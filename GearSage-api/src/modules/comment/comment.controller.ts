import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { AddCommentDto } from './dto/add-comment.dto';
import { CommentService } from './comment.service';

@Controller('mini/comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  async list(@Query('topicId') topicId?: string) {
    return {
      code: 0,
      message: 'ok',
      data: await this.commentService.list(Number(topicId || 0)),
    };
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async add(
    @CurrentUser() user: { id: number },
    @Body() body: AddCommentDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.commentService.add(Number(user.id), body),
    };
  }
}
