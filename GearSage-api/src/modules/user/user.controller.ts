import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/optional-jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('mini/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('info')
  @UseGuards(OptionalJwtAuthGuard)
  async info(
    @CurrentUser() user: { id: number } | undefined,
    @Query('id') id?: string,
    @Query('userId') userId?: string,
  ) {
    const value = Number(id || userId);
    if (!value) {
      throw new BadRequestException('id is required');
    }

    return {
      code: 0,
      message: 'ok',
      data: await this.userService.getById(value, Number(user?.id || 0)),
    };
  }

  @Post('update')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: { id: number },
    @Body() body: UpdateUserDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.userService.update(Number(user.id), body),
    };
  }

  @Get('points')
  @UseGuards(JwtAuthGuard)
  async points(@CurrentUser() user: { id: number }) {
    return {
      code: 0,
      message: 'ok',
      data: await this.userService.getPoints(Number(user.id)),
    };
  }
}
