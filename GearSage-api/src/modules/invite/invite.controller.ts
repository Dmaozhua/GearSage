import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { UserService } from '../user/user.service';

@Controller('mini/invite')
export class InviteController {
  constructor(private readonly userService: UserService) {}

  @Post('bind')
  @UseGuards(JwtAuthGuard)
  bind() {
    return {
      code: 0,
      message: 'ok',
      data: {
        bound: false,
        reason: 'not_implemented',
      },
    };
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  async summary(@CurrentUser() user: { id: number }) {
    const currentUser = await this.userService.getById(Number(user.id));
    return {
      code: 0,
      message: 'ok',
      data: {
        inviteCode: currentUser.inviteCode || '',
        invitedByUserId: currentUser.invitedByUserId,
        inviteSuccessCount: currentUser.inviteSuccessCount || 0,
        inviteRewardPoints: currentUser.inviteRewardPoints || 0,
        inviteRewardCount: 0,
        inviterDailyRewardLimit: 0,
        inviterRewardPoints: 0,
        inviteeRewardPoints: 0,
        recentInvites: [],
      },
    };
  }
}
