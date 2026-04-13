import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { MediaUrlService } from '../../common/media-url.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ModerationService } from '../moderation/moderation.service';
import { TagService } from '../tag/tag.service';

@Injectable()
export class UserService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly mediaUrlService: MediaUrlService,
    private readonly moderationService: ModerationService,
    private readonly tagService: TagService,
  ) {}

  async getById(userId: number) {
    const result = await this.databaseService.query(
      `
      SELECT *
      FROM bz_mini_user
      WHERE id = $1
      LIMIT 1
      `,
      [userId],
    );

    if (!result.rows.length) {
      throw new NotFoundException('user not found');
    }

    const normalizedUserId = Number(result.rows[0].id || userId || 0);
    const [identityMap, recentTopics, recentAcceptedAnswers] = await Promise.all([
      this.getPublicIdentityMap([normalizedUserId]),
      this.getRecentTopics(normalizedUserId),
      this.getRecentAcceptedAnswers(normalizedUserId),
    ]);

    const identity =
      identityMap.get(normalizedUserId) || this.createEmptyPublicIdentity(normalizedUserId);

    return {
      ...this.mapUser(result.rows[0]),
      displayTag: identity.displayTag || null,
      topicCount: identity.topicCount,
      longReviewCount: identity.longReviewCount,
      recommendAnswerCount: identity.recommendAnswerCount,
      acceptedAnswerCount: identity.acceptedAnswerCount,
      recommendAnswerLikeCount: identity.recommendAnswerLikeCount,
      recommendPostCount: identity.recommendPostCount,
      recommendSolvedCount: identity.recommendSolvedCount,
      recommendFeedbackCount: identity.recommendFeedbackCount,
      likeReceivedCount: identity.likeReceivedCount,
      stats: identity.stats,
      authorStats: identity.authorStats,
      recentTopics,
      recentAcceptedAnswers,
    };
  }

  async update(userId: number, dto: UpdateUserDto) {
    const nickName = dto.nickName ?? dto.nickname;
    const avatarUrl = dto.avatarUrl ?? dto.avatar;
    const background = dto.background ?? dto.backgroundImage;

    if (nickName !== undefined && String(nickName || '').trim()) {
      const nickDecision = await this.moderationService.reviewText(
        'user_nickname',
        String(nickName),
        {
          userId,
          targetType: 'user',
          targetId: userId,
          extra: { field: 'nickName' },
        },
      );
      this.moderationService.assertProfileTextAllowed(nickDecision);
    }

    if (dto.bio !== undefined && String(dto.bio || '').trim()) {
      const bioDecision = await this.moderationService.reviewText(
        'user_bio',
        String(dto.bio),
        {
          userId,
          targetType: 'user',
          targetId: userId,
          extra: { field: 'bio' },
        },
      );
      this.moderationService.assertProfileTextAllowed(bioDecision);
    }

    const result = await this.databaseService.query(
      `
      UPDATE bz_mini_user
      SET
        "nickName" = COALESCE($2, "nickName"),
        "avatarUrl" = COALESCE($3, "avatarUrl"),
        bio = COALESCE($4, bio),
        background = COALESCE($5, background),
        "shipAddress" = COALESCE($6, "shipAddress"),
        "updateTime" = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [userId, nickName ?? null, avatarUrl ?? null, dto.bio ?? null, background ?? null, dto.shipAddress ?? null],
    );

    if (!result.rows.length) {
      throw new NotFoundException('user not found');
    }

    return this.mapUser(result.rows[0]);
  }

  async getPoints(userId: number) {
    const result = await this.databaseService.query(
      `
      SELECT points
      FROM bz_mini_user
      WHERE id = $1
      LIMIT 1
      `,
      [userId],
    );

    return result.rows.length ? Number(result.rows[0].points || 0) : 0;
  }

  async getPublicIdentityMap(userIds: number[]) {
    const normalizedIds = [...new Set((userIds || []).map((item) => Number(item || 0)).filter(Boolean))];
    const identityMap = new Map<number, any>();

    if (!normalizedIds.length) {
      return identityMap;
    }

    const [statsMap, displayTagMap] = await Promise.all([
      this.getPublicStatsMap(normalizedIds),
      this.getDisplayTagMap(normalizedIds),
    ]);

    normalizedIds.forEach((userId) => {
      const stats = statsMap.get(userId) || this.createEmptyStats();
      const displayTag = displayTagMap.get(userId) || null;
      identityMap.set(userId, {
        userId,
        displayTag,
        ...stats,
        stats: { ...stats },
        authorStats: this.buildAuthorStatsPayload(stats),
      });
    });

    return identityMap;
  }

  private mapUser(row: any) {
    const avatarUrl = this.mediaUrlService.normalizeUrl(row.avatarUrl);
    const background = this.mediaUrlService.normalizeUrl(row.background);
    return {
      id: Number(row.id),
      phone: row.phone || '',
      nickName: row.nickName || '',
      nickname: row.nickName || '',
      avatarUrl,
      avatar: avatarUrl,
      bio: row.bio || '',
      background,
      backgroundImage: background,
      shipAddress: row.shipAddress || '',
      status: Number(row.status || 0),
      points: Number(row.points || 0),
      level: Number(row.level || 1),
      inviteCode: row.inviteCode || '',
      invitedByUserId: row.invitedByUserId ? Number(row.invitedByUserId) : null,
      inviteSuccessCount: Number(row.inviteSuccessCount || 0),
      inviteRewardPoints: Number(row.inviteRewardPoints || 0),
      isAdmin: Boolean(row.isAdmin),
    };
  }

  private createEmptyStats() {
    return {
      topicCount: 0,
      longReviewCount: 0,
      recommendAnswerCount: 0,
      acceptedAnswerCount: 0,
      recommendAnswerLikeCount: 0,
      recommendPostCount: 0,
      recommendSolvedCount: 0,
      recommendFeedbackCount: 0,
      likeReceivedCount: 0,
    };
  }

  private createEmptyPublicIdentity(userId = 0) {
    const stats = this.createEmptyStats();
    return {
      userId,
      displayTag: null,
      ...stats,
      stats: { ...stats },
      authorStats: this.buildAuthorStatsPayload(stats),
    };
  }

  private buildAuthorStatsPayload(stats: Record<string, any>) {
    return {
      acceptedAnswerCount: Number(stats.acceptedAnswerCount || 0),
      recommendAnswerCount: Number(stats.recommendAnswerCount || 0),
      recommendAnswerLikeCount: Number(stats.recommendAnswerLikeCount || 0),
      longReviewCount: Number(stats.longReviewCount || 0),
      likeReceivedCount: Number(stats.likeReceivedCount || 0),
    };
  }

  private async getPublicStatsMap(userIds: number[]) {
    const normalizedIds = [...new Set((userIds || []).map((item) => Number(item || 0)).filter(Boolean))];
    const statsMap = new Map<number, Record<string, number>>();

    if (!normalizedIds.length) {
      return statsMap;
    }

    const result = await this.databaseService.query(
      `
      SELECT
        ids.user_id AS "userId",
        (
          SELECT COUNT(*)::int
          FROM bz_mini_topic t
          WHERE t."userId" = ids.user_id
            AND t.status = 2
            AND t."isDelete" = 0
        ) AS "topicCount",
        (
          SELECT COUNT(*)::int
          FROM bz_mini_topic t
          WHERE t."userId" = ids.user_id
            AND t.status = 2
            AND t."isDelete" = 0
            AND t."topicCategory" = 1
        ) AS "longReviewCount",
        (
          SELECT COUNT(*)::int
          FROM bz_topic_comment c
          JOIN bz_mini_topic t ON t.id = c."topicId"
          WHERE c."userId" = ids.user_id
            AND c."commentType" = 'recommend_answer'
            AND c."isVisible" = 1
            AND t.status = 2
            AND t."isDelete" = 0
        ) AS "recommendAnswerCount",
        (
          SELECT COUNT(*)::int
          FROM bz_topic_comment c
          JOIN bz_mini_topic t ON t.id = c."topicId"
          WHERE c."userId" = ids.user_id
            AND c."commentType" = 'recommend_answer'
            AND c."isVisible" = 1
            AND t.status = 2
            AND t."isDelete" = 0
            AND (t.extra->>'acceptedAnswerId') ~ '^[0-9]+$'
            AND (t.extra->>'acceptedAnswerId')::bigint = c.id
        ) AS "acceptedAnswerCount",
        (
          SELECT COUNT(*)::int
          FROM bz_topic_comment_like cl
          JOIN bz_topic_comment c ON c.id = cl."commentId"
          JOIN bz_mini_topic t ON t.id = c."topicId"
          WHERE c."userId" = ids.user_id
            AND c."commentType" = 'recommend_answer'
            AND c."isVisible" = 1
            AND t.status = 2
            AND t."isDelete" = 0
        ) AS "recommendAnswerLikeCount",
        (
          SELECT COUNT(*)::int
          FROM bz_mini_topic t
          WHERE t."userId" = ids.user_id
            AND t.status = 2
            AND t."isDelete" = 0
            AND t."topicCategory" = 2
            AND LOWER(COALESCE(t.extra->>'questionType', '')) = 'recommend'
        ) AS "recommendPostCount",
        (
          SELECT COUNT(*)::int
          FROM bz_mini_topic t
          WHERE t."userId" = ids.user_id
            AND t.status = 2
            AND t."isDelete" = 0
            AND t."topicCategory" = 2
            AND LOWER(COALESCE(t.extra->>'questionType', '')) = 'recommend'
            AND (t.extra->>'acceptedAnswerId') ~ '^[0-9]+$'
        ) AS "recommendSolvedCount",
        (
          SELECT COUNT(*)::int
          FROM bz_mini_topic t
          WHERE t."userId" = ids.user_id
            AND t.status = 2
            AND t."isDelete" = 0
            AND t."topicCategory" = 2
            AND LOWER(COALESCE(t.extra->>'questionType', '')) = 'recommend'
            AND (
              NULLIF(BTRIM(COALESCE(t.extra->>'feedbackText', '')), '') IS NOT NULL
              OR (
                t.extra ? 'finalProduct'
                AND jsonb_typeof(t.extra->'finalProduct') = 'object'
                AND t.extra->'finalProduct' <> '{}'::jsonb
              )
            )
        ) AS "recommendFeedbackCount",
        (
          COALESCE((
            SELECT COUNT(*)::int
            FROM bz_topic_like tl
            JOIN bz_mini_topic t ON t.id = tl."topicId"
            WHERE t."userId" = ids.user_id
              AND t.status = 2
              AND t."isDelete" = 0
          ), 0)
          +
          COALESCE((
            SELECT COUNT(*)::int
            FROM bz_topic_comment_like cl
            JOIN bz_topic_comment c ON c.id = cl."commentId"
            WHERE c."userId" = ids.user_id
              AND c."isVisible" = 1
          ), 0)
        ) AS "likeReceivedCount"
      FROM UNNEST($1::bigint[]) AS ids(user_id)
      `,
      [normalizedIds],
    );

    result.rows.forEach((row: any) => {
      statsMap.set(Number(row.userId || 0), {
        topicCount: Number(row.topicCount || 0),
        longReviewCount: Number(row.longReviewCount || 0),
        recommendAnswerCount: Number(row.recommendAnswerCount || 0),
        acceptedAnswerCount: Number(row.acceptedAnswerCount || 0),
        recommendAnswerLikeCount: Number(row.recommendAnswerLikeCount || 0),
        recommendPostCount: Number(row.recommendPostCount || 0),
        recommendSolvedCount: Number(row.recommendSolvedCount || 0),
        recommendFeedbackCount: Number(row.recommendFeedbackCount || 0),
        likeReceivedCount: Number(row.likeReceivedCount || 0),
      });
    });

    return statsMap;
  }

  private async getDisplayTagMap(userIds: number[]) {
    const normalizedIds = [...new Set((userIds || []).map((item) => Number(item || 0)).filter(Boolean))];
    const entries = await Promise.all(
      normalizedIds.map(async (userId) => {
        try {
          const usedTags = await this.tagService.getUsedTags(userId);
          const displayTag =
            usedTags && typeof usedTags === 'object'
              ? usedTags.mainTag || usedTags.equippedTag || null
              : null;
          return [userId, displayTag] as const;
        } catch (error) {
          console.warn('[user] load displayTag failed:', userId, error);
          return [userId, null] as const;
        }
      }),
    );

    return new Map<number, any>(entries);
  }

  private async getRecentTopics(userId: number) {
    const result = await this.databaseService.query(
      `
      SELECT
        t.id,
        t.title,
        t."topicCategory",
        t.images,
        t.extra,
        t."publishTime",
        t."createTime",
        t."likeCount",
        t."commentCount"
      FROM bz_mini_topic t
      WHERE t."userId" = $1
        AND t.status = 2
        AND t."isDelete" = 0
      ORDER BY t."publishTime" DESC NULLS LAST, t.id DESC
      LIMIT 3
      `,
      [userId],
    );

    return result.rows.map((row: any) => {
      const extra = row.extra && typeof row.extra === 'object' && !Array.isArray(row.extra) ? row.extra : {};
      return {
        id: Number(row.id || 0),
        title: row.title || '',
        topicCategory: Number(row.topicCategory || 0),
        questionType: extra.questionType || '',
        images: Array.isArray(row.images) ? row.images : [],
        publishTime: row.publishTime || row.createTime || '',
        createTime: row.createTime || '',
        likeCount: Number(row.likeCount || 0),
        commentCount: Number(row.commentCount || 0),
      };
    });
  }

  private async getRecentAcceptedAnswers(userId: number) {
    const result = await this.databaseService.query(
      `
      SELECT
        c.id AS "commentId",
        c."topicId",
        c.content,
        c."recommendAnswerMeta",
        c."createTime",
        t.title AS "topicTitle",
        t."publishTime",
        COALESCE(t.extra->>'acceptedAt', '') AS "acceptedAt"
      FROM bz_topic_comment c
      JOIN bz_mini_topic t ON t.id = c."topicId"
      WHERE c."userId" = $1
        AND c."commentType" = 'recommend_answer'
        AND c."isVisible" = 1
        AND t.status = 2
        AND t."isDelete" = 0
        AND (t.extra->>'acceptedAnswerId') ~ '^[0-9]+$'
        AND (t.extra->>'acceptedAnswerId')::bigint = c.id
      ORDER BY
        CASE
          WHEN COALESCE(t.extra->>'acceptedAt', '') <> ''
            THEN (t.extra->>'acceptedAt')::timestamptz
          ELSE t."updateTime"
        END DESC,
        c.id DESC
      LIMIT 3
      `,
      [userId],
    );

    return result.rows.map((row: any) => ({
      commentId: Number(row.commentId || 0),
      topicId: Number(row.topicId || 0),
      topicTitle: row.topicTitle || '',
      acceptedAt: row.acceptedAt || '',
      createTime: row.createTime || '',
      publishTime: row.publishTime || '',
      content: row.content || '',
      recommendAnswerMeta:
        row.recommendAnswerMeta &&
        typeof row.recommendAnswerMeta === 'object' &&
        !Array.isArray(row.recommendAnswerMeta)
          ? row.recommendAnswerMeta
          : {},
    }));
  }
}
