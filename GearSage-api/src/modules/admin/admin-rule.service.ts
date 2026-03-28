import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { AdminLogService } from './admin-log.service';
import { AdminCreateRuleDto } from './dto/admin-create-rule.dto';

@Injectable()
export class AdminRuleService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly adminLogService: AdminLogService,
  ) {}

  async list() {
    const result = await this.databaseService.query(
      `
      SELECT id, rule_type, match_type, keyword, status, remark, "createTime", "updateTime"
      FROM moderation_rules
      ORDER BY id DESC
      `,
    );

    return result.rows.map((row: any) => ({
      id: Number(row.id),
      ruleType: row.rule_type || 'text',
      matchType: row.match_type || 'contains',
      keyword: row.keyword || '',
      status: row.status || 'active',
      remark: row.remark || '',
      createTime: row.createTime,
      updateTime: row.updateTime,
    }));
  }

  async create(admin: { id: number }, dto: AdminCreateRuleDto) {
    const result = await this.databaseService.query(
      `
      INSERT INTO moderation_rules
      (rule_type, match_type, keyword, status, remark, "createTime", "updateTime")
      VALUES
      ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, rule_type, match_type, keyword, status, remark, "createTime", "updateTime"
      `,
      [
        dto.ruleType || 'text',
        dto.matchType || 'contains',
        dto.keyword.trim(),
        dto.status || 'active',
        dto.remark || '',
      ],
    );

    await this.adminLogService.write({
      adminUserId: admin.id,
      targetType: 'moderation_rule',
      targetId: result.rows[0].id,
      action: 'rule_create',
      remark: dto.remark,
      extra: {
        ruleType: dto.ruleType || 'text',
        matchType: dto.matchType || 'contains',
        keyword: dto.keyword.trim(),
        status: dto.status || 'active',
      },
    });

    return {
      id: Number(result.rows[0].id),
      ruleType: result.rows[0].rule_type || 'text',
      matchType: result.rows[0].match_type || 'contains',
      keyword: result.rows[0].keyword || '',
      status: result.rows[0].status || 'active',
      remark: result.rows[0].remark || '',
      createTime: result.rows[0].createTime,
      updateTime: result.rows[0].updateTime,
    };
  }

  async remove(admin: { id: number }, id: number) {
    const result = await this.databaseService.query(
      `
      DELETE FROM moderation_rules
      WHERE id = $1
      RETURNING id, keyword
      `,
      [id],
    );

    if (!result.rows.length) {
      throw new NotFoundException('rule not found');
    }

    await this.adminLogService.write({
      adminUserId: admin.id,
      targetType: 'moderation_rule',
      targetId: id,
      action: 'rule_delete',
      extra: {
        keyword: result.rows[0].keyword || '',
      },
    });

    return true;
  }
}
