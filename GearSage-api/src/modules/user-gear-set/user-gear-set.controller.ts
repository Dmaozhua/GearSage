import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/optional-jwt-auth.guard';
import { CreateUserGearSetDto } from './dto/create-user-gear-set.dto';
import { ListUserGearSetDto } from './dto/list-user-gear-set.dto';
import { UpdateUserGearSetDto } from './dto/update-user-gear-set.dto';
import { UserGearSetService } from './user-gear-set.service';

@Controller('mini/user/gear-sets')
export class UserGearSetController {
  constructor(private readonly userGearSetService: UserGearSetService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async list(
    @CurrentUser() user: { id: number } | undefined,
    @Query() query: ListUserGearSetDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.userGearSetService.list(Number(user?.id || 0), query),
    };
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async detail(
    @CurrentUser() user: { id: number } | undefined,
    @Param('id') id: string,
  ) {
    const setId = Number(id || 0);
    if (!setId) {
      throw new BadRequestException('id is required');
    }

    return {
      code: 0,
      message: 'ok',
      data: await this.userGearSetService.detail(Number(user?.id || 0), setId),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: { id: number }, @Body() body: CreateUserGearSetDto) {
    return {
      code: 0,
      message: 'ok',
      data: await this.userGearSetService.create(Number(user.id), body),
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: { id: number },
    @Param('id') id: string,
    @Body() body: UpdateUserGearSetDto,
  ) {
    const setId = Number(id || 0);
    if (!setId) {
      throw new BadRequestException('id is required');
    }

    return {
      code: 0,
      message: 'ok',
      data: await this.userGearSetService.update(Number(user.id), setId, body),
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@CurrentUser() user: { id: number }, @Param('id') id: string) {
    const setId = Number(id || 0);
    if (!setId) {
      throw new BadRequestException('id is required');
    }

    return {
      code: 0,
      message: 'ok',
      data: await this.userGearSetService.remove(Number(user.id), setId),
    };
  }
}
