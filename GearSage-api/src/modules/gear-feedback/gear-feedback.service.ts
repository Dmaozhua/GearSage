import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { GearService } from '../gear/gear.service';
import { ModerationService } from '../moderation/moderation.service';
import { CreateGearFeedbackDto } from './dto/create-gear-feedback.dto';

type GearKind = 'reel' | 'rod' | 'lure' | 'line' | 'hook';

@Injectable()
export class GearFeedbackService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly gearService: GearService,
    private readonly moderationService: ModerationService,
  ) {}

  async create(userId: number, dto: CreateGearFeedbackDto) {
    const normalized = this.normalizePayload(dto);
    const gearDetail = await this.findGearDetail(normalized.gearType, normalized.masterId);
    const master = await this.findMaster(normalized.kind, normalized.masterId);
    const variant = normalized.variantId
      ? await this.findVariant(normalized.kind, normalized.masterId, normalized.variantId)
      : null;

    const pendingTargetId = `${normalized.gearType}:${normalized.masterId}:${Date.now()}:pending`;
    const decision = await this.moderationService.reviewText(
      'gear_feedback_content',
      normalized.content,
      {
        userId,
        targetType: 'gear_feedback',
        targetId: pendingTargetId,
        extra: {
          gearType: normalized.gearType,
          kind: normalized.kind,
          masterId: normalized.masterId,
          variantId: normalized.variantId,
          feedbackType: normalized.feedbackType,
          fieldKey: normalized.fieldKey,
          fieldLabel: normalized.fieldLabel,
        },
      },
    );
    this.moderationService.assertProfileTextAllowed(decision);

    const result = await this.databaseService.query(
      `
      INSERT INTO gear_feedback
      ("userId", "gearType", "masterId", "variantId", "fieldKey", "fieldLabel",
       "feedbackType", content, contact, images, status, extra, "createTime", "updateTime")
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, 'pending', $11::jsonb, NOW(), NOW())
      RETURNING id, status, "createTime"
      `,
      [
        userId,
        normalized.gearType,
        normalized.masterId,
        normalized.variantId,
        normalized.fieldKey,
        normalized.fieldLabel,
        normalized.feedbackType,
        normalized.content,
        '',
        JSON.stringify(normalized.images),
        JSON.stringify({
          kind: normalized.kind,
          master: this.formatMasterSnapshot(master, gearDetail, normalized.kind),
          variantMatched: !!variant,
          variant: variant ? this.formatVariantSnapshot(variant) : null,
        }),
      ],
    );

    await this.moderationService.relinkPendingRecords({
      targetType: 'gear_feedback',
      fromTargetId: pendingTargetId,
      toTargetId: result.rows[0].id,
      userId,
    });

    return {
      id: Number(result.rows[0].id),
      status: result.rows[0].status,
      createTime: result.rows[0].createTime,
    };
  }

  private normalizePayload(dto: CreateGearFeedbackDto) {
    const gearType = this.normalizeGearType(dto.gearType);
    const kind = this.typeToKind(gearType);
    const masterId = String(dto.masterId || '').trim();
    const content = String(dto.content || '').trim();

    if (!masterId) {
      throw new BadRequestException('masterId is required');
    }
    if (!content) {
      throw new BadRequestException('反馈内容不能为空');
    }

    return {
      gearType,
      kind,
      masterId,
      variantId: String(dto.variantId || '').trim(),
      fieldKey: String(dto.fieldKey || '').trim(),
      fieldLabel: String(dto.fieldLabel || '').trim(),
      feedbackType: dto.feedbackType,
      content,
      images: Array.isArray(dto.images)
        ? dto.images.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 6)
        : [],
    };
  }

  private async findGearDetail(gearType: string, masterId: string) {
    const detail = await this.gearService.getDetail({
      type: gearType,
      id: masterId,
    });

    if (!detail) {
      throw new NotFoundException('gear not found');
    }

    return detail;
  }

  private async findMaster(kind: GearKind, masterId: string) {
    const result = await this.databaseService.query(
      `
      SELECT id, kind, model, "modelCn", "modelYear", "brandId", "isShow", raw_json
      FROM gear_master
      WHERE kind = $1
        AND id = $2
        AND "isShow" = 1
      LIMIT 1
      `,
      [kind, masterId],
    );

    return result.rows[0] || null;
  }

  private async findVariant(kind: GearKind, masterId: string, variantId: string) {
    const result = await this.databaseService.query(
      `
      SELECT "sourceKey", "gearId", "variantId", sku, raw_json
      FROM gear_variants
      WHERE kind = $1
        AND "gearId" = $2
        AND (
          "variantId" = $3
          OR sku = $3
          OR "sourceKey" = $3
          OR raw_json->>'id' = $3
          OR raw_json->>'SKU' = $3
          OR raw_json->>'sku' = $3
        )
      LIMIT 1
      `,
      [kind, masterId, variantId],
    );

    return result.rows[0] || null;
  }

  private normalizeGearType(value: string) {
    const raw = String(value || '').trim();
    if (raw === 'rods' || raw === 'rod') return 'rods';
    if (raw === 'lures' || raw === 'lure') return 'lures';
    if (raw === 'line' || raw === 'lines') return 'line';
    if (raw === 'hook' || raw === 'hooks') return 'hook';
    return 'reels';
  }

  private typeToKind(type: string): GearKind {
    if (type === 'rods') return 'rod';
    if (type === 'lures') return 'lure';
    if (type === 'line') return 'line';
    if (type === 'hook') return 'hook';
    return 'reel';
  }

  private formatMasterSnapshot(row: any, detail: any, kind: GearKind) {
    if (!row) {
      return {
        id: detail.id || '',
        kind,
        model: detail.model || '',
        modelCn: detail.modelCn || detail.model_cn || '',
        modelYear: detail.modelYear || detail.model_year || '',
        brandId: detail.brandId || detail.brand_id || null,
        displayName: detail.displayName || '',
        brandName: detail.brand_name || detail.brand?.name || '',
      };
    }

    return {
      id: row.id,
      kind: row.kind,
      model: row.model || '',
      modelCn: row.modelCn || '',
      modelYear: row.modelYear || '',
      brandId: row.brandId || null,
      displayName: detail.displayName || '',
      brandName: detail.brand_name || detail.brand?.name || '',
    };
  }

  private formatVariantSnapshot(row: any) {
    return {
      sourceKey: row.sourceKey || '',
      gearId: row.gearId || '',
      variantId: row.variantId || '',
      sku: row.sku || '',
    };
  }
}
