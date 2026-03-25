import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { TaskService } from './task.service';

@Controller('mini/taskFeat')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@CurrentUser() user: { id: number }) {
    return {
      code: 0,
      message: 'ok',
      data: await this.taskService.listCompleted(Number(user.id)),
    };
  }

  @Get('unfinish')
  @UseGuards(JwtAuthGuard)
  async unfinish(@CurrentUser() user: { id: number }) {
    return {
      code: 0,
      message: 'ok',
      data: await this.taskService.listUnfinished(Number(user.id)),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async receive(
    @CurrentUser() user: { id: number },
    @Body() body: { id?: string; recordId?: string },
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.taskService.receive(Number(user.id), body),
    };
  }
}
