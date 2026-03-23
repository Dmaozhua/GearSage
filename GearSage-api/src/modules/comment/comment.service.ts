import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { AddCommentDto } from './dto/add-comment.dto';

@Injectable()
export class CommentService {
  constructor(private readonly databaseService: DatabaseService) {}

  async list(topicId: number) {
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
        u."avatarUrl" AS "userAvatarUrl"
      FROM bz_topic_comment c
      LEFT JOIN bz_mini_user u ON u.id = c."userId"
      WHERE c."topicId" = $1
        AND c."isVisible" = 1
      ORDER BY c."createTime" ASC, c.id ASC
      `,
      [topicId],
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
      likeCount: 0,
      isLiked: false,
      displayTag: null,
    }));
  }

  async add(userId: number, dto: AddCommentDto) {
    await this.databaseService.query(
      `
      INSERT INTO bz_topic_comment
      ("topicId", content, "replyCommentId", "replyUserId", "userId", "isVisible", "createTime", "updateTime")
      VALUES
      ($1, $2, $3, $4, $5, 1, NOW(), NOW())
      `,
      [
        dto.topicId,
        dto.content,
        dto.replayCommentId ?? null,
        dto.replayUserId ?? null,
        userId,
      ],
    );

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

    return true;
  }
}
