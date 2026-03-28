import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { ReadMessageDto } from './dto/read-message.dto';
import { MessageService } from './message.service';

@Controller('mini/message')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  async list(
    @CurrentUser() user: { id: number },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('onlyUnread') onlyUnread?: string,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.messageService.list(Number(user.id), {
        page,
        limit,
        type,
        onlyUnread,
      }),
    };
  }

  @Post('read')
  async read(
    @CurrentUser() user: { id: number },
    @Body() body: ReadMessageDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.messageService.markRead(Number(user.id), body.messageId),
    };
  }

  @Post('read-all')
  async readAll(@CurrentUser() user: { id: number }) {
    return {
      code: 0,
      message: 'ok',
      data: await this.messageService.markAllRead(Number(user.id)),
    };
  }
}
