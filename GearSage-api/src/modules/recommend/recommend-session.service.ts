import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { SelectionInput } from './recommend.types';

@Injectable()
export class RecommendSessionService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createSelectionSession(params: {
    userId?: number;
    input: SelectionInput;
    result: Record<string, any>;
  }): Promise<string | null> {
    const input = params.input || ({} as SelectionInput);
    const result = params.result || {};
    const userId = Number(params.userId || 0) > 0 ? Number(params.userId) : null;

    const insertResult = await this.databaseService.query(
      `
      INSERT INTO gear_selection_sessions
      (
        user_id,
        gear_category,
        input_json,
        result_json,
        source,
        create_time,
        update_time
      )
      VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, NOW(), NOW())
      RETURNING id
      `,
      [
        userId,
        String(input.gearCategory || ''),
        JSON.stringify(input),
        JSON.stringify(result),
        String(input.source || ''),
      ],
    );

    return insertResult.rows[0] ? String(insertResult.rows[0].id) : null;
  }

  async markCreatedTopic(params: {
    sessionId?: string | number | null;
    topicId: string | number;
    userId?: number;
  }) {
    const sessionId = Number(params.sessionId || 0);
    const topicId = Number(params.topicId || 0);
    const userId = Number(params.userId || 0);

    if (!Number.isInteger(sessionId) || sessionId <= 0 || !Number.isInteger(topicId) || topicId <= 0) {
      return false;
    }

    const result = await this.databaseService.query(
      `
      UPDATE gear_selection_sessions
      SET
        created_topic_id = $2,
        update_time = NOW()
      WHERE id = $1
        AND ($3::bigint = 0 OR user_id IS NULL OR user_id = $3::bigint)
      RETURNING id
      `,
      [sessionId, topicId, userId],
    );

    return result.rows.length > 0;
  }
}
