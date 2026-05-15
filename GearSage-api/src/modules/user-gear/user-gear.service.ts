import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { ModerationService } from '../moderation/moderation.service';
import { CreateUserGearDto } from './dto/create-user-gear.dto';
import { ListUserGearDto } from './dto/list-user-gear.dto';
import { UpdateUserGearDto } from './dto/update-user-gear.dto';

type UserGearType = 'reel' | 'rod' | 'lure';

const USAGE_STATUS_TEXT: Record<string, string> = {
  frequent: '常用',
  backup: '备用',
  idle: '已闲置',
};

const USER_GEAR_LIMITS = {
  total: 180,
  byType: {
    rod: 30,
    reel: 30,
    lure: 120,
  },
  dailyTotal: 50,
  dailyByType: {
    rod: 15,
    reel: 15,
    lure: 40,
  },
};

@Injectable()
export class UserGearService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly moderationService: ModerationService,
  ) {}

  async list(viewerUserId: number, query: ListUserGearDto) {
    const targetUserId = Number(query.userId || viewerUserId || 0);
    if (!targetUserId) {
      throw new UnauthorizedException('missing bearer token');
    }

    const isSelf = Boolean(viewerUserId && viewerUserId === targetUserId);
    if (!isSelf) {
      throw new ForbiddenException('我的装备只允许本人管理查看');
    }

    const params: any[] = [targetUserId];
    const conditions = ['ugi.user_id = $1', 'ugi.is_deleted = FALSE'];

    if (query.gearType) {
      params.push(query.gearType);
      conditions.push(`ugi.gear_type = $${params.length}`);
    }
    const result = await this.databaseService.query(
      `
      SELECT
        ugi.*,
        gm.model AS latest_model,
        gm."modelCn" AS latest_model_cn,
        gm.images AS latest_images,
        gb.name AS latest_brand_name,
        gb.name_en AS latest_brand_name_en,
        gb.name_zh AS latest_brand_name_zh
      FROM user_gear_items ugi
      LEFT JOIN gear_master gm
        ON gm.kind = ugi.gear_type
       AND gm.id = ugi.gear_master_id
      LEFT JOIN gear_brands gb
        ON gb.id = gm."brandId"
      WHERE ${conditions.join(' AND ')}
      ORDER BY
        CASE ugi.usage_status
          WHEN 'frequent' THEN 0
          WHEN 'backup' THEN 1
          ELSE 2
        END,
        ugi.sort_order ASC,
        ugi.update_time DESC
      `,
      params,
    );

    const items = result.rows.map((row) => this.mapRow(row));
    return {
      summary: this.buildSummary(items),
      items,
    };
  }

  async create(userId: number, dto: CreateUserGearDto) {
    const payload = this.normalizeCreatePayload(dto);
    const master = await this.findMaster(payload.gearType, payload.gearMasterId);
    if (!master) {
      throw new NotFoundException('装备不存在或已下架');
    }

    const variant = payload.gearVariantId || payload.variantKey
      ? await this.findVariant(payload.gearType, payload.gearMasterId, payload.gearVariantId || payload.variantKey)
      : null;
    const resolvedVariantKey = payload.variantKey || variant?.variantId || payload.gearVariantId || variant?.sku || variant?.sourceKey || '';
    const resolvedVariantLabel = payload.variantLabel || variant?.sku || resolvedVariantKey;
    const variantCheckStatus = payload.gearVariantId || payload.variantKey
      ? (variant ? 'matched' : 'unmatched')
      : 'not_provided';
    const displayName = payload.displayName || this.buildDisplayName(master, resolvedVariantLabel);
    const existing = await this.findActiveDuplicate(userId, payload.gearType, payload.gearMasterId, resolvedVariantKey);

    if (existing) {
      throw new ConflictException('该装备已在我的装备中');
    }

    await this.assertCreateLimits(userId, payload.gearType);

    const pendingTargetId = this.buildPendingModerationTargetId(userId, payload.gearType);
    await this.reviewUserGearText(userId, pendingTargetId, {
      displayName,
      note: payload.note,
      fields: {
        displayName,
        note: payload.note,
      },
    });

    const result = await this.databaseService.query(
      `
      INSERT INTO user_gear_items
      (
        user_id, gear_type, gear_master_id, gear_variant_id, variant_key, variant_label,
        display_name, brand_name, gear_model, image_url, ownership_status, usage_status,
        note, is_public, sort_order, extra, create_time, update_time
      )
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE, 0, $14::jsonb, NOW(), NOW())
      RETURNING *
      `,
      [
        userId,
        payload.gearType,
        payload.gearMasterId,
        variant?.variantId || payload.gearVariantId || null,
        resolvedVariantKey || null,
        resolvedVariantLabel || null,
        displayName,
        this.resolveBrandName(master),
        master.model || master.modelCn || '',
        this.resolveImageUrl(master),
        payload.ownershipStatus,
        payload.usageStatus,
        payload.note || null,
        JSON.stringify({
          variantCheckStatus,
          variant: variant ? this.formatVariantSnapshot(variant) : null,
        }),
      ],
    );

    await this.moderationService.relinkPendingRecords({
      targetType: 'user_gear_item',
      fromTargetId: pendingTargetId,
      toTargetId: result.rows[0].id,
      userId,
    });

    return this.mapRow(result.rows[0]);
  }

  async update(userId: number, id: number, dto: UpdateUserGearDto) {
    const current = await this.assertOwnItem(userId, id);

    const displayName = dto.displayName === undefined ? undefined : String(dto.displayName || '').trim();
    if (displayName !== undefined && !displayName) {
      throw new BadRequestException('displayName is required');
    }
    const note = dto.note === undefined ? undefined : String(dto.note || '').trim();

    if (displayName !== undefined || note !== undefined) {
      const nextDisplayName = displayName ?? String(current.display_name || '').trim();
      const nextNote = note ?? String(current.note || '').trim();
      await this.reviewUserGearText(userId, id, {
        displayName: nextDisplayName,
        note: nextNote,
        fields: {
          displayName: nextDisplayName,
          note: nextNote,
        },
      });
    }

    const result = await this.databaseService.query(
      `
      UPDATE user_gear_items
      SET
        display_name = COALESCE($3, display_name),
        ownership_status = COALESCE($4, ownership_status),
        usage_status = COALESCE($5, usage_status),
        note = COALESCE($6, note),
        sort_order = COALESCE($7, sort_order),
        update_time = NOW()
      WHERE id = $1
        AND user_id = $2
        AND is_deleted = FALSE
      RETURNING *
      `,
      [
        id,
        userId,
        displayName ?? null,
        dto.ownershipStatus ?? null,
        dto.usageStatus ?? null,
        note ?? null,
        dto.sortOrder ?? null,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async remove(userId: number, id: number) {
    await this.assertOwnItem(userId, id);

    await this.databaseService.query(
      `
      UPDATE user_gear_items
      SET is_deleted = TRUE,
          delete_time = NOW(),
          update_time = NOW()
      WHERE id = $1
        AND user_id = $2
        AND is_deleted = FALSE
      `,
      [id, userId],
    );

    return true;
  }

  private normalizeCreatePayload(dto: CreateUserGearDto) {
    const gearMasterId = String(dto.gearMasterId || '').trim();
    if (!gearMasterId) {
      throw new BadRequestException('gearMasterId is required');
    }

    return {
      gearType: dto.gearType,
      gearMasterId,
      gearVariantId: String(dto.gearVariantId || '').trim(),
      variantKey: String(dto.variantKey || '').trim(),
      variantLabel: String(dto.variantLabel || '').trim(),
      displayName: String(dto.displayName || '').trim(),
      ownershipStatus: dto.ownershipStatus || 'owned',
      usageStatus: dto.usageStatus || 'frequent',
      note: String(dto.note || '').trim(),
    };
  }

  private async reviewUserGearText(
    userId: number,
    targetId: string | number,
    input: {
      displayName: string;
      note: string;
      fields: Record<string, string>;
    },
  ) {
    const content = this.buildModerationContent([
      ['displayName', input.displayName],
      ['note', input.note],
    ]);
    const decision = await this.moderationService.reviewText(
      'user_gear_content',
      content,
      {
        userId,
        targetType: 'user_gear_item',
        targetId,
        extra: {
          fields: input.fields,
        },
      },
    );
    this.moderationService.assertProfileTextAllowed(decision);
  }

  private buildModerationContent(entries: Array<[string, string]>) {
    return entries
      .map(([field, value]) => {
        const text = String(value || '').trim();
        return text ? `${field}: ${text}` : '';
      })
      .filter(Boolean)
      .join('\n');
  }

  private buildPendingModerationTargetId(userId: number, gearType: string) {
    return `${userId}:user_gear_item:${gearType}:${Date.now()}:${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  private async findMaster(gearType: UserGearType, gearMasterId: string) {
    const result = await this.databaseService.query(
      `
      SELECT gm.*, gb.name AS brand_name, gb.name_en AS brand_name_en, gb.name_zh AS brand_name_zh
      FROM gear_master gm
      LEFT JOIN gear_brands gb ON gb.id = gm."brandId"
      WHERE gm.kind = $1
        AND gm.id = $2
        AND gm."isShow" = 1
      LIMIT 1
      `,
      [gearType, gearMasterId],
    );

    return result.rows[0] || null;
  }

  private async findVariant(gearType: UserGearType, gearMasterId: string, variantKey?: string) {
    const key = String(variantKey || '').trim();
    if (!key) {
      return null;
    }

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
      [gearType, gearMasterId, key],
    );

    return result.rows[0] || null;
  }

  private async findActiveDuplicate(userId: number, gearType: UserGearType, gearMasterId: string, variantKey: string) {
    const result = await this.databaseService.query(
      `
      SELECT id
      FROM user_gear_items
      WHERE user_id = $1
        AND gear_type = $2
        AND gear_master_id = $3
        AND COALESCE(variant_key, '') = COALESCE($4, '')
        AND is_deleted = FALSE
      LIMIT 1
      `,
      [userId, gearType, gearMasterId, variantKey || null],
    );

    return result.rows[0] || null;
  }

  private async assertCreateLimits(userId: number, gearType: UserGearType) {
    const result = await this.databaseService.query(
      `
      SELECT
        COUNT(*)::int AS total_count,
        COUNT(*) FILTER (WHERE gear_type = $2)::int AS type_count,
        COUNT(*) FILTER (WHERE create_time >= date_trunc('day', NOW()))::int AS daily_total_count,
        COUNT(*) FILTER (WHERE gear_type = $2 AND create_time >= date_trunc('day', NOW()))::int AS daily_type_count
      FROM user_gear_items
      WHERE user_id = $1
        AND is_deleted = FALSE
      `,
      [userId, gearType],
    );

    const row = result.rows[0] || {};
    if (Number(row.total_count || 0) >= USER_GEAR_LIMITS.total) {
      throw new BadRequestException(`我的装备最多保留 ${USER_GEAR_LIMITS.total} 件`);
    }
    if (Number(row.type_count || 0) >= USER_GEAR_LIMITS.byType[gearType]) {
      throw new BadRequestException(`${this.getTypeLabel(gearType)}最多保留 ${USER_GEAR_LIMITS.byType[gearType]} 件`);
    }
    if (Number(row.daily_total_count || 0) >= USER_GEAR_LIMITS.dailyTotal) {
      throw new BadRequestException(`每天最多新增 ${USER_GEAR_LIMITS.dailyTotal} 件我的装备`);
    }
    if (Number(row.daily_type_count || 0) >= USER_GEAR_LIMITS.dailyByType[gearType]) {
      throw new BadRequestException(`每天最多新增 ${USER_GEAR_LIMITS.dailyByType[gearType]} 件${this.getTypeLabel(gearType)}`);
    }
  }

  private getTypeLabel(gearType: UserGearType) {
    if (gearType === 'rod') return '鱼竿';
    if (gearType === 'reel') return '鱼轮';
    return '常用饵';
  }

  private async assertOwnItem(userId: number, id: number) {
    const result = await this.databaseService.query(
      `
      SELECT id, user_id, display_name, note
      FROM user_gear_items
      WHERE id = $1
        AND is_deleted = FALSE
      LIMIT 1
      `,
      [id],
    );

    if (!result.rows.length) {
      throw new NotFoundException('user gear item not found');
    }
    if (Number(result.rows[0].user_id) !== Number(userId)) {
      throw new ForbiddenException('cannot modify another user gear item');
    }
    return result.rows[0];
  }

  private buildSummary(items: any[]) {
    const summary = { reel: 0, rod: 0, lure: 0, total: 0 };
    items.forEach((item) => {
      if (item.gearType === 'reel' || item.gearType === 'rod' || item.gearType === 'lure') {
        summary[item.gearType] += 1;
        summary.total += 1;
      }
    });
    return summary;
  }

  private mapRow(row: any) {
    const imageUrl = this.resolveLatestImage(row) || row.image_url || '';
    const brandName = row.latest_brand_name_zh || row.latest_brand_name || row.latest_brand_name_en || row.brand_name || '';
    const gearModel = row.latest_model_cn || row.latest_model || row.gear_model || '';

    return {
      id: Number(row.id),
      userId: Number(row.user_id),
      gearType: row.gear_type,
      gearMasterId: row.gear_master_id,
      gearVariantId: row.gear_variant_id || '',
      variantKey: row.variant_key || '',
      variantLabel: row.variant_label || '',
      displayName: row.display_name || this.buildDisplayName({ brand_name: brandName, model: gearModel }, row.variant_label),
      brandName,
      gearModel,
      imageUrl,
      ownershipStatus: row.ownership_status || 'owned',
      usageStatus: row.usage_status || 'frequent',
      usageStatusText: USAGE_STATUS_TEXT[row.usage_status] || row.usage_status || '',
      note: row.note || '',
      isPublic: row.is_public === true,
      sortOrder: Number(row.sort_order || 0),
      extra: row.extra || {},
      createTime: row.create_time,
      updateTime: row.update_time,
    };
  }

  private resolveBrandName(row: any) {
    return row.brand_name_zh || row.brand_name || row.brand_name_en || '';
  }

  private resolveImageUrl(row: any) {
    return this.resolveLatestImage({ latest_images: row.images });
  }

  private resolveLatestImage(row: any) {
    const images = row.latest_images || row.images;
    if (Array.isArray(images)) {
      return String(images[0] || '').trim();
    }
    if (typeof images === 'string' && images.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? String(parsed[0] || '').trim() : '';
      } catch (_error) {
        return '';
      }
    }
    return typeof images === 'string' ? images.trim() : '';
  }

  private buildDisplayName(master: any, variantLabel = '') {
    const parts = [
      this.resolveBrandName(master),
      master.modelCn || master.model || master.displayName || '',
      variantLabel,
    ].map((item) => String(item || '').trim()).filter(Boolean);
    return parts.join(' ').trim() || '未命名装备';
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
