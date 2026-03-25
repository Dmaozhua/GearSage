import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import {
  POINTS_GOODS_SEEDS,
  STARTER_TAG_IDS,
  TAG_DEFINITION_SEEDS,
  PointsGoodsSeed,
  TagDefinitionSeed,
} from './tag.seed';

type PostTagMode = 'main' | 'smart' | 'custom' | 'hidden';

type OwnedTagRecord = {
  id: number;
  user_id: number;
  tag_id: string;
  obtain_method: string;
  obtain_source_id: string | null;
  status: string;
  obtained_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

type TagDefinitionRecord = {
  id: string;
  code: string;
  name: string;
  type: string;
  sub_type: string;
  rarity_level: number;
  style_key: string;
  icon_key: string;
  source_type: string;
  is_redeemable: boolean;
  is_wearable: boolean;
  is_active: boolean;
  display_priority: number;
  credibility_weight: number;
  is_authoritative: boolean;
  scene_scope: any;
  description: string;
};

type DisplaySettingsRecord = {
  user_id: number;
  main_tag_id: string | null;
  equipped_tag_id: string | null;
  display_strategy: string;
  post_tag_mode: PostTagMode;
  custom_post_tags: Record<string, any> | null;
  prefer_identity_in_review: boolean;
  prefer_fun_in_catch: boolean;
};

type GoodsRecord = {
  id: string;
  type: number;
  tag_id: string | null;
  goods_name: string;
  points: number;
  image: string;
  description: string;
  rules: string;
  rarity_level: number;
  stock: number;
  is_available: boolean;
};

const GROUP_META: Record<string, { label: string; displayLabel: string; description: string }> = {
  identity: {
    label: '身份',
    displayLabel: '身份标签',
    description: '代表你的钓鱼偏好、器材方向和内容身份。',
  },
  fun: {
    label: '梗图',
    displayLabel: '娱乐标签',
    description: '更轻松的钓鱼圈黑话，适合让内容更有社区味道。',
  },
  behavior: {
    label: '经历',
    displayLabel: '经历标签',
    description: '记录长期活跃、里程碑和真实参与痕迹。',
  },
  official: {
    label: '官方',
    displayLabel: '官方标签',
    description: '来自认证、活动、官方发放或特殊荣誉。',
  },
};

const GROUP_ORDER = ['identity', 'fun', 'behavior', 'official'];

const TOPIC_META = [
  { key: 'recommend', label: '好物速报', topicCategory: 0 },
  { key: 'experience', label: '长测评', topicCategory: 1 },
  { key: 'question', label: '讨论&提问', topicCategory: 2 },
  { key: 'catch', label: '鱼获展示', topicCategory: 3 },
  { key: 'trip', label: '钓行分享', topicCategory: 4 },
];

const SMART_PRIORITY_BY_TOPIC: Record<number, string[]> = {
  0: ['identity', 'behavior', 'fun', 'official'],
  1: ['official', 'identity', 'behavior', 'fun'],
  2: ['identity', 'fun', 'behavior', 'official'],
  3: ['fun', 'behavior', 'identity', 'official'],
  4: ['official', 'identity', 'behavior', 'fun'],
};

const CUSTOM_TAG_REF = {
  MAIN: '__main__',
  SMART: '__smart__',
  HIDDEN: '__hidden__',
};

@Injectable()
export class TagService {
  private seedPromise: Promise<void> | null = null;

  constructor(private readonly databaseService: DatabaseService) {}

  async getUsableTags(userId: number) {
    const profile = await this.getTagProfile(userId);
    return profile.ownedTags;
  }

  async getUsedTags(userId: number) {
    const profile = await this.getTagProfile(userId);
    return {
      mainTagId: profile.mainTag ? profile.mainTag.id : null,
      mainTag: profile.mainTag,
      equippedTagId: profile.mainTag ? profile.mainTag.id : null,
      equippedTag: profile.mainTag,
      postTagMode: profile.settings.postTagMode,
      customPostTags: profile.settings.customPostTags,
      settings: {
        mainTagId: profile.mainTag ? profile.mainTag.id : null,
        postTagMode: profile.settings.postTagMode,
        customPostTags: profile.settings.customPostTags,
        preferIdentityInReview: profile.settings.preferIdentityInReview,
        preferFunInCatch: profile.settings.preferFunInCatch,
      },
      ownedTags: profile.ownedTags,
      groupedTags: profile.groupedTags,
      previewByPostType: profile.previewByPostType,
    };
  }

  async updateUsedTags(
    userId: number,
    payload: {
      mainTagId?: string | null;
      equippedTagId?: string | null;
      tagId?: string | null;
      postTagMode?: string;
      customPostTags?: Record<string, any>;
      preferIdentityInReview?: boolean;
      preferFunInCatch?: boolean;
    },
  ) {
    const profile = await this.getTagProfile(userId);
    const hasMainTagUpdate =
      Object.prototype.hasOwnProperty.call(payload || {}, 'mainTagId') ||
      Object.prototype.hasOwnProperty.call(payload || {}, 'equippedTagId') ||
      Object.prototype.hasOwnProperty.call(payload || {}, 'tagId');
    const requestedTagId = hasMainTagUpdate
      ? this.firstDefined(payload.mainTagId, payload.equippedTagId, payload.tagId, null)
      : undefined;

    let nextMainTagId = profile.settings.mainTagId || null;
    if (requestedTagId === null || requestedTagId === '') {
      nextMainTagId = null;
    } else if (requestedTagId !== undefined) {
      const matchedTag = profile.ownedTags.find(
        (tag: any) =>
          String(tag.tagId || '') === String(requestedTagId) ||
          String(tag.code || '') === String(requestedTagId),
      );
      if (!matchedTag) {
        throw new BadRequestException('标签不存在或未拥有');
      }
      nextMainTagId = String(matchedTag.tagId);
    }

    const nextPostTagMode = this.normalizePostTagMode(
      this.firstDefined(payload.postTagMode, profile.settings.postTagMode),
      profile.settings.postTagMode,
    );
    const nextCustomPostTags = this.normalizeCustomPostTags(
      this.firstDefined(payload.customPostTags, profile.settings.customPostTags),
    );

    await this.databaseService.query(
      `
        INSERT INTO user_tag_display_settings (
          user_id,
          main_tag_id,
          equipped_tag_id,
          display_strategy,
          post_tag_mode,
          custom_post_tags,
          prefer_identity_in_review,
          prefer_fun_in_catch
        )
        VALUES ($1, $2, $2, $3, $4, $5::jsonb, $6, $7)
        ON CONFLICT (user_id)
        DO UPDATE SET
          main_tag_id = EXCLUDED.main_tag_id,
          equipped_tag_id = EXCLUDED.equipped_tag_id,
          display_strategy = EXCLUDED.display_strategy,
          post_tag_mode = EXCLUDED.post_tag_mode,
          custom_post_tags = EXCLUDED.custom_post_tags,
          prefer_identity_in_review = EXCLUDED.prefer_identity_in_review,
          prefer_fun_in_catch = EXCLUDED.prefer_fun_in_catch,
          updated_at = NOW()
      `,
      [
        userId,
        nextMainTagId,
        nextPostTagMode === 'main' ? 'fixed' : 'smart',
        nextPostTagMode,
        JSON.stringify(nextCustomPostTags),
        typeof payload.preferIdentityInReview === 'boolean'
          ? payload.preferIdentityInReview
          : profile.settings.preferIdentityInReview,
        typeof payload.preferFunInCatch === 'boolean'
          ? payload.preferFunInCatch
          : profile.settings.preferFunInCatch,
      ],
    );

    return this.getUsedTags(userId);
  }

  async getPointsGoods() {
    await this.ensureSeedData();
    const { rows } = await this.databaseService.query<GoodsRecord>(
      `
        SELECT *
        FROM bz_points_goods
        WHERE type = 0
          AND is_available = TRUE
        ORDER BY points ASC, goods_name ASC
      `,
    );
    const tagMap = await this.getTagDefinitionMap(
      rows.map((item) => item.tag_id).filter(Boolean) as string[],
    );
    return rows.map((item) =>
      this.buildGoodsPayload(
        item,
        (tagMap.get(String(item.tag_id || '')) as TagDefinitionRecord | undefined) || null,
      ),
    );
  }

  async redeemTagByAnyId(userId: number, id: string) {
    await this.ensureSeedData();
    await this.ensureStarterState(userId);
    const targetId = String(id || '').trim();
    if (!targetId) {
      throw new BadRequestException('id is required');
    }

    return this.databaseService.withTransaction<boolean>(async (client) => {
      const goodsResult = await client.query<GoodsRecord>(
        `
          SELECT *
          FROM bz_points_goods
          WHERE type = 0
            AND is_available = TRUE
            AND (id = $1 OR tag_id = $1)
          ORDER BY CASE WHEN id = $1 THEN 0 ELSE 1 END
          LIMIT 1
        `,
        [targetId],
      );
      const goods = goodsResult.rows[0];
      if (!goods) {
        throw new NotFoundException('商品不存在');
      }
      if ((goods.stock || 0) <= 0) {
        throw new BadRequestException('您来晚了～');
      }
      if (!goods.tag_id) {
        throw new BadRequestException('商品数据异常');
      }

      const userResult = await client.query<{ points: number }>(
        `SELECT points FROM bz_mini_user WHERE id = $1 LIMIT 1`,
        [userId],
      );
      const user = userResult.rows[0];
      if (!user) {
        throw new NotFoundException('用户不存在');
      }
      if (Number(user.points || 0) < Number(goods.points || 0)) {
        throw new BadRequestException('积分不足');
      }

      const definitionResult = await client.query<TagDefinitionRecord>(
        `
          SELECT *
          FROM bz_tag_definitions
          WHERE id = $1
            AND is_active = TRUE
          LIMIT 1
        `,
        [goods.tag_id],
      );
      const definition = definitionResult.rows[0];
      if (!definition) {
        throw new BadRequestException('标签不存在');
      }

      const ownedResult = await client.query(
        `
          SELECT 1
          FROM bz_user_tags
          WHERE user_id = $1
            AND tag_id = $2
            AND status = 'active'
          LIMIT 1
        `,
        [userId, goods.tag_id],
      );
      if (ownedResult.rows.length > 0) {
        throw new BadRequestException('已拥有该标签');
      }

      await client.query(
        `
          INSERT INTO bz_user_tags (
            user_id,
            tag_id,
            obtain_method,
            obtain_source_id,
            status,
            obtained_at
          )
          VALUES ($1, $2, 'redeem', $3, 'active', NOW())
        `,
        [userId, goods.tag_id, goods.id],
      );

      await client.query(
        `
          UPDATE bz_mini_user
          SET points = points - $2,
              "updateTime" = NOW()
          WHERE id = $1
        `,
        [userId, Number(goods.points || 0)],
      );

      await client.query(
        `
          UPDATE bz_points_goods
          SET stock = stock - 1,
              updated_at = NOW()
          WHERE id = $1
        `,
        [goods.id],
      );

      return true;
    });
  }

  async getGoodsList(type = 0) {
    if (Number(type) !== 0) {
      return [];
    }
    return this.getPointsGoods();
  }

  private async getTagProfile(userId: number) {
    await this.ensureSeedData();
    await this.ensureStarterState(userId);

    const [ownedRows, settings] = await Promise.all([
      this.getOwnedTagRows(userId),
      this.getDisplaySettings(userId),
    ]);
    const definitionMap = await this.getTagDefinitionMap(ownedRows.map((item) => item.tag_id));
    const mainTagId = settings.main_tag_id ? String(settings.main_tag_id) : null;
    const ownedTags = this.sortTags(
      ownedRows
        .map((item) =>
          this.mergeOwnedTagWithDefinition(
            item,
            (definitionMap.get(String(item.tag_id)) as TagDefinitionRecord | undefined) || null,
            mainTagId,
          ),
        )
        .filter(Boolean) as any[],
    );
    const mainTag = ownedTags.find((tag: any) => tag.isMainTag) || null;
    const groupedTags = this.buildGroupedTagSummary(ownedTags);
    const normalizedSettings = {
      mainTagId,
      postTagMode: this.normalizePostTagMode(settings.post_tag_mode, 'smart'),
      customPostTags: this.normalizeCustomPostTags(settings.custom_post_tags || {}),
      preferIdentityInReview: Boolean(settings.prefer_identity_in_review),
      preferFunInCatch: Boolean(settings.prefer_fun_in_catch),
    };

    return {
      settings: normalizedSettings,
      mainTag: mainTag ? mainTag.displayTag : null,
      equippedTag: mainTag ? mainTag.displayTag : null,
      ownedTags,
      groupedTags,
      previewByPostType: this.buildPreviewByPostType(ownedTags, normalizedSettings),
    };
  }

  private async ensureSeedData() {
    if (!this.seedPromise) {
      this.seedPromise = this.performSeedData().catch((error) => {
        this.seedPromise = null;
        throw error;
      });
    }
    await this.seedPromise;
  }

  private async performSeedData() {
    const definitionsCount = await this.databaseService.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM bz_tag_definitions`,
    );
    if (Number(definitionsCount.rows[0]?.count || 0) === 0) {
      for (const item of TAG_DEFINITION_SEEDS) {
        await this.insertTagDefinition(item);
      }
    }

    const goodsCount = await this.databaseService.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM bz_points_goods`,
    );
    if (Number(goodsCount.rows[0]?.count || 0) === 0) {
      for (const item of POINTS_GOODS_SEEDS) {
        await this.insertPointsGoods(item);
      }
    }
  }

  private async insertTagDefinition(item: TagDefinitionSeed) {
    await this.databaseService.query(
      `
        INSERT INTO bz_tag_definitions (
          id, code, name, type, sub_type, rarity_level, style_key, icon_key,
          source_type, is_redeemable, is_wearable, is_active, display_priority,
          credibility_weight, is_authoritative, scene_scope, description
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13,
          $14, $15, $16::jsonb, $17
        )
        ON CONFLICT (id) DO NOTHING
      `,
      [
        item.id,
        item.code,
        item.name,
        item.type,
        item.subType,
        item.rarityLevel,
        item.styleKey,
        item.iconKey,
        item.sourceType,
        item.isRedeemable,
        item.isWearable,
        item.isActive,
        item.displayPriority,
        item.credibilityWeight,
        item.isAuthoritative,
        JSON.stringify(item.sceneScope || []),
        item.description,
      ],
    );
  }

  private async insertPointsGoods(item: PointsGoodsSeed) {
    await this.databaseService.query(
      `
        INSERT INTO bz_points_goods (
          id, type, tag_id, goods_name, points, image, description, rules,
          rarity_level, stock, is_available
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `,
      [
        item.id,
        item.type,
        item.tagId,
        item.goodsName,
        item.points,
        item.image,
        item.description,
        item.rules,
        item.rarityLevel,
        item.stock,
        item.isAvailable,
      ],
    );
  }

  private async ensureStarterState(userId: number) {
    const ownedCount = await this.databaseService.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM bz_user_tags
        WHERE user_id = $1
          AND status = 'active'
      `,
      [userId],
    );
    if (Number(ownedCount.rows[0]?.count || 0) === 0) {
      for (const tagId of STARTER_TAG_IDS) {
        await this.databaseService.query(
          `
            INSERT INTO bz_user_tags (
              user_id,
              tag_id,
              obtain_method,
              obtain_source_id,
              status,
              obtained_at
            )
            VALUES ($1, $2, 'system', 'starter', 'active', NOW())
            ON CONFLICT (user_id, tag_id) DO NOTHING
          `,
          [userId, tagId],
        );
      }
    }

    const settingsResult = await this.databaseService.query<{ user_id: number }>(
      `SELECT user_id FROM user_tag_display_settings WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    if (settingsResult.rows.length === 0) {
      await this.databaseService.query(
        `
          INSERT INTO user_tag_display_settings (
            user_id,
            main_tag_id,
            equipped_tag_id,
            display_strategy,
            post_tag_mode,
            custom_post_tags,
            prefer_identity_in_review,
            prefer_fun_in_catch
          )
          VALUES ($1, $2, $2, 'smart', 'smart', '{}'::jsonb, FALSE, FALSE)
          ON CONFLICT (user_id) DO NOTHING
        `,
        [userId, STARTER_TAG_IDS[0] || null],
      );
    }
  }

  private async getOwnedTagRows(userId: number) {
    const { rows } = await this.databaseService.query<OwnedTagRecord>(
      `
        SELECT *
        FROM bz_user_tags
        WHERE user_id = $1
          AND status = 'active'
        ORDER BY obtained_at DESC NULLS LAST, id DESC
      `,
      [userId],
    );
    return rows;
  }

  private async getDisplaySettings(userId: number) {
    const { rows } = await this.databaseService.query<DisplaySettingsRecord>(
      `
        SELECT *
        FROM user_tag_display_settings
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId],
    );
    return (
      rows[0] || {
        user_id: userId,
        main_tag_id: null,
        equipped_tag_id: null,
        display_strategy: 'smart',
        post_tag_mode: 'smart',
        custom_post_tags: {},
        prefer_identity_in_review: false,
        prefer_fun_in_catch: false,
      }
    );
  }

  private async getTagDefinitionMap(tagIds: string[]) {
    const normalizedIds = [...new Set((tagIds || []).filter(Boolean).map((item) => String(item)))];
    if (!normalizedIds.length) {
      return new Map<string, TagDefinitionRecord>();
    }
    const { rows } = await this.databaseService.query<TagDefinitionRecord>(
      `
        SELECT *
        FROM bz_tag_definitions
        WHERE id = ANY($1::varchar[])
      `,
      [normalizedIds],
    );
    return new Map(rows.map((item) => [String(item.id), item]));
  }

  private mergeOwnedTagWithDefinition(
    owned: OwnedTagRecord,
    definition: TagDefinitionRecord | null,
    mainTagId: string | null,
  ) {
    if (!definition || !definition.is_active) {
      return null;
    }
    const resolvedId = String(definition.id || owned.tag_id || '');
    const displayCategory = this.normalizeDisplayCategory(definition.type, definition.sub_type);
    const displayMeta = GROUP_META[displayCategory] || GROUP_META.fun;
    const isMainTag = Boolean(mainTagId) && resolvedId === String(mainTagId);
    const displayTag = this.createDisplayTagPayload(definition, isMainTag);

    return {
      id: owned.id,
      userTagId: String(owned.id),
      tagId: resolvedId,
      resolvedId,
      code: String(definition.code || ''),
      name: String(definition.name || ''),
      type: String(definition.type || 'fun'),
      subType: String(definition.sub_type || ''),
      rarityLevel: Number(definition.rarity_level || 1) || 1,
      styleKey: String(definition.style_key || ''),
      iconKey: String(definition.icon_key || ''),
      description: String(definition.description || ''),
      displayPriority: Number(definition.display_priority || 0) || 0,
      credibilityWeight: Number(definition.credibility_weight || 0) || 0,
      sourceType: String(definition.source_type || ''),
      sourceLabel: this.getSourceLabel(definition.source_type),
      displayCategory,
      displayLabel: displayMeta.displayLabel,
      displayCategoryLabel: displayMeta.label,
      displayCategoryDescription: displayMeta.description,
      isMainTag,
      isEquipped: isMainTag,
      isSelected: isMainTag,
      selected: isMainTag,
      status: owned.status,
      obtainMethod: owned.obtain_method,
      obtainSourceId: owned.obtain_source_id,
      obtainedAt: owned.obtained_at,
      expiresAt: owned.expires_at,
      createdAt: owned.created_at,
      updatedAt: owned.updated_at,
      displayTag,
    };
  }

  private createDisplayTagPayload(definition: TagDefinitionRecord, isMainTag = false) {
    const displayCategory = this.normalizeDisplayCategory(definition.type, definition.sub_type);
    const displayMeta = GROUP_META[displayCategory] || GROUP_META.fun;
    return {
      id: String(definition.id || ''),
      code: String(definition.code || ''),
      name: String(definition.name || ''),
      type: String(definition.type || 'fun').toLowerCase(),
      subType: String(definition.sub_type || ''),
      rarityLevel: Number(definition.rarity_level || 1) || 1,
      styleKey: String(definition.style_key || ''),
      iconKey: String(definition.icon_key || ''),
      isAuthoritative: Boolean(definition.is_authoritative),
      displayCategory,
      displayCategoryLabel: displayMeta.label,
      displayLabel: displayMeta.displayLabel,
      rarityLabel: `R${Math.max(1, Math.min(5, Number(definition.rarity_level || 1) || 1))}`,
      sourceLabel: this.getSourceLabel(definition.source_type),
      isMainTag,
      isEquipped: isMainTag,
    };
  }

  private sortTags(tags: any[]) {
    return [...tags].sort((a, b) => {
      const priorityDiff = (Number(b.displayPriority) || 0) - (Number(a.displayPriority) || 0);
      if (priorityDiff !== 0) return priorityDiff;

      const credibilityDiff = (Number(b.credibilityWeight) || 0) - (Number(a.credibilityWeight) || 0);
      if (credibilityDiff !== 0) return credibilityDiff;

      const rarityDiff = (Number(b.rarityLevel) || 0) - (Number(a.rarityLevel) || 0);
      if (rarityDiff !== 0) return rarityDiff;

      const timeA = new Date(a.obtainedAt || a.createdAt || 0).getTime() || 0;
      const timeB = new Date(b.obtainedAt || b.createdAt || 0).getTime() || 0;
      return timeB - timeA;
    });
  }

  private normalizeDisplayCategory(type: string, subType: string) {
    const normalizedType = String(type || '').trim().toLowerCase();
    const normalizedSubType = String(subType || '').trim().toLowerCase();
    if (normalizedType === 'official') return 'official';
    if (normalizedType === 'identity') return 'identity';
    if (normalizedType === 'fun') return 'fun';
    if (
      normalizedType === 'event' ||
      ['achievement', 'milestone', 'record', 'tracker', 'habit', 'founder', 'honor'].includes(normalizedSubType)
    ) {
      return 'behavior';
    }
    return 'fun';
  }

  private getSourceLabel(sourceType: string) {
    const normalized = String(sourceType || '').trim().toLowerCase();
    if (['shop', 'redeem', 'exchange'].includes(normalized)) return '积分兑换';
    if (['event', 'activity', 'campaign'].includes(normalized)) return '活动获得';
    if (['official', 'staff'].includes(normalized)) return '官方发放';
    return '系统授予';
  }

  private buildGroupedTagSummary(tagItems: any[]) {
    const groups = GROUP_ORDER.map((key) => {
      const meta = GROUP_META[key];
      const tags = tagItems.filter((item) => item.displayCategory === key);
      return {
        key,
        label: meta.label,
        displayLabel: meta.displayLabel,
        description: meta.description,
        count: tags.length,
        tags,
      };
    });

    return [
      {
        key: 'all',
        label: '全部',
        displayLabel: '全部标签',
        description: '按展示方式整理你的全部标签',
        count: tagItems.length,
        tags: tagItems,
      },
      ...groups,
    ];
  }

  private buildPreviewByPostType(tagItems: any[], settings: any) {
    return TOPIC_META.map((item) => {
      const displayTag = this.resolveDisplayTagForTopic(tagItems, item.topicCategory, settings);
      return {
        ...item,
        displayTag,
        tagName: displayTag ? displayTag.name : '',
        categoryLabel: displayTag ? displayTag.displayLabel : '',
      };
    });
  }

  private resolveDisplayTagForTopic(tagItems: any[], topicCategory: number, settings: any) {
    const postTagMode = this.normalizePostTagMode(settings.postTagMode, 'smart');
    const customTopicKey = TOPIC_META.find((item) => item.topicCategory === topicCategory)?.key || '';
    const customRef = this.normalizeCustomTagRef((settings.customPostTags || {})[customTopicKey]);
    const mainTag = tagItems.find((item) => item.isMainTag) || null;
    const smartTag = this.resolveSmartTagForTopic(tagItems, topicCategory, mainTag);

    if (postTagMode === 'hidden') {
      return null;
    }
    if (postTagMode === 'main') {
      return mainTag ? mainTag.displayTag : null;
    }

    if (postTagMode === 'custom' && customTopicKey) {
      if (customRef === CUSTOM_TAG_REF.HIDDEN) return null;
      if (customRef === CUSTOM_TAG_REF.MAIN) return mainTag ? mainTag.displayTag : null;
      if (customRef && customRef !== CUSTOM_TAG_REF.SMART) {
        const matchedTag = tagItems.find(
          (item) =>
            String(item.tagId || '') === String(customRef) ||
            String(item.resolvedId || '') === String(customRef),
        );
        if (matchedTag) {
          return matchedTag.displayTag;
        }
      }
    }

    return smartTag ? smartTag.displayTag : mainTag ? mainTag.displayTag : null;
  }

  private resolveSmartTagForTopic(tagItems: any[], topicCategory: number, mainTag: any) {
    const priorities = SMART_PRIORITY_BY_TOPIC[Number(topicCategory)] || SMART_PRIORITY_BY_TOPIC[0];
    for (const groupKey of priorities) {
      const matched = tagItems.find((item) => item.displayCategory === groupKey);
      if (matched) return matched;
    }
    return mainTag || tagItems[0] || null;
  }

  private normalizePostTagMode(value: any, fallback: PostTagMode): PostTagMode {
    const normalized = String(value || '').trim().toLowerCase();
    if (['main', 'smart', 'custom', 'hidden'].includes(normalized)) {
      return normalized as PostTagMode;
    }
    if (normalized === 'fixed') return 'main';
    return fallback;
  }

  private normalizeCustomPostTags(value: any = {}) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const result: Record<string, string | null> = {};
    ['recommend', 'experience', 'question', 'catch', 'trip'].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        result[key] = this.normalizeCustomTagRef(source[key]);
      }
    });
    return result;
  }

  private normalizeCustomTagRef(value: any) {
    if (value === undefined || value === null || value === '') return null;
    const normalized = String(value).trim();
    if (!normalized) return null;
    return normalized;
  }

  private buildGoodsPayload(goods: GoodsRecord, definition: TagDefinitionRecord | null) {
    const displayTag = definition ? this.createDisplayTagPayload(definition, false) : null;
    return {
      id: goods.id,
      type: goods.type,
      tagId: goods.tag_id,
      goodsName: goods.goods_name || (definition ? definition.name : ''),
      points: Number(goods.points || 0),
      image: goods.image || '/images/icons/h28.png',
      description: goods.description || (definition ? definition.description : ''),
      rules: goods.rules || '兑换规则详见商品详情',
      rarityLevel: definition ? Number(definition.rarity_level || 1) || 1 : Number(goods.rarity_level || 1) || 1,
      stock: Number(goods.stock || 0),
      displayTag,
      tagDefinition: displayTag,
    };
  }

  private firstDefined(...values: any[]) {
    for (const value of values) {
      if (value !== undefined) return value;
    }
    return undefined;
  }
}
