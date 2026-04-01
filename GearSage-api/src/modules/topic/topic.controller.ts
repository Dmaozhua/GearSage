import {
  BadRequestException,
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
import { TopicService } from './topic.service';
import { SaveTopicDto } from './dto/save-topic.dto';
import { PublishTopicDto } from './dto/publish-topic.dto';
import { ToggleTopicLikeDto } from './dto/toggle-topic-like.dto';
import { AcceptRecommendAnswerDto } from './dto/accept-recommend-answer.dto';
import { SubmitRecommendFeedbackDto } from './dto/submit-recommend-feedback.dto';

@Controller('mini/topic')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Get('all')
  @UseGuards(OptionalJwtAuthGuard)
  async getAll(
    @Query('limit') limit?: string,
    @Query('topicCategory') topicCategory?: string,
    @Query('questionType') questionType?: string,
    @Query('gearCategory') gearCategory?: string,
    @Query('gearModel') gearModel?: string,
    @Query('gearItemId') gearItemId?: string,
    @CurrentUser() user?: { id: number },
  ) {
    const list = await this.topicService.getAllTopics(Number(user?.id || 0), {
      limit,
      topicCategory,
      questionType,
      gearCategory,
      gearModel,
      gearItemId,
    });

    return {
      code: 0,
      message: 'ok',
      data: list,
    };
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async getMine(
    @CurrentUser() user: { id: number },
    @Query('status') status?: string,
  ) {
    const normalizedStatus =
      typeof status === 'string' && status.trim() !== '' ? Number(status) : null;
    const list = await this.topicService.getMyTopics(
      Number(user.id),
      Number(user.id),
      Number.isInteger(normalizedStatus) ? normalizedStatus : null,
    );

    return {
      code: 0,
      message: 'ok',
      data: list,
    };
  }

  @Get('tmp')
  @UseGuards(JwtAuthGuard)
  async getLatestDraft(@CurrentUser() user: { id: number }) {
    const detail = await this.topicService.getLatestDraftByUserId(Number(user.id), Number(user.id));

    return {
      code: 0,
      message: 'ok',
      data: detail,
    };
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getDetail(
    @Query('topicId') topicId?: string,
    @CurrentUser() user?: { id: number },
  ) {
    if (!topicId) {
      throw new BadRequestException('topicId is required');
    }

    const id = Number(topicId);

    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('topicId is invalid');
    }

    const detail = await this.topicService.getTopicById(id, Number(user?.id || 0));

    if (!detail) {
      return {
        code: 404,
        message: 'topic not found',
        data: null,
      };
    }

    return {
      code: 0,
      message: 'ok',
      data: detail,
    };
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async saveDraft(@CurrentUser() user: { id: number }, @Body() body: SaveTopicDto) {
    const result = await this.topicService.saveTopicDraft(Number(user.id), body);

    if (!result) {
      return {
        code: 404,
        message: 'topic not found',
        data: null,
      };
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        id: Number(result.id),
        status: result.status,
      },
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async publish(
    @CurrentUser() user: { id: number },
    @Body() body: PublishTopicDto,
  ) {
    const result = await this.topicService.publishTopic(Number(user.id), body);

    if (!result) {
      return {
        code: 404,
        message: 'topic not found',
        data: null,
      };
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        id: Number(result.id),
        status: result.status,
        publishTime: result.publishTime,
      },
    };
  }

  @Post('like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(
    @CurrentUser() user: { id: number },
    @Body() body: ToggleTopicLikeDto,
  ) {
    const result = await this.topicService.toggleTopicLike(Number(user.id), body);

    if (!result) {
      return {
        code: 404,
        message: 'topic not found',
        data: null,
      };
    }

    return {
      code: 0,
      message: 'ok',
      data: result,
    };
  }

  @Post('recommend/accept')
  @UseGuards(JwtAuthGuard)
  async acceptRecommendAnswer(
    @CurrentUser() user: { id: number },
    @Body() body: AcceptRecommendAnswerDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.topicService.acceptRecommendAnswer(Number(user.id), body),
    };
  }

  @Post('recommend/feedback')
  @UseGuards(JwtAuthGuard)
  async submitRecommendFeedback(
    @CurrentUser() user: { id: number },
    @Body() body: SubmitRecommendFeedbackDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.topicService.submitRecommendFeedback(Number(user.id), body),
    };
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async remove(@CurrentUser() user: { id: number }, @Query('topicId') topicId?: string) {
    if (!topicId) {
      throw new BadRequestException('topicId is required');
    }

    const id = Number(topicId);

    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('topicId is invalid');
    }

    const result = await this.topicService.deleteTopic(Number(user.id), id);

    if (!result) {
      return {
        code: 404,
        message: 'topic not found',
        data: null,
      };
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        id: Number(result.id),
        isDelete: result.isDelete,
        updateTime: result.updateTime,
      },
    };
  }
}
