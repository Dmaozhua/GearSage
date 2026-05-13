import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../../common/admin-jwt-auth.guard';
import { CurrentAdmin } from '../../common/current-admin.decorator';
import { AdminReviewActionDto } from './dto/admin-review-action.dto';
import { AdminReportService } from './admin-report.service';

@Controller('admin/reports')
@UseGuards(AdminJwtAuthGuard)
export class AdminReportController {
  constructor(private readonly adminReportService: AdminReportService) {}

  @Get()
  async list(
    @Query('status') status?: string,
    @Query('targetType') targetType?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReportService.list({ status, targetType, limit }),
    };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReportService.getDetail(Number(id)),
    };
  }

  @Post(':id/handle')
  async handle(
    @Param('id') id: string,
    @CurrentAdmin() admin?: { id: number },
    @Body() body?: AdminReviewActionDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReportService.resolve(Number(id), { id: Number(admin?.id || 0) }, body?.remark),
    };
  }

  @Post(':id/accept-comment')
  async acceptComment(
    @Param('id') id: string,
    @CurrentAdmin() admin?: { id: number },
    @Body() body?: AdminReviewActionDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReportService.acceptCommentReport(
        Number(id),
        { id: Number(admin?.id || 0) },
        body?.remark,
      ),
    };
  }

  @Post(':id/accept-topic')
  async acceptTopic(
    @Param('id') id: string,
    @CurrentAdmin() admin?: { id: number },
    @Body() body?: AdminReviewActionDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReportService.acceptTopicReport(
        Number(id),
        { id: Number(admin?.id || 0) },
        body?.remark,
      ),
    };
  }

  @Post(':id/accept-user')
  async acceptUser(
    @Param('id') id: string,
    @CurrentAdmin() admin?: { id: number },
    @Body() body?: AdminReviewActionDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReportService.acceptUserReport(
        Number(id),
        { id: Number(admin?.id || 0) },
        body?.remark,
      ),
    };
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @CurrentAdmin() admin?: { id: number },
    @Body() body?: AdminReviewActionDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReportService.reject(Number(id), { id: Number(admin?.id || 0) }, body?.remark),
    };
  }
}
