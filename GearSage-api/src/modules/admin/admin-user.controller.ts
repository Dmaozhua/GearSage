import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../../common/admin-jwt-auth.guard';
import { CurrentAdmin } from '../../common/current-admin.decorator';
import { AdminBanUserDto } from './dto/admin-ban-user.dto';
import { AdminUserService } from './admin-user.service';

@Controller('admin/users')
@UseGuards(AdminJwtAuthGuard)
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  async list(
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminUserService.list({ status, keyword, limit }),
    };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminUserService.getDetail(Number(id)),
    };
  }

  @Post(':id/ban')
  async ban(
    @Param('id') id: string,
    @CurrentAdmin() admin?: { id: number },
    @Body() body?: AdminBanUserDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminUserService.ban(Number(id), { id: Number(admin?.id || 0) }, body?.remark),
    };
  }

  @Post(':id/unban')
  async unban(
    @Param('id') id: string,
    @CurrentAdmin() admin?: { id: number },
    @Body() body?: AdminBanUserDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminUserService.unban(Number(id), { id: Number(admin?.id || 0) }, body?.remark),
    };
  }
}
