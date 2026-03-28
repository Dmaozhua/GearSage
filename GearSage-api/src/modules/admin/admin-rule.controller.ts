import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../../common/admin-jwt-auth.guard';
import { CurrentAdmin } from '../../common/current-admin.decorator';
import { AdminCreateRuleDto } from './dto/admin-create-rule.dto';
import { AdminRuleService } from './admin-rule.service';

@Controller('admin/rules')
@UseGuards(AdminJwtAuthGuard)
export class AdminRuleController {
  constructor(private readonly adminRuleService: AdminRuleService) {}

  @Get()
  async list() {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminRuleService.list(),
    };
  }

  @Post()
  async create(@Body() body: AdminCreateRuleDto, @CurrentAdmin() admin?: { id: number }) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminRuleService.create({ id: Number(admin?.id || 0) }, body),
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentAdmin() admin?: { id: number }) {
    return {
      code: 0,
      message: 'ok',
      data: await this.adminRuleService.remove({ id: Number(admin?.id || 0) }, Number(id)),
    };
  }
}
