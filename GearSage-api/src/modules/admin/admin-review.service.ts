import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { MediaUrlService } from '../../common/media-url.service';
import { AdminLogService } from './admin-log.service';
import { MessageService } from '../message/message.service';

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
        t."userId",
        t."publishTime",
        t."createTime",
        t."updateTime",
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
      ...this.mapTopicRow(topicResult.rows[0]),
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

  private mapTopicRow(row: any) {
    const extra = row.extra && typeof row.extra === 'object' && !Array.isArray(row.extra)
      ? row.extra
      : {};
    return {
      id: Number(row.id),
      topicCategory: Number(row.topicCategory || 0),
      title: row.title || '',
      content: row.content || '',
      images: this.normalizeTopicImages(row.images, extra),
      rejectReason: row.rejectReason || '',
      extra,
      status: Number(row.status || 0),
      userId: Number(row.userId || 0),
      authorName: row.authorName || '',
      authorPhone: row.authorPhone || '',
      publishTime: row.publishTime || null,
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
