import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import { Pool } from 'pg';
import { join } from 'path';

@Injectable()
export class DatabaseService implements OnModuleDestroy, OnModuleInit {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }

    this.pool = new Pool({
      connectionString,
      max: 10,
    });
  }

  async ping() {
    const result = await this.pool.query(
      'select now() as now, current_database() as database, current_user as "user"'
    );
    return result.rows[0];
  }

  async query<T = any>(text: string, params: any[] = []) {
    return this.pool.query(text, params);
  }

  async onModuleInit() {
    const initSqlPath = join(process.cwd(), 'sql', 'init_core_tables.sql');

    try {
      const sql = await readFile(initSqlPath, 'utf8');
      await this.pool.query(sql);
    } catch (error) {
      console.error('[DatabaseService] Failed to initialize schema:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
