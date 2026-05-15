import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../common/database.service';
import { ModerationService } from '../moderation/moderation.service';
import { CreateUserGearSetDto } from './dto/create-user-gear-set.dto';
import { ListUserGearSetDto } from './dto/list-user-gear-set.dto';
import { UpdateUserGearSetDto } from './dto/update-user-gear-set.dto';

type GearType = 'rod' | 'reel' | 'lure';
type RodHandleType = 'spinning' | 'casting' | 'unknown';
type ReelSubtype = 'spinning' | 'baitcasting' | 'drum' | 'unknown';
type ProfileDisplayStatus = 'not_displayed' | 'showing' | 'invalid';

type NormalizedPayload = {
  name: string;
  rodItemId: number | null;
  reelItemId: number | null;
  lureItemIds: number[];
  targetFish: string[];
  useScene: string[];
  note: string;
  showOnProfile: boolean;
  sortOrder?: number;
  compatibilityOverrides: {
    rodHandleType?: 'spinning' | 'casting';
    reelSubtype?: 'spinning' | 'baitcasting' | 'drum';
  };
};

const SET_LIMITS = {
  activeSets: 30,
  profileSets: 3,
  dailyCreates: 10,
  dailyEdits: 50,
  luresPerSet: 20,
};

const ROLE_ORDER: Record<GearType, number> = {
  rod: 0,
  reel: 1,
  lure: 2,
};

@Injectable()
export class UserGearSetService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly moderationService: ModerationService,
  ) {}

  async list(viewerUserId: number, query: ListUserGearSetDto) {
    const targetUserId = Number(query.userId || viewerUserId || 0);
    if (!targetUserId) {
      throw new UnauthorizedException('missing bearer token');
    }

    const isSelf = Boolean(viewerUserId && viewerUserId === targetUserId);
    const limit = Math.min(Math.max(Number(query.limit || 50), 1), 50);
    const page = Math.max(Number(query.page || 1), 1);
    const offset = (page - 1) * limit;
    const summaryOnly = query.summaryOnly === 'true';
    const profileOnly = query.profileOnly === 'true' || !isSelf;
    const fetchLimit = profileOnly ? 50 : limit;
    const fetchOffset = profileOnly ? 0 : offset;
    const params: any[] = [targetUserId];
    const conditions = ['user_id = $1', 'is_deleted = FALSE'];

    if (profileOnly) {
      conditions.push('show_on_profile = TRUE');
    }

    const totalResult = await this.databaseService.query(
      `
      SELECT COUNT(*)::int AS count
      FROM user_gear_sets
      WHERE ${conditions.join(' AND ')}
      `,
      params,
    );

    params.push(fetchLimit, fetchOffset);
    const result = await this.databaseService.query(
      `
      SELECT *
      FROM user_gear_sets
      WHERE ${conditions.join(' AND ')}
      ORDER BY profile_sort_order ASC, sort_order ASC, COALESCE(profile_selected_at, update_time) DESC, update_time DESC
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
      `,
      params,
    );

    const sets = result.rows;
    const itemsBySetId = await this.loadItemsBySetIds(sets.map((row) => Number(row.id)));
    const mappedItems = this.applyProfileDisplayState(
      sets.map((row) => this.mapSetRow(row, itemsBySetId.get(Number(row.id)) || [], summaryOnly)),
    );
    const items = profileOnly
      ? mappedItems.filter((item) => item.profileDisplayStatus === 'showing').slice(0, Math.min(limit, SET_LIMITS.profileSets))
      : mappedItems;
    const profileShowingCount = mappedItems.filter((item) => item.profileDisplayStatus === 'showing').length;

    return {
      summary: {
        total: profileOnly ? items.length : Number(totalResult.rows[0]?.count || 0),
        profileShowing: profileOnly ? items.length : profileShowingCount,
        public: profileOnly ? items.length : profileShowingCount,
      },
      limits: isSelf ? await this.buildLimitState(targetUserId) : null,
      page,
      limit,
      total: profileOnly ? items.length : Number(totalResult.rows[0]?.count || 0),
      items,
    };
  }

  async detail(viewerUserId: number, id: number) {
    const result = await this.databaseService.query(
      `
      SELECT *
      FROM user_gear_sets
      WHERE id = $1
        AND is_deleted = FALSE
      LIMIT 1
      `,
      [id],
    );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException('gear set not found');
    }

    const isSelf = Boolean(viewerUserId && Number(row.user_id) === Number(viewerUserId));
    const itemsBySetId = await this.loadItemsBySetIds([id]);
    let mapped = this.applyProfileDisplayState([
      this.mapSetRow(row, itemsBySetId.get(id) || [], false),
    ])[0];
    if (
      mapped.showOnProfile === true &&
      mapped.profileDisplayStatus === 'showing' &&
      await this.isProfileLimitExceededForSet(Number(row.user_id), id)
    ) {
      mapped = {
        ...mapped,
        profileDisplayStatus: 'invalid',
        profileBlockedReasons: ['profile_limit_exceeded'],
        profileStatusText: this.getProfileStatusText('invalid'),
      };
    }
    if (!isSelf && mapped.profileDisplayStatus !== 'showing') {
      throw new ForbiddenException('cannot view this gear set');
    }
    return mapped;
  }

  async create(userId: number, dto: CreateUserGearSetDto) {
    const payload = await this.validatePayload(userId, this.normalizePayload(dto, false), null);
    await this.assertCreateLimits(userId, payload);

    const compatibility = this.validateCompatibility(payload.items, payload);
    const pendingTargetId = this.buildPendingModerationTargetId(userId);
    await this.reviewUserGearSetText(userId, pendingTargetId, payload);

    const setId = await this.databaseService.withTransaction(async (client) => {
      const created = await client.query(
        `
        INSERT INTO user_gear_sets
        (
          user_id, name, target_fish, use_scene, note, show_on_profile, profile_selected_at, sort_order,
          compatibility_status, compatibility_message, cover_image_url, extra,
          create_time, update_time
        )
        VALUES
        ($1, $2, $3::jsonb, $4::jsonb, $5, $6, CASE WHEN $6 THEN NOW() ELSE NULL END, 0, $7, $8, $9, $10::jsonb, NOW(), NOW())
        RETURNING *
        `,
        [
          userId,
          payload.name,
          JSON.stringify(payload.targetFish),
          JSON.stringify(payload.useScene),
          payload.note || null,
          payload.showOnProfile,
          compatibility.status,
          compatibility.message,
          this.resolveCoverImage(payload.items),
          JSON.stringify(this.buildSetExtra(payload, compatibility)),
        ],
      );

      await this.replaceSetItems(client, Number(created.rows[0].id), userId, payload.items);
      return Number(created.rows[0].id);
    });

    await this.moderationService.relinkPendingRecords({
      targetType: 'user_gear_set',
      fromTargetId: pendingTargetId,
      toTargetId: setId,
      userId,
    });

    return this.detail(userId, setId);
  }

  async update(userId: number, id: number, dto: UpdateUserGearSetDto) {
    const current = await this.findOwnSet(userId, id);
    await this.assertDailyEditLimit(userId, id);

    const merged = {
      name: dto.name ?? current.name,
      rodItemId: dto.rodItemId !== undefined ? dto.rodItemId : null,
      reelItemId: dto.reelItemId !== undefined ? dto.reelItemId : null,
      lureItemIds: dto.lureItemIds !== undefined ? dto.lureItemIds : undefined,
      targetFish: dto.targetFish !== undefined ? dto.targetFish : current.target_fish,
      useScene: dto.useScene !== undefined ? dto.useScene : current.use_scene,
      note: dto.note !== undefined ? dto.note : current.note,
      showOnProfile: this.resolveShowOnProfile(dto, current.show_on_profile),
      sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : current.sort_order,
      compatibilityOverrides: dto.compatibilityOverrides || current.extra?.compatibilityOverrides || {},
    };

    if (dto.rodItemId === undefined || dto.reelItemId === undefined || dto.lureItemIds === undefined) {
      const currentItems = await this.loadItemsBySetIds([id]);
      const items = currentItems.get(id) || [];
      merged.rodItemId = dto.rodItemId !== undefined ? dto.rodItemId : this.findRoleItemId(items, 'rod');
      merged.reelItemId = dto.reelItemId !== undefined ? dto.reelItemId : this.findRoleItemId(items, 'reel');
      merged.lureItemIds = dto.lureItemIds !== undefined
        ? dto.lureItemIds
        : items.filter((item) => item.role === 'lure').map((item) => Number(item.user_gear_item_id));
    }

    const payload = await this.validatePayload(userId, this.normalizePayload(merged, true), id);
    await this.assertUpdateLimits(userId, id, payload);
    const compatibility = this.validateCompatibility(payload.items, payload);
    if (this.shouldReviewTextUpdate(dto)) {
      await this.reviewUserGearSetText(userId, id, payload);
    }

    const setId = await this.databaseService.withTransaction(async (client) => {
      const updated = await client.query(
        `
        UPDATE user_gear_sets
        SET name = $3,
            target_fish = $4::jsonb,
            use_scene = $5::jsonb,
            note = $6,
            show_on_profile = $7,
            profile_selected_at = CASE
              WHEN $7 = TRUE AND show_on_profile = FALSE THEN NOW()
              WHEN $7 = FALSE THEN NULL
              ELSE profile_selected_at
            END,
            sort_order = $8,
            compatibility_status = $9,
            compatibility_message = $10,
            cover_image_url = $11,
            extra = $12::jsonb,
            update_time = NOW()
        WHERE id = $1
          AND user_id = $2
          AND is_deleted = FALSE
        RETURNING *
        `,
        [
          id,
          userId,
          payload.name,
          JSON.stringify(payload.targetFish),
          JSON.stringify(payload.useScene),
          payload.note || null,
          payload.showOnProfile,
          payload.sortOrder || 0,
          compatibility.status,
          compatibility.message,
          this.resolveCoverImage(payload.items),
          JSON.stringify(this.buildSetExtra(payload, compatibility)),
        ],
      );

      await client.query(
        `
        UPDATE user_gear_set_items
        SET is_deleted = TRUE,
            delete_time = NOW(),
            update_time = NOW()
        WHERE set_id = $1
          AND user_id = $2
          AND is_deleted = FALSE
        `,
        [id, userId],
      );
      await this.replaceSetItems(client, id, userId, payload.items);
      return Number(updated.rows[0].id);
    });
    return this.detail(userId, setId);
  }

  async remove(userId: number, id: number) {
    await this.findOwnSet(userId, id);

    await this.databaseService.withTransaction(async (client) => {
      await client.query(
        `
        UPDATE user_gear_sets
        SET is_deleted = TRUE,
            delete_time = NOW(),
            update_time = NOW()
        WHERE id = $1
          AND user_id = $2
          AND is_deleted = FALSE
        `,
        [id, userId],
      );
      await client.query(
        `
        UPDATE user_gear_set_items
        SET is_deleted = TRUE,
            delete_time = NOW(),
            update_time = NOW()
        WHERE set_id = $1
          AND user_id = $2
          AND is_deleted = FALSE
        `,
        [id, userId],
      );
    });

    return true;
  }

  private async reviewUserGearSetText(
    userId: number,
    targetId: string | number,
    payload: NormalizedPayload,
  ) {
    const fields = {
      name: payload.name,
      targetFish: payload.targetFish,
      useScene: payload.useScene,
      note: payload.note,
    };
    const content = this.buildModerationContent([
      ['name', payload.name],
      ['targetFish', payload.targetFish.join('、')],
      ['useScene', payload.useScene.join('、')],
      ['note', payload.note],
    ]);
    const decision = await this.moderationService.reviewText(
      'user_gear_set_content',
      content,
      {
        userId,
        targetType: 'user_gear_set',
        targetId,
        extra: {
          fields,
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

  private buildPendingModerationTargetId(userId: number) {
    return `${userId}:user_gear_set:${Date.now()}:${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  private normalizePayload(dto: any, allowPartialSortOrder: boolean): NormalizedPayload {
    const name = String(dto.name || '').trim();
    if (name.length < 2 || name.length > 80) {
      throw new BadRequestException('搭配名称需为 2-80 个字符');
    }

    const rodItemId = this.normalizePositiveId(dto.rodItemId);
    const reelItemId = this.normalizePositiveId(dto.reelItemId);
    const lureItemIds = this.uniqueIds(Array.isArray(dto.lureItemIds) ? dto.lureItemIds : []);
    if (lureItemIds.length > SET_LIMITS.luresPerSet) {
      throw new BadRequestException(`单个搭配最多选择 ${SET_LIMITS.luresPerSet} 个鱼饵`);
    }
    if (!rodItemId && !reelItemId && !lureItemIds.length && !String(dto.note || '').trim()) {
      throw new BadRequestException('请至少选择一件我的装备，或填写搭配备注');
    }

    return {
      name,
      rodItemId,
      reelItemId,
      lureItemIds,
      targetFish: this.normalizeTextArray(dto.targetFish, 3),
      useScene: this.normalizeTextArray(dto.useScene, 3),
      note: String(dto.note || '').trim().slice(0, 200),
      showOnProfile: this.resolveShowOnProfile(dto, false),
      sortOrder: allowPartialSortOrder ? Number(dto.sortOrder || 0) : undefined,
      compatibilityOverrides: this.normalizeCompatibilityOverrides(dto.compatibilityOverrides),
    };
  }

  private async validatePayload(userId: number, payload: NormalizedPayload, setId: number | null) {
    const expectedIds = [
      payload.rodItemId,
      payload.reelItemId,
      ...payload.lureItemIds,
    ].filter(Boolean) as number[];
    const rows = await this.loadOwnedGearItems(userId, expectedIds);
    const rowMap = new Map<number, any>(rows.map((row) => [Number(row.id), row]));
    const items: any[] = [];

    if (payload.rodItemId) {
      items.push(this.assertRoleItem(rowMap, payload.rodItemId, 'rod'));
    }
    if (payload.reelItemId) {
      items.push(this.assertRoleItem(rowMap, payload.reelItemId, 'reel'));
    }
    payload.lureItemIds.forEach((id) => {
      items.push(this.assertRoleItem(rowMap, id, 'lure'));
    });

    return {
      ...payload,
      items: items.map((item) => ({
        ...item,
        role: item.gear_type as GearType,
      })),
      setId,
    };
  }

  private async loadOwnedGearItems(userId: number, ids: number[]) {
    if (!ids.length) {
      return [];
    }

    const result = await this.databaseService.query(
      `
      SELECT
        ugi.*,
        gm.type AS master_type,
        gm.alias AS master_alias,
        gm."typeTips" AS master_type_tips,
        gm.raw_json AS master_raw_json,
        gv.raw_json AS variant_raw_json
      FROM user_gear_items ugi
      LEFT JOIN gear_master gm
        ON gm.kind = ugi.gear_type
       AND gm.id = ugi.gear_master_id
      LEFT JOIN gear_variants gv
        ON gv.kind = ugi.gear_type
       AND gv."gearId" = ugi.gear_master_id
       AND (
         gv."variantId" = ugi.gear_variant_id
         OR gv."sourceKey" = ugi.variant_key
         OR gv.sku = ugi.variant_key
       )
      WHERE ugi.user_id = $1
        AND ugi.id = ANY($2::bigint[])
        AND ugi.is_deleted = FALSE
      `,
      [userId, ids],
    );

    return result.rows;
  }

  private assertRoleItem(rowMap: Map<number, any>, id: number, role: GearType) {
    const row = rowMap.get(id);
    if (!row) {
      throw new NotFoundException('只能选择当前用户自己的我的装备');
    }
    if (row.gear_type !== role) {
      throw new BadRequestException(`选择的${this.getRoleLabel(role)}类型不正确`);
    }
    return row;
  }

  private shouldReviewTextUpdate(dto: UpdateUserGearSetDto) {
    return (
      dto.name !== undefined ||
      dto.targetFish !== undefined ||
      dto.useScene !== undefined ||
      dto.note !== undefined
    );
  }

  private resolveShowOnProfile(dto: any, fallback: boolean) {
    if (dto.showOnProfile !== undefined) {
      return dto.showOnProfile === true;
    }
    if (dto.isPublic !== undefined) {
      return dto.isPublic === true;
    }
    return fallback === true;
  }

  private validateCompatibility(items: any[], payload: NormalizedPayload) {
    const rod = items.find((item) => item.role === 'rod');
    const reel = items.find((item) => item.role === 'reel');
    if (!rod || !reel) {
      return { status: 'valid', message: '' };
    }

    const rodHandleType = this.resolveRodHandleType(rod, payload.compatibilityOverrides.rodHandleType);
    const reelSubtype = this.resolveReelSubtype(reel, payload.compatibilityOverrides.reelSubtype);
    const missing: string[] = [];

    if (rodHandleType === 'unknown') {
      missing.push('rodHandleType');
    }
    if (reelSubtype === 'unknown') {
      missing.push('reelSubtype');
    }
    if (missing.length) {
      throw new ConflictException({
        message: '无法识别鱼竿或渔轮类型，请先手动确认类型后再保存搭配。',
        reason: 'compatibility_type_unknown',
        data: {
          requiresManualConfirmation: true,
          missing,
          rodItemId: Number(rod.id),
          reelItemId: Number(reel.id),
        },
      });
    }

    if (rodHandleType === 'spinning' && reelSubtype !== 'spinning') {
      throw new ConflictException({
        message: '直柄竿只能搭配纺车轮，请调整装备或手动确认类型。',
        reason: 'compatibility_mismatch',
      });
    }
    if (rodHandleType === 'casting' && !['baitcasting', 'drum'].includes(reelSubtype)) {
      throw new ConflictException({
        message: '枪柄竿只能搭配水滴轮或鼓轮，请调整装备或手动确认类型。',
        reason: 'compatibility_mismatch',
      });
    }

    const hasOverrides = Boolean(payload.compatibilityOverrides.rodHandleType || payload.compatibilityOverrides.reelSubtype);
    return {
      status: hasOverrides ? 'manual_confirmed' : 'valid',
      message: hasOverrides ? '已手动确认竿轮类型' : '',
      rodHandleType,
      reelSubtype,
    };
  }

  private resolveRodHandleType(item: any, override?: string): RodHandleType {
    if (override === 'spinning' || override === 'casting') {
      return override;
    }
    const manual = item.extra?.manualSubtype || item.extra?.compatibilityOverrides?.rodHandleType;
    if (manual === 'spinning' || manual === 'casting') {
      return manual;
    }
    const structuredType = this.resolveStructuredRodType(item);
    if (structuredType !== 'unknown') {
      return structuredType;
    }
    const text = this.buildCompatibilityText(item);
    if (this.hasAny(text, ['spinning', '直柄', '纺车'])) return 'spinning';
    if (this.hasAny(text, ['casting', '枪柄', 'bait finesse', 'bfs'])) return 'casting';
    return 'unknown';
  }

  private resolveReelSubtype(item: any, override?: string): ReelSubtype {
    if (override === 'spinning' || override === 'baitcasting' || override === 'drum') {
      return override;
    }
    const manual = item.extra?.manualSubtype || item.extra?.compatibilityOverrides?.reelSubtype;
    if (manual === 'spinning' || manual === 'baitcasting' || manual === 'drum') {
      return manual;
    }
    const text = this.buildCompatibilityText(item);
    if (this.hasAny(text, ['spinning', '纺车'])) return 'spinning';
    if (this.hasAny(text, ['baitcasting', '水滴', '两轴', 'bfs'])) return 'baitcasting';
    if (this.hasAny(text, ['drum', '鼓轮', 'conventional'])) return 'drum';
    return 'unknown';
  }

  private resolveStructuredRodType(item: any): RodHandleType {
    const rawValues = [
      item.variant_raw_json?.TYPE,
      item.variant_raw_json?.type,
      item.variant_raw_json?.rod_type,
      item.master_raw_json?.TYPE,
      item.master_raw_json?.type,
      item.master_raw_json?.type_tips,
      item.master_type,
      item.master_type_tips,
    ].map((value) => String(value || '').trim().toLowerCase()).filter(Boolean);

    if (rawValues.some((value) => value === 's' || value === 'spinning')) {
      return 'spinning';
    }
    if (rawValues.some((value) => value === 'c' || value === 'casting')) {
      return 'casting';
    }

    return 'unknown';
  }

  private buildCompatibilityText(item: any) {
    return [
      item.master_type,
      item.master_alias,
      item.master_type_tips,
      item.display_name,
      item.variant_label,
      item.gear_model,
      JSON.stringify(item.variant_raw_json || {}),
      JSON.stringify(item.master_raw_json || {}),
    ].join(' ').toLowerCase();
  }

  private hasAny(text: string, keywords: string[]) {
    return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
  }

  private async replaceSetItems(client: PoolClient, setId: number, userId: number, items: any[]) {
    const ordered = [...items].sort((a, b) => {
      const roleDiff = ROLE_ORDER[a.role as GearType] - ROLE_ORDER[b.role as GearType];
      return roleDiff || Number(a.id) - Number(b.id);
    });

    for (const [index, item] of ordered.entries()) {
      await client.query(
        `
        INSERT INTO user_gear_set_items
        (
          set_id, user_id, user_gear_item_id, gear_type, role, gear_master_id,
          gear_variant_id, variant_key, variant_label, display_name, brand_name,
          gear_model, image_url, sort_order, extra, create_time, update_time
        )
        VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, NOW(), NOW())
        `,
        [
          setId,
          userId,
          Number(item.id),
          item.gear_type,
          item.role,
          item.gear_master_id || null,
          item.gear_variant_id || null,
          item.variant_key || null,
          item.variant_label || null,
          item.display_name || '未命名装备',
          item.brand_name || null,
          item.gear_model || null,
          item.image_url || null,
          index,
          JSON.stringify({
            sourceUserGearItemUpdateTime: item.update_time,
          }),
        ],
      );
    }
  }

  private async loadItemsBySetIds(setIds: number[]) {
    const map = new Map<number, any[]>();
    if (!setIds.length) {
      return map;
    }

    const result = await this.databaseService.query(
      `
      SELECT
        ugsi.*,
        ugi.id AS current_user_gear_item_id,
        ugi.is_deleted AS current_item_deleted,
        ugi.ownership_status AS current_ownership_status,
        ugi.display_name AS current_display_name,
        ugi.brand_name AS current_brand_name,
        ugi.gear_model AS current_gear_model,
        ugi.image_url AS current_image_url,
        gm."isShow" AS current_master_is_show,
        gm.type AS master_type,
        gm.alias AS master_alias,
        gm."typeTips" AS master_type_tips,
        gm.raw_json AS master_raw_json,
        gv."variantId" AS current_variant_id,
        gv.raw_json AS variant_raw_json
      FROM user_gear_set_items ugsi
      LEFT JOIN user_gear_items ugi
        ON ugi.id = ugsi.user_gear_item_id
      LEFT JOIN gear_master gm
        ON gm.kind = ugsi.gear_type
       AND gm.id = ugsi.gear_master_id
      LEFT JOIN gear_variants gv
        ON gv.kind = ugsi.gear_type
       AND gv."gearId" = ugsi.gear_master_id
       AND (
         gv."variantId" = ugsi.gear_variant_id
         OR gv."sourceKey" = ugsi.variant_key
         OR gv.sku = ugsi.variant_key
       )
      WHERE ugsi.set_id = ANY($1::bigint[])
        AND ugsi.is_deleted = FALSE
      ORDER BY ugsi.set_id ASC, ugsi.sort_order ASC, ugsi.id ASC
      `,
      [setIds],
    );

    result.rows.forEach((row) => {
      const setId = Number(row.set_id);
      if (!map.has(setId)) {
        map.set(setId, []);
      }
      map.get(setId)?.push(row);
    });
    return map;
  }

  private mapSetRow(row: any, items: any[], summaryOnly: boolean) {
    const mappedItems = items.map((item) => this.mapItemRow(item));
    const rod = mappedItems.find((item) => item.role === 'rod') || null;
    const reel = mappedItems.find((item) => item.role === 'reel') || null;
    const lures = mappedItems.filter((item) => item.role === 'lure');

    return {
      id: Number(row.id),
      userId: Number(row.user_id),
      name: row.name || '',
      targetFish: Array.isArray(row.target_fish) ? row.target_fish : [],
      useScene: Array.isArray(row.use_scene) ? row.use_scene : [],
      note: row.note || '',
      showOnProfile: row.show_on_profile === true,
      isPublic: row.show_on_profile === true,
      profileDisplayStatus: 'not_displayed' as ProfileDisplayStatus,
      profileBlockedReasons: [] as string[],
      profileStatusText: '未展示',
      profileSortOrder: Number(row.profile_sort_order || 0),
      profileSelectedAt: row.profile_selected_at || null,
      sortOrder: Number(row.sort_order || 0),
      compatibilityStatus: row.compatibility_status || 'valid',
      compatibilityMessage: row.compatibility_message || '',
      coverImageUrl: row.cover_image_url || '',
      extra: row.extra || {},
      items: summaryOnly ? mappedItems.slice(0, 5) : mappedItems,
      summary: {
        rod,
        reel,
        lures: lures.slice(0, 3),
        lureCount: lures.length,
        text: this.buildSummaryText(rod, reel, lures),
      },
      createTime: row.create_time,
      updateTime: row.update_time,
    };
  }

  private applyProfileDisplayState(items: any[]) {
    let showingRank = 0;
    return items.map((item) => {
      const blockedReasons = this.buildProfileBlockedReasons(item);
      if (item.showOnProfile && !blockedReasons.length) {
        showingRank += 1;
        if (showingRank > SET_LIMITS.profileSets) {
          blockedReasons.push('profile_limit_exceeded');
        }
      }

      const profileDisplayStatus: ProfileDisplayStatus = item.showOnProfile
        ? (blockedReasons.length ? 'invalid' : 'showing')
        : 'not_displayed';
      return this.sanitizeSetForResponse({
        ...item,
        profileDisplayStatus,
        profileBlockedReasons: blockedReasons,
        profileStatusText: this.getProfileStatusText(profileDisplayStatus),
      });
    });
  }

  private buildProfileBlockedReasons(item: any) {
    if (item.showOnProfile !== true) {
      return [];
    }

    const reasons = new Set<string>();
    const items = Array.isArray(item.items) ? item.items : [];
    items.forEach((entry) => {
      if (entry.currentItemDeleted) {
        reasons.add(`${entry.role}_deleted`);
        reasons.add('gear_item_deleted');
      }
      if (entry.ownershipStatus && entry.ownershipStatus !== 'owned') {
        reasons.add('gear_item_not_owned');
      }
      if (entry.currentMasterHidden) {
        reasons.add('gear_master_hidden');
      }
      if (entry.currentVariantMissing) {
        reasons.add('gear_variant_missing');
      }
    });

    const rod = items.find((entry) => entry.role === 'rod');
    const reel = items.find((entry) => entry.role === 'reel');
    if (!rod && !reel) {
      reasons.add('profile_missing_main_gear');
    }
    if (rod && reel && this.isRodReelMismatch(rod, reel, item.extra?.compatibilityOverrides || {})) {
      reasons.add('invalid_rod_reel_combo');
    }

    return Array.from(reasons);
  }

  private isRodReelMismatch(rod: any, reel: any, overrides: NormalizedPayload['compatibilityOverrides']) {
    const rodHandleType = this.resolveRodHandleType(rod, overrides.rodHandleType);
    const reelSubtype = this.resolveReelSubtype(reel, overrides.reelSubtype);
    if (rodHandleType === 'unknown' || reelSubtype === 'unknown') {
      return false;
    }
    if (rodHandleType === 'spinning') {
      return reelSubtype !== 'spinning';
    }
    return !['baitcasting', 'drum'].includes(reelSubtype);
  }

  private getProfileStatusText(status: ProfileDisplayStatus) {
    if (status === 'showing') return '主页展示中';
    if (status === 'invalid') return '展示异常';
    return '未展示';
  }

  private mapItemRow(row: any) {
    const displayName = row.current_display_name || row.display_name || '';
    const brandName = row.current_brand_name || row.brand_name || '';
    const gearModel = row.current_gear_model || row.gear_model || '';
    const imageUrl = row.current_image_url || row.image_url || '';
    return {
      id: Number(row.id),
      setId: Number(row.set_id),
      userGearItemId: Number(row.user_gear_item_id),
      role: row.role,
      gearType: row.gear_type,
      gearMasterId: row.gear_master_id || '',
      gearVariantId: row.gear_variant_id || '',
      variantKey: row.variant_key || '',
      variantLabel: row.variant_label || '',
      displayName,
      brandName,
      gearModel,
      imageUrl,
      ownershipStatus: row.current_ownership_status || '',
      currentItemDeleted: row.current_item_deleted === true || row.current_user_gear_item_id === null,
      currentMasterHidden: row.current_master_is_show !== undefined && row.current_master_is_show !== null
        ? Number(row.current_master_is_show) !== 1
        : false,
      currentVariantMissing: Boolean(row.variant_key || row.gear_variant_id) && !row.current_variant_id,
      sortOrder: Number(row.sort_order || 0),
      label: displayName || row.variant_label || gearModel || '',
      master_type: row.master_type,
      master_alias: row.master_alias,
      master_type_tips: row.master_type_tips,
      master_raw_json: row.master_raw_json,
      variant_raw_json: row.variant_raw_json,
    };
  }

  private sanitizeSetForResponse(item: any) {
    const items = Array.isArray(item.items)
      ? item.items.map((entry) => this.stripInternalItemFields(entry))
      : [];
    const rod = items.find((entry) => entry.role === 'rod') || null;
    const reel = items.find((entry) => entry.role === 'reel') || null;
    const lures = items.filter((entry) => entry.role === 'lure');

    return {
      ...item,
      items,
      summary: {
        ...(item.summary || {}),
        rod,
        reel,
        lures: lures.slice(0, 3),
        lureCount: lures.length,
        text: this.buildSummaryText(rod, reel, lures),
      },
    };
  }

  private stripInternalItemFields(item: any) {
    const {
      currentItemDeleted,
      currentMasterHidden,
      currentVariantMissing,
      master_type,
      master_alias,
      master_type_tips,
      master_raw_json,
      variant_raw_json,
      ...publicItem
    } = item;
    return publicItem;
  }

  private buildSummaryText(rod: any, reel: any, lures: any[]) {
    const main = [rod?.label, reel?.label].filter(Boolean).join(' + ');
    const lureText = lures.slice(0, 3).map((item) => item.label).filter(Boolean).join('、');
    if (main && lureText) {
      return `${main}；常用饵：${lureText}${lures.length > 3 ? `等${lures.length}个` : ''}`;
    }
    return main || lureText || '';
  }

  private async findOwnSet(userId: number, id: number) {
    const result = await this.databaseService.query(
      `
      SELECT *
      FROM user_gear_sets
      WHERE id = $1
        AND is_deleted = FALSE
      LIMIT 1
      `,
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException('gear set not found');
    }
    if (Number(row.user_id) !== Number(userId)) {
      throw new ForbiddenException('cannot modify another user gear set');
    }
    return row;
  }

  private async assertCreateLimits(userId: number, payload: NormalizedPayload) {
    const [activeCount, dailyCount] = await Promise.all([
      this.countActiveSets(userId),
      this.countDailyCreatedSets(userId),
    ]);
    if (activeCount >= SET_LIMITS.activeSets) {
      throw new BadRequestException(`我的搭配最多保留 ${SET_LIMITS.activeSets} 个`);
    }
    if (dailyCount >= SET_LIMITS.dailyCreates) {
      throw new BadRequestException(`每天最多新增 ${SET_LIMITS.dailyCreates} 个搭配`);
    }
  }

  private async assertUpdateLimits(userId: number, setId: number, payload: NormalizedPayload) {
    void userId;
    void setId;
    void payload;
  }

  private async assertDailyEditLimit(userId: number, setId: number) {
    const result = await this.databaseService.query(
      `
      SELECT COUNT(*)::int AS count
      FROM user_gear_sets
      WHERE user_id = $1
        AND id <> $2
        AND is_deleted = FALSE
        AND update_time >= date_trunc('day', NOW())
      `,
      [userId, setId],
    );
    if (Number(result.rows[0]?.count || 0) >= SET_LIMITS.dailyEdits) {
      throw new BadRequestException(`每天最多编辑 ${SET_LIMITS.dailyEdits} 个搭配`);
    }
  }

  private async countActiveSets(userId: number) {
    const result = await this.databaseService.query(
      'SELECT COUNT(*)::int AS count FROM user_gear_sets WHERE user_id = $1 AND is_deleted = FALSE',
      [userId],
    );
    return Number(result.rows[0]?.count || 0);
  }

  private async countProfileSelectedSets(userId: number) {
    const result = await this.databaseService.query(
      `
      SELECT COUNT(*)::int AS count
      FROM user_gear_sets
      WHERE user_id = $1
        AND show_on_profile = TRUE
        AND is_deleted = FALSE
      `,
      [userId],
    );
    return Number(result.rows[0]?.count || 0);
  }

  private async isProfileLimitExceededForSet(userId: number, setId: number) {
    const result = await this.databaseService.query(
      `
      SELECT id
      FROM user_gear_sets
      WHERE user_id = $1
        AND show_on_profile = TRUE
        AND is_deleted = FALSE
      ORDER BY profile_sort_order ASC, sort_order ASC, COALESCE(profile_selected_at, update_time) DESC, update_time DESC
      LIMIT $2
      `,
      [userId, SET_LIMITS.profileSets],
    );
    return !result.rows.some((row) => Number(row.id) === Number(setId));
  }

  private async countDailyCreatedSets(userId: number) {
    const result = await this.databaseService.query(
      `
      SELECT COUNT(*)::int AS count
      FROM user_gear_sets
      WHERE user_id = $1
        AND create_time >= date_trunc('day', NOW())
      `,
      [userId],
    );
    return Number(result.rows[0]?.count || 0);
  }

  private async buildLimitState(userId: number) {
    const [activeSets, profileSets, dailyCreates] = await Promise.all([
      this.countActiveSets(userId),
      this.countProfileSelectedSets(userId),
      this.countDailyCreatedSets(userId),
    ]);
    return {
      activeSets: { used: activeSets, max: SET_LIMITS.activeSets },
      profileSets: { used: profileSets, max: SET_LIMITS.profileSets },
      publicSets: { used: profileSets, max: SET_LIMITS.profileSets },
      dailyCreates: { used: dailyCreates, max: SET_LIMITS.dailyCreates },
      luresPerSet: SET_LIMITS.luresPerSet,
    };
  }

  private buildSetExtra(payload: NormalizedPayload, compatibility: any) {
    return {
      compatibilityOverrides: payload.compatibilityOverrides,
      compatibility: {
        rodHandleType: compatibility.rodHandleType || '',
        reelSubtype: compatibility.reelSubtype || '',
      },
    };
  }

  private resolveCoverImage(items: any[]) {
    const first = items.find((item) => item.image_url);
    return first?.image_url || null;
  }

  private findRoleItemId(items: any[], role: GearType) {
    const item = items.find((entry) => entry.role === role);
    return item ? Number(item.user_gear_item_id || 0) : null;
  }

  private normalizePositiveId(value: any) {
    const numberValue = Number(value || 0);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
  }

  private uniqueIds(values: any[]) {
    return Array.from(new Set(values.map((value) => this.normalizePositiveId(value)).filter(Boolean))) as number[];
  }

  private normalizeTextArray(value: any, max: number) {
    return (Array.isArray(value) ? value : [])
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, max);
  }

  private normalizeCompatibilityOverrides(value: any) {
    const source = value && typeof value === 'object' ? value : {};
    const overrides: NormalizedPayload['compatibilityOverrides'] = {};
    if (source.rodHandleType === 'spinning' || source.rodHandleType === 'casting') {
      overrides.rodHandleType = source.rodHandleType;
    }
    if (source.reelSubtype === 'spinning' || source.reelSubtype === 'baitcasting' || source.reelSubtype === 'drum') {
      overrides.reelSubtype = source.reelSubtype;
    }
    return overrides;
  }

  private getRoleLabel(role: GearType) {
    if (role === 'rod') return '鱼竿';
    if (role === 'reel') return '渔轮';
    return '鱼饵';
  }
}
