import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';

@Controller('mini/taskFeat')
export class TaskController {
  @Get()
  @UseGuards(JwtAuthGuard)
  list() {
    return {
      code: 0,
      message: 'ok',
      data: [],
    };
  }

  @Get('unfinish')
  @UseGuards(JwtAuthGuard)
  unfinish() {
    return {
      code: 0,
      message: 'ok',
      data: [],
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  receive() {
    return {
      code: 0,
      message: 'ok',
      data: true,
    };
  }
}
