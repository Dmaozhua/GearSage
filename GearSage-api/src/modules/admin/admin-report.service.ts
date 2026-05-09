import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { AdminLogService } from './admin-log.service';

@Injectable()
export class AdminReportService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly adminLogService: AdminLogService,
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
        mr.result AS "moderationResult",
        mr.provider AS "moderationProvider",
        mr."riskReason" AS "moderationRiskReason"
      FROM user_reports r
      LEFT JOIN bz_mini_user u ON u.id = r."reporterUserId"
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
        u.phone AS "reporterPhone"
      FROM user_reports r
      LEFT JOIN bz_mini_user u ON u.id = r."reporterUserId"
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
    return {
      id: Number(row.id),
      reporterUserId: Number(row.reporterUserId || 0),
      reporterName: row.reporterName || '',
      reporterPhone: row.reporterPhone || '',
      targetType: row.targetType || '',
      targetId: Number(row.targetId || 0),
      reason: row.reason || '',
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

  private normalizeLimit(limit?: string | number) {
    const normalized = Number(limit || 50);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      return 50;
    }
    return Math.min(Math.floor(normalized), 200);
  }
}
