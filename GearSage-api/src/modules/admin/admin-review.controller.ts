import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../../common/admin-jwt-auth.guard';
import { CurrentAdmin } from '../../common/current-admin.decorator';
import { AdminReviewService } from './admin-review.service';
import { AdminReviewActionDto } from './dto/admin-review-action.dto';

@Controller('admin/review')
@UseGuards(AdminJwtAuthGuard)
export class AdminReviewController {
  constructor(private readonly adminReviewService: AdminReviewService) {}

  @Get('topics')
  async listTopics(
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReviewService.listTopics({ status, keyword, limit }),
    };
  }

  @Get('topics/:id')
  async getTopicDetail(@Param('id') id: string) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReviewService.getTopicDetail(Number(id)),
    };
  }

  @Post('topics/:id/pass')
  async passTopic(
    @Param('id') id: string,
    @CurrentAdmin() admin?: { id: number },
    @Body() body?: AdminReviewActionDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReviewService.passTopic(Number(id), { id: Number(admin?.id || 0) }, body?.remark),
    };
  }

  @Post('topics/:id/reject')
  async rejectTopic(
    @Param('id') id: string,
    @CurrentAdmin() admin?: { id: number },
    @Body() body?: AdminReviewActionDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReviewService.rejectTopic(Number(id), { id: Number(admin?.id || 0) }, body?.remark),
    };
  }

  @Post('topics/:id/remove')
  async removeTopic(
    @Param('id') id: string,
    @CurrentAdmin() admin?: { id: number },
    @Body() body?: AdminReviewActionDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReviewService.removeTopic(Number(id), { id: Number(admin?.id || 0) }, body?.remark),
    };
  }

  @Post('topics/:id/restore')
  async restoreTopic(
    @Param('id') id: string,
    @CurrentAdmin() admin?: { id: number },
    @Body() body?: AdminReviewActionDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReviewService.restoreTopic(Number(id), { id: Number(admin?.id || 0) }, body?.remark),
    };
  }

  @Get('comments')
  async listComments(
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReviewService.listComments({ status, keyword, limit }),
    };
  }

  @Get('comments/:id')
  async getCommentDetail(@Param('id') id: string) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReviewService.getCommentDetail(Number(id)),
    };
  }

  @Post('comments/:id/pass')
  async passComment(
    @Param('id') id: string,
    @CurrentAdmin() admin?: { id: number },
    @Body() body?: AdminReviewActionDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReviewService.passComment(Number(id), { id: Number(admin?.id || 0) }, body?.remark),
    };
  }

  @Post('comments/:id/reject')
  async rejectComment(
    @Param('id') id: string,
    @CurrentAdmin() admin?: { id: number },
    @Body() body?: AdminReviewActionDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReviewService.rejectComment(Number(id), { id: Number(admin?.id || 0) }, body?.remark),
    };
  }

  @Post('comments/:id/remove')
  async removeComment(
    @Param('id') id: string,
    @CurrentAdmin() admin?: { id: number },
    @Body() body?: AdminReviewActionDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminReviewService.removeComment(Number(id), { id: Number(admin?.id || 0) }, body?.remark),
    };
  }
}
