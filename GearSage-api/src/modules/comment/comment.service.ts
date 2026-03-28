import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { AddCommentDto } from './dto/add-comment.dto';
import { ToggleCommentLikeDto } from './dto/toggle-comment-like.dto';
import { ModerationService } from '../moderation/moderation.service';

@Injectable()
export class CommentService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly moderationService: ModerationService,
  ) {}

  async list(topicId: number, currentUserId = 0) {
    const result = await this.databaseService.query(
      `
      SELECT
        c.id,
        c."topicId",
        c.content,
        c."replyCommentId" AS "replayCommentId",
        c."replyUserId" AS "replayUserId",
        c."userId",
        c."createTime",
        u."nickName" AS "userName",
        u."avatarUrl" AS "userAvatarUrl",
        COALESCE(cl."likeCount", 0) AS "likeCount",
        EXISTS (
          SELECT 1
          FROM bz_topic_comment_like cul
          WHERE cul."commentId" = c.id
            AND cul."userId" = $2
        ) AS "isLiked"
      FROM bz_topic_comment c
      LEFT JOIN bz_mini_user u ON u.id = c."userId"
      LEFT JOIN (
        SELECT "commentId", COUNT(*)::int AS "likeCount"
        FROM bz_topic_comment_like
        GROUP BY "commentId"
      ) cl ON cl."commentId" = c.id
      WHERE c."topicId" = $1
        AND c."isVisible" = 1
      ORDER BY c."createTime" ASC, c.id ASC
      `,
      [topicId, currentUserId || 0],
    );

    return result.rows.map((row: any) => ({
      id: Number(row.id),
      topicId: Number(row.topicId),
      userId: Number(row.userId),
      userName: row.userName || '匿名用户',
      userAvatarUrl: row.userAvatarUrl || '',
      content: row.content || '',
      createTime: row.createTime,
      replayCommentId: row.replayCommentId ? Number(row.replayCommentId) : null,
      replayUserId: row.replayUserId ? Number(row.replayUserId) : null,
      likeCount: Number(row.likeCount || 0),
      isLiked: Boolean(row.isLiked),
      displayTag: null,
    }));
  }

  async add(userId: number, dto: AddCommentDto) {
    const topicResult = await this.databaseService.query(
      `
      SELECT id, status, "isDelete"
      FROM bz_mini_topic
      WHERE id = $1
      LIMIT 1
      `,
      [dto.topicId],
    );

    if (!topicResult.rows.length || Number(topicResult.rows[0].isDelete || 0) === 1) {
      throw new NotFoundException('topic not found');
    }

    if (Number(topicResult.rows[0].status || 0) !== 2) {
      throw new ForbiddenException('当前帖子未发布，暂不支持评论');
    }

    const decision = await this.moderationService.reviewText(
      'comment_content',
      dto.content,
      {
        userId,
        targetType: 'comment',
        targetId: `${dto.topicId}:pending`,
        extra: {
          topicId: dto.topicId,
          replyCommentId: dto.replayCommentId ?? null,
          replyUserId: dto.replayUserId ?? null,
        },
      },
    );

    if (decision.result === 'REJECT') {
      throw new ForbiddenException('内容不符合社区规范，请修改后重试');
    }

    const status = decision.result === 'REVIEW' ? 0 : 2;
    const isVisible = status === 2 ? 1 : 0;

    const insertResult = await this.databaseService.query(
      `
      INSERT INTO bz_topic_comment
      ("topicId", content, "replyCommentId", "replyUserId", "userId", status, "isVisible", "createTime", "updateTime")
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id
      `,
      [
        dto.topicId,
        dto.content,
        dto.replayCommentId ?? null,
        dto.replayUserId ?? null,
        userId,
        status,
        isVisible,
      ],
    );

    await this.moderationService.relinkPendingRecords({
      targetType: 'comment',
      fromTargetId: `${dto.topicId}:pending`,
      toTargetId: insertResult.rows[0].id,
      userId,
    });

    if (status === 2) {
      await this.databaseService.query(
        `
        UPDATE bz_mini_topic
        SET
          "commentCount" = "commentCount" + 1,
          "updateTime" = NOW()
        WHERE id = $1
        `,
        [dto.topicId],
      );
    }

    return true;
  }

  async remove(userId: number, commentId: number, isAdmin = false) {
    if (!commentId) {
      throw new NotFoundException('comment not found');
    }

    const commentResult = await this.databaseService.query(
      `
      SELECT id, "topicId", "userId", "isVisible"
      FROM bz_topic_comment
      WHERE id = $1
      LIMIT 1
      `,
      [commentId],
    );

    if (!commentResult.rows.length || Number(commentResult.rows[0].isVisible || 0) !== 1) {
      throw new NotFoundException('comment not found');
    }

    const comment = commentResult.rows[0];
    if (!isAdmin && Number(comment.userId) !== Number(userId)) {
      throw new ForbiddenException('no permission to delete comment');
    }

    await this.databaseService.query(
      `
      UPDATE bz_topic_comment
      SET
        status = 9,
        "isVisible" = 0,
        "updateTime" = NOW()
      WHERE id = $1
      `,
      [commentId],
    );

    await this.databaseService.query(
      `
      UPDATE bz_mini_topic
      SET
        "commentCount" = GREATEST("commentCount" - 1, 0),
        "updateTime" = NOW()
      WHERE id = $1
      `,
      [comment.topicId],
    );

    return true;
  }

  async toggleLike(userId: number, dto: ToggleCommentLikeDto) {
    const commentResult = await this.databaseService.query(
      `
      SELECT id
      FROM bz_topic_comment
      WHERE id = $1
        AND "isVisible" = 1
      LIMIT 1
      `,
      [dto.commentId],
    );

    if (!commentResult.rows.length) {
      throw new NotFoundException('comment not found');
    }

    const insertResult = await this.databaseService.query(
      `
      INSERT INTO bz_topic_comment_like ("commentId", "userId", "createTime")
      VALUES ($1, $2, NOW())
      ON CONFLICT ("commentId", "userId") DO NOTHING
      RETURNING id
      `,
      [dto.commentId, userId],
    );

    if (!insertResult.rows.length) {
      await this.databaseService.query(
        `
        DELETE FROM bz_topic_comment_like
        WHERE "commentId" = $1
          AND "userId" = $2
        `,
        [dto.commentId, userId],
      );

      const countResult = await this.databaseService.query(
        `
        SELECT COUNT(*)::int AS count
        FROM bz_topic_comment_like
        WHERE "commentId" = $1
        `,
        [dto.commentId],
      );

      return {
        isLike: false,
        likeCount: Number(countResult.rows[0]?.count || 0),
      };
    }

    const countResult = await this.databaseService.query(
      `
      SELECT COUNT(*)::int AS count
      FROM bz_topic_comment_like
      WHERE "commentId" = $1
      `,
      [dto.commentId],
    );

    return {
      isLike: true,
      likeCount: Number(countResult.rows[0]?.count || 0),
    };
  }
}
