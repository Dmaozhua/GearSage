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
import { CreateUserGearDto } from './dto/create-user-gear.dto';
import { ListUserGearDto } from './dto/list-user-gear.dto';
import { UpdateUserGearDto } from './dto/update-user-gear.dto';
import { UserGearService } from './user-gear.service';

@Controller('mini/user/gear')
export class UserGearController {
  constructor(private readonly userGearService: UserGearService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async list(
    @CurrentUser() user: { id: number } | undefined,
    @Query() query: ListUserGearDto,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.userGearService.list(Number(user?.id || 0), query),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: { id: number }, @Body() body: CreateUserGearDto) {
    return {
      code: 0,
      message: 'ok',
      data: await this.userGearService.create(Number(user.id), body),
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: { id: number },
    @Param('id') id: string,
    @Body() body: UpdateUserGearDto,
  ) {
    const itemId = Number(id || 0);
    if (!itemId) {
      throw new BadRequestException('id is required');
    }

    return {
      code: 0,
      message: 'ok',
      data: await this.userGearService.update(Number(user.id), itemId, body),
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@CurrentUser() user: { id: number }, @Param('id') id: string) {
    const itemId = Number(id || 0);
    if (!itemId) {
      throw new BadRequestException('id is required');
    }

    return {
      code: 0,
      message: 'ok',
      data: await this.userGearService.remove(Number(user.id), itemId),
    };
  }
}
