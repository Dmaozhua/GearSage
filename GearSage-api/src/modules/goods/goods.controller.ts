import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/optional-jwt-auth.guard';
import { TagService } from '../tag/tag.service';

@Controller('mini/goods')
export class GoodsController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async list(@Query('type') type?: string) {
    return {
      code: 0,
      message: 'ok',
      data: await this.tagService.getGoodsList(Number(type || 0)),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async redeem(
    @CurrentUser() user: { id: number },
    @Body() body: { goodsId?: string; id?: string },
  ) {
    await this.tagService.redeemTagByAnyId(
      Number(user.id),
      String(body.goodsId || body.id || ''),
    );
    return {
      code: 0,
      message: 'ok',
      data: true,
    };
  }
}
