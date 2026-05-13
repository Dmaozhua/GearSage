import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { AdminLogService } from './admin-log.service';

const GEAR_TYPE_LABELS: Record<string, string> = {
  reels: '渔轮',
  rods: '鱼竿',
  lures: '路亚饵',
  line: '鱼线',
  hook: '鱼钩',
};

@Injectable()
export class AdminGearFeedbackService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly adminLogService: AdminLogService,
  ) {}

  async list(filters: {
    status?: string;
    gearType?: string;
    feedbackType?: string;
    limit?: string | number;
  } = {}) {
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters.status && filters.status !== 'all') {
      params.push(filters.status);
      conditions.push(`f.status = $${params.length}`);
    } else if (!filters.status) {
      conditions.push(`f.status = 'pending'`);
    }

    if (filters.gearType && filters.gearType !== 'all') {
      params.push(this.normalizeGearType(filters.gearType));
      conditions.push(`f."gearType" = $${params.length}`);
    }

    if (filters.feedbackType && filters.feedbackType !== 'all') {
      params.push(filters.feedbackType);
      conditions.push(`f."feedbackType" = $${params.length}`);
    }

    const limit = this.normalizeLimit(filters.limit);
    params.push(limit);

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await this.databaseService.query(
      `
      SELECT
        f.id,
        f."userId",
        f."gearType",
        f."masterId",
        f."variantId",
        f."fieldKey",
        f."fieldLabel",
        f."feedbackType",
        f.content,
        f.contact,
        f.images,
        f.status,
        f."handledByAdminId",
        f."handledRemark",
        f."handledAt",
        f.extra,
        f."createTime",
        f."updateTime",
        u."nickName" AS "userName",
        u.phone AS "userPhone",
        gm.model AS "gearModel",
        gm."modelCn" AS "gearModelCn",
        gm."modelYear" AS "gearModelYear",
        gm."brandId" AS "gearBrandId",
        gb.name AS "gearBrandName",
        mr.result AS "moderationResult",
        mr.provider AS "moderationProvider",
        mr."riskReason" AS "moderationRiskReason"
      FROM gear_feedback f
      LEFT JOIN bz_mini_user u ON u.id = f."userId"
      LEFT JOIN gear_master gm
        ON gm.kind = ${this.gearKindSql('f."gearType"')}
       AND gm.id = f."masterId"
      LEFT JOIN gear_brands gb ON gb.id = gm."brandId"
      LEFT JOIN LATERAL (
        SELECT result, provider, "riskReason"
        FROM moderation_records
        WHERE "targetType" = 'gear_feedback'
          AND "targetId" = f.id::text
        ORDER BY id DESC
        LIMIT 1
      ) mr ON TRUE
      ${whereClause}
      ORDER BY f.id DESC
      LIMIT $${params.length}
      `,
      params,
    );

    return result.rows.map((row: any) => this.formatFeedback(row));
  }

  async getDetail(feedbackId: number) {
    const result = await this.databaseService.query(
      `
      SELECT
        f.*,
        u."nickName" AS "userName",
        u.phone AS "userPhone",
        gm.model AS "gearModel",
        gm."modelCn" AS "gearModelCn",
        gm."modelYear" AS "gearModelYear",
        gm."brandId" AS "gearBrandId",
        gm.raw_json AS "gearRawJson",
        gb.name AS "gearBrandName",
        gv."sourceKey" AS "variantSourceKey",
        gv."gearId" AS "variantGearId",
        gv."variantId" AS "matchedVariantId",
        gv.sku AS "variantSku",
        gv.raw_json AS "variantRawJson"
      FROM gear_feedback f
      LEFT JOIN bz_mini_user u ON u.id = f."userId"
      LEFT JOIN gear_master gm
        ON gm.kind = ${this.gearKindSql('f."gearType"')}
       AND gm.id = f."masterId"
      LEFT JOIN gear_brands gb ON gb.id = gm."brandId"
      LEFT JOIN LATERAL (
        SELECT "sourceKey", "gearId", "variantId", sku, raw_json
        FROM gear_variants
        WHERE kind = ${this.gearKindSql('f."gearType"')}
          AND "gearId" = f."masterId"
          AND f."variantId" <> ''
          AND (
            "variantId" = f."variantId"
            OR sku = f."variantId"
            OR "sourceKey" = f."variantId"
            OR raw_json->>'id' = f."variantId"
            OR raw_json->>'SKU' = f."variantId"
            OR raw_json->>'sku' = f."variantId"
          )
        ORDER BY "variantId" ASC
        LIMIT 1
      ) gv ON TRUE
      WHERE f.id = $1
      LIMIT 1
      `,
      [feedbackId],
    );

    if (!result.rows.length) {
      throw new NotFoundException('gear feedback not found');
    }

    return {
      ...this.formatFeedback(result.rows[0]),
      moderationRecords: await this.listModerationRecords(feedbackId),
      adminLogs: await this.listTargetLogs(feedbackId),
    };
  }

  async handle(feedbackId: number, admin: { id: number }, remark?: string) {
    return this.updateStatus(feedbackId, admin, 'handled', 'gear_feedback_handle', remark);
  }

  async reject(feedbackId: number, admin: { id: number }, remark?: string) {
    return this.updateStatus(feedbackId, admin, 'rejected', 'gear_feedback_reject', remark);
  }

  private async updateStatus(
    feedbackId: number,
    admin: { id: number },
    status: 'handled' | 'rejected',
    action: string,
    remark?: string,
  ) {
    const result = await this.databaseService.query(
      `
      UPDATE gear_feedback
      SET
        status = $2,
        "handledByAdminId" = $3,
        "handledRemark" = $4,
        "handledAt" = NOW(),
        "updateTime" = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [feedbackId, status, Number(admin.id || 0), remark || ''],
    );

    if (!result.rows.length) {
      throw new NotFoundException('gear feedback not found');
    }

    const row = result.rows[0];
    await this.adminLogService.write({
      adminUserId: Number(admin.id || 0),
      targetType: 'gear_feedback',
      targetId: feedbackId,
      action,
      remark,
      extra: {
        status,
        gearType: row.gearType,
        masterId: row.masterId,
        variantId: row.variantId,
        feedbackType: row.feedbackType,
      },
    });

    return {
      ...this.formatFeedback(row),
      action,
    };
  }

  private async listModerationRecords(feedbackId: number) {
    const result = await this.databaseService.query(
      `
      SELECT id, scene, "contentType", provider, result, "riskLevel", "riskReason",
             "hitLabels", "requestId", extra, "createTime"
      FROM moderation_records
      WHERE "targetType" = 'gear_feedback'
        AND "targetId" = $1
      ORDER BY id DESC
      `,
      [String(feedbackId)],
    );

    return result.rows;
  }

  private async listTargetLogs(feedbackId: number) {
    const result = await this.databaseService.query(
      `
      SELECT l.id, l."adminUserId", l.action, l.remark, l.extra, l."createTime",
             a.username AS "adminUsername"
      FROM admin_operation_logs l
      LEFT JOIN admin_users a ON a.id = l."adminUserId"
      WHERE l."targetType" = 'gear_feedback'
        AND l."targetId" = $1
      ORDER BY l.id DESC
      `,
      [String(feedbackId)],
    );

    return result.rows;
  }

  private formatFeedback(row: any) {
    const images = this.normalizeImages(row.images);
    const gearName = [row.gearBrandName, row.gearModelYear, row.gearModel, row.gearModelCn]
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .join(' ');

    return {
      id: Number(row.id),
      userId: Number(row.userId || 0),
      userName: row.userName || '',
      userPhone: row.userPhone || '',
      gearType: row.gearType || '',
      gearTypeLabel: GEAR_TYPE_LABELS[row.gearType] || row.gearType || '',
      masterId: row.masterId || '',
      variantId: row.variantId || '',
      fieldKey: row.fieldKey || '',
      fieldLabel: row.fieldLabel || '',
      feedbackType: row.feedbackType || '',
      content: row.content || '',
      contact: row.contact || '',
      images,
      status: row.status || '',
      handledByAdminId: row.handledByAdminId ? Number(row.handledByAdminId) : null,
      handledRemark: row.handledRemark || '',
      handledAt: row.handledAt || null,
      extra: row.extra || {},
      createTime: row.createTime,
      updateTime: row.updateTime,
      moderationResult: row.moderationResult || '',
      moderationProvider: row.moderationProvider || '',
      moderationRiskReason: row.moderationRiskReason || '',
      gear: {
        id: row.masterId || '',
        name: gearName,
        brandId: row.gearBrandId || null,
        brandName: row.gearBrandName || '',
        model: row.gearModel || '',
        modelCn: row.gearModelCn || '',
        modelYear: row.gearModelYear || '',
        rawJson: row.gearRawJson || null,
      },
      variant: {
        sourceKey: row.variantSourceKey || '',
        gearId: row.variantGearId || '',
        variantId: row.matchedVariantId || '',
        sku: row.variantSku || '',
        rawJson: row.variantRawJson || null,
      },
    };
  }

  private normalizeImages(value: any) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || '').trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return this.normalizeImages(parsed);
      } catch (_error) {
        return value.split(',').map((item) => item.trim()).filter(Boolean);
      }
    }
    return [];
  }

  private normalizeGearType(value?: string) {
    const raw = String(value || '').trim();
    if (raw === 'rod' || raw === 'rods') return 'rods';
    if (raw === 'lure' || raw === 'lures') return 'lures';
    if (raw === 'line' || raw === 'lines') return 'line';
    if (raw === 'hook' || raw === 'hooks') return 'hook';
    return 'reels';
  }

  private gearKindSql(expression: string) {
    return `
      CASE
        WHEN ${expression} IN ('rod', 'rods') THEN 'rod'
        WHEN ${expression} IN ('lure', 'lures') THEN 'lure'
        WHEN ${expression} IN ('line', 'lines') THEN 'line'
        WHEN ${expression} IN ('hook', 'hooks') THEN 'hook'
        ELSE 'reel'
      END
    `;
  }

  private normalizeLimit(limit?: string | number) {
    const normalized = Number(limit || 50);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      return 50;
    }
    return Math.min(Math.floor(normalized), 200);
  }
}
