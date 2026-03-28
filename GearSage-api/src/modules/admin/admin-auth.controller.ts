import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../../common/admin-jwt-auth.guard';
import { CurrentAdmin } from '../../common/current-admin.decorator';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  async login(@Body() body: AdminLoginDto) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminAuthService.login(body),
    };
  }

  @Post('logout')
  @UseGuards(AdminJwtAuthGuard)
  async logout() {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminAuthService.logout(),
    };
  }

  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  async me(@CurrentAdmin() admin?: { id: number }) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminAuthService.getMe(Number(admin?.id || 0)),
    };
  }
}
