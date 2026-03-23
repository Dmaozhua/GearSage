import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { TopicService } from './topic.service';
import { SaveTopicDto } from './dto/save-topic.dto';
import { PublishTopicDto } from './dto/publish-topic.dto';
import { ToggleTopicLikeDto } from './dto/toggle-topic-like.dto';

@Controller('mini/topic')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Get('all')
  async getAll() {
    const list = await this.topicService.getAllTopics();

    return {
      code: 0,
      message: 'ok',
      data: list,
    };
  }

  @Get('mine')
  async getMine(@Query('userId') userId?: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const id = Number(userId);

    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('userId is invalid');
    }

    const list = await this.topicService.getMyTopics(id);

    return {
      code: 0,
      message: 'ok',
      data: list,
    };
  }

  @Get('tmp')
  async getLatestDraft(@Query('userId') userId?: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const id = Number(userId);

    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('userId is invalid');
    }

    const detail = await this.topicService.getLatestDraftByUserId(id);

    return {
      code: 0,
      message: 'ok',
      data: detail,
    };
  }

  @Get()
  async getDetail(@Query('topicId') topicId?: string) {
    if (!topicId) {
      throw new BadRequestException('topicId is required');
    }

    const id = Number(topicId);

    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('topicId is invalid');
    }

    const detail = await this.topicService.getTopicById(id);

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
  async saveDraft(@Body() body: SaveTopicDto) {
    const result = await this.topicService.saveTopicDraft(body);

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
  async publish(@Body() body: PublishTopicDto) {
    const result = await this.topicService.publishTopic(body);

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
  async toggleLike(@Body() body: ToggleTopicLikeDto) {
    const result = await this.topicService.toggleTopicLike(body);

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

  @Delete()
  async remove(@Query('topicId') topicId?: string) {
    if (!topicId) {
      throw new BadRequestException('topicId is required');
    }

    const id = Number(topicId);

    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('topicId is invalid');
    }

    const result = await this.topicService.deleteTopic(id);

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
