import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';

@Controller('mini/tag')
export class TagController {
  @Get('usable')
  @UseGuards(JwtAuthGuard)
  usable() {
    return {
      code: 0,
      message: 'ok',
      data: [],
    };
  }

  @Get('used')
  @UseGuards(JwtAuthGuard)
  used() {
    return {
      code: 0,
      message: 'ok',
      data: {
        mainTagId: null,
        mainTag: null,
        equippedTag: null,
        ownedTags: [],
        postTagMode: 'smart',
        customPostTags: {},
        previewByPostType: [],
      },
    };
  }

  @Post('used')
  @UseGuards(JwtAuthGuard)
  updateUsed() {
    return {
      code: 0,
      message: 'ok',
      data: true,
    };
  }
}
