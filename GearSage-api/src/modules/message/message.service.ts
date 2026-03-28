import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';

type CreateMessageInput = {
  userId: number;
  type: string;
  title: string;
  content: string;
  targetType?: string;
  targetId?: string | number;
  extra?: Record<string, any>;
};

@Injectable()
export class MessageService {
  constructor(private readonly databaseService: DatabaseService) {}

  async deleteByTopic(
    userId: number,
    topicId: number,
    types: string[] = [],
  ) {
    if (!userId || userId <= 0 || !topicId || topicId <= 0 || !Array.isArray(types) || !types.length) {
      return 0;
    }

    const normalizedTypes = types.map((item) => String(item || '').trim()).filter(Boolean);
    if (!normalizedTypes.length) {
      return 0;
    }

    const result = await this.databaseService.query(
      `
      DELETE FROM user_messages
      WHERE "userId" = $1
        AND "targetType" = 'topic'
        AND "targetId" = $2
        AND type = ANY($3::text[])
      `,
      [userId, String(topicId), normalizedTypes],
    );

    return Number(result.rowCount || 0);
  }

  async purgeStaleRejectedMessages(userId: number) {
    if (!userId || userId <= 0) {
      return 0;
    }

    const result = await this.databaseService.query(
      `
      DELETE FROM user_messages um
      WHERE um."userId" = $1
        AND um.type = 'topic_rejected'
        AND (
          um."targetType" <> 'topic'
          OR um."targetId" = ''
          OR NOT EXISTS (
            SELECT 1
            FROM bz_mini_topic t
            WHERE t.id::text = um."targetId"
              AND t."userId" = $1
              AND t.status = 0
              AND t."isDelete" = 0
          )
        )
      `,
      [userId],
    );

    return Number(result.rowCount || 0);
  }

  async create(input: CreateMessageInput) {
    if (!input.userId || input.userId <= 0) {
      return null;
    }

    if (
      input.type === 'topic_rejected' &&
      input.targetType === 'topic' &&
      input.targetId !== undefined &&
      input.targetId !== null &&
      String(input.targetId).trim()
    ) {
      await this.databaseService.query(
        `
        DELETE FROM user_messages
        WHERE "userId" = $1
          AND type = $2
          AND "targetType" = $3
          AND "targetId" = $4
        `,
        [
          input.userId,
          input.type,
          input.targetType,
          String(input.targetId),
        ],
      );
    }

    const result = await this.databaseService.query(
      `
      INSERT INTO user_messages
      ("userId", type, title, content, "targetType", "targetId", "isRead", extra, "createTime", "updateTime")
      VALUES
      ($1, $2, $3, $4, $5, $6, 0, $7::jsonb, NOW(), NOW())
      RETURNING id
      `,
      [
        input.userId,
        input.type,
        input.title || '',
        input.content || '',
        input.targetType || '',
        String(input.targetId || ''),
        JSON.stringify(input.extra || {}),
      ],
    );

    return result.rows[0] ? Number(result.rows[0].id) : null;
  }

  async list(
    userId: number,
    filters: {
      page?: string | number;
      limit?: string | number;
      type?: string;
      onlyUnread?: string | boolean;
    } = {},
  ) {
    await this.purgeStaleRejectedMessages(userId);

    const page = this.normalizePage(filters.page);
    const limit = this.normalizeLimit(filters.limit);
    const offset = (page - 1) * limit;
    const params: any[] = [userId];
    const conditions = [`"userId" = $1`];

    if (filters.type) {
      params.push(String(filters.type).trim());
      conditions.push(`type = $${params.length}`);
    }

    if (this.normalizeBoolean(filters.onlyUnread)) {
      conditions.push(`"isRead" = 0`);
    }

    params.push(limit);
    params.push(offset);
    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const listResult = await this.databaseService.query(
      `
      SELECT
        id,
        "userId",
        type,
        title,
        content,
        "targetType",
        "targetId",
        "isRead",
        extra,
        "createTime",
        "updateTime"
      FROM user_messages
      ${whereClause}
      ORDER BY "createTime" DESC, id DESC
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
      `,
      params,
    );

    const unreadResult = await this.databaseService.query(
      `
      SELECT COUNT(*)::int AS count
      FROM user_messages
      WHERE "userId" = $1
        AND "isRead" = 0
      `,
      [userId],
    );

    return {
      list: listResult.rows.map((row: any) => ({
        id: Number(row.id),
        userId: Number(row.userId),
        type: row.type || '',
        title: row.title || '',
        content: row.content || '',
        targetType: row.targetType || '',
        targetId: row.targetId || '',
        isRead: Number(row.isRead || 0) === 1,
        extra: row.extra && typeof row.extra === 'object' ? row.extra : {},
        createTime: row.createTime,
        updateTime: row.updateTime,
      })),
      unreadCount: Number(unreadResult.rows[0]?.count || 0),
    };
  }

  async markRead(userId: number, messageId: number) {
    await this.databaseService.query(
      `
      UPDATE user_messages
      SET
        "isRead" = 1,
        "updateTime" = NOW()
      WHERE id = $1
        AND "userId" = $2
      `,
      [messageId, userId],
    );

    return true;
  }

  async markAllRead(userId: number) {
    await this.databaseService.query(
      `
      UPDATE user_messages
      SET
        "isRead" = 1,
        "updateTime" = NOW()
      WHERE "userId" = $1
        AND "isRead" = 0
      `,
      [userId],
    );

    return true;
  }

  private normalizePage(value: string | number | undefined) {
    const page = Number(value || 1);
    return Number.isInteger(page) && page > 0 ? page : 1;
  }

  private normalizeLimit(value: string | number | undefined) {
    const limit = Number(value || 20);
    if (!Number.isInteger(limit) || limit <= 0) {
      return 20;
    }
    return Math.min(limit, 100);
  }

  private normalizeBoolean(value: string | boolean | undefined) {
    if (value === true) return true;
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes';
  }
}
