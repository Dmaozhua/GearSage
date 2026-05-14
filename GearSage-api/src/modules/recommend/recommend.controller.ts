import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { OptionalJwtAuthGuard } from '../../common/optional-jwt-auth.guard';
import { CreateSelectionDto } from './dto/create-selection.dto';
import { RecommendService } from './recommend.service';

@Controller('mini/recommend')
export class RecommendController {
  constructor(private readonly recommendService: RecommendService) {}

  @Post('selection')
  @UseGuards(OptionalJwtAuthGuard)
  async createSelection(@Body() body: CreateSelectionDto, @CurrentUser() user?: { id: number }) {
    return {
      code: 0,
      message: 'ok',
      data: await this.recommendService.createSelection(body, Number(user?.id || 0)),
    };
  }
}
