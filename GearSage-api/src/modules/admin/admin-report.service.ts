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

const RECOMMEND_INTENT_LABELS: Record<string, string> = {
  first_set: '第一套入门',
  fill_gap: '已有一套，想补一个空位',
  replace_old: '旧装备用久了想替换',
  upgrade: '已有装备，想升级进阶',
  compare_options: '二选一 / 三选一',
  full_combo: '整套求配',
};

const BUDGET_RANGE_LABELS: Record<string, string> = {
  under_300: '300 以内',
  '300_500': '300~500',
  '500_800': '500~800',
  '800_1200': '800~1200',
  '1200_1800': '1200~1800',
  '1800_2500': '1800~2500',
  '2500_4000': '2500~4000',
  '4000_plus': '4000+',
};

const BUDGET_FLEXIBLE_LABELS: Record<string, string> = {
  hard_limit: '预算基本卡死',
  slightly_flexible: '可上浮一点',
  accept_used: '可接受二手',
  new_only: '只看全新',
};

const TARGET_FISH_LABELS: Record<string, string> = {
  largemouth_bass: '鲈鱼',
  topmouth_culter: '翘嘴',
  mandarin_fish: '鳜鱼',
  snakehead: '黑鱼',
  stream_small_fish: '马口 / 溪流小型鱼',
  seabass: '海鲈',
  all_round: '综合泛用',
  other: '其他',
};

const USE_SCENE_LABELS: Record<string, string> = {
  wild_river: '野河',
  reservoir: '水库',
  stream: '溪流',
  inshore: '近海',
  urban_river: '城市河道',
  managed_water: '黑坑 / 管理场',
  mixed: '综合不固定',
};

const CARE_PRIORITY_LABELS: Record<string, string> = {
  value_for_money: '性价比',
  versatile: '泛用',
  lightweight: '轻量',
  long_cast: '远投',
  smooth: '顺滑',
  durable: '耐用',
  beginner_friendly: '新手友好',
  fish_control: '控鱼 / 腰力',
  sensitive: '细腻手感',
  appearance: '做工颜值',
  resale: '保值',
};

const AVOID_POINT_LABELS: Record<string, string> = {
  too_heavy: '不想太重',
  too_expensive: '不想太贵',
  too_delicate: '不想太娇气',
  too_specialized: '不想太专用',
  hard_to_use: '不想难上手',
  high_maintenance: '不想后期维护麻烦',
  picky_line_bait: '不想太挑线 / 挑饵',
  other: '其他',
};

const RECOMMEND_USAGE_FREQUENCY_LABELS: Record<string, string> = {
  essential: '出钓必备 / 高频使用',
  weekly_once: '每周一次左右',
  monthly_several: '每月几次',
  occasional: '偶尔玩玩',
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
export class AdminReportService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly mediaUrlService: MediaUrlService,
    private readonly adminLogService: AdminLogService,
    private readonly messageService: MessageService,
  ) {}

  async list(filters: { status?: string; targetType?: string; limit?: string | number } = {}) {
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters.status && filters.status !== 'all') {
      params.push(filters.status);
      conditions.push(`r.status = $${params.length}`);
    } else if (!filters.status) {
      conditions.push(`r.status = 'pending'`);
    }

    if (filters.targetType && filters.targetType !== 'all') {
      params.push(filters.targetType);
      conditions.push(`r."targetType" = $${params.length}`);
    }

    const limit = this.normalizeLimit(filters.limit);
    params.push(limit);

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await this.databaseService.query(
      `
      SELECT
        r.id,
        r."reporterUserId",
        r."targetType",
        r."targetId",
        r.reason,
        r.status,
        r."handledByAdminId",
        r."handledRemark",
        r."handledAt",
        r."createTime",
        r."updateTime",
        u."nickName" AS "reporterName",
        u.phone AS "reporterPhone",
        tc.content AS "targetCommentContent",
        tt.id AS "targetTopicId",
        tt."topicCategory" AS "targetTopicCategory",
        tt.title AS "targetTopicTitle",
        tt.content AS "targetTopicContent",
        tt.images AS "targetTopicImages",
        tt.extra AS "targetTopicExtra",
        tt.status AS "targetTopicStatus",
        tt."isDelete" AS "targetTopicIsDelete",
        tt."userId" AS "targetTopicUserId",
        tt."publishTime" AS "targetTopicPublishTime",
        tt."createTime" AS "targetTopicCreateTime",
        tt."updateTime" AS "targetTopicUpdateTime",
        tt."likeCount" AS "targetTopicLikeCount",
        tt."commentCount" AS "targetTopicCommentCount",
        tu."nickName" AS "targetTopicAuthorName",
        tu.phone AS "targetTopicAuthorPhone",
        ru.id AS "targetUserId",
        ru.phone AS "targetUserPhone",
        ru."nickName" AS "targetUserName",
        ru."avatarUrl" AS "targetUserAvatarUrl",
        ru.bio AS "targetUserBio",
        ru.background AS "targetUserBackground",
        ru.status AS "targetUserStatus",
        ru.points AS "targetUserPoints",
        ru.level AS "targetUserLevel",
        ru."isAdmin" AS "targetUserIsAdmin",
        ru."inviteCode" AS "targetUserInviteCode",
        ru."invitedByUserId" AS "targetUserInvitedByUserId",
        ru."inviteSuccessCount" AS "targetUserInviteSuccessCount",
        ru."inviteRewardPoints" AS "targetUserInviteRewardPoints",
        ru."createTime" AS "targetUserCreateTime",
        ru."updateTime" AS "targetUserUpdateTime",
        COALESCE(rut."topicCount", 0) AS "targetUserTopicCount",
        COALESCE(rut."publishedTopicCount", 0) AS "targetUserPublishedTopicCount",
        COALESCE(rut."pendingTopicCount", 0) AS "targetUserPendingTopicCount",
        COALESCE(rut."removedTopicCount", 0) AS "targetUserRemovedTopicCount",
        COALESCE(ruc."commentCount", 0) AS "targetUserCommentCount",
        COALESCE(ruc."visibleCommentCount", 0) AS "targetUserVisibleCommentCount",
        COALESCE(rur."receivedReportCount", 0) AS "targetUserReceivedReportCount",
        COALESCE(rur."pendingReportCount", 0) AS "targetUserPendingReportCount",
        mr.result AS "moderationResult",
        mr.provider AS "moderationProvider",
        mr."riskReason" AS "moderationRiskReason"
      FROM user_reports r
      LEFT JOIN bz_mini_user u ON u.id = r."reporterUserId"
      LEFT JOIN bz_topic_comment tc
        ON r."targetType" = 'comment'
       AND tc.id = CASE
         WHEN r."targetId" ~ '^[0-9]+$' THEN r."targetId"::bigint
         ELSE NULL
       END
      LEFT JOIN bz_mini_topic tt
        ON r."targetType" = 'topic'
       AND tt.id = CASE
         WHEN r."targetId" ~ '^[0-9]+$' THEN r."targetId"::bigint
         ELSE NULL
       END
      LEFT JOIN bz_mini_user tu ON tu.id = tt."userId"
      LEFT JOIN bz_mini_user ru
        ON r."targetType" = 'user'
       AND ru.id = CASE
         WHEN r."targetId" ~ '^[0-9]+$' THEN r."targetId"::bigint
         ELSE NULL
       END
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS "topicCount",
          COUNT(*) FILTER (WHERE status = 2 AND "isDelete" = 0)::int AS "publishedTopicCount",
          COUNT(*) FILTER (WHERE status = 1 AND "isDelete" = 0)::int AS "pendingTopicCount",
          COUNT(*) FILTER (WHERE status = 9 OR "isDelete" = 1)::int AS "removedTopicCount"
        FROM bz_mini_topic
        WHERE "userId" = ru.id
      ) rut ON ru.id IS NOT NULL
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS "commentCount",
          COUNT(*) FILTER (WHERE status = 2 AND "isVisible" = 1)::int AS "visibleCommentCount"
        FROM bz_topic_comment
        WHERE "userId" = ru.id
      ) ruc ON ru.id IS NOT NULL
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS "receivedReportCount",
          COUNT(*) FILTER (WHERE status = 'pending')::int AS "pendingReportCount"
        FROM user_reports
        WHERE "targetType" = 'user'
          AND "targetId" = ru.id::text
      ) rur ON ru.id IS NOT NULL
      LEFT JOIN LATERAL (
        SELECT result, provider, "riskReason"
        FROM moderation_records
        WHERE "targetType" = 'report'
          AND "targetId" = r.id::text
        ORDER BY id DESC
        LIMIT 1
      ) mr ON TRUE
      ${whereClause}
      ORDER BY r.id DESC
      LIMIT $${params.length}
      `,
      params,
    );

    return result.rows.map((row: any) => this.formatReport(row));
  }

  async getDetail(reportId: number) {
    const result = await this.databaseService.query(
      `
      SELECT
        r.*,
        u."nickName" AS "reporterName",
        u.phone AS "reporterPhone",
        tc.content AS "targetCommentContent",
        tt.id AS "targetTopicId",
        tt."topicCategory" AS "targetTopicCategory",
        tt.title AS "targetTopicTitle",
        tt.content AS "targetTopicContent",
        tt.images AS "targetTopicImages",
        tt.extra AS "targetTopicExtra",
        tt.status AS "targetTopicStatus",
        tt."isDelete" AS "targetTopicIsDelete",
        tt."userId" AS "targetTopicUserId",
        tt."publishTime" AS "targetTopicPublishTime",
        tt."createTime" AS "targetTopicCreateTime",
        tt."updateTime" AS "targetTopicUpdateTime",
        tt."likeCount" AS "targetTopicLikeCount",
        tt."commentCount" AS "targetTopicCommentCount",
        tu."nickName" AS "targetTopicAuthorName",
        tu.phone AS "targetTopicAuthorPhone",
        ru.id AS "targetUserId",
        ru.phone AS "targetUserPhone",
        ru."nickName" AS "targetUserName",
        ru."avatarUrl" AS "targetUserAvatarUrl",
        ru.bio AS "targetUserBio",
        ru.background AS "targetUserBackground",
        ru.status AS "targetUserStatus",
        ru.points AS "targetUserPoints",
        ru.level AS "targetUserLevel",
        ru."isAdmin" AS "targetUserIsAdmin",
        ru."inviteCode" AS "targetUserInviteCode",
        ru."invitedByUserId" AS "targetUserInvitedByUserId",
        ru."inviteSuccessCount" AS "targetUserInviteSuccessCount",
        ru."inviteRewardPoints" AS "targetUserInviteRewardPoints",
        ru."createTime" AS "targetUserCreateTime",
        ru."updateTime" AS "targetUserUpdateTime",
        COALESCE(rut."topicCount", 0) AS "targetUserTopicCount",
        COALESCE(rut."publishedTopicCount", 0) AS "targetUserPublishedTopicCount",
        COALESCE(rut."pendingTopicCount", 0) AS "targetUserPendingTopicCount",
        COALESCE(rut."removedTopicCount", 0) AS "targetUserRemovedTopicCount",
        COALESCE(ruc."commentCount", 0) AS "targetUserCommentCount",
        COALESCE(ruc."visibleCommentCount", 0) AS "targetUserVisibleCommentCount",
        COALESCE(rur."receivedReportCount", 0) AS "targetUserReceivedReportCount",
        COALESCE(rur."pendingReportCount", 0) AS "targetUserPendingReportCount"
      FROM user_reports r
      LEFT JOIN bz_mini_user u ON u.id = r."reporterUserId"
      LEFT JOIN bz_topic_comment tc
        ON r."targetType" = 'comment'
       AND tc.id = CASE
         WHEN r."targetId" ~ '^[0-9]+$' THEN r."targetId"::bigint
         ELSE NULL
       END
      LEFT JOIN bz_mini_topic tt
        ON r."targetType" = 'topic'
       AND tt.id = CASE
         WHEN r."targetId" ~ '^[0-9]+$' THEN r."targetId"::bigint
         ELSE NULL
       END
      LEFT JOIN bz_mini_user tu ON tu.id = tt."userId"
      LEFT JOIN bz_mini_user ru
        ON r."targetType" = 'user'
       AND ru.id = CASE
         WHEN r."targetId" ~ '^[0-9]+$' THEN r."targetId"::bigint
         ELSE NULL
       END
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS "topicCount",
          COUNT(*) FILTER (WHERE status = 2 AND "isDelete" = 0)::int AS "publishedTopicCount",
          COUNT(*) FILTER (WHERE status = 1 AND "isDelete" = 0)::int AS "pendingTopicCount",
          COUNT(*) FILTER (WHERE status = 9 OR "isDelete" = 1)::int AS "removedTopicCount"
        FROM bz_mini_topic
        WHERE "userId" = ru.id
      ) rut ON ru.id IS NOT NULL
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS "commentCount",
          COUNT(*) FILTER (WHERE status = 2 AND "isVisible" = 1)::int AS "visibleCommentCount"
        FROM bz_topic_comment
        WHERE "userId" = ru.id
      ) ruc ON ru.id IS NOT NULL
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS "receivedReportCount",
          COUNT(*) FILTER (WHERE status = 'pending')::int AS "pendingReportCount"
        FROM user_reports
        WHERE "targetType" = 'user'
          AND "targetId" = ru.id::text
      ) rur ON ru.id IS NOT NULL
      WHERE r.id = $1
      LIMIT 1
      `,
      [reportId],
    );

    if (!result.rows.length) {
      throw new NotFoundException('report not found');
    }

    return {
      ...this.formatReport(result.rows[0]),
      moderationRecords: await this.listModerationRecords(reportId),
      adminLogs: await this.listTargetLogs(reportId),
    };
  }

  async resolve(reportId: number, admin: { id: number }, remark?: string) {
    return this.handle(reportId, admin, 'handled', 'report_handle', remark);
  }

  async reject(reportId: number, admin: { id: number }, remark?: string) {
    return this.handle(reportId, admin, 'rejected', 'report_reject', remark);
  }

  async acceptCommentReport(reportId: number, admin: { id: number }, remark?: string) {
    return this.databaseService.withTransaction(async (client) => {
      const reportResult = await client.query(
        `
        SELECT *
        FROM user_reports
        WHERE id = $1
          AND "targetType" = 'comment'
        LIMIT 1
        `,
        [reportId],
      );

      if (!reportResult.rows.length) {
        throw new NotFoundException('comment report not found');
      }

      const report = reportResult.rows[0];
      const commentId = Number(report.targetId || 0);

      const commentResult = await client.query(
        `
        WITH RECURSIVE comment_tree AS (
          SELECT id, "topicId", status, "isVisible"
          FROM bz_topic_comment
          WHERE id = $1
          UNION ALL
          SELECT c.id, c."topicId", c.status, c."isVisible"
          FROM bz_topic_comment c
          INNER JOIN comment_tree ct ON c."replyCommentId" = ct.id
        )
        SELECT id, "topicId", status, "isVisible"
        FROM comment_tree
        `,
        [commentId],
      );

      if (!commentResult.rows.length) {
        throw new NotFoundException('comment not found');
      }

      const topicId = Number(commentResult.rows[0].topicId || 0);
      const hiddenVisibleCount = commentResult.rows.filter(
        (row: any) => Number(row.isVisible || 0) === 1,
      ).length;
      const commentIds = commentResult.rows.map((row: any) => Number(row.id));

      await client.query(
        `
        UPDATE bz_topic_comment
        SET
          status = 9,
          "isVisible" = 0,
          "updateTime" = NOW()
        WHERE id = ANY($1::bigint[])
        `,
        [commentIds],
      );

      if (hiddenVisibleCount > 0) {
        await client.query(
          `
          UPDATE bz_mini_topic
          SET
            "commentCount" = GREATEST("commentCount" - $2, 0),
            "updateTime" = NOW()
          WHERE id = $1
          `,
          [topicId, hiddenVisibleCount],
        );
      }

      const updateReportResult = await client.query(
        `
        UPDATE user_reports
        SET
          status = 'handled',
          "handledByAdminId" = $2,
          "handledRemark" = $3,
          "handledAt" = NOW(),
          "updateTime" = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [reportId, Number(admin.id || 0), remark || ''],
      );

      await client.query(
        `
        INSERT INTO admin_operation_logs
        ("adminUserId", "targetType", "targetId", action, remark, extra, "createTime")
        VALUES
        ($1, 'report', $2, 'report_accept', $3, $4::jsonb, NOW())
        `,
        [
          Number(admin.id || 0),
          String(reportId),
          remark || '',
          JSON.stringify({
          reportStatus: 'handled',
          targetType: 'comment',
          targetId: commentId,
          hiddenCommentIds: commentIds,
          hiddenVisibleCount,
          topicId,
          }),
        ],
      );

      await client.query(
        `
        INSERT INTO admin_operation_logs
        ("adminUserId", "targetType", "targetId", action, remark, extra, "createTime")
        VALUES
        ($1, 'comment', $2, 'comment_remove', $3, $4::jsonb, NOW())
        `,
        [
          Number(admin.id || 0),
          String(commentId),
          remark || '',
          JSON.stringify({
          source: 'report_accept',
          reportId,
          hiddenCommentIds: commentIds,
          hiddenVisibleCount,
          topicId,
          }),
        ],
      );

      return {
        ...this.formatReport(updateReportResult.rows[0]),
        action: 'report_accept',
        hiddenCommentIds: commentIds,
        hiddenVisibleCount,
      };
    });
  }

  async acceptTopicReport(reportId: number, admin: { id: number }, remark?: string) {
    const result = await this.databaseService.withTransaction(async (client) => {
      const reportResult = await client.query(
        `
        SELECT r.*, t.title, t."userId", t.status AS "topicStatus", t."isDelete"
        FROM user_reports r
        JOIN bz_mini_topic t ON t.id = CASE
          WHEN r."targetId" ~ '^[0-9]+$' THEN r."targetId"::bigint
          ELSE NULL
        END
        WHERE r.id = $1
          AND r."targetType" = 'topic'
        LIMIT 1
        `,
        [reportId],
      );

      if (!reportResult.rows.length) {
        throw new NotFoundException('topic report not found');
      }

      const report = reportResult.rows[0];
      const topicId = Number(report.targetId || 0);

      await client.query(
        `
        UPDATE bz_mini_topic
        SET
          status = 9,
          "isDelete" = 1,
          "updateTime" = NOW()
        WHERE id = $1
        `,
        [topicId],
      );

      const updateReportResult = await client.query(
        `
        UPDATE user_reports
        SET
          status = 'handled',
          "handledByAdminId" = $2,
          "handledRemark" = $3,
          "handledAt" = NOW(),
          "updateTime" = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [reportId, Number(admin.id || 0), remark || ''],
      );

      await client.query(
        `
        INSERT INTO admin_operation_logs
        ("adminUserId", "targetType", "targetId", action, remark, extra, "createTime")
        VALUES
        ($1, 'report', $2, 'report_accept', $3, $4::jsonb, NOW())
        `,
        [
          Number(admin.id || 0),
          String(reportId),
          remark || '',
          JSON.stringify({
            reportStatus: 'handled',
            targetType: 'topic',
            targetId: topicId,
            topicStatus: 9,
            isDelete: 1,
          }),
        ],
      );

      await client.query(
        `
        INSERT INTO admin_operation_logs
        ("adminUserId", "targetType", "targetId", action, remark, extra, "createTime")
        VALUES
        ($1, 'topic', $2, 'topic_remove', $3, $4::jsonb, NOW())
        `,
        [
          Number(admin.id || 0),
          String(topicId),
          remark || '',
          JSON.stringify({
            source: 'report_accept',
            reportId,
            topicStatus: 9,
            isDelete: 1,
          }),
        ],
      );

      return {
        report: updateReportResult.rows[0],
        topic: report,
      };
    });

    await this.messageService.create({
      userId: Number(result.topic.userId || 0),
      type: 'topic_removed',
      title: '你的帖子已被下架',
      content: `你发布的《${result.topic.title || '未命名帖子'}》因举报处理已被下架。`,
      targetType: 'topic',
      targetId: Number(result.topic.targetId || 0),
      extra: {
        topicId: Number(result.topic.targetId || 0),
        topicTitle: result.topic.title || '',
        source: 'report_accept',
        reportId,
      },
    });

    return {
      ...this.formatReport(result.report),
      action: 'report_accept',
      removedTopicId: Number(result.topic.targetId || 0),
    };
  }

  async acceptUserReport(reportId: number, admin: { id: number }, remark?: string) {
    return this.databaseService.withTransaction(async (client) => {
      const reportResult = await client.query(
        `
        SELECT r.*, u.id AS "targetUserId", u.status AS "targetUserStatus"
        FROM user_reports r
        JOIN bz_mini_user u ON u.id = CASE
          WHEN r."targetId" ~ '^[0-9]+$' THEN r."targetId"::bigint
          ELSE NULL
        END
        WHERE r.id = $1
          AND r."targetType" = 'user'
        LIMIT 1
        `,
        [reportId],
      );

      if (!reportResult.rows.length) {
        throw new NotFoundException('user report not found');
      }

      const report = reportResult.rows[0];
      const userId = Number(report.targetUserId || report.targetId || 0);

      await client.query(
        `
        UPDATE bz_mini_user
        SET
          status = 9,
          "updateTime" = NOW()
        WHERE id = $1
        `,
        [userId],
      );

      const updateReportResult = await client.query(
        `
        UPDATE user_reports
        SET
          status = 'handled',
          "handledByAdminId" = $2,
          "handledRemark" = $3,
          "handledAt" = NOW(),
          "updateTime" = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [reportId, Number(admin.id || 0), remark || ''],
      );

      await client.query(
        `
        INSERT INTO admin_operation_logs
        ("adminUserId", "targetType", "targetId", action, remark, extra, "createTime")
        VALUES
        ($1, 'report', $2, 'report_accept', $3, $4::jsonb, NOW())
        `,
        [
          Number(admin.id || 0),
          String(reportId),
          remark || '',
          JSON.stringify({
            reportStatus: 'handled',
            targetType: 'user',
            targetId: userId,
            userStatus: 9,
          }),
        ],
      );

      await client.query(
        `
        INSERT INTO admin_operation_logs
        ("adminUserId", "targetType", "targetId", action, remark, extra, "createTime")
        VALUES
        ($1, 'user', $2, 'user_ban', $3, $4::jsonb, NOW())
        `,
        [
          Number(admin.id || 0),
          String(userId),
          remark || '',
          JSON.stringify({
            source: 'report_accept',
            reportId,
            previousStatus: Number(report.targetUserStatus || 0),
            userStatus: 9,
          }),
        ],
      );

      return {
        ...this.formatReport(updateReportResult.rows[0]),
        action: 'report_accept',
        bannedUserId: userId,
      };
    });
  }

  private async handle(
    reportId: number,
    admin: { id: number },
    status: 'handled' | 'rejected',
    action: 'report_handle' | 'report_reject',
    remark = '',
  ) {
    const result = await this.databaseService.query(
      `
      UPDATE user_reports
      SET
        status = $2,
        "handledByAdminId" = $3,
        "handledRemark" = $4,
        "handledAt" = NOW(),
        "updateTime" = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [reportId, status, Number(admin.id || 0), remark || ''],
    );

    if (!result.rows.length) {
      throw new NotFoundException('report not found');
    }

    await this.adminLogService.write({
      adminUserId: Number(admin.id || 0),
      targetType: 'report',
      targetId: reportId,
      action,
      remark,
      extra: {
        reportStatus: status,
        targetType: result.rows[0].targetType,
        targetId: result.rows[0].targetId,
      },
    });

    return this.formatReport(result.rows[0]);
  }

  private async listModerationRecords(reportId: number) {
    const result = await this.databaseService.query(
      `
      SELECT *
      FROM moderation_records
      WHERE "targetType" = 'report'
        AND "targetId" = $1
      ORDER BY id DESC
      `,
      [String(reportId)],
    );
    return result.rows;
  }

  private async listTargetLogs(reportId: number) {
    const result = await this.databaseService.query(
      `
      SELECT l.*, a.username AS "adminUsername"
      FROM admin_operation_logs l
      LEFT JOIN admin_users a ON a.id = l."adminUserId"
      WHERE l."targetType" = 'report'
        AND l."targetId" = $1
      ORDER BY l.id DESC
      `,
      [String(reportId)],
    );
    return result.rows;
  }

  private formatReport(row: any) {
    const targetTopic = this.formatTargetTopic(row);
    const targetUser = this.formatTargetUser(row);
    return {
      id: Number(row.id),
      reporterUserId: Number(row.reporterUserId || 0),
      reporterName: row.reporterName || '',
      reporterPhone: row.reporterPhone || '',
      targetType: row.targetType || '',
      targetId: Number(row.targetId || 0),
      reason: row.reason || '',
      targetContent: row.targetCommentContent || this.buildTopicContentSummary(targetTopic) || this.buildUserContentSummary(targetUser),
      targetTopic,
      targetUser,
      status: row.status || '',
      handledByAdminId: row.handledByAdminId ? Number(row.handledByAdminId) : null,
      handledRemark: row.handledRemark || '',
      handledAt: row.handledAt || null,
      createTime: row.createTime,
      updateTime: row.updateTime,
      moderationResult: row.moderationResult || '',
      moderationProvider: row.moderationProvider || '',
      moderationRiskReason: row.moderationRiskReason || '',
    };
  }

  private formatTargetUser(row: any) {
    if (!row.targetUserId) {
      return null;
    }

    const status = Number(row.targetUserStatus || 0);
    return {
      id: Number(row.targetUserId),
      phone: row.targetUserPhone || '',
      nickName: row.targetUserName || '',
      avatarUrl: this.mediaUrlService.normalizeUrl(row.targetUserAvatarUrl),
      bio: row.targetUserBio || '',
      background: this.mediaUrlService.normalizeUrl(row.targetUserBackground),
      status,
      statusLabel: this.getUserStatusLabel(status),
      points: Number(row.targetUserPoints || 0),
      level: Number(row.targetUserLevel || 1),
      isAdmin: Boolean(row.targetUserIsAdmin),
      inviteCode: row.targetUserInviteCode || '',
      invitedByUserId: row.targetUserInvitedByUserId ? Number(row.targetUserInvitedByUserId) : null,
      inviteSuccessCount: Number(row.targetUserInviteSuccessCount || 0),
      inviteRewardPoints: Number(row.targetUserInviteRewardPoints || 0),
      createTime: row.targetUserCreateTime || null,
      updateTime: row.targetUserUpdateTime || null,
      topicCount: Number(row.targetUserTopicCount || 0),
      publishedTopicCount: Number(row.targetUserPublishedTopicCount || 0),
      pendingTopicCount: Number(row.targetUserPendingTopicCount || 0),
      removedTopicCount: Number(row.targetUserRemovedTopicCount || 0),
      commentCount: Number(row.targetUserCommentCount || 0),
      visibleCommentCount: Number(row.targetUserVisibleCommentCount || 0),
      receivedReportCount: Number(row.targetUserReceivedReportCount || 0),
      pendingReportCount: Number(row.targetUserPendingReportCount || 0),
    };
  }

  private formatTargetTopic(row: any) {
    if (!row.targetTopicId) {
      return null;
    }

    const extra = row.targetTopicExtra && typeof row.targetTopicExtra === 'object' && !Array.isArray(row.targetTopicExtra)
      ? row.targetTopicExtra
      : {};

    const topicCategory = Number(row.targetTopicCategory || 0);
    const topic = {
      id: Number(row.targetTopicId),
      topicCategory,
      topicCategoryLabel: this.getTopicCategoryLabel(topicCategory),
      title: row.targetTopicTitle || '',
      content: row.targetTopicContent || '',
      images: this.normalizeList(row.targetTopicImages),
      extra,
      status: Number(row.targetTopicStatus || 0),
      isDelete: Number(row.targetTopicIsDelete || 0),
      userId: Number(row.targetTopicUserId || 0),
      authorName: row.targetTopicAuthorName || '',
      authorPhone: row.targetTopicAuthorPhone || '',
      publishTime: row.targetTopicPublishTime || null,
      createTime: row.targetTopicCreateTime || null,
      updateTime: row.targetTopicUpdateTime || null,
      likeCount: Number(row.targetTopicLikeCount || 0),
      commentCount: Number(row.targetTopicCommentCount || 0),
    };

    return {
      ...topic,
      reviewSections: this.buildTopicReviewSections(topic, extra),
      reviewFields: this.buildTopicReviewFields(extra),
    };
  }

  private buildTopicContentSummary(topic: any) {
    if (!topic) {
      return '';
    }

    const parts = [
      topic.title ? `标题：${topic.title}` : '',
      topic.content ? `正文：${String(topic.content).slice(0, 120)}` : '',
    ].filter(Boolean);
    return parts.join('\n');
  }

  private buildUserContentSummary(user: any) {
    if (!user) {
      return '';
    }

    return [
      `昵称：${user.nickName || '-'}`,
      `手机号：${user.phone || '-'}`,
      `状态：${user.statusLabel || this.getUserStatusLabel(user.status)}`,
      user.bio ? `简介：${String(user.bio).slice(0, 120)}` : '',
    ].filter(Boolean).join('\n');
  }

  private buildTopicReviewFields(extra: Record<string, any>) {
    return this.buildTopicReviewSections({ topicCategory: -1 }, extra)
      .flatMap((section) => section.rows || []);
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
    if (category === 0 || category === 1 || category === -1) {
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

    if (category === 2 || category === -1) {
      addSection('提问信息', (add) => {
        const recommendMeta = this.normalizePlainObject(extra.recommendMeta);
        add('问题类型', this.mapByLabel(QUESTION_TYPE_LABELS, extra.questionType), 'questionType');
        add('关联分类', this.getGearCategoryLabel(extra.relatedGearCategory), 'relatedGearCategory');
        add('关联型号', extra.relatedGearModel, 'relatedGearModel');
        add('求推荐类型', this.mapByLabel(RECOMMEND_INTENT_LABELS, recommendMeta.recommendIntent || recommendMeta.currentStage), ['recommendMeta.recommendIntent', 'recommendMeta.currentStage']);
        add('预算范围', this.mapByLabel(BUDGET_RANGE_LABELS, recommendMeta.budgetRange || recommendMeta.budget || extra.budget), ['recommendMeta.budgetRange', 'recommendMeta.budget', 'budget']);
        add('预算弹性', this.mapByLabel(BUDGET_FLEXIBLE_LABELS, recommendMeta.budgetFlexible), 'recommendMeta.budgetFlexible');
        add('目标鱼', this.mapListByLabel(TARGET_FISH_LABELS, recommendMeta.targetFish || extra.targetFish), ['recommendMeta.targetFish', 'targetFish']);
        add('使用场景', this.mapListByLabel(USE_SCENE_LABELS, recommendMeta.useScene || recommendMeta.scenes || extra.environments), ['recommendMeta.useScene', 'recommendMeta.scenes', 'environments']);
        add('在意点', this.mapListByLabel(CARE_PRIORITY_LABELS, recommendMeta.carePriorities), 'recommendMeta.carePriorities');
        add('避坑点', this.mapListByLabel(AVOID_POINT_LABELS, recommendMeta.avoidPoints), 'recommendMeta.avoidPoints');
        add('当前装备', recommendMeta.currentGear, 'recommendMeta.currentGear');
        add('候选选项', recommendMeta.candidateOptions || extra.candidateOptions, ['recommendMeta.candidateOptions', 'candidateOptions']);
        add('使用频率', this.mapByLabel(RECOMMEND_USAGE_FREQUENCY_LABELS, recommendMeta.usageFrequency || extra.usageFrequency), ['recommendMeta.usageFrequency', 'usageFrequency']);
        add('核心纠结', recommendMeta.coreQuestion, 'recommendMeta.coreQuestion');
        add('回复模式', extra.quickReplyOnly ? '仅快答' : '开放讨论', 'quickReplyOnly');
      });
    }

    if (category === 3 || category === -1) {
      addSection('鱼获信息', (add) => {
        add('位置标签', extra.locationTag, 'locationTag');
        add('长度', this.formatCatchMeasure('长度', extra.length, extra.isLengthSecret, extra.isLengthEstimated, 'cm'), ['length', 'isLengthSecret', 'isLengthEstimated']);
        add('重量', this.formatCatchMeasure('重量', extra.weight, extra.isWeightSecret, extra.isWeightEstimated, 'kg'), ['weight', 'isWeightSecret', 'isWeightEstimated']);
      });
    }

    if (category === 4 || category === -1) {
      addSection('钓行信息', (add) => {
        const targetFish = [
          ...this.normalizeStringList(extra.targetFish),
          ...this.normalizeStringList(extra.customTargetFish),
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
        return [];
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
    this.normalizeStringList(keys).forEach((key) => {
      usedKeys.add(key);
    });
  }

  private normalizeStringList(value: any): string[] {
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

  private getUserStatusLabel(status: any) {
    const normalized = Number(status || 0);
    if (normalized === 0) return '正常';
    if (normalized === 9) return '已封禁';
    return String(status ?? '-');
  }

  private getGearCategoryLabel(value: any) {
    const normalized = Array.isArray(value) ? value[0] : value;
    const text = String(normalized || '').trim();
    return GEAR_CATEGORY_LABELS[text] || text;
  }

  private normalizePlainObject(value: any): Record<string, any> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  private mapByLabel(map: Record<string, string>, value: any) {
    const text = String(value || '').trim();
    return map[text] || text;
  }

  private mapListByLabel(map: Record<string, string>, value: any) {
    return this.normalizeStringList(value)
      .map((item) => this.mapByLabel(map, item))
      .filter(Boolean);
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

  private normalizeList(value: any) {
    if (!value) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  }

  private normalizeLimit(limit?: string | number) {
    const normalized = Number(limit || 50);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      return 50;
    }
    return Math.min(Math.floor(normalized), 200);
  }
}
