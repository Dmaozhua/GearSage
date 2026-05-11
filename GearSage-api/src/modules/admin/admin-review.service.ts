import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { MediaUrlService } from '../../common/media-url.service';
import { AdminLogService } from './admin-log.service';
import { MessageService } from '../message/message.service';

const TOPIC_CATEGORY_LABELS: Record<number, string> = {
  0: '好物速报',
  1: '长测评',
  2: '讨论提问',
  3: '鱼获展示',
  4: '钓行分享',
};

const GEAR_CATEGORY_LABELS: Record<string, string> = {
  rod: '鱼竿',
  reel: '渔轮',
  bait: '鱼饵',
  line: '鱼线',
  hook: '鱼钩',
  combo: '整套搭配',
  other: '其他',
};

const USAGE_YEAR_LABELS: Record<string, string> = {
  love_at_first_sight: '一见钟情',
  '1_month': '1个月',
  '1_3_months': '1-3个月',
  '3_12_months': '3-12个月',
  '1_year_plus': '1年以上',
};

const USAGE_FREQUENCY_LABELS: Record<string, string> = {
  essential: '出钓必备',
  several_times_week: '每周多次',
  once_week: '每周一次',
  several_times_month: '每月多次',
  once_month: '每月一次',
  several_times_year: '每年多次',
};

const RECOMMEND_SUMMARY_LABELS: Record<string, string> = {
  strongly_recommend: '强烈推荐，明显超出预期',
  recommend: '值得推荐，整体满意',
  soso: '有亮点，但不一定适合所有人',
  not_recommend: '不太推荐，实际体验一般',
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  ask: '提问',
  discuss: '讨论',
  recommend: '求推荐',
  avoid_pitfall: '求避坑',
  chat_with_photos: '晒图闲聊',
};

const RATING_LABELS: Record<string, string> = {
  actionMatchScore: '调性匹配',
  sensitivityScore: '传导性',
  castingScore: '抛投表现',
  workmanshipScore: '做工',
  durabilityScore: '耐用性',
  retrieveFeelScore: '收线手感',
  dragScore: '卸力表现',
  smoothnessScore: '顺滑度',
  balanceScore: '轻量与平衡',
  actionScore: '动作表现',
  stabilityScore: '稳定性',
  attractionScore: '诱鱼表现',
  strengthScore: '强度表现',
  abrasionScore: '耐磨性',
  handlingScore: '顺滑与操作感',
  castabilityScore: '抛投表现',
  sharpnessScore: '锋利度',
  penetrationScore: '刺鱼效率',
  resistanceScore: '抗变形',
  coatingScore: '防锈与涂层',
  practicalityScore: '实用性',
  designScore: '设计合理性',
  costScore: '性价比',
};

const REVIEW_ENUM_LABELS: Record<string, string> = {
  strongly_recommend: '强烈推荐，明显超出预期',
  recommend: '值得推荐，整体满意',
  soso: '有亮点，但不一定适合所有人',
  not_recommend: '不太推荐，实际体验一般',
  buy_same: '会继续使用同款',
  buy_upgrade: '会考虑升级同系列',
  try_other: '可能尝试其他品牌',
  never_buy: '不会再买',
  budget_other_balanced: '均衡好用',
  usage_other_longtime: '长时使用',
  fit_intermediate: '进阶玩家',
  unfit_intermediate: '不适合远投需求',
  compare_profile_other_5: '更耐用',
  compare_buy_decision_other_2: '对比款更值得买',
  purchase_advice_other_5: '当前不建议',
  buy_stage_other_5: '收纳备选',
  rod_scene_precise: '精细作钓',
  other_scene_high_uv: '高紫外线',
  other_pro_comfortable: '佩戴舒适',
  other_con_stability_normal: '稳定性一般',
};

const REVIEW_ENUM_TOKEN_LABELS: Record<string, string> = {
  rod: '鱼竿',
  reel: '渔轮',
  bait: '假饵',
  line: '鱼线',
  hook: '钩子',
  other: '其他',
  budget: '预算',
  usage: '使用',
  scene: '场景',
  fit: '适合',
  unfit: '不适合',
  compare: '对比',
  profile: '定位',
  buy: '购买',
  decision: '结论',
  purchase: '入手',
  advice: '建议',
  stage: '阶段',
  pro: '优点',
  con: '不足',
  precise: '精细',
  balanced: '均衡',
  longtime: '长时',
  intermediate: '进阶',
  stability: '稳定性',
  normal: '一般',
  comfortable: '舒适',
  high: '高',
  uv: '紫外线',
  value: '实用',
  premium: '专业',
  general: '泛用',
  main: '主力',
  specialized: '专项',
  threshold: '门槛高',
  daily: '日常',
};

@Injectable()
export class AdminReviewService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly mediaUrlService: MediaUrlService,
    private readonly adminLogService: AdminLogService,
    private readonly messageService: MessageService,
  ) {}

  async listTopics(filters: {
    status?: string;
    keyword?: string;
    limit?: string | number;
  } = {}) {
    const params: any[] = [];
    const normalizedStatus = this.normalizeTopicStatus(filters.status);
    const conditions = this.buildTopicConditions(normalizedStatus);

    if (normalizedStatus !== null) {
      params.push(normalizedStatus);
      conditions.push(`t.status = $${params.length}`);
    }

    if (filters.keyword) {
      params.push(`%${filters.keyword.trim()}%`);
      conditions.push(`(t.title ILIKE $${params.length} OR t.content ILIKE $${params.length})`);
    }

    const limit = this.normalizeLimit(filters.limit);
    params.push(limit);
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.databaseService.query(
      `
      SELECT
        t.id,
        t."topicCategory",
        t.title,
        t.content,
        t.images,
        t.extra,
        t."rejectReason",
        t.status,
        t."isDelete",
        t."userId",
        t."publishTime",
        t."createTime",
        t."updateTime",
        t."likeCount",
        t."commentCount",
        u."nickName" AS "authorName",
        u.phone AS "authorPhone",
        mr.result AS "moderationResult",
        mr.provider AS "moderationProvider",
        mr."riskLevel" AS "moderationRiskLevel",
        mr."riskReason" AS "moderationRiskReason",
        mr."createTime" AS "moderationCreateTime",
        al.action AS "latestAdminAction",
        al.remark AS "latestAdminRemark",
        al."createTime" AS "latestAdminActionTime"
      FROM bz_mini_topic t
      LEFT JOIN bz_mini_user u ON u.id = t."userId"
      LEFT JOIN LATERAL (
        SELECT result, provider, "riskLevel", "riskReason", "createTime"
        FROM moderation_records
        WHERE "targetType" = 'topic'
          AND "targetId" = t.id::text
        ORDER BY id DESC
        LIMIT 1
      ) mr ON TRUE
      LEFT JOIN LATERAL (
        SELECT action, remark, "createTime"
        FROM admin_operation_logs
        WHERE "targetType" = 'topic'
          AND "targetId" = t.id::text
        ORDER BY id DESC
        LIMIT 1
      ) al ON TRUE
      ${whereClause}
      ORDER BY t."updateTime" DESC, t.id DESC
      LIMIT $${params.length}
      `,
      params,
    );

    return result.rows.map((row: any) => this.mapTopicRow(row));
  }

  async getTopicDetail(topicId: number) {
    const topicResult = await this.databaseService.query(
      `
      SELECT
        t.*,
        u."nickName" AS "authorName",
        u.phone AS "authorPhone"
      FROM bz_mini_topic t
      LEFT JOIN bz_mini_user u ON u.id = t."userId"
      WHERE t.id = $1
      LIMIT 1
      `,
      [topicId],
    );

    if (!topicResult.rows.length) {
      throw new NotFoundException('topic not found');
    }

    return {
      ...this.mapTopicRow(topicResult.rows[0], true),
      moderationRecords: await this.listModerationRecords('topic', topicId),
      adminLogs: await this.listTargetLogs('topic', topicId),
    };
  }

  async passTopic(topicId: number, admin: { id: number }, remark?: string) {
    const result = await this.databaseService.query(
      `
      UPDATE bz_mini_topic
      SET
        status = 2,
        "rejectReason" = '',
        "publishTime" = COALESCE("publishTime", NOW()),
        "isDelete" = 0,
        "updateTime" = NOW()
      WHERE id = $1
      RETURNING id, status, "publishTime", "updateTime", title, "userId"
      `,
      [topicId],
    );

    if (!result.rows.length) {
      throw new NotFoundException('topic not found');
    }

    await this.adminLogService.write({
      adminUserId: admin.id,
      targetType: 'topic',
      targetId: topicId,
      action: 'topic_pass',
      remark,
    });

    await this.messageService.deleteByTopic(Number(result.rows[0].userId || 0), Number(result.rows[0].id || topicId), [
      'topic_rejected',
    ]);

    await this.messageService.create({
      userId: Number(result.rows[0].userId || 0),
      type: 'topic_approved',
      title: '你的帖子已通过审核',
      content: `你发布的《${result.rows[0].title || '未命名帖子'}》已通过审核，现在其他用户可以看到了。`,
      targetType: 'topic',
      targetId: result.rows[0].id,
      extra: {
        topicId: Number(result.rows[0].id),
        topicTitle: result.rows[0].title || '',
      },
    });

    return {
      id: Number(result.rows[0].id),
      status: Number(result.rows[0].status),
      publishTime: result.rows[0].publishTime,
      updateTime: result.rows[0].updateTime,
    };
  }

  async rejectTopic(topicId: number, admin: { id: number }, remark?: string) {
    const result = await this.databaseService.query(
      `
      UPDATE bz_mini_topic
      SET
        status = 0,
        "rejectReason" = $2,
        "publishTime" = NULL,
        "isDelete" = 0,
        "updateTime" = NOW()
      WHERE id = $1
      RETURNING id, status, "updateTime", title, "userId", "rejectReason"
      `,
      [topicId, remark || ''],
    );

    if (!result.rows.length) {
      throw new NotFoundException('topic not found');
    }

    await this.adminLogService.write({
      adminUserId: admin.id,
      targetType: 'topic',
      targetId: topicId,
      action: 'topic_reject',
      remark,
    });

    await this.messageService.create({
      userId: Number(result.rows[0].userId || 0),
      type: 'topic_rejected',
      title: '你的帖子未通过审核',
      content: `你发布的《${result.rows[0].title || '未命名帖子'}》未通过审核，已退回草稿，请修改后重新发布。`,
      targetType: 'topic',
      targetId: result.rows[0].id,
      extra: {
        topicId: Number(result.rows[0].id),
        topicTitle: result.rows[0].title || '',
        reason: result.rows[0].rejectReason || '',
        status: 0,
      },
    });

    return {
      id: Number(result.rows[0].id),
      status: Number(result.rows[0].status),
      updateTime: result.rows[0].updateTime,
    };
  }

  async removeTopic(topicId: number, admin: { id: number }, remark?: string) {
    const result = await this.databaseService.query(
      `
      UPDATE bz_mini_topic
      SET
        status = 9,
        "isDelete" = 1,
        "updateTime" = NOW()
      WHERE id = $1
      RETURNING id, status, "isDelete", "updateTime", title, "userId"
      `,
      [topicId],
    );

    if (!result.rows.length) {
      throw new NotFoundException('topic not found');
    }

    await this.adminLogService.write({
      adminUserId: admin.id,
      targetType: 'topic',
      targetId: topicId,
      action: 'topic_remove',
      remark,
    });

    await this.messageService.create({
      userId: Number(result.rows[0].userId || 0),
      type: 'topic_removed',
      title: '你的帖子已被下架',
      content: `你发布的《${result.rows[0].title || '未命名帖子'}》当前已被下架。`,
      targetType: 'topic',
      targetId: result.rows[0].id,
      extra: {
        topicId: Number(result.rows[0].id),
        topicTitle: result.rows[0].title || '',
      },
    });

    return {
      id: Number(result.rows[0].id),
      status: Number(result.rows[0].status),
      isDelete: Number(result.rows[0].isDelete || 0),
      updateTime: result.rows[0].updateTime,
    };
  }

  async restoreTopic(topicId: number, admin: { id: number }, remark?: string) {
    const result = await this.databaseService.query(
      `
      UPDATE bz_mini_topic
      SET
        status = 2,
        "rejectReason" = '',
        "isDelete" = 0,
        "publishTime" = COALESCE("publishTime", NOW()),
        "updateTime" = NOW()
      WHERE id = $1
      RETURNING id, status, "isDelete", "publishTime", "updateTime", title, "userId"
      `,
      [topicId],
    );

    if (!result.rows.length) {
      throw new NotFoundException('topic not found');
    }

    await this.adminLogService.write({
      adminUserId: admin.id,
      targetType: 'topic',
      targetId: topicId,
      action: 'topic_restore',
      remark,
    });

    await this.messageService.deleteByTopic(Number(result.rows[0].userId || 0), Number(result.rows[0].id || topicId), [
      'topic_rejected',
    ]);

    await this.messageService.create({
      userId: Number(result.rows[0].userId || 0),
      type: 'topic_restored',
      title: '你的帖子已恢复显示',
      content: `你发布的《${result.rows[0].title || '未命名帖子'}》已恢复正常展示。`,
      targetType: 'topic',
      targetId: result.rows[0].id,
      extra: {
        topicId: Number(result.rows[0].id),
        topicTitle: result.rows[0].title || '',
      },
    });

    return {
      id: Number(result.rows[0].id),
      status: Number(result.rows[0].status),
      isDelete: Number(result.rows[0].isDelete || 0),
      publishTime: result.rows[0].publishTime,
      updateTime: result.rows[0].updateTime,
    };
  }

  async listComments(filters: {
    status?: string;
    keyword?: string;
    limit?: string | number;
  } = {}) {
    const params: any[] = [];
    const conditions: string[] = [];
    const normalizedStatus = this.normalizeCommentStatus(filters.status);

    if (normalizedStatus !== null) {
      params.push(normalizedStatus);
      conditions.push(`c.status = $${params.length}`);
    }

    if (filters.keyword) {
      params.push(`%${filters.keyword.trim()}%`);
      conditions.push(`c.content ILIKE $${params.length}`);
    }

    const limit = this.normalizeLimit(filters.limit);
    params.push(limit);
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.databaseService.query(
      `
      SELECT
        c.id,
        c."topicId",
        c.content,
        c."replyCommentId",
        c."replyUserId",
        c."userId",
        c.status,
        c."isVisible",
        c."createTime",
        c."updateTime",
        u."nickName" AS "userName",
        u.phone AS "userPhone",
        t.title AS "topicTitle",
        mr.result AS "moderationResult",
        mr.provider AS "moderationProvider",
        mr."riskLevel" AS "moderationRiskLevel",
        mr."riskReason" AS "moderationRiskReason",
        mr."createTime" AS "moderationCreateTime",
        al.action AS "latestAdminAction",
        al.remark AS "latestAdminRemark",
        al."createTime" AS "latestAdminActionTime"
      FROM bz_topic_comment c
      LEFT JOIN bz_mini_user u ON u.id = c."userId"
      LEFT JOIN bz_mini_topic t ON t.id = c."topicId"
      LEFT JOIN LATERAL (
        SELECT result, provider, "riskLevel", "riskReason", "createTime"
        FROM moderation_records
        WHERE "targetType" = 'comment'
          AND "targetId" = c.id::text
        ORDER BY id DESC
        LIMIT 1
      ) mr ON TRUE
      LEFT JOIN LATERAL (
        SELECT action, remark, "createTime"
        FROM admin_operation_logs
        WHERE "targetType" = 'comment'
          AND "targetId" = c.id::text
        ORDER BY id DESC
        LIMIT 1
      ) al ON TRUE
      ${whereClause}
      ORDER BY c."updateTime" DESC, c.id DESC
      LIMIT $${params.length}
      `,
      params,
    );

    return result.rows.map((row: any) => this.mapCommentRow(row));
  }

  async getCommentDetail(commentId: number) {
    const result = await this.databaseService.query(
      `
      SELECT
        c.*,
        u."nickName" AS "userName",
        u.phone AS "userPhone",
        t.title AS "topicTitle"
      FROM bz_topic_comment c
      LEFT JOIN bz_mini_user u ON u.id = c."userId"
      LEFT JOIN bz_mini_topic t ON t.id = c."topicId"
      WHERE c.id = $1
      LIMIT 1
      `,
      [commentId],
    );

    if (!result.rows.length) {
      throw new NotFoundException('comment not found');
    }

    return {
      ...this.mapCommentRow(result.rows[0]),
      moderationRecords: await this.listModerationRecords('comment', commentId),
      adminLogs: await this.listTargetLogs('comment', commentId),
    };
  }

  async passComment(commentId: number, admin: { id: number }, remark?: string) {
    return this.databaseService.withTransaction(async (client) => {
      const currentResult = await client.query(
        `
        SELECT id, status, "isVisible", "topicId"
        FROM bz_topic_comment
        WHERE id = $1
        LIMIT 1
        `,
        [commentId],
      );

      if (!currentResult.rows.length) {
        throw new NotFoundException('comment not found');
      }

      const current = currentResult.rows[0];
      const wasVisible = Number(current.isVisible || 0) === 1;

      const updateResult = await client.query(
        `
        UPDATE bz_topic_comment
        SET
          status = 2,
          "isVisible" = 1,
          "updateTime" = NOW()
        WHERE id = $1
        RETURNING id, status, "isVisible", "topicId", "updateTime"
        `,
        [commentId],
      );

      if (!wasVisible) {
        await client.query(
          `
          UPDATE bz_mini_topic
          SET
            "commentCount" = "commentCount" + 1,
            "updateTime" = NOW()
          WHERE id = $1
          `,
          [current.topicId],
        );
      }

      await this.adminLogService.write({
        adminUserId: admin.id,
        targetType: 'comment',
        targetId: commentId,
        action: 'comment_pass',
        remark,
      });

      return {
        id: Number(updateResult.rows[0].id),
        status: Number(updateResult.rows[0].status),
        isVisible: Number(updateResult.rows[0].isVisible || 0),
        topicId: Number(updateResult.rows[0].topicId),
        updateTime: updateResult.rows[0].updateTime,
      };
    });
  }

  async rejectComment(commentId: number, admin: { id: number }, remark?: string) {
    return this.hideComment(commentId, admin, 'comment_reject', remark);
  }

  async removeComment(commentId: number, admin: { id: number }, remark?: string) {
    return this.hideComment(commentId, admin, 'comment_remove', remark);
  }

  private async hideComment(
    commentId: number,
    admin: { id: number },
    action: 'comment_reject' | 'comment_remove',
    remark?: string,
  ) {
    return this.databaseService.withTransaction(async (client) => {
      const currentResult = await client.query(
        `
        SELECT id, status, "isVisible", "topicId"
        FROM bz_topic_comment
        WHERE id = $1
        LIMIT 1
        `,
        [commentId],
      );

      if (!currentResult.rows.length) {
        throw new NotFoundException('comment not found');
      }

      const current = currentResult.rows[0];
      const wasVisible = Number(current.isVisible || 0) === 1;

      const updateResult = await client.query(
        `
        UPDATE bz_topic_comment
        SET
          status = 9,
          "isVisible" = 0,
          "updateTime" = NOW()
        WHERE id = $1
        RETURNING id, status, "isVisible", "topicId", "updateTime"
        `,
        [commentId],
      );

      if (wasVisible) {
        await client.query(
          `
          UPDATE bz_mini_topic
          SET
            "commentCount" = GREATEST("commentCount" - 1, 0),
            "updateTime" = NOW()
          WHERE id = $1
          `,
          [current.topicId],
        );
      }

      await this.adminLogService.write({
        adminUserId: admin.id,
        targetType: 'comment',
        targetId: commentId,
        action,
        remark,
      });

      return {
        id: Number(updateResult.rows[0].id),
        status: Number(updateResult.rows[0].status),
        isVisible: Number(updateResult.rows[0].isVisible || 0),
        topicId: Number(updateResult.rows[0].topicId),
        updateTime: updateResult.rows[0].updateTime,
      };
    });
  }

  private async listModerationRecords(targetType: string, targetId: number) {
    const result = await this.databaseService.query(
      `
      SELECT
        id,
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
        "operatorType",
        "operatorId",
        "userId",
        extra,
        "createTime"
      FROM moderation_records
      WHERE "targetType" = $1
        AND "targetId" = $2
      ORDER BY id DESC
      `,
      [targetType, String(targetId)],
    );

    return result.rows.map((row: any) => ({
      id: Number(row.id),
      scene: row.scene || '',
      targetType: row.targetType || '',
      targetId: row.targetId || '',
      contentType: row.contentType || 'text',
      provider: row.provider || '',
      result: row.result || '',
      riskLevel: row.riskLevel || '',
      riskReason: row.riskReason || '',
      hitLabels: row.hitLabels || [],
      requestId: row.requestId || '',
      operatorType: row.operatorType || '',
      operatorId: row.operatorId || '',
      userId: row.userId ? Number(row.userId) : null,
      extra: row.extra || {},
      createTime: row.createTime,
    }));
  }

  private async listTargetLogs(targetType: string, targetId: number) {
    const result = await this.databaseService.query(
      `
      SELECT
        l.id,
        l."adminUserId",
        l."targetType",
        l."targetId",
        l.action,
        l.remark,
        l.extra,
        l."createTime",
        a.username AS "adminUsername"
      FROM admin_operation_logs l
      LEFT JOIN admin_users a ON a.id = l."adminUserId"
      WHERE l."targetType" = $1
        AND l."targetId" = $2
      ORDER BY l.id DESC
      `,
      [targetType, String(targetId)],
    );

    return result.rows.map((row: any) => ({
      id: Number(row.id),
      adminUserId: Number(row.adminUserId),
      adminUsername: row.adminUsername || '',
      targetType: row.targetType || '',
      targetId: row.targetId || '',
      action: row.action || '',
      remark: row.remark || '',
      extra: row.extra || {},
      createTime: row.createTime,
    }));
  }

  private mapTopicRow(row: any, includeReviewSections = false) {
    const extra = row.extra && typeof row.extra === 'object' && !Array.isArray(row.extra)
      ? row.extra
      : {};
    const topicCategory = Number(row.topicCategory || 0);
    const topic = {
      id: Number(row.id),
      topicCategory,
      topicCategoryLabel: this.getTopicCategoryLabel(topicCategory),
      title: row.title || '',
      content: row.content || '',
      images: this.normalizeTopicImages(row.images, extra),
      rejectReason: row.rejectReason || '',
      extra,
      status: Number(row.status || 0),
      isDelete: Number(row.isDelete || 0),
      userId: Number(row.userId || 0),
      authorName: row.authorName || '',
      authorPhone: row.authorPhone || '',
      publishTime: row.publishTime || null,
      createTime: row.createTime,
      updateTime: row.updateTime,
      likeCount: Number(row.likeCount || 0),
      commentCount: Number(row.commentCount || 0),
      moderationResult: row.moderationResult || '',
      moderationProvider: row.moderationProvider || '',
      moderationRiskLevel: row.moderationRiskLevel || '',
      moderationRiskReason: row.moderationRiskReason || '',
      moderationCreateTime: row.moderationCreateTime || null,
      latestAdminAction: row.latestAdminAction || '',
      latestAdminRemark: row.latestAdminRemark || '',
      latestAdminActionTime: row.latestAdminActionTime || null,
    };

    return includeReviewSections
      ? {
        ...topic,
        reviewSections: this.buildTopicReviewSections(topic, extra),
      }
      : topic;
  }

  private buildTopicReviewSections(topic: any, extra: Record<string, any>) {
    const usedKeys = new Set<string>();
    const sections: Array<{ title: string; rows: Array<{ label: string; value: string }> }> = [];
    const addSection = (title: string, build: (add: (label: string, value: any, keys?: string | string[]) => void) => void) => {
      const rows: Array<{ label: string; value: string }> = [];
      const add = (label: string, value: any, keys?: string | string[]) => {
        const formatted = this.formatReviewValue(value);
        if (!formatted) {
          return;
        }
        this.markUsedKeys(usedKeys, keys);
        rows.push({ label, value: formatted });
      };

      build(add);
      if (rows.length) {
        sections.push({ title, rows });
      }
    };

    addSection('帖子概览', (add) => {
      add('内容类型', this.getTopicCategoryLabel(topic.topicCategory));
      add('作者', topic.authorName);
      add('作者手机号', topic.authorPhone);
      add('当前状态', `${this.getTopicStatusLabel(topic.status)} / isDelete=${topic.isDelete}`);
      add('点赞数', topic.likeCount);
      add('评论数', topic.commentCount);
      add('发布时间', topic.publishTime);
      add('创建时间', topic.createTime);
    });

    if (topic.content) {
      sections.push({
        title: '正文',
        rows: [{ label: '正文内容', value: String(topic.content) }],
      });
    }

    const category = Number(topic.topicCategory);
    if (category === 0 || category === 1) {
      addSection('装备与使用', (add) => {
        add('装备分类', this.getGearCategoryLabel(extra.gearCategory), 'gearCategory');
        add('装备型号', extra.gearModel, 'gearModel');
        add('使用年限', this.mapByLabel(USAGE_YEAR_LABELS, extra.usageYear), 'usageYear');
        add('使用频率', this.mapByLabel(USAGE_FREQUENCY_LABELS, extra.usageFrequency || extra.usageRate), ['usageFrequency', 'usageRate']);
        add('使用场景', extra.environments || extra.environment, ['environments', 'environment']);
        add('自定义场景', extra.customScene, 'customScene');
      });

      addSection(category === 0 ? '推荐结论' : '测评结论', (add) => {
        add('一句话总结', category === 0 ? this.mapByLabel(RECOMMEND_SUMMARY_LABELS, extra.summary) : extra.summary, 'summary');
        add('分享理由', extra.tags?.shareReasons, 'tags.shareReasons');
        add('优点', extra.pros, 'pros');
        add('不足', extra.cons, 'cons');
        add('回购意愿', extra.repurchase, 'repurchase');
        add('适合人群', extra.customFit, 'customFit');
        add('不适合人群', extra.customUnfit, 'customUnfit');
      });

      addSection('评分与对比', (add) => {
        add('评分', this.formatRatings(extra.ratings), 'ratings');
        add('常用搭配', extra.comboGear, 'comboGear');
        add('搭配说明', extra.comboDesc, 'comboDesc');
        add('对比对象', extra.compareGear, 'compareGear');
        add('对比说明', extra.compareDesc, 'compareDesc');
        add('预算倾向', extra.tags?.budget, 'tags.budget');
        add('使用倾向', extra.tags?.usage, 'tags.usage');
        add('适合标签', extra.tags?.fit, 'tags.fit');
        add('不适合标签', extra.tags?.unfit, 'tags.unfit');
        add('适配场景', extra.tags?.fitContextTags, 'tags.fitContextTags');
        add('适配玩法', extra.tags?.fitTechniqueTags, 'tags.fitTechniqueTags');
        add('对比定位', extra.tags?.compareProfile, 'tags.compareProfile');
        add('对比购买结论', extra.tags?.compareBuyDecision, 'tags.compareBuyDecision');
        add('入手建议', extra.tags?.purchaseAdvice, 'tags.purchaseAdvice');
        add('购买定位', extra.tags?.buyStage, 'tags.buyStage');
        add('补充参数', extra.tags?.supplementParams, 'tags.supplementParams');
      });
    }

    if (category === 2) {
      addSection('提问信息', (add) => {
        add('问题类型', this.mapByLabel(QUESTION_TYPE_LABELS, extra.questionType), 'questionType');
        add('关联分类', this.getGearCategoryLabel(extra.relatedGearCategory), 'relatedGearCategory');
        add('关联型号', extra.relatedGearModel, 'relatedGearModel');
        add('候选选项', extra.recommendMeta?.candidateOptions || extra.candidateOptions, ['recommendMeta.candidateOptions', 'candidateOptions']);
        add('使用频率', this.mapByLabel(USAGE_FREQUENCY_LABELS, extra.recommendMeta?.usageFrequency || extra.usageFrequency), ['recommendMeta.usageFrequency', 'usageFrequency']);
        add('使用场景', extra.recommendMeta?.scenes || extra.environments, ['recommendMeta.scenes', 'environments']);
        add('预算', extra.recommendMeta?.budget || extra.budget, ['recommendMeta.budget', 'budget']);
        add('回复模式', extra.quickReplyOnly ? '仅快答' : '开放讨论', 'quickReplyOnly');
      });
    }

    if (category === 3) {
      addSection('鱼获信息', (add) => {
        add('位置标签', extra.locationTag, 'locationTag');
        add('长度', this.formatCatchMeasure('长度', extra.length, extra.isLengthSecret, extra.isLengthEstimated, 'cm'), ['length', 'isLengthSecret', 'isLengthEstimated']);
        add('重量', this.formatCatchMeasure('重量', extra.weight, extra.isWeightSecret, extra.isWeightEstimated, 'kg'), ['weight', 'isWeightSecret', 'isWeightEstimated']);
      });
    }

    if (category === 4) {
      addSection('钓行信息', (add) => {
        const targetFish = [
          ...this.normalizeReadableStringList(extra.targetFish),
          ...this.normalizeReadableStringList(extra.customTargetFish),
        ];
        add('钓行结果', extra.tripResult, 'tripResult');
        add('钓行总结', extra.tripStatus, 'tripStatus');
        add('目标鱼', targetFish, ['targetFish', 'customTargetFish']);
        add('季节', extra.season, 'season');
        add('天气', extra.weather, 'weather');
        add('水域类型', extra.waterType, 'waterType');
        add('主要钓点', extra.mainSpot, 'mainSpot');
        add('作钓时间', extra.fishingTime, 'fishingTime');
        add('环境感受', extra.envFeelings, 'envFeelings');
        add('主要钓组/饵型', extra.rigs, 'rigs');
        add('手法简述', extra.rigDescription, 'rigDescription');
      });
    }

    const otherRows = this.buildOtherReviewRows(extra, usedKeys);
    if (otherRows.length) {
      sections.push({ title: '其他已填写内容', rows: otherRows });
    }

    return sections;
  }

  private buildOtherReviewRows(extra: Record<string, any>, usedKeys: Set<string>) {
    const skippedKeys = new Set([
      'contentImages',
      'coverImg',
      'verifyImage',
      'receipt',
      'receiptImages',
    ]);

    return this.collectOtherReviewRows(extra, usedKeys, skippedKeys);
  }

  private collectOtherReviewRows(
    value: any,
    usedKeys: Set<string>,
    skippedKeys: Set<string>,
    path = '',
  ): Array<{ label: string; value: string }> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return [];
    }

    return Object.entries(value).flatMap(([key, nestedValue]) => {
      const nextPath = path ? `${path}.${key}` : key;
      if (skippedKeys.has(nextPath) || skippedKeys.has(key) || usedKeys.has(nextPath) || this.isEmptyReviewValue(nestedValue)) {
        return [];
      }

      if (nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
        const nestedRows = this.collectOtherReviewRows(nestedValue, usedKeys, skippedKeys, nextPath);
        if (nestedRows.length) {
          return nestedRows;
        }
      }

      const formatted = this.formatReviewValue(nestedValue);
      return formatted
        ? [{
          label: this.getPathLabel(nextPath),
          value: formatted,
        }]
        : [];
    });
  }

  private formatReviewValue(value: any): string {
    if (this.isEmptyReviewValue(value)) {
      return '';
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => this.formatReviewValue(item))
        .filter(Boolean)
        .join('、');
    }

    if (typeof value === 'boolean') {
      return value ? '是' : '否';
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'string') {
      return this.formatEnumText(value.trim());
    }

    if (value && typeof value === 'object') {
      if (value.label || value.name || value.value || value.text) {
        return [
          value.label || value.name || '',
          value.value || value.text || '',
        ].filter(Boolean).join('：');
      }

      return Object.entries(value)
        .filter(([, nestedValue]) => !this.isEmptyReviewValue(nestedValue))
        .map(([key, nestedValue]) => `${this.getFieldLabel(key)}：${this.formatReviewValue(nestedValue)}`)
        .filter(Boolean)
        .join('；');
    }

    return '';
  }

  private isEmptyReviewValue(value: any): boolean {
    if (value === undefined || value === null || value === '') {
      return true;
    }
    if (Array.isArray(value)) {
      return value.length === 0 || value.every((item) => this.isEmptyReviewValue(item));
    }
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    return false;
  }

  private markUsedKeys(usedKeys: Set<string>, keys?: string | string[]) {
    this.normalizeReadableStringList(keys).forEach((key) => {
      usedKeys.add(key);
    });
  }

  private normalizeTopicImages(images: any, extra: Record<string, any>) {
    const sourceList = [
      ...(Array.isArray(images) ? images : []),
      ...this.normalizeStringList(extra.contentImages),
      extra.coverImg,
      extra.verifyImage,
    ];

    const normalized = sourceList
      .map((item) => this.extractMediaUrl(item))
      .filter(Boolean) as string[];

    return Array.from(new Set(normalized));
  }

  private normalizeStringList(value: any) {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return [];
      }

      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed : [trimmed];
        } catch (_error) {
          return [trimmed];
        }
      }

      return [trimmed];
    }

    return [value];
  }

  private normalizeReadableStringList(value: any): string[] {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.map((item) => String(item || '').trim()).filter(Boolean);
    }
    return [String(value).trim()].filter(Boolean);
  }

  private getTopicCategoryLabel(value: any) {
    return TOPIC_CATEGORY_LABELS[Number(value)] || '内容';
  }

  private getTopicStatusLabel(status: any) {
    const normalized = Number(status || 0);
    if (normalized === 1) return '待审核';
    if (normalized === 2) return '已通过';
    if (normalized === 9) return '已驳回/下架';
    if (normalized === 0) return '草稿';
    return String(status ?? '-');
  }

  private getGearCategoryLabel(value: any) {
    const normalized = Array.isArray(value) ? value[0] : value;
    const text = String(normalized || '').trim();
    return GEAR_CATEGORY_LABELS[text] || this.formatEnumText(text);
  }

  private mapByLabel(map: Record<string, string>, value: any) {
    const text = String(value || '').trim();
    return map[text] || this.formatEnumText(text);
  }

  private formatRatings(ratings: any) {
    const list = Array.isArray(ratings) ? ratings : [];
    return list
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return '';
        }
        const key = String(item.key || item.name || '').trim();
        const score = Number(item.score || item.value || 0);
        if (!key || score <= 0) {
          return '';
        }
        return `${RATING_LABELS[key] || item.label || key} ${score}/5`;
      })
      .filter(Boolean);
  }

  private formatCatchMeasure(label: string, value: any, isSecret: any, isEstimated: any, unit: string) {
    if (isSecret) {
      return `${label}保密`;
    }
    const text = String(value || '').trim();
    if (!text) {
      return '';
    }
    return `${text}${unit}${isEstimated ? '（目测）' : ''}`;
  }

  private getFieldLabel(key: string) {
    const labels: Record<string, string> = {
      tags: '标签信息',
      recommendMeta: '求推荐补充信息',
      gearItemId: '装备 ID',
      relatedGearItemId: '关联装备 ID',
      acceptedAnswerId: '已采纳回答 ID',
      feedbackText: '反馈内容',
      finalProduct: '最终选择',
      acceptedAt: '采纳时间',
    };
    return labels[key] || key;
  }

  private getPathLabel(path: string) {
    return path
      .split('.')
      .filter(Boolean)
      .map((item) => this.getFieldLabel(item))
      .join(' / ');
  }

  private formatEnumText(value: string) {
    if (!value) {
      return '';
    }

    if (REVIEW_ENUM_LABELS[value]) {
      return REVIEW_ENUM_LABELS[value];
    }

    if (!value.includes('_') || /[\u4e00-\u9fa5]/.test(value)) {
      return value;
    }

    return value
      .split('_')
      .map((item) => REVIEW_ENUM_TOKEN_LABELS[item] || item)
      .filter(Boolean)
      .join(' / ');
  }

  private extractMediaUrl(value: any): string {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      return this.mediaUrlService.normalizeUrl(value.trim());
    }

    if (typeof value === 'object') {
      const candidate = value.url
        || value.src
        || value.fileID
        || value.fileId
        || value.path
        || value.tempFileURL
        || '';
      return typeof candidate === 'string' ? this.mediaUrlService.normalizeUrl(candidate.trim()) : '';
    }

    return '';
  }

  private mapCommentRow(row: any) {
    return {
      id: Number(row.id),
      topicId: Number(row.topicId || 0),
      topicTitle: row.topicTitle || '',
      content: row.content || '',
      replyCommentId: row.replyCommentId ? Number(row.replyCommentId) : null,
      replyUserId: row.replyUserId ? Number(row.replyUserId) : null,
      userId: Number(row.userId || 0),
      userName: row.userName || '',
      userPhone: row.userPhone || '',
      status: Number(row.status || 0),
      isVisible: Number(row.isVisible || 0),
      createTime: row.createTime,
      updateTime: row.updateTime,
      moderationResult: row.moderationResult || '',
      moderationProvider: row.moderationProvider || '',
      moderationRiskLevel: row.moderationRiskLevel || '',
      moderationRiskReason: row.moderationRiskReason || '',
      moderationCreateTime: row.moderationCreateTime || null,
      latestAdminAction: row.latestAdminAction || '',
      latestAdminRemark: row.latestAdminRemark || '',
      latestAdminActionTime: row.latestAdminActionTime || null,
    };
  }

  private normalizeTopicStatus(status?: string) {
    if (!status || status === 'pending') {
      return 1;
    }

    if (status === 'all') {
      return null;
    }

    const normalized = Number(status);
    if (!Number.isInteger(normalized)) {
      return 1;
    }

    return normalized;
  }

  private buildTopicConditions(normalizedStatus: number | null) {
    if (normalizedStatus === 9) {
      return [] as string[];
    }

    if (normalizedStatus === null) {
      return [] as string[];
    }

    return [`t."isDelete" = 0`];
  }

  private normalizeCommentStatus(status?: string) {
    if (!status || status === 'pending') {
      return 0;
    }

    if (status === 'all') {
      return null;
    }

    const normalized = Number(status);
    if (!Number.isInteger(normalized)) {
      return 0;
    }

    return normalized;
  }

  private normalizeLimit(limit?: string | number) {
    const normalized = Number(limit || 50);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      return 50;
    }
    return Math.min(Math.floor(normalized), 200);
  }
}
