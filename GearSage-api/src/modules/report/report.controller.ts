import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportService } from './report.service';

@Controller('mini/report')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  async create(@CurrentUser() user: { id: number }, @Body() body: CreateReportDto) {
    return {
      code: 0,
      message: 'ok',
      data: await this.reportService.create(Number(user.id), body),
    };
  }
}
