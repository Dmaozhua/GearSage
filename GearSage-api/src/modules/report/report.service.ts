import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { ModerationService } from '../moderation/moderation.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly moderationService: ModerationService,
  ) {}

  async create(userId: number, dto: CreateReportDto) {
    const targetType = dto.targetType;
    const targetId = Number(dto.targetId || 0);
    const reason = String(dto.reason || '').trim();

    if (!reason) {
      throw new BadRequestException('举报理由不能为空');
    }

    await this.assertReportTargetVisible(targetType, targetId);
    await this.assertNotDuplicateReport(userId, targetType, targetId);

    const decision = await this.moderationService.reviewText('report_reason', reason, {
      userId,
      targetType: 'report',
      targetId: `${targetType}:${targetId}:pending`,
      extra: {
        reportTargetType: targetType,
        reportTargetId: targetId,
      },
    });
    this.moderationService.assertProfileTextAllowed(decision);

    const result = await this.databaseService.query(
      `
      INSERT INTO user_reports
      ("reporterUserId", "targetType", "targetId", reason, status, "createTime", "updateTime")
      VALUES
      ($1, $2, $3, $4, 'pending', NOW(), NOW())
      RETURNING id, "targetType", "targetId", status, "createTime"
      `,
      [userId, targetType, String(targetId), reason],
    );

    await this.moderationService.relinkPendingRecords({
      targetType: 'report',
      fromTargetId: `${targetType}:${targetId}:pending`,
      toTargetId: result.rows[0].id,
      userId,
    });

    return {
      id: Number(result.rows[0].id),
      targetType: result.rows[0].targetType,
      targetId: Number(result.rows[0].targetId),
      status: result.rows[0].status,
      createTime: result.rows[0].createTime,
    };
  }

  private async assertReportTargetVisible(targetType: string, targetId: number) {
    if (!targetId) {
      throw new BadRequestException('targetId is required');
    }

    if (targetType === 'topic') {
      const result = await this.databaseService.query(
        `
        SELECT id
        FROM bz_mini_topic
        WHERE id = $1
          AND status = 2
          AND "isDelete" = 0
        LIMIT 1
        `,
        [targetId],
      );
      if (!result.rows.length) {
        throw new NotFoundException('topic not found');
      }
      return;
    }

    if (targetType === 'comment') {
      const result = await this.databaseService.query(
        `
        SELECT c.id
        FROM bz_topic_comment c
        JOIN bz_mini_topic t ON t.id = c."topicId"
        WHERE c.id = $1
          AND c.status = 2
          AND c."isVisible" = 1
          AND t.status = 2
          AND t."isDelete" = 0
        LIMIT 1
        `,
        [targetId],
      );
      if (!result.rows.length) {
        throw new NotFoundException('comment not found');
      }
      return;
    }

    if (targetType === 'user') {
      const result = await this.databaseService.query(
        `
        SELECT id
        FROM bz_mini_user
        WHERE id = $1
        LIMIT 1
        `,
        [targetId],
      );
      if (!result.rows.length) {
        throw new NotFoundException('user not found');
      }
      return;
    }

    throw new ForbiddenException('unsupported report target');
  }

  private async assertNotDuplicateReport(userId: number, targetType: string, targetId: number) {
    const result = await this.databaseService.query(
      `
      SELECT id
      FROM user_reports
      WHERE "reporterUserId" = $1
        AND "targetType" = $2
        AND "targetId" = $3
      LIMIT 1
      `,
      [userId, targetType, String(targetId)],
    );

    if (result.rows.length) {
      throw new ConflictException('已举报该对象，后台正在处理举报信息');
    }
  }
}
