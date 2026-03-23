import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SendCodeDto } from './dto/send-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  async sendCode(@Body() body: SendCodeDto) {
    return {
      code: 0,
      message: 'ok',
      data: await this.authService.sendCode(body.phone),
    };
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return {
      code: 0,
      message: 'ok',
      data: await this.authService.login(body),
    };
  }

  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDto) {
    return {
      code: 0,
      message: 'ok',
      data: await this.authService.refresh(body.refreshToken),
    };
  }

  @Post('logout')
  async logout(@Body() body: RefreshTokenDto) {
    return {
      code: 0,
      message: 'ok',
      data: await this.authService.logout(body.refreshToken),
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user?: { id: number }) {
    return {
      code: 0,
      message: 'ok',
      data: await this.authService.getMe(Number(user?.id || 0)),
    };
  }
}
