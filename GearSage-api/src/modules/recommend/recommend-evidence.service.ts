import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { SelectionEvidencePost, SelectionGearCandidate } from './recommend.types';

@Injectable()
export class RecommendEvidenceService {
  constructor(private readonly databaseService: DatabaseService) {}

  async loadEvidencePosts(candidate: SelectionGearCandidate): Promise<SelectionEvidencePost[]> {
    const gearItemId = this.normalizeText(candidate.gearItemId);
    const model = this.normalizeText(candidate.model || candidate.modelCn || candidate.gearLabel).toLowerCase();
    const label = this.normalizeText(candidate.gearLabel).toLowerCase();
    const brandName = this.normalizeText(candidate.brandName).toLowerCase();
    const likeModel = model ? `%${model}%` : '';
    const likeLabel = label ? `%${label}%` : '';
    const likeBrand = brandName ? `%${brandName}%` : '';

    if (!gearItemId && !likeModel && !likeLabel) {
      return [];
    }

    const result = await this.databaseService.query(
      `
      SELECT
        t.id,
        t.title,
        t.content,
        t."topicCategory",
        t.extra,
        u."nickName"
      FROM bz_mini_topic t
      LEFT JOIN bz_mini_user u ON u.id = t."userId"
      WHERE t.status = 2
        AND t."isDelete" = 0
        AND (
          ($1 <> '' AND (t.extra->>'gearItemId' = $1 OR t.extra->>'relatedGearItemId' = $1))
          OR ($2 <> '' AND LOWER(COALESCE(t.extra->>'gearModel', '')) LIKE $2)
          OR ($2 <> '' AND LOWER(COALESCE(t.extra->>'relatedGearModel', '')) LIKE $2)
          OR ($3 <> '' AND LOWER(t.title) LIKE $3)
          OR ($4 <> '' AND LOWER(t.title) LIKE $4)
        )
      ORDER BY
        CASE
          WHEN $1 <> '' AND (t.extra->>'gearItemId' = $1 OR t.extra->>'relatedGearItemId' = $1) THEN 0
          ELSE 1
        END,
        t."publishTime" DESC NULLS LAST,
        t.id DESC
      LIMIT 3
      `,
      [gearItemId, likeModel, likeLabel, likeBrand],
    );

    return result.rows.map((row: any) => ({
      topicId: Number(row.id),
      title: row.title || '',
      summary: this.truncate(row.content || '', 80),
      topicCategory: Number(row.topicCategory || 0),
      authorNickName: row.nickName || '',
      reason: this.resolveReason(row.extra, gearItemId),
    }));
  }

  private resolveReason(extra: any, gearItemId: string) {
    const source = extra && typeof extra === 'object' ? extra : {};
    if (
      gearItemId &&
      (this.normalizeText(source.gearItemId) === gearItemId ||
        this.normalizeText(source.relatedGearItemId) === gearItemId)
    ) {
      return '绑定同一装备';
    }
    return '型号或标题相关';
  }

  private truncate(value: string, maxLength: number) {
    const text = this.normalizeText(value);
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }

  private normalizeText(value: any) {
    return String(value ?? '').trim();
  }
}

