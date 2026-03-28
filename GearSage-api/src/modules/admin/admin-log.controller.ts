import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../../common/admin-jwt-auth.guard';
import { AdminLogService } from './admin-log.service';

@Controller('admin/logs')
@UseGuards(AdminJwtAuthGuard)
export class AdminLogController {
  constructor(private readonly adminLogService: AdminLogService) {}

  @Get()
  async list(
    @Query('targetType') targetType?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminLogService.list({ targetType, action, limit }),
    };
  }
}
