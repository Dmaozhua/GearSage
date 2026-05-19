import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { AdminLogService } from '../admin/admin-log.service';
import { ModerationService } from '../moderation/moderation.service';
import { AdminGearUpdateRequestStatusDto } from './dto/admin-gear-update-request-status.dto';
import { CreateGearUpdateRequestDto } from './dto/create-gear-update-request.dto';

type GearUpdateRequestStatus = 'pending' | 'review' | 'accepted' | 'ignored' | 'done';

const GEAR_TYPE_LABELS: Record<string, string> = {
  reels: '渔轮',
  rods: '鱼竿',
  lures: '鱼饵',
  other: '其他',
};

const ADMIN_ACTION_BY_STATUS: Record<GearUpdateRequestStatus, string> = {
  pending: 'gear_update_request_status',
  review: 'gear_update_request_status',
  accepted: 'gear_update_request_accept',
  ignored: 'gear_update_request_ignore',
  done: 'gear_update_request_done',
};

@Injectable()
export class GearUpdateRequestService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly moderationService: ModerationService,
    private readonly adminLogService: AdminLogService,
  ) {}

  async create(userId: number, dto: CreateGearUpdateRequestDto) {
    const normalized = this.normalizeCreatePayload(dto);
    const requestDay = await this.getShanghaiRequestDay();

    await this.assertDailyLimit(userId, requestDay);

    const pendingTargetId = `${userId}:gear_update_request:${Date.now()}:pending`;
    const moderationContent = [normalized.gearName, normalized.description]
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .join('\n');
    const decision = await this.moderationService.reviewText(
      'gear_update_request',
      moderationContent,
      {
        userId,
        targetType: 'gear_update_request',
        targetId: pendingTargetId,
        extra: {
          gearType: normalized.gearType,
          searchKeyword: normalized.searchKeyword,
          searchContext: normalized.searchContext,
          sourcePage: normalized.sourcePage,
        },
      },
    );

    if (decision.result === 'REJECT') {
      throw new HttpException(
        {
          code: 403,
          message: '内容不符合社区规范，请修改后重试',
          data: null,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const status = decision.result === 'REVIEW' ? 'review' : 'pending';

    try {
      const result = await this.databaseService.query(
        `
        INSERT INTO gear_update_requests
        (
          user_id,
          gear_type,
          gear_name,
          description,
          search_keyword,
          search_context_json,
          source_page,
          status,
          moderation_result,
          moderation_reason,
          request_day,
          create_time,
          update_time
        )
        VALUES
        ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11::date, NOW(), NOW())
        RETURNING id, status
        `,
        [
          userId,
          normalized.gearType,
          normalized.gearName,
          normalized.description,
          normalized.searchKeyword,
          JSON.stringify(normalized.searchContext),
          normalized.sourcePage,
          status,
          decision.result,
          decision.riskReason || '',
          requestDay,
        ],
      );

      await this.moderationService.relinkPendingRecords({
        targetType: 'gear_update_request',
        fromTargetId: pendingTargetId,
        toTargetId: result.rows[0].id,
        userId,
      });

      return {
        id: Number(result.rows[0].id),
        status: result.rows[0].status,
      };
    } catch (error: any) {
      if (String(error?.code || '') === '23505') {
        this.throwDailyLimitError();
      }
      throw error;
    }
  }

  async list(filters: { status?: string; gearType?: string; limit?: string | number } = {}) {
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters.status && filters.status !== 'all') {
      params.push(filters.status);
      conditions.push(`r.status = $${params.length}`);
    } else if (!filters.status) {
      conditions.push(`r.status IN ('pending', 'review')`);
    }

    if (filters.gearType && filters.gearType !== 'all') {
      params.push(this.normalizeGearType(filters.gearType));
      conditions.push(`r.gear_type = $${params.length}`);
    }

    const limit = this.normalizeLimit(filters.limit);
    params.push(limit);

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await this.databaseService.query(
      `
      SELECT
        r.*,
        u."nickName" AS user_name,
        u.phone AS user_phone
      FROM gear_update_requests r
      LEFT JOIN bz_mini_user u ON u.id = r.user_id
      ${whereClause}
      ORDER BY r.id DESC
      LIMIT $${params.length}
      `,
      params,
    );

    return result.rows.map((row: any) => this.formatRequest(row));
  }

  async getDetail(requestId: number) {
    const result = await this.databaseService.query(
      `
      SELECT
        r.*,
        u."nickName" AS user_name,
        u.phone AS user_phone
      FROM gear_update_requests r
      LEFT JOIN bz_mini_user u ON u.id = r.user_id
      WHERE r.id = $1
      LIMIT 1
      `,
      [requestId],
    );

    if (!result.rows.length) {
      throw new NotFoundException('gear update request not found');
    }

    return {
      ...this.formatRequest(result.rows[0]),
      moderationRecords: await this.listModerationRecords(requestId),
      adminLogs: await this.listTargetLogs(requestId),
    };
  }

  async updateStatus(
    requestId: number,
    admin: { id: number },
    dto: AdminGearUpdateRequestStatusDto,
  ) {
    const status = this.normalizeAdminStatus(dto?.status);
    const remark = String(dto.remark || '').trim();
    const result = await this.databaseService.query(
      `
      UPDATE gear_update_requests
      SET
        status = $2,
        admin_remark = $3,
        handled_by_admin_id = $4,
        handled_at = NOW(),
        update_time = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [requestId, status, remark, Number(admin.id || 0)],
    );

    if (!result.rows.length) {
      throw new NotFoundException('gear update request not found');
    }

    const row = result.rows[0];
    const action = ADMIN_ACTION_BY_STATUS[status];
    await this.adminLogService.write({
      adminUserId: Number(admin.id || 0),
      targetType: 'gear_update_request',
      targetId: requestId,
      action,
      remark,
      extra: {
        status,
        gearType: row.gear_type,
        gearName: row.gear_name,
        requestDay: row.request_day,
      },
    });

    return {
      ...this.formatRequest(row),
      action,
    };
  }

  private normalizeCreatePayload(dto: CreateGearUpdateRequestDto) {
    const gearName = String(dto.gearName || '').trim();
    const description = String(dto.description || '').trim();

    if (!gearName) {
      throw new HttpException(
        { code: 400, message: '请输入希望新增的装备', data: null },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (gearName.length < 2) {
      throw new HttpException(
        { code: 400, message: '装备名称太短，请补充完整型号', data: null },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (gearName.length > 80) {
      throw new HttpException(
        { code: 400, message: '装备名称最多 80 字', data: null },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (description.length > 300) {
      throw new HttpException(
        { code: 400, message: '描述最多 300 字', data: null },
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      gearName,
      description,
      gearType: this.normalizeGearType(dto.gearType),
      searchKeyword: String(dto.searchKeyword || '').trim().slice(0, 120),
      searchContext:
        dto.searchContext && typeof dto.searchContext === 'object' && !Array.isArray(dto.searchContext)
          ? dto.searchContext
          : {},
      sourcePage: String(dto.sourcePage || 'gear_list').trim().slice(0, 64) || 'gear_list',
    };
  }

  private normalizeGearType(value?: string) {
    const raw = String(value || '').trim();
    if (raw === 'rod' || raw === 'rods') return 'rods';
    if (raw === 'lure' || raw === 'lures') return 'lures';
    if (raw === 'reel' || raw === 'reels') return 'reels';
    return 'other';
  }

  private normalizeAdminStatus(value?: string): GearUpdateRequestStatus {
    const status = String(value || '').trim();
    if (status === 'pending') return 'pending';
    if (status === 'review') return 'review';
    if (status === 'accepted') return 'accepted';
    if (status === 'ignored') return 'ignored';
    if (status === 'done') return 'done';
    throw new BadRequestException('unsupported gear update request status');
  }

  private async getShanghaiRequestDay() {
    const result = await this.databaseService.query(
      `SELECT (NOW() AT TIME ZONE 'Asia/Shanghai')::date AS request_day`,
    );
    return result.rows[0].request_day;
  }

  private async assertDailyLimit(userId: number, requestDay: string) {
    const result = await this.databaseService.query(
      `
      SELECT id
      FROM gear_update_requests
      WHERE user_id = $1
        AND request_day = $2::date
      LIMIT 1
      `,
      [userId, requestDay],
    );

    if (result.rows.length) {
      this.throwDailyLimitError();
    }
  }

  private throwDailyLimitError(): never {
    throw new HttpException(
      {
        code: 400,
        message: '每个用户一天只能提交一次',
        data: null,
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  private async listModerationRecords(requestId: number) {
    const result = await this.databaseService.query(
      `
      SELECT id, scene, "contentType", provider, result, "riskLevel", "riskReason",
             "hitLabels", "requestId", extra, "createTime"
      FROM moderation_records
      WHERE "targetType" = 'gear_update_request'
        AND "targetId" = $1
      ORDER BY id DESC
      `,
      [String(requestId)],
    );

    return result.rows;
  }

  private async listTargetLogs(requestId: number) {
    const result = await this.databaseService.query(
      `
      SELECT l.id, l."adminUserId", l.action, l.remark, l.extra, l."createTime",
             a.username AS "adminUsername"
      FROM admin_operation_logs l
      LEFT JOIN admin_users a ON a.id = l."adminUserId"
      WHERE l."targetType" = 'gear_update_request'
        AND l."targetId" = $1
      ORDER BY l.id DESC
      `,
      [String(requestId)],
    );

    return result.rows;
  }

  private formatRequest(row: any) {
    const phone = String(row.user_phone || '');
    return {
      id: Number(row.id),
      userId: Number(row.user_id || 0),
      userName: row.user_name || '',
      userPhone: phone,
      userPhoneTail: phone ? phone.slice(-4) : '',
      gearType: row.gear_type || '',
      gearTypeLabel: GEAR_TYPE_LABELS[row.gear_type] || row.gear_type || '',
      gearName: row.gear_name || '',
      description: row.description || '',
      searchKeyword: row.search_keyword || '',
      searchContext: row.search_context_json || {},
      sourcePage: row.source_page || '',
      status: row.status || '',
      moderationResult: row.moderation_result || '',
      moderationReason: row.moderation_reason || '',
      adminRemark: row.admin_remark || '',
      handledByAdminId: row.handled_by_admin_id ? Number(row.handled_by_admin_id) : null,
      handledAt: row.handled_at || null,
      requestDay: row.request_day,
      createTime: row.create_time,
      updateTime: row.update_time,
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
