import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { GearService } from './gear.service';

@Controller('mini/gear')
export class GearController {
  constructor(private readonly gearService: GearService) {}

  @Get('brands')
  async getBrands(@Query('type') type?: string) {
    return {
      code: 0,
      message: 'ok',
      data: await this.gearService.getBrands(type),
    };
  }

  @Get('list')
  async getList(@Query() query: Record<string, string>) {
    return {
      code: 0,
      message: 'ok',
      data: await this.gearService.getList(query),
    };
  }

  @Get('detail')
  async getDetail(
    @Query('id') id?: string,
    @Query('type') type?: string,
    @Query('gearModel') gearModel?: string,
  ) {
    if (!id && !gearModel) {
      throw new BadRequestException('id or gearModel is required');
    }

    const detail = await this.gearService.getDetail({ id, type, gearModel });
    if (!detail) {
      return {
        code: 404,
        message: 'gear not found',
        data: null,
      };
    }

    return {
      code: 0,
      message: 'ok',
      data: detail,
    };
  }
}
