import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../../common/admin-jwt-auth.guard';
import { CurrentAdmin } from '../../common/current-admin.decorator';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { AdminGearUpdateRequestStatusDto } from './dto/admin-gear-update-request-status.dto';
import { CreateGearUpdateRequestDto } from './dto/create-gear-update-request.dto';
import { GearUpdateRequestService } from './gear-update-request.service';

@Controller()
export class GearUpdateRequestController {
  constructor(private readonly gearUpdateRequestService: GearUpdateRequestService) {}

  @Post('mini/gear/update-request')
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: { id: number }, @Body() body: CreateGearUpdateRequestDto) {
    return {
      code: 0,
      message: 'ok',
      data: await this.gearUpdateRequestService.create(Number(user.id), body),
    };
  }

  @Get('admin/gear-update-requests')
  @UseGuards(AdminJwtAuthGuard)
  async list(
    @Query('status') status?: string,
    @Query('gearType') gearType?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.gearUpdateRequestService.list({ status, gearType, limit }),
    };
  }

  @Get('admin/gear-update-requests/:id')
  @UseGuards(AdminJwtAuthGuard)
  async detail(@Param('id') id: string) {
    return {
      code: 0,
      message: 'ok',
      data: await this.gearUpdateRequestService.getDetail(Number(id)),
    };
  }

  @Post('admin/gear-update-requests/:id/status')
  @UseGuards(AdminJwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @CurrentAdmin() admin?: { id: number },
    @Body() body?: AdminGearUpdateRequestStatusDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.gearUpdateRequestService.updateStatus(
        Number(id),
        { id: Number(admin?.id || 0) },
        body || ({ status: 'pending' } as AdminGearUpdateRequestStatusDto),
      ),
    };
  }
}
