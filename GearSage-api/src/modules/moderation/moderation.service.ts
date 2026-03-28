import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../common/database.service';
import {
  ModerationContentType,
  ModerationDecision,
  ModerationMetadata,
  ModerationRuleRecord,
  ModerationScene,
} from './moderation.types';
import { ModerationTencentService } from './moderation.tencent.service';

@Injectable()
export class ModerationService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly moderationTencentService: ModerationTencentService,
  ) {}

  async reviewText(
    scene: ModerationScene,
    content: string,
    metadata: ModerationMetadata,
  ): Promise<ModerationDecision> {
    const normalizedContent = String(content || '').trim();
    if (!normalizedContent) {
      return this.persistDecision(scene, 'text', metadata, {
        result: 'PASS',
        provider: 'system_bypass',
        riskLevel: 'empty',
        riskReason: 'empty_content',
        hitLabels: [],
        raw: {},
      });
    }

    const localRuleDecision = await this.matchLocalTextRules(scene, normalizedContent, metadata);
    if (localRuleDecision) {
      return this.persistDecision(scene, 'text', metadata, localRuleDecision);
    }

    if (!this.isTencentModerationEnabled()) {
      return this.persistDecision(scene, 'text', metadata, {
        result: 'PASS',
        provider: 'system_bypass',
        riskLevel: 'bypass',
        riskReason: 'tencent_provider_disabled',
        hitLabels: [],
        raw: {},
      });
    }

    try {
      const decision = await this.moderationTencentService.reviewText(
        scene,
        normalizedContent,
        metadata,
      );
      return this.persistDecision(scene, 'text', metadata, decision);
    } catch (error) {
      return this.persistDecision(scene, 'text', metadata, {
        result: 'REVIEW',
        provider: 'tencent_text',
        riskLevel: 'provider_error',
        riskReason:
          error instanceof Error ? error.message : 'tencent_text_provider_error',
        hitLabels: [],
        raw: {
          error:
            error instanceof Error ? error.message : 'tencent_text_provider_error',
        },
      });
    }
  }

  async reviewImage(
    scene: ModerationScene,
    fileBuffer: Buffer,
    metadata: ModerationMetadata,
  ): Promise<ModerationDecision> {
    if (!fileBuffer?.length) {
      return this.persistDecision(scene, 'image', metadata, {
        result: 'PASS',
        provider: 'system_bypass',
        riskLevel: 'empty',
        riskReason: 'empty_file_buffer',
        hitLabels: [],
        raw: {},
      });
    }

    if (!this.isTencentModerationEnabled()) {
      return this.persistDecision(scene, 'image', metadata, {
        result: 'PASS',
        provider: 'system_bypass',
        riskLevel: 'bypass',
        riskReason: 'tencent_provider_disabled',
        hitLabels: [],
        raw: {},
      });
    }

    try {
      const decision = await this.moderationTencentService.reviewImage(
        scene,
        fileBuffer,
        metadata,
      );
      return this.persistDecision(scene, 'image', metadata, decision);
    } catch (error) {
      return this.persistDecision(scene, 'image', metadata, {
        result: 'REVIEW',
        provider: 'tencent_image',
        riskLevel: 'provider_error',
        riskReason:
          error instanceof Error ? error.message : 'tencent_image_provider_error',
        hitLabels: [],
        raw: {
          error:
            error instanceof Error ? error.message : 'tencent_image_provider_error',
        },
      });
    }
  }

  assertProfileTextAllowed(decision: ModerationDecision) {
    if (decision.result === 'PASS') {
      return;
    }
    throw new BadRequestException('内容不符合社区规范，请修改后重试');
  }

  assertUploadImageAllowed(decision: ModerationDecision) {
    if (decision.result === 'PASS') {
      return;
    }
    throw new BadRequestException('图片内容不符合社区规范，请更换后重试');
  }

  assertTopicPublishAccepted(decision: ModerationDecision) {
    if (decision.result === 'REJECT') {
      throw new BadRequestException('内容不符合社区规范，请修改后重试');
    }
  }

  combineTextDecisions(decisions: ModerationDecision[]): ModerationDecision {
    if (decisions.some((item) => item.result === 'REJECT')) {
      return this.mergeDecisions(decisions, 'REJECT');
    }
    if (decisions.some((item) => item.result === 'REVIEW')) {
      return this.mergeDecisions(decisions, 'REVIEW');
    }
    return this.mergeDecisions(decisions, 'PASS');
  }

  async relinkPendingRecords(input: {
    targetType: string;
    fromTargetId: string | number;
    toTargetId: string | number;
    userId?: number | null;
  }) {
    const params: any[] = [String(input.toTargetId), input.targetType, String(input.fromTargetId)];
    let userClause = '';

    if (input.userId !== undefined && input.userId !== null) {
      params.push(Number(input.userId));
      userClause = ` AND "userId" = $${params.length}`;
    }

    await this.databaseService.query(
      `
      UPDATE moderation_records
      SET "targetId" = $1
      WHERE "targetType" = $2
        AND "targetId" = $3
        ${userClause}
      `,
      params,
    );
  }

  private isTencentModerationEnabled() {
    const moderationEnabled = String(
      this.configService.get<string>('MODERATION_ENABLED') || 'false',
    )
      .trim()
      .toLowerCase();
    const provider = String(
      this.configService.get<string>('MODERATION_PROVIDER') || '',
    )
      .trim()
      .toLowerCase();

    return (
      moderationEnabled === 'true' &&
      provider === 'tencent' &&
      this.moderationTencentService.isConfigured()
    );
  }

  private async matchLocalTextRules(
    scene: ModerationScene,
    content: string,
    metadata: ModerationMetadata,
  ) {
    const { rows } = await this.databaseService.query<ModerationRuleRecord>(
      `
      SELECT id, rule_type, match_type, keyword, status, remark
      FROM moderation_rules
      WHERE status = 'active'
        AND rule_type IN ('text', 'all')
      ORDER BY id ASC
      `,
    );

    const normalizedContent = content.toLowerCase();
    for (const row of rows) {
      const keyword = String(row.keyword || '').trim();
      if (!keyword) {
        continue;
      }
      const normalizedKeyword = keyword.toLowerCase();
      const matchType = String(row.match_type || 'contains').trim().toLowerCase();
      const matched =
        matchType === 'exact'
          ? normalizedContent === normalizedKeyword
          : normalizedContent.includes(normalizedKeyword);

      if (!matched) {
        continue;
      }

      return {
        result: 'REJECT' as const,
        provider: 'local_rule',
        riskLevel: 'local_rule_hit',
        riskReason: `keyword=${keyword}; scene=${scene}; ruleId=${row.id}`,
        hitLabels: ['LocalRule'],
        raw: {
          ruleId: row.id,
          keyword,
          matchType,
          remark: row.remark || '',
          scene,
          targetType: metadata.targetType,
          targetId: metadata.targetId ?? null,
        },
      };
    }

    return null;
  }

  private async persistDecision(
    scene: ModerationScene,
    contentType: ModerationContentType,
    metadata: ModerationMetadata,
    decision: ModerationDecision,
  ) {
    await this.databaseService.query(
      `
      INSERT INTO moderation_records
      (
        scene,
        "targetType",
        "targetId",
        "contentType",
        provider,
        result,
        "riskLevel",
        "riskReason",
        "hitLabels",
        "requestId",
        "rawResultJson",
        "operatorType",
        "operatorId",
        "userId",
        extra,
        "createTime"
      )
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11::jsonb, $12, $13, $14, $15::jsonb, NOW())
      `,
      [
        scene,
        String(metadata.targetType || ''),
        metadata.targetId !== undefined && metadata.targetId !== null
          ? String(metadata.targetId)
          : '',
        contentType,
        decision.provider,
        decision.result.toLowerCase(),
        decision.riskLevel || '',
        decision.riskReason || '',
        JSON.stringify(decision.hitLabels || []),
        decision.requestId || '',
        JSON.stringify(decision.raw || {}),
        metadata.operatorType || 'system',
        metadata.operatorId !== undefined && metadata.operatorId !== null
          ? String(metadata.operatorId)
          : '',
        metadata.userId || null,
        JSON.stringify(metadata.extra || {}),
      ],
    );

    return decision;
  }

  private mergeDecisions(
    decisions: ModerationDecision[],
    result: ModerationDecision['result'],
  ): ModerationDecision {
    return {
      result,
      provider:
        decisions.map((item) => item.provider).filter(Boolean).join(',') || 'system',
      riskLevel:
        decisions
          .map((item) => item.riskLevel)
          .filter(Boolean)
          .join('|') || 'normal',
      riskReason:
        decisions
          .map((item) => item.riskReason)
          .filter(Boolean)
          .join('; ') || 'combined',
      hitLabels: Array.from(
        new Set(decisions.flatMap((item) => item.hitLabels || []).filter(Boolean)),
      ),
      requestId: decisions.map((item) => item.requestId).find(Boolean),
      raw: {
        decisions,
      },
    };
  }
}
