import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../common/database.service';

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get('health')
  getHealth() {
    return {
      code: 0,
      message: 'ok',
      data: {
        service: this.configService.get('APP_NAME') || 'gearsage-api',
        status: 'running',
        timestamp: Date.now(),
      },
    };
  }

  @Get('health/db')
  async getDbHealth() {
    const dbInfo = await this.databaseService.ping();

    return {
      code: 0,
      message: 'ok',
      data: {
        service: this.configService.get('APP_NAME') || 'gearsage-api',
        status: 'running',
        database: dbInfo,
        timestamp: Date.now(),
      },
    };
  }
}
