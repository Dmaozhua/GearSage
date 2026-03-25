import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { TASK_SEEDS } from './task.seed';

type TaskRow = {
  id: string;
  type: number;
  action_type: string;
  name: string;
  task_feat_desc: string;
  points: number;
  target_count: number;
  sort: number;
};

type TaskRecordRow = {
  id: number;
  userId: number;
  taskFeatId: string;
  taskFeatName: string;
  points: number;
  received: boolean;
  taskFeatDesc: string;
  createTime: string;
};

@Injectable()
export class TaskService {
  private seedPromise: Promise<void> | null = null;

  constructor(private readonly databaseService: DatabaseService) {}

  async listCompleted(userId: number) {
    await this.ensureSeedData();
    const { rows } = await this.databaseService.query<TaskRecordRow & TaskRow>(
      `
        SELECT
          r.id,
          r."userId",
          r."taskFeatId",
          r."taskFeatName",
          r.points,
          r.received,
          r."taskFeatDesc",
          r."createTime",
          t.type,
          t.action_type,
          t.name,
          t.task_feat_desc,
          t.target_count,
          t.sort
        FROM bz_mini_task_feat_record r
        INNER JOIN bz_mini_task_feat t ON t.id = r."taskFeatId"
        WHERE r."userId" = $1
        ORDER BY t.sort ASC, r."createTime" DESC
      `,
      [userId],
    );

    const { start, end } = this.getDailyTaskRefreshWindow();

    return rows
      .filter((row) => {
        if (Number(row.type) !== 0) return true;
        const time = new Date(row.createTime).getTime();
        return time >= start.getTime() && time < end.getTime();
      })
      .map((row) => ({
        id: Number(row.id),
        taskId: String(row.taskFeatId || row.id),
        type: Number(row.type || 0),
        name: row.name || row.taskFeatName || '',
        taskFeatName: row.taskFeatName || row.name || '',
        taskFeatDesc: row.taskFeatDesc || row.task_feat_desc || '',
        points: Number(row.points || 0),
        received: Boolean(row.received),
        completed: true,
        progress: 100,
        currentCount: Number(row.target_count || 1),
        targetCount: Number(row.target_count || 1),
      }));
  }

  async listUnfinished(userId: number) {
    await this.ensureSeedData();
    const tasks = await this.getTasks();
    const records = await this.getTaskRecords(userId);
    const claimedTaskIds = this.buildClaimedTaskIdSet(records, tasks);

    const result = await Promise.all(
      tasks
        .filter((task) => !claimedTaskIds.has(String(task.id)))
        .map(async (task) => {
          const progress = await this.calculateTaskProgress(userId, task);
          return {
            id: String(task.id),
            taskId: String(task.id),
            type: Number(task.type || 0),
            name: task.name || '',
            taskFeatName: task.name || '',
            taskFeatDesc: task.task_feat_desc || '',
            points: Number(task.points || 0),
            currentCount: progress.currentCount,
            targetCount: progress.targetCount,
            progress: progress.progress,
            isCompleted: progress.completed,
          };
        }),
    );

    return result.sort((a, b) => {
      const typeDiff = Number(a.type || 0) - Number(b.type || 0);
      if (typeDiff !== 0) return typeDiff;
      return 0;
    });
  }

  async receive(userId: number, payload: { id?: string; recordId?: string }) {
    await this.ensureSeedData();
    const candidateIds = [payload.recordId, payload.id].filter(Boolean).map((item) => String(item));
    if (!candidateIds.length) {
      throw new BadRequestException('记录不存在');
    }

    return this.databaseService.withTransaction<boolean>(async (client) => {
      let record = null as TaskRecordRow | null;

      for (const recordId of candidateIds) {
        const recordResult = await client.query<TaskRecordRow>(
          `
            SELECT *
            FROM bz_mini_task_feat_record
            WHERE id = $1
              AND "userId" = $2
            LIMIT 1
          `,
          [Number(recordId) || 0, userId],
        );
        if (recordResult.rows.length) {
          record = recordResult.rows[0];
          break;
        }
      }

      if (!record) {
        for (const taskId of candidateIds) {
          const taskResult = await client.query<TaskRow>(
            `
              SELECT *
              FROM bz_mini_task_feat
              WHERE id = $1
              LIMIT 1
            `,
            [taskId],
          );
          const task = taskResult.rows[0];
          if (!task) continue;

          const progress = await this.calculateTaskProgress(userId, task);
          if (!progress.completed) {
            throw new BadRequestException('任务未达成，暂不可领取');
          }

          const existingRecordResult = await client.query<TaskRecordRow>(
            `
              SELECT *
              FROM bz_mini_task_feat_record
              WHERE "userId" = $1
                AND "taskFeatId" = $2
              ORDER BY "createTime" DESC
              LIMIT 1
            `,
            [userId, String(task.id)],
          );
          const existingRecord = existingRecordResult.rows[0] || null;
          if (existingRecord) {
            if (Number(task.type) !== 0 || this.isInCurrentDailyWindow(existingRecord.createTime)) {
              record = existingRecord;
              break;
            }
          }

          const insertedRecordResult = await client.query<TaskRecordRow>(
            `
              INSERT INTO bz_mini_task_feat_record
              (
                "userId",
                "taskFeatId",
                "taskFeatName",
                points,
                received,
                "taskFeatDesc",
                "createTime"
              )
              VALUES ($1, $2, $3, $4, FALSE, $5, NOW())
              RETURNING *
            `,
            [userId, String(task.id), task.name, Number(task.points || 0), task.task_feat_desc || ''],
          );
          record = insertedRecordResult.rows[0];
          break;
        }
      }

      if (!record) {
        throw new BadRequestException('记录不存在');
      }

      if (record.received) {
        return true;
      }

      await client.query(
        `
          UPDATE bz_mini_task_feat_record
          SET received = TRUE
          WHERE id = $1
        `,
        [Number(record.id)],
      );

      await client.query(
        `
          UPDATE bz_mini_user
          SET points = points + $2,
              "updateTime" = NOW()
          WHERE id = $1
        `,
        [userId, Number(record.points || 0)],
      );

      return true;
    });
  }

  private async ensureSeedData() {
    if (!this.seedPromise) {
      this.seedPromise = this.performSeedData().catch((error) => {
        this.seedPromise = null;
        throw error;
      });
    }
    await this.seedPromise;
  }

  private async performSeedData() {
    const countResult = await this.databaseService.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM bz_mini_task_feat`,
    );
    if (Number(countResult.rows[0]?.count || 0) > 0) {
      return;
    }

    for (const item of TASK_SEEDS) {
      await this.databaseService.query(
        `
          INSERT INTO bz_mini_task_feat
          (id, type, action_type, name, task_feat_desc, points, target_count, sort, "createTime", "updateTime")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
        `,
        [
          item.id,
          item.type,
          item.actionType,
          item.name,
          item.taskFeatDesc,
          item.points,
          item.targetCount,
          item.sort,
        ],
      );
    }
  }

  private async getTasks() {
    const { rows } = await this.databaseService.query<TaskRow>(
      `
        SELECT *
        FROM bz_mini_task_feat
        ORDER BY type ASC, sort ASC, id ASC
      `,
    );
    return rows;
  }

  private async getTaskRecords(userId: number) {
    const { rows } = await this.databaseService.query<TaskRecordRow>(
      `
        SELECT *
        FROM bz_mini_task_feat_record
        WHERE "userId" = $1
      `,
      [userId],
    );
    return rows;
  }

  private buildClaimedTaskIdSet(records: TaskRecordRow[], tasks: TaskRow[]) {
    const taskById = new Map(tasks.map((task) => [String(task.id), task]));
    const result = new Set<string>();
    records.forEach((record) => {
      const task = taskById.get(String(record.taskFeatId));
      if (!task) return;
      if (Number(task.type) === 0) {
        if (this.isInCurrentDailyWindow(record.createTime)) {
          result.add(String(record.taskFeatId));
        }
        return;
      }
      result.add(String(record.taskFeatId));
    });
    return result;
  }

  private async calculateTaskProgress(userId: number, task: TaskRow) {
    const actionType = String(task.action_type || '').trim().toLowerCase();
    const targetCount = Number(task.target_count || 1) || 1;

    if (actionType === 'daily_login') {
      return { currentCount: 1, targetCount, completed: true, progress: 100 };
    }

    if (actionType === 'edit_profile') {
      const profileResult = await this.databaseService.query<{
        nickName: string;
        avatarUrl: string;
        bio: string;
      }>(
        `
          SELECT "nickName", "avatarUrl", bio
          FROM bz_mini_user
          WHERE id = $1
          LIMIT 1
        `,
        [userId],
      );
      const user = profileResult.rows[0];
      const hasCustomNick =
        !!String(user?.nickName || '').trim() &&
        !/^钓友\d{4}$/.test(String(user?.nickName || '').trim());
      const hasBio = !!String(user?.bio || '').trim();
      const hasAvatar = !!String(user?.avatarUrl || '').trim();
      const currentCount = hasCustomNick || hasBio || hasAvatar ? 1 : 0;
      const completed = currentCount >= targetCount;
      return {
        currentCount,
        targetCount,
        completed,
        progress: completed ? 100 : 0,
      };
    }

    if (actionType === 'invite_master') {
      const inviteResult = await this.databaseService.query<{ inviteSuccessCount: number }>(
        `
          SELECT "inviteSuccessCount"
          FROM bz_mini_user
          WHERE id = $1
          LIMIT 1
        `,
        [userId],
      );
      const currentCount = Number(inviteResult.rows[0]?.inviteSuccessCount || 0);
      const completed = currentCount >= targetCount;
      return {
        currentCount,
        targetCount,
        completed,
        progress: Math.min(100, Math.floor((currentCount / targetCount) * 100)),
      };
    }

    const querySpec = this.resolveAggregateQuery(actionType, Number(task.type || 0));
    if (!querySpec) {
      return { currentCount: 0, targetCount, completed: false, progress: 0 };
    }

    const { rows } = await this.databaseService.query<{ count: string }>(
      querySpec.sql,
      querySpec.params(userId, this.getDailyTaskRefreshWindow()),
    );
    const currentCount = Number(rows[0]?.count || 0);
    const completed = currentCount >= targetCount;
    return {
      currentCount,
      targetCount,
      completed,
      progress: Math.min(100, Math.floor((currentCount / targetCount) * 100)),
    };
  }

  private resolveAggregateQuery(actionType: string, taskType: number) {
    const useDailyWindow = taskType === 0;
    const windowClause = useDailyWindow ? ` AND "createTime" >= $2 AND "createTime" < $3` : '';

    switch (actionType) {
      case 'post_interaction':
      case 'post_master':
        return {
          sql: `
            SELECT COUNT(*)::text AS count
            FROM bz_mini_topic
            WHERE "userId" = $1
              AND "isDelete" = 0
              ${windowClause}
          `,
          params: (userId: number, window: { start: Date; end: Date }) =>
            useDailyWindow ? [userId, window.start.toISOString(), window.end.toISOString()] : [userId],
        };
      case 'comment_interaction':
      case 'comment_master':
        return {
          sql: `
            SELECT COUNT(*)::text AS count
            FROM bz_topic_comment
            WHERE "userId" = $1
              AND "isVisible" = 1
              ${windowClause}
          `,
          params: (userId: number, window: { start: Date; end: Date }) =>
            useDailyWindow ? [userId, window.start.toISOString(), window.end.toISOString()] : [userId],
        };
      case 'like_interaction':
      case 'like_master':
        return {
          sql: `
            SELECT COUNT(*)::text AS count
            FROM bz_topic_like
            WHERE "userId" = $1
              ${windowClause}
          `,
          params: (userId: number, window: { start: Date; end: Date }) =>
            useDailyWindow ? [userId, window.start.toISOString(), window.end.toISOString()] : [userId],
        };
      default:
        return null;
    }
  }

  private getDailyTaskRefreshWindow() {
    const now = new Date();
    const current = new Date(now);
    const start = new Date(current);
    start.setHours(2, 0, 0, 0);
    if (current.getHours() < 2) {
      start.setDate(start.getDate() - 1);
    }
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  private isInCurrentDailyWindow(dateLike: string) {
    const { start, end } = this.getDailyTaskRefreshWindow();
    const value = new Date(dateLike).getTime();
    return value >= start.getTime() && value < end.getTime();
  }
}
