import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { AdminLogService } from './admin-log.service';

@Injectable()
export class AdminUserService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly adminLogService: AdminLogService,
  ) {}

  async list(filters: { status?: string; keyword?: string; limit?: string | number } = {}) {
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters.status && filters.status !== 'all') {
      const normalizedStatus = Number(filters.status);
      if (Number.isInteger(normalizedStatus)) {
        params.push(normalizedStatus);
        conditions.push(`u.status = $${params.length}`);
      }
    }

    if (filters.keyword) {
      params.push(`%${filters.keyword.trim()}%`);
      conditions.push(
        `(u."nickName" ILIKE $${params.length} OR u.phone ILIKE $${params.length})`,
      );
    }

    const limit = this.normalizeLimit(filters.limit);
    params.push(limit);
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.databaseService.query(
      `
      SELECT
        u.id,
        u.phone,
        u."nickName",
        u."avatarUrl",
        u.status,
        u.points,
        u.level,
        u."createTime",
        u."updateTime",
        COALESCE(tc."topicCount", 0) AS "topicCount",
        COALESCE(cc."commentCount", 0) AS "commentCount"
      FROM bz_mini_user u
      LEFT JOIN (
        SELECT "userId", COUNT(*)::int AS "topicCount"
        FROM bz_mini_topic
        WHERE "isDelete" = 0
        GROUP BY "userId"
      ) tc ON tc."userId" = u.id
      LEFT JOIN (
        SELECT "userId", COUNT(*)::int AS "commentCount"
        FROM bz_topic_comment
        GROUP BY "userId"
      ) cc ON cc."userId" = u.id
      ${whereClause}
      ORDER BY u.id DESC
      LIMIT $${params.length}
      `,
      params,
    );

    return result.rows.map((row: any) => this.mapUser(row));
  }

  async getDetail(userId: number) {
    const result = await this.databaseService.query(
      `
      SELECT *
      FROM bz_mini_user
      WHERE id = $1
      LIMIT 1
      `,
      [userId],
    );

    if (!result.rows.length) {
      throw new NotFoundException('user not found');
    }

    return {
      ...this.mapUser(result.rows[0]),
      adminLogs: await this.listTargetLogs(userId),
    };
  }

  async ban(userId: number, admin: { id: number }, remark?: string) {
    const result = await this.databaseService.query(
      `
      UPDATE bz_mini_user
      SET
        status = 9,
        "updateTime" = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [userId],
    );

    if (!result.rows.length) {
      throw new NotFoundException('user not found');
    }

    await this.adminLogService.write({
      adminUserId: admin.id,
      targetType: 'user',
      targetId: userId,
      action: 'user_ban',
      remark,
    });

    return this.mapUser(result.rows[0]);
  }

  async unban(userId: number, admin: { id: number }, remark?: string) {
    const result = await this.databaseService.query(
      `
      UPDATE bz_mini_user
      SET
        status = 0,
        "updateTime" = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [userId],
    );

    if (!result.rows.length) {
      throw new NotFoundException('user not found');
    }

    await this.adminLogService.write({
      adminUserId: admin.id,
      targetType: 'user',
      targetId: userId,
      action: 'user_unban',
      remark,
    });

    return this.mapUser(result.rows[0]);
  }

  private async listTargetLogs(userId: number) {
    const result = await this.databaseService.query(
      `
      SELECT
        l.id,
        l."adminUserId",
        l.action,
        l.remark,
        l.extra,
        l."createTime",
        a.username AS "adminUsername"
      FROM admin_operation_logs l
      LEFT JOIN admin_users a ON a.id = l."adminUserId"
      WHERE l."targetType" = 'user'
        AND l."targetId" = $1
      ORDER BY l.id DESC
      `,
      [String(userId)],
    );

    return result.rows.map((row: any) => ({
      id: Number(row.id),
      adminUserId: Number(row.adminUserId),
      adminUsername: row.adminUsername || '',
      action: row.action || '',
      remark: row.remark || '',
      extra: row.extra || {},
      createTime: row.createTime,
    }));
  }

  private mapUser(row: any) {
    return {
      id: Number(row.id),
      phone: row.phone || '',
      nickName: row.nickName || '',
      avatarUrl: row.avatarUrl || '',
      status: Number(row.status || 0),
      points: Number(row.points || 0),
      level: Number(row.level || 1),
      topicCount: Number(row.topicCount || 0),
      commentCount: Number(row.commentCount || 0),
      createTime: row.createTime,
      updateTime: row.updateTime,
    };
  }

  private normalizeLimit(limit?: string | number) {
    const normalized = Number(limit || 50);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      return 50;
    }
    return Math.min(Math.floor(normalized), 200);
  }
}
