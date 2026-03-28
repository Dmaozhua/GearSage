import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';

@Injectable()
export class AdminLogService {
  constructor(private readonly databaseService: DatabaseService) {}

  async write(input: {
    adminUserId: number;
    targetType: string;
    targetId: string | number;
    action: string;
    remark?: string;
    extra?: Record<string, any>;
  }) {
    await this.databaseService.query(
      `
      INSERT INTO admin_operation_logs
      ("adminUserId", "targetType", "targetId", action, remark, extra, "createTime")
      VALUES
      ($1, $2, $3, $4, $5, $6::jsonb, NOW())
      `,
      [
        input.adminUserId,
        input.targetType,
        String(input.targetId),
        input.action,
        input.remark || '',
        JSON.stringify(input.extra || {}),
      ],
    );
  }

  async list(filters: {
    targetType?: string;
    action?: string;
    limit?: string | number;
  } = {}) {
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters.targetType) {
      params.push(filters.targetType);
      conditions.push(`l."targetType" = $${params.length}`);
    }

    if (filters.action) {
      params.push(filters.action);
      conditions.push(`l.action = $${params.length}`);
    }

    const limit = this.normalizeLimit(filters.limit);
    params.push(limit);

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
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
        a.username AS "adminUsername",
        a.role AS "adminRole"
      FROM admin_operation_logs l
      LEFT JOIN admin_users a ON a.id = l."adminUserId"
      ${whereClause}
      ORDER BY l.id DESC
      LIMIT $${params.length}
      `,
      params,
    );

    return result.rows.map((row: any) => ({
      id: Number(row.id),
      adminUserId: Number(row.adminUserId),
      adminUsername: row.adminUsername || '',
      adminRole: row.adminRole || '',
      targetType: row.targetType || '',
      targetId: row.targetId || '',
      action: row.action || '',
      remark: row.remark || '',
      extra: row.extra || {},
      createTime: row.createTime,
    }));
  }

  private normalizeLimit(limit?: string | number) {
    const normalized = Number(limit || 50);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      return 50;
    }
    return Math.min(Math.floor(normalized), 200);
  }
}
