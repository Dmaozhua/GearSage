import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/optional-jwt-auth.guard';
import { AddCommentDto } from './dto/add-comment.dto';
import { CommentService } from './comment.service';
import { ToggleCommentLikeDto } from './dto/toggle-comment-like.dto';

@Controller('mini/comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async list(
    @Query('topicId') topicId?: string,
    @CurrentUser() user?: { id: number },
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.commentService.list(Number(topicId || 0), Number(user?.id || 0)),
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

  @Post('like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(
    @CurrentUser() user: { id: number },
    @Body() body: ToggleCommentLikeDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.commentService.toggleLike(Number(user.id), body),
    };
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async remove(
    @CurrentUser() user: { id: number; isAdmin?: boolean },
    @Query('commentId') commentId?: string,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.commentService.remove(Number(user.id), Number(commentId || 0), Boolean(user.isAdmin)),
    };
  }
}
