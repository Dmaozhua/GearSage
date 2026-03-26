import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ModerationService } from '../moderation/moderation.service';

@Injectable()
export class UserService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly moderationService: ModerationService,
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

    return this.mapUser(result.rows[0]);
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

  private mapUser(row: any) {
    return {
      id: Number(row.id),
      phone: row.phone || '',
      nickName: row.nickName || '',
      nickname: row.nickName || '',
      avatarUrl: row.avatarUrl || '',
      avatar: row.avatarUrl || '',
      bio: row.bio || '',
      background: row.background || '',
      backgroundImage: row.background || '',
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
}
