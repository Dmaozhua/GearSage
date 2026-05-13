import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CreateGearFeedbackDto } from './dto/create-gear-feedback.dto';
import { GearFeedbackService } from './gear-feedback.service';

@Controller('mini/gear/feedback')
@UseGuards(JwtAuthGuard)
export class GearFeedbackController {
  constructor(private readonly gearFeedbackService: GearFeedbackService) {}

  @Post()
  async create(@CurrentUser() user: { id: number }, @Body() body: CreateGearFeedbackDto) {
    return {
      code: 0,
      message: 'ok',
      data: await this.gearFeedbackService.create(Number(user.id), body),
    };
  }
}
