import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../../common/admin-jwt-auth.guard';
import { CurrentAdmin } from '../../common/current-admin.decorator';
import { AdminReviewActionDto } from './dto/admin-review-action.dto';
import { AdminGearFeedbackService } from './admin-gear-feedback.service';

@Controller('admin/gear-feedback')
@UseGuards(AdminJwtAuthGuard)
export class AdminGearFeedbackController {
  constructor(private readonly adminGearFeedbackService: AdminGearFeedbackService) {}

  @Get()
  async list(
    @Query('status') status?: string,
    @Query('gearType') gearType?: string,
    @Query('feedbackType') feedbackType?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminGearFeedbackService.list({ status, gearType, feedbackType, limit }),
    };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminGearFeedbackService.getDetail(Number(id)),
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
      data: await this.adminGearFeedbackService.handle(
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
      data: await this.adminGearFeedbackService.reject(
        Number(id),
        { id: Number(admin?.id || 0) },
        body?.remark,
      ),
    };
  }
}
