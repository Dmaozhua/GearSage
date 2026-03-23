import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { SaveTopicDto } from './dto/save-topic.dto';
import { PublishTopicDto } from './dto/publish-topic.dto';
import { ToggleTopicLikeDto } from './dto/toggle-topic-like.dto';

@Injectable()
export class TopicService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getAllTopics() {
    const result = await this.databaseService.query(
      `
      SELECT
        t.id,
        t."topicCategory",
        t.title,
        t.content,
        t.images,
        t.extra,
        t.status,
        t."userId",
        t."publishTime",
        t."createTime",
        t."updateTime",
        t."likeCount",
        t."commentCount",
        t."isDelete",
        u."nickName",
        u."avatarUrl",
        u.level
      FROM bz_mini_topic t
      LEFT JOIN bz_mini_user u ON u.id = t."userId"
      WHERE t.status = 2
        AND t."isDelete" = 0
      ORDER BY t."publishTime" DESC NULLS LAST, t.id DESC
      `
    );

    return result.rows.map((row: any) => this.formatTopic(row));
  }

  async getMyTopics(userId: number, status?: number | null) {
    const params: Array<number> = [userId];
    let whereClause = `
      WHERE t."userId" = $1
        AND t."isDelete" = 0
    `;

    if (status !== null && status !== undefined) {
      params.push(status);
      whereClause += ` AND t.status = $2`;
    }

    const result = await this.databaseService.query(
      `
      SELECT
        t.id,
        t."topicCategory",
        t.title,
        t.content,
        t.images,
        t.extra,
        t.status,
        t."userId",
        t."publishTime",
        t."createTime",
        t."updateTime",
        t."likeCount",
        t."commentCount",
        t."isDelete",
        u."nickName",
        u."avatarUrl",
        u.level
      FROM bz_mini_topic t
      LEFT JOIN bz_mini_user u ON u.id = t."userId"
      ${whereClause}
      ORDER BY t."updateTime" DESC, t.id DESC
      `,
      params,
    );

    return result.rows.map((row: any) => this.formatTopic(row));
  }

  async getTopicById(topicId: number) {
    const result = await this.databaseService.query(
      `
      SELECT
        t.id,
        t."topicCategory",
        t.title,
        t.content,
        t.images,
        t.extra,
        t.status,
        t."userId",
        t."publishTime",
        t."createTime",
        t."updateTime",
        t."likeCount",
        t."commentCount",
        t."isDelete",
        u."nickName",
        u."avatarUrl",
        u.level
      FROM bz_mini_topic t
      LEFT JOIN bz_mini_user u ON u.id = t."userId"
      WHERE t.id = $1
        AND t."isDelete" = 0
      LIMIT 1
      `,
      [topicId],
    );

    if (!result.rows.length) {
      return null;
    }

    return this.formatTopic(result.rows[0]);
  }

  async getLatestDraftByUserId(userId: number) {
    const result = await this.databaseService.query(
      `
      SELECT
        t.id,
        t."topicCategory",
        t.title,
        t.content,
        t.images,
        t.extra,
        t.status,
        t."userId",
        t."publishTime",
        t."createTime",
        t."updateTime",
        t."likeCount",
        t."commentCount",
        t."isDelete",
        u."nickName",
        u."avatarUrl",
        u.level
      FROM bz_mini_topic t
      LEFT JOIN bz_mini_user u ON u.id = t."userId"
      WHERE t."userId" = $1
        AND t.status = 0
        AND t."isDelete" = 0
      ORDER BY t."updateTime" DESC, t.id DESC
      LIMIT 1
      `,
      [userId],
    );

    if (!result.rows.length) {
      return null;
    }

    return this.formatTopic(result.rows[0]);
  }

  async saveTopicDraft(userId: number, dto: SaveTopicDto) {
    if (dto.id) {
      const updateResult = await this.databaseService.query(
        `
        UPDATE bz_mini_topic
        SET
          "topicCategory" = $1,
          title = $2,
          content = $3,
          images = $4::jsonb,
          extra = $5::jsonb,
          status = 0,
          "userId" = $6,
          "isDelete" = 0,
          "updateTime" = NOW()
        WHERE id = $7
          AND "userId" = $6
        RETURNING *
        `,
        [
          dto.topicCategory,
          dto.title,
          dto.content,
          JSON.stringify(dto.images || []),
          JSON.stringify(dto.extra || {}),
          userId,
          dto.id,
        ],
      );

      if (!updateResult.rows.length) {
        return null;
      }

      return updateResult.rows[0];
    }

    const insertResult = await this.databaseService.query(
      `
      INSERT INTO bz_mini_topic
      (
        "topicCategory",
        title,
        content,
        images,
        extra,
        status,
        "userId",
        "publishTime",
        "createTime",
        "updateTime",
        "likeCount",
        "commentCount",
        "isDelete"
      )
      VALUES
      ($1, $2, $3, $4::jsonb, $5::jsonb, 0, $6, NULL, NOW(), NOW(), 0, 0, 0)
      RETURNING *
      `,
      [
        dto.topicCategory,
        dto.title,
        dto.content,
        JSON.stringify(dto.images || []),
        JSON.stringify(dto.extra || {}),
        userId,
      ],
    );

    return insertResult.rows[0];
  }

  async publishTopic(userId: number, dto: PublishTopicDto) {
    if (dto.id) {
      const updateResult = await this.databaseService.query(
        `
        UPDATE bz_mini_topic
        SET
          "topicCategory" = $1,
          title = $2,
          content = $3,
          images = $4::jsonb,
          extra = $5::jsonb,
          status = 2,
          "userId" = $6,
          "publishTime" = NOW(),
          "isDelete" = 0,
          "updateTime" = NOW()
        WHERE id = $7
          AND "userId" = $6
        RETURNING *
        `,
        [
          dto.topicCategory,
          dto.title,
          dto.content,
          JSON.stringify(dto.images || []),
          JSON.stringify(dto.extra || {}),
          userId,
          dto.id,
        ],
      );

      if (!updateResult.rows.length) {
        return null;
      }

      return updateResult.rows[0];
    }

    const insertResult = await this.databaseService.query(
      `
      INSERT INTO bz_mini_topic
      (
        "topicCategory",
        title,
        content,
        images,
        extra,
        status,
        "userId",
        "publishTime",
        "createTime",
        "updateTime",
        "likeCount",
        "commentCount",
        "isDelete"
      )
      VALUES
      ($1, $2, $3, $4::jsonb, $5::jsonb, 2, $6, NOW(), NOW(), NOW(), 0, 0, 0)
      RETURNING *
      `,
      [
        dto.topicCategory,
        dto.title,
        dto.content,
        JSON.stringify(dto.images || []),
        JSON.stringify(dto.extra || {}),
        userId,
      ],
    );

    return insertResult.rows[0];
  }

  async deleteTopic(userId: number, topicId: number) {
    const result = await this.databaseService.query(
      `
      UPDATE bz_mini_topic
      SET
        "isDelete" = 1,
        "updateTime" = NOW()
      WHERE id = $1
        AND "userId" = $2
        AND "isDelete" = 0
      RETURNING id, "isDelete", "updateTime"
      `,
      [topicId, userId],
    );

    if (!result.rows.length) {
      return null;
    }

    return result.rows[0];
  }

  async toggleTopicLike(userId: number, dto: ToggleTopicLikeDto) {
    const topicResult = await this.databaseService.query(
      `
      SELECT id, "likeCount"
      FROM bz_mini_topic
      WHERE id = $1
        AND "isDelete" = 0
      LIMIT 1
      `,
      [dto.topicId],
    );

    if (!topicResult.rows.length) {
      return null;
    }

    const likedResult = await this.databaseService.query(
      `
      SELECT id
      FROM bz_topic_like
      WHERE "topicId" = $1
        AND "userId" = $2
      LIMIT 1
      `,
      [dto.topicId, userId],
    );

    if (likedResult.rows.length) {
      await this.databaseService.query(
        `
        DELETE FROM bz_topic_like
        WHERE "topicId" = $1
          AND "userId" = $2
        `,
        [dto.topicId, userId],
      );

      const updateTopic = await this.databaseService.query(
        `
        UPDATE bz_mini_topic
        SET
          "likeCount" = GREATEST("likeCount" - 1, 0),
          "updateTime" = NOW()
        WHERE id = $1
        RETURNING id, "likeCount"
        `,
        [dto.topicId],
      );

      return {
        isLike: false,
        likeCount: updateTopic.rows[0].likeCount,
      };
    }

    await this.databaseService.query(
      `
      INSERT INTO bz_topic_like ("topicId", "userId", "createTime")
      VALUES ($1, $2, NOW())
      `,
      [dto.topicId, userId],
    );

    const updateTopic = await this.databaseService.query(
      `
      UPDATE bz_mini_topic
      SET
        "likeCount" = "likeCount" + 1,
        "updateTime" = NOW()
      WHERE id = $1
      RETURNING id, "likeCount"
      `,
      [dto.topicId],
    );

    return {
      isLike: true,
      likeCount: updateTopic.rows[0].likeCount,
    };
  }

  private formatTopic(row: any) {
    const extra =
      row.extra && typeof row.extra === 'object' && !Array.isArray(row.extra)
        ? row.extra
        : {};

    return {
      id: Number(row.id),
      topicCategory: row.topicCategory,
      title: row.title,
      content: row.content,
      images: row.images,
      status: row.status,
      userId: Number(row.userId),
      publishTime: row.publishTime,
      createTime: row.createTime,
      updateTime: row.updateTime,
      likeCount: row.likeCount,
      commentCount: row.commentCount,
      isDelete: row.isDelete,
      nickName: row.nickName || '',
      avatarUrl: row.avatarUrl || '',
      level: row.level || 1,
      isLike: false,
      displayTag: null,
      ...extra,
    };
  }
}
