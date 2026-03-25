import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/optional-jwt-auth.guard';
import { TagService } from './tag.service';

@Controller('mini/tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get('usable')
  @UseGuards(JwtAuthGuard)
  async usable(@CurrentUser() user: { id: number }) {
    return {
      code: 0,
      message: 'ok',
      data: await this.tagService.getUsableTags(Number(user.id)),
    };
  }

  @Get('used')
  @UseGuards(JwtAuthGuard)
  async used(@CurrentUser() user: { id: number }) {
    return {
      code: 0,
      message: 'ok',
      data: await this.tagService.getUsedTags(Number(user.id)),
    };
  }

  @Post('used')
  @UseGuards(JwtAuthGuard)
  async updateUsed(
    @CurrentUser() user: { id: number },
    @Body()
    body: {
      mainTagId?: string | null;
      equippedTagId?: string | null;
      tagId?: string | null;
      postTagMode?: string;
      customPostTags?: Record<string, any>;
      preferIdentityInReview?: boolean;
      preferFunInCatch?: boolean;
    },
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.tagService.updateUsedTags(Number(user.id), body),
    };
  }

  @Get('points')
  @UseGuards(OptionalJwtAuthGuard)
  async points() {
    return {
      code: 0,
      message: 'ok',
      data: await this.tagService.getPointsGoods(),
    };
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  async redeem(
    @CurrentUser() user: { id: number },
    @Body() body: { id?: string; tagId?: string; goodsId?: string },
  ) {
    await this.tagService.redeemTagByAnyId(
      Number(user.id),
      String(body.id || body.tagId || body.goodsId || ''),
    );
    return {
      code: 0,
      message: 'ok',
      data: true,
    };
  }
}
