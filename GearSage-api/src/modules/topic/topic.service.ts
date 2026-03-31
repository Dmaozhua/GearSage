import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../common/database.service';
import { SaveTopicDto } from './dto/save-topic.dto';
import { PublishTopicDto } from './dto/publish-topic.dto';
import { ToggleTopicLikeDto } from './dto/toggle-topic-like.dto';
import { AcceptRecommendAnswerDto } from './dto/accept-recommend-answer.dto';
import { ModerationService } from '../moderation/moderation.service';
import { MessageService } from '../message/message.service';
import { UserService } from '../user/user.service';

@Injectable()
export class TopicService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly moderationService: ModerationService,
    private readonly configService: ConfigService,
    private readonly messageService: MessageService,
    private readonly userService: UserService,
  ) {}

  async getAllTopics(
    currentUserId = 0,
    filters: {
      limit?: string | number;
      topicCategory?: string;
      questionType?: string;
      gearCategory?: string;
      gearModel?: string;
      gearItemId?: string;
    } = {},
  ) {
    const result = await this.databaseService.query(
      `
      SELECT
        t.id,
        t."topicCategory",
        t.title,
        t.content,
        t.images,
        t.extra,
        t."rejectReason",
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
        u.level,
        CASE WHEN tul.id IS NULL THEN FALSE ELSE TRUE END AS "isLike"
      FROM bz_mini_topic t
      LEFT JOIN bz_mini_user u ON u.id = t."userId"
      LEFT JOIN bz_topic_like tul
        ON tul."topicId" = t.id
       AND tul."userId" = $1
      WHERE t.status = 2
        AND t."isDelete" = 0
      ORDER BY t."publishTime" DESC NULLS LAST, t.id DESC
      `,
      [currentUserId || 0],
    );

    const limit = this.normalizePositiveNumber(filters.limit, 12);
    return result.rows
      .map((row: any) => this.formatTopic(row))
      .filter((topic: any) => this.matchesTopicFilters(topic, filters))
      .slice(0, limit);
  }

  async getMyTopics(userId: number, currentUserId = 0, status?: number | null) {
    const params: Array<number> = [userId, currentUserId || 0];
    let whereClause = `
      WHERE t."userId" = $1
        AND t."isDelete" = 0
    `;

    if (status !== null && status !== undefined) {
      params.push(status);
      whereClause += ` AND t.status = $3`;
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
        t."rejectReason",
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
        u.level,
        CASE WHEN tul.id IS NULL THEN FALSE ELSE TRUE END AS "isLike"
      FROM bz_mini_topic t
      LEFT JOIN bz_mini_user u ON u.id = t."userId"
      LEFT JOIN bz_topic_like tul
        ON tul."topicId" = t.id
       AND tul."userId" = $2
      ${whereClause}
      ORDER BY t."updateTime" DESC, t.id DESC
      `,
      params,
    );

    return result.rows.map((row: any) => this.formatTopic(row));
  }

  async getTopicById(topicId: number, currentUserId = 0) {
    const result = await this.databaseService.query(
      `
      SELECT
        t.id,
        t."topicCategory",
        t.title,
        t.content,
        t.images,
        t.extra,
        t."rejectReason",
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
        u.level,
        CASE WHEN tul.id IS NULL THEN FALSE ELSE TRUE END AS "isLike"
      FROM bz_mini_topic t
      LEFT JOIN bz_mini_user u ON u.id = t."userId"
      LEFT JOIN bz_topic_like tul
        ON tul."topicId" = t.id
       AND tul."userId" = $2
      WHERE t.id = $1
      LIMIT 1
      `,
      [topicId, currentUserId || 0],
    );

    if (!result.rows.length) {
      return null;
    }

    const topic = this.formatTopic(result.rows[0]);

    if (Number(topic.isDelete || 0) === 1) {
      return null;
    }

    if (Number(topic.status || 0) !== 2 && Number(topic.userId || 0) !== Number(currentUserId || 0)) {
      return null;
    }

    const identityMap = await this.userService.getPublicIdentityMap([Number(topic.userId || 0)]);
    const identity = identityMap.get(Number(topic.userId || 0)) || null;

    return {
      ...topic,
      displayTag: identity ? identity.displayTag || null : topic.displayTag || null,
      authorStats: identity ? identity.authorStats || null : null,
    };
  }

  async getLatestDraftByUserId(userId: number, currentUserId = 0) {
    const result = await this.databaseService.query(
      `
      SELECT
        t.id,
        t."topicCategory",
        t.title,
        t.content,
        t.images,
        t.extra,
        t."rejectReason",
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
        u.level,
        CASE WHEN tul.id IS NULL THEN FALSE ELSE TRUE END AS "isLike"
      FROM bz_mini_topic t
      LEFT JOIN bz_mini_user u ON u.id = t."userId"
      LEFT JOIN bz_topic_like tul
        ON tul."topicId" = t.id
       AND tul."userId" = $2
      WHERE t."userId" = $1
        AND t.status = 0
        AND t."isDelete" = 0
      ORDER BY t."updateTime" DESC, t.id DESC
      LIMIT 1
      `,
      [userId, currentUserId || 0],
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

      await this.messageService.deleteByTopic(userId, Number(updateResult.rows[0].id || dto.id || 0), [
        'topic_rejected',
      ]);

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

    await this.moderationService.relinkPendingRecords({
      targetType: 'topic',
      fromTargetId: `${userId}:pending`,
      toTargetId: insertResult.rows[0].id,
      userId,
    });

    return insertResult.rows[0];
  }

  async publishTopic(userId: number, dto: PublishTopicDto) {
    const titleDecision = await this.moderationService.reviewText(
      'topic_title',
      dto.title,
      {
        userId,
        targetType: 'topic',
        targetId: dto.id ?? `${userId}:pending`,
        extra: { field: 'title', topicCategory: dto.topicCategory },
      },
    );
    const contentDecision = await this.moderationService.reviewText(
      'topic_content',
      dto.content,
      {
        userId,
        targetType: 'topic',
        targetId: dto.id ?? `${userId}:pending`,
        extra: { field: 'content', topicCategory: dto.topicCategory },
      },
    );
    const combinedDecision = this.moderationService.combineTextDecisions([
      titleDecision,
      contentDecision,
    ]);
    this.moderationService.assertTopicPublishAccepted(combinedDecision);

    const forceReview =
      combinedDecision.result === 'PASS' && this.isTopicManualReviewEnabled();
    const nextStatus =
      combinedDecision.result === 'REVIEW' || forceReview ? 1 : 2;
    const publishTimeSql = nextStatus === 2 ? 'NOW()' : 'NULL';

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
          status = $8,
          "rejectReason" = '',
          "userId" = $6,
          "publishTime" = ${publishTimeSql},
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
          nextStatus,
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
        "rejectReason",
        "userId",
        "publishTime",
        "createTime",
        "updateTime",
        "likeCount",
        "commentCount",
        "isDelete"
      )
      VALUES
      ($1, $2, $3, $4::jsonb, $5::jsonb, $7, '', $6, ${publishTimeSql}, NOW(), NOW(), 0, 0, 0)
      RETURNING *
      `,
      [
        dto.topicCategory,
        dto.title,
        dto.content,
        JSON.stringify(dto.images || []),
        JSON.stringify(dto.extra || {}),
        userId,
        nextStatus,
      ],
    );

    await this.moderationService.relinkPendingRecords({
      targetType: 'topic',
      fromTargetId: `${userId}:pending`,
      toTargetId: insertResult.rows[0].id,
      userId,
    });

    return insertResult.rows[0];
  }

  private isTopicManualReviewEnabled() {
    return String(
      this.configService.get<string>('MODERATION_TEXT_REVIEW_ENABLED') || 'false',
    )
      .trim()
      .toLowerCase() === 'true';
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
      SELECT id, "likeCount", status, title, "userId"
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

    if (Number(topicResult.rows[0].status || 0) !== 2) {
      throw new ForbiddenException('当前帖子未发布，暂不支持点赞');
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

    if (Number(topicResult.rows[0].userId || 0) !== Number(userId)) {
      await this.messageService.create({
        userId: Number(topicResult.rows[0].userId || 0),
        type: 'like_received',
        title: '有人点赞了你',
        content: `你的帖子《${topicResult.rows[0].title || '未命名帖子'}》收到了一个赞。`,
        targetType: 'topic',
        targetId: dto.topicId,
        extra: {
          topicId: Number(dto.topicId),
          topicTitle: topicResult.rows[0].title || '',
        },
      });
    }

    return {
      isLike: true,
      likeCount: updateTopic.rows[0].likeCount,
    };
  }

  async acceptRecommendAnswer(userId: number, dto: AcceptRecommendAnswerDto) {
    const topicResult = await this.databaseService.query(
      `
      SELECT id, title, status, "isDelete", "userId", extra
      FROM bz_mini_topic
      WHERE id = $1
      LIMIT 1
      `,
      [dto.topicId],
    );

    if (!topicResult.rows.length || Number(topicResult.rows[0].isDelete || 0) === 1) {
      throw new NotFoundException('topic not found');
    }

    const topicRow = topicResult.rows[0];
    if (Number(topicRow.status || 0) !== 2) {
      throw new ForbiddenException('当前帖子未发布，暂不支持采纳');
    }

    if (Number(topicRow.userId || 0) !== Number(userId)) {
      throw new ForbiddenException('只有楼主可以采纳主回答');
    }

    const topicExtra = this.normalizeTopicExtra(topicRow.extra);
    if (this.normalizeText(topicExtra.questionType) !== 'recommend') {
      throw new ForbiddenException('当前帖子不是求推荐帖，暂不支持采纳');
    }

    const acceptedAnswerId = Number(topicExtra.acceptedAnswerId || 0);
    if (acceptedAnswerId && acceptedAnswerId !== Number(dto.commentId)) {
      throw new ForbiddenException('当前帖子已采纳主回答，第一版暂不支持改采纳');
    }

    const commentResult = await this.databaseService.query(
      `
      SELECT id, "topicId", "userId", content, "commentType", "recommendAnswerMeta", "isVisible"
      FROM bz_topic_comment
      WHERE id = $1
      LIMIT 1
      `,
      [dto.commentId],
    );

    if (!commentResult.rows.length) {
      throw new NotFoundException('comment not found');
    }

    const commentRow = commentResult.rows[0];
    if (
      Number(commentRow.topicId || 0) !== Number(dto.topicId) ||
      Number(commentRow.isVisible || 0) !== 1
    ) {
      throw new NotFoundException('comment not found');
    }

    if (this.normalizeText(commentRow.commentType) !== 'recommend_answer') {
      throw new ForbiddenException('当前回答不是规范回答，暂不支持采纳');
    }

    if (acceptedAnswerId === Number(dto.commentId)) {
      return this.buildAcceptedAnswerResult(dto.topicId, topicExtra, commentRow);
    }

    const acceptedAt = new Date().toISOString();
    const nextExtra = {
      ...topicExtra,
      acceptedAnswerId: Number(dto.commentId),
      acceptedAt,
      acceptedByUserId: Number(userId),
      acceptStatus: 'accepted',
    };

    await this.databaseService.query(
      `
      UPDATE bz_mini_topic
      SET
        extra = $2::jsonb,
        "updateTime" = NOW()
      WHERE id = $1
      `,
      [dto.topicId, JSON.stringify(nextExtra)],
    );

    if (Number(commentRow.userId || 0) !== Number(userId)) {
      await this.messageService.create({
        userId: Number(commentRow.userId || 0),
        type: 'recommend_answer_accepted',
        title: '你的推荐被楼主采纳了',
        content: `你在《${topicRow.title || '未命名帖子'}》里的回答被楼主采纳。`,
        targetType: 'comment',
        targetId: Number(commentRow.id),
        extra: {
          topicId: Number(dto.topicId),
          topicTitle: topicRow.title || '',
          commentId: Number(commentRow.id),
        },
      });
    }

    return this.buildAcceptedAnswerResult(dto.topicId, nextExtra, commentRow);
  }

  private formatTopic(row: any) {
    const extra = this.normalizeTopicExtra(row.extra);

    return {
      id: Number(row.id),
      topicCategory: row.topicCategory,
      title: row.title,
      content: row.content,
      images: row.images,
      rejectReason: row.rejectReason || '',
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
      isLike: Boolean(row.isLike),
      displayTag: null,
      ...extra,
    };
  }

  private normalizeTopicExtra(value: any) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  private buildAcceptedAnswerResult(topicId: number, topicExtra: Record<string, any>, commentRow: any) {
    return {
      topicId: Number(topicId),
      acceptedAnswer: {
        id: Number(commentRow.id),
        userId: Number(commentRow.userId || 0),
        content: commentRow.content || '',
        commentType: commentRow.commentType || 'normal',
        recommendAnswerMeta:
          commentRow.recommendAnswerMeta &&
          typeof commentRow.recommendAnswerMeta === 'object' &&
          !Array.isArray(commentRow.recommendAnswerMeta)
            ? commentRow.recommendAnswerMeta
            : {},
      },
      topicStatus: {
        acceptedAnswerId: Number(topicExtra.acceptedAnswerId || 0),
        acceptedAt: topicExtra.acceptedAt || '',
        acceptedByUserId: Number(topicExtra.acceptedByUserId || 0),
        acceptStatus: this.normalizeText(topicExtra.acceptStatus) || 'none',
      },
    };
  }

  private matchesTopicFilters(
    topic: any,
    filters: {
      topicCategory?: string;
      questionType?: string;
      gearCategory?: string;
      gearModel?: string;
      gearItemId?: string;
    },
  ) {
    if (
      filters.topicCategory !== undefined &&
      filters.topicCategory !== null &&
      filters.topicCategory !== '' &&
      String(topic.topicCategory) !== String(filters.topicCategory)
    ) {
      return false;
    }

    if (
      filters.questionType !== undefined &&
      filters.questionType !== null &&
      filters.questionType !== '' &&
      this.normalizeText(topic.questionType) !== this.normalizeText(filters.questionType)
    ) {
      return false;
    }

    const gearCategory = this.normalizeText(filters.gearCategory);
    const gearModel = this.normalizeText(filters.gearModel).toLowerCase();
    const gearItemId = this.normalizeText(filters.gearItemId);

    if (!gearCategory && !gearModel && !gearItemId) {
      return true;
    }

    const matchesPair = (category: any, model: any, itemId: any) => {
      const normalizedCategory = this.normalizeText(category);
      const normalizedModel = this.normalizeText(model).toLowerCase();
      const normalizedItemId = this.normalizeText(itemId);

      if (gearCategory && normalizedCategory !== gearCategory) {
        return false;
      }

      if (gearItemId && normalizedItemId === gearItemId) {
        return true;
      }

      if (gearModel && normalizedModel === gearModel) {
        return true;
      }

      if (!gearItemId && !gearModel && gearCategory) {
        return true;
      }

      return false;
    };

    return (
      matchesPair(topic.gearCategory, topic.gearModel, topic.gearItemId) ||
      matchesPair(
        topic.relatedGearCategory,
        topic.relatedGearModel,
        topic.relatedGearItemId,
      )
    );
  }

  private normalizePositiveNumber(value: string | number | undefined, fallback: number) {
    const next = Number(value);
    return Number.isInteger(next) && next > 0 ? next : fallback;
  }

  private normalizeText(value: any) {
    return String(value ?? '').trim();
  }
}
