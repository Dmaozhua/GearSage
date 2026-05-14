import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { CreateSelectionDto } from './dto/create-selection.dto';
import { RecommendEvidenceService } from './recommend-evidence.service';
import { RecommendRuleService } from './recommend-rule.service';
import { RecommendSessionService } from './recommend-session.service';
import {
  SelectionBranch,
  SelectionBranchRule,
  SelectionGearCandidate,
  SelectionInput,
} from './recommend.types';

@Injectable()
export class RecommendService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly ruleService: RecommendRuleService,
    private readonly evidenceService: RecommendEvidenceService,
    private readonly sessionService: RecommendSessionService,
  ) {}

  async createSelection(dto: CreateSelectionDto, userId = 0) {
    const input = this.normalizeInput(dto);
    const missingFields = this.getMissingFields(input);
    const inputSummary = this.ruleService.resolveInputSummary(input);

    if (missingFields.length) {
      return this.attachSession(input, userId, {
        sessionId: null,
        inputSummary,
        missingFields,
        branches: [],
        emptyReason: `还缺少必要信息：${missingFields.join('、')}`,
        suggestedActions: ['补齐必要信息', '如果不确定玩法，可选择“不确定”'],
        topicDraftPayload: this.ruleService.buildTopicDraftPayload(input, []),
      });
    }

    if (input.gearCategory !== 'rod') {
      return this.attachSession(input, userId, {
        sessionId: null,
        inputSummary,
        missingFields: [],
        branches: [],
        emptyReason: '第一版选型向导先支持鱼竿，其他品类后续再扩展。',
        suggestedActions: ['先选择鱼竿', '直接发求推荐帖'],
        topicDraftPayload: this.ruleService.buildTopicDraftPayload(input, []),
      });
    }

    const candidates = await this.loadRodCandidates(input);
    if (!candidates.length) {
      return this.attachSession(input, userId, {
        sessionId: null,
        inputSummary,
        missingFields: [],
        branches: [],
        emptyReason: `当前装备库没有足够匹配 ${inputSummary || '这组需求'} 的装备数据。`,
        suggestedActions: ['放宽预算', '放宽硬度或柄型', '改成泛用路线', '直接发求推荐帖'],
        topicDraftPayload: this.ruleService.buildTopicDraftPayload(input, []),
      });
    }

    const branches = await this.buildBranches(input, candidates);
    const primaryCandidates = branches
      .map((branch) => branch.primaryGear)
      .filter(Boolean)
      .slice(0, 3) as NonNullable<SelectionBranch['primaryGear']>[];

    return this.attachSession(input, userId, {
      sessionId: null,
      inputSummary,
      missingFields: [],
      branches,
      nextActions: ['view_detail', 'compare', 'create_recommend_topic'],
      topicDraftPayload: this.ruleService.buildTopicDraftPayload(input, primaryCandidates),
    });
  }

  private async attachSession(
    input: SelectionInput,
    userId: number,
    response: Record<string, any>,
  ) {
    try {
      const resultForStorage = {
        ...response,
        sessionId: null,
      };
      const sessionId = await this.sessionService.createSelectionSession({
        userId,
        input,
        result: resultForStorage,
      });

      if (!sessionId) {
        return response;
      }

      return this.withSelectionSession(response, sessionId);
    } catch (error) {
      console.warn('[RecommendService] create selection session failed:', error);
      return response;
    }
  }

  private withSelectionSession(response: Record<string, any>, sessionId: string) {
    const topicDraftPayload =
      response.topicDraftPayload && typeof response.topicDraftPayload === 'object'
        ? response.topicDraftPayload
        : null;
    const recommendMeta =
      topicDraftPayload && topicDraftPayload.recommendMeta && typeof topicDraftPayload.recommendMeta === 'object'
        ? topicDraftPayload.recommendMeta
        : null;
    const selectionSource =
      recommendMeta && recommendMeta.selectionSource && typeof recommendMeta.selectionSource === 'object'
        ? recommendMeta.selectionSource
        : {};

    return {
      ...response,
      sessionId,
      topicDraftPayload: topicDraftPayload
        ? {
            ...topicDraftPayload,
            recommendMeta: recommendMeta
              ? {
                  ...recommendMeta,
                  selectionSource: {
                    ...selectionSource,
                    source: selectionSource.source || 'selection_guide',
                    selectionSessionId: sessionId,
                  },
                }
              : recommendMeta,
          }
        : topicDraftPayload,
    };
  }

  private async buildBranches(
    input: SelectionInput,
    candidates: SelectionGearCandidate[],
  ): Promise<SelectionBranch[]> {
    const usedGearIds = new Set<string>();
    const branches: SelectionBranch[] = [];

    for (const rule of this.ruleService.getRodBranches()) {
      const scored = candidates
        .map((candidate) => ({
          candidate,
          result: this.ruleService.scoreCandidate(candidate, rule, input),
        }))
        .sort((a, b) => b.result.score - a.result.score);

      const selected =
        scored.find((item) => !usedGearIds.has(item.candidate.gearItemId)) || scored[0] || null;
      if (!selected) {
        continue;
      }

      usedGearIds.add(selected.candidate.gearItemId);
      const alternativeGears = scored
        .filter((item) => item.candidate.gearItemId !== selected.candidate.gearItemId)
        .slice(0, 2)
        .map((item) => this.ruleService.buildGearCard(item.candidate));
      const evidencePosts = await this.evidenceService.loadEvidencePosts(selected.candidate);

      branches.push({
        branchKey: rule.branchKey,
        branchTitle: rule.branchTitle,
        branchSummary: rule.branchSummary,
        primaryGear: this.ruleService.buildGearCard(selected.candidate),
        alternativeGears,
        whyRecommended: selected.result.reasons.length
          ? selected.result.reasons
          : this.buildFallbackReasons(rule, selected.candidate),
        tradeOffs: rule.tradeOffs,
        budgetFit: selected.result.budgetFit,
        confidence: evidencePosts.length ? selected.result.confidence : this.downgradeConfidence(selected.result.confidence),
        evidencePosts,
        actions: {
          canViewDetail: true,
          canAddCompare: true,
          canCreateRecommendTopic: true,
        },
      });
    }

    const limit = Math.min(Math.max(Number(input.limit || 6), 1), 6);
    return branches.slice(0, limit);
  }

  private async loadRodCandidates(input: SelectionInput): Promise<SelectionGearCandidate[]> {
    const result = await this.databaseService.query(
      `
      SELECT
        gm.id,
        gm."brandId",
        gm."isShow",
        gm.model,
        gm."modelCn",
        gm."modelYear",
        gm.type,
        gm.action,
        gm."typeTips",
        gm.raw_json,
        gb.name AS "brandName",
        gv."variantId",
        gv.sku,
        gv.raw_json AS "variantRawJson"
      FROM gear_master gm
      LEFT JOIN gear_brands gb ON gb.id = gm."brandId"
      LEFT JOIN gear_variants gv
        ON gv.kind = gm.kind
       AND gv."gearId" = gm.id
      WHERE gm.kind = 'rod'
        AND COALESCE(gm."isShow", 1) <> 0
      ORDER BY gm.id ASC, gv."variantId" ASC
      `,
    );

    const candidates = result.rows
      .map((row: any) => this.mapRodCandidate(row))
      .filter((candidate: SelectionGearCandidate | null): candidate is SelectionGearCandidate => Boolean(candidate))
      .filter((candidate) => this.matchesRodInput(candidate, input));

    return this.dedupeCandidates(candidates).slice(0, 80);
  }

  private mapRodCandidate(row: any): SelectionGearCandidate | null {
    if (!row || this.normalizeVisibilityFlag(row.isShow) !== 1) {
      return null;
    }

    const raw = this.normalizeObject(row.raw_json);
    const variantRaw = this.normalizeObject(row.variantRawJson);
    const model = this.normalizeText(row.model || raw.model);
    const modelCn = this.normalizeText(row.modelCn || raw.model_cn);
    const brandName = this.normalizeText(row.brandName || raw.brand_name);
    const variantKey = this.normalizeText(row.variantId || variantRaw.variantId || variantRaw.SKU || variantRaw.sku);
    const variantLabel = this.normalizeText(row.sku || variantRaw.SKU || variantRaw.sku || variantKey);
    const gearLabel = [brandName, modelCn || model, variantLabel].filter(Boolean).join(' ');
    const priceInfo = this.extractPriceInfo(variantRaw, raw);
    const power = this.normalizeText(variantRaw.POWER || variantRaw.power || raw.POWER || raw.power);
    const rodType = this.normalizeText(variantRaw.TYPE || variantRaw.type || row.type || raw.type);
    const action = this.normalizeText(variantRaw.Action || variantRaw.action || row.action || raw.action);
    const typeTips = this.normalizeText(row.typeTips || raw.type_tips || raw.typeTips);
    const traits = this.normalizeStringList(raw.fit_style_tags || raw.fitStyleTags)
      .concat(this.normalizeStringList(variantRaw.fit_style_tags || variantRaw.fitStyleTags));
    const rawText = [
      model,
      modelCn,
      brandName,
      rodType,
      power,
      action,
      typeTips,
      JSON.stringify(raw),
      JSON.stringify(variantRaw),
    ].join(' ');

    return {
      gearItemId: this.normalizeText(row.id),
      gearCategory: 'rod',
      gearLabel: gearLabel || model || modelCn || '未命名鱼竿',
      brandName,
      model,
      modelCn,
      modelYear: this.normalizeText(row.modelYear || raw.model_year),
      rodType,
      power,
      action,
      typeTips,
      variantKey,
      variantLabel,
      price: priceInfo.value,
      priceText: priceInfo.text,
      traits,
      rawText: rawText.toLowerCase(),
      dataCompleteness: this.resolveCompleteness([model, brandName, rodType, power, action, variantLabel, priceInfo.value]),
    };
  }

  private matchesRodInput(candidate: SelectionGearCandidate, input: SelectionInput) {
    if (!candidate.gearItemId) {
      return false;
    }

    if (!this.matchesRodType(candidate.rodType, input.rodType)) {
      return false;
    }

    if (!this.matchesPower(candidate.power, input.power)) {
      return false;
    }

    if (!this.matchesFreshwaterContext(candidate, input)) {
      return false;
    }

    const budgetMax = Number(input.budgetMax || 0);
    if (candidate.price && budgetMax && candidate.price > budgetMax * 1.3) {
      return false;
    }

    return true;
  }

  private getMissingFields(input: SelectionInput) {
    const missing: string[] = [];
    if (!input.gearCategory) missing.push('gearCategory');
    if (!input.budgetMax) missing.push('budgetMax');
    if (!input.targetFish || !input.targetFish.length) missing.push('targetFish');
    if (!input.useScene || !input.useScene.length) missing.push('useScene');
    if (input.gearCategory === 'rod') {
      if (!input.rodType) missing.push('rodType');
      if (!input.power) missing.push('power');
    }
    return missing;
  }

  private normalizeInput(dto: CreateSelectionDto): SelectionInput {
    return {
      gearCategory: this.normalizeGearCategory(dto.gearCategory),
      rodType: this.normalizeText(dto.rodType),
      power: this.normalizeText(dto.power).toUpperCase(),
      budgetMin: this.normalizeNumber(dto.budgetMin),
      budgetMax: this.normalizeNumber(dto.budgetMax),
      budgetFlexible: this.normalizeText(dto.budgetFlexible),
      targetFish: this.normalizeStringList(dto.targetFish).slice(0, 3),
      useScene: this.normalizeStringList(dto.useScene).slice(0, 2),
      technique: this.normalizeStringList(dto.technique),
      carePriorities: this.normalizeStringList(dto.carePriorities).slice(0, 3),
      avoidPoints: this.normalizeStringList(dto.avoidPoints).slice(0, 3),
      brandPreference: this.normalizeStringList(dto.brandPreference),
      ownedGear: this.normalizeText(dto.ownedGear),
      source: this.normalizeText(dto.source),
      limit: dto.limit,
    };
  }

  private buildFallbackReasons(rule: SelectionBranchRule, candidate: SelectionGearCandidate) {
    return [
      `${candidate.gearLabel} 与 ${rule.branchTitle} 路线接近`,
      candidate.priceText ? `价格参考 ${candidate.priceText}` : '价格信息需进详情确认',
      candidate.variantLabel ? `可先查看 ${candidate.variantLabel} 子型号` : '当前为系列级推荐',
    ];
  }

  private downgradeConfidence(value: 'high' | 'medium' | 'low') {
    if (value === 'high') return 'medium';
    if (value === 'medium') return 'low';
    return value;
  }

  private dedupeCandidates(candidates: SelectionGearCandidate[]) {
    const seen = new Set<string>();
    return candidates.filter((candidate) => {
      const key = [candidate.gearItemId, candidate.variantKey || 'master'].join(':');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private matchesRodType(candidateType: string, inputType?: string) {
    const source = this.normalizeText(candidateType).toLowerCase();
    const target = this.normalizeText(inputType).toLowerCase();
    if (!target) {
      return true;
    }
    if (!source) {
      return true;
    }
    if (target === 'casting') {
      return source === 'c' || source === 'b' || ['casting', '枪', '枪柄', 'baitcasting'].some((item) => source.includes(item));
    }
    if (target === 'spinning') {
      return source === 's' || ['spinning', '直', '直柄'].some((item) => source.includes(item));
    }
    return source.includes(target);
  }

  private matchesPower(candidatePower: string, inputPower?: string) {
    const source = this.normalizeText(candidatePower).toUpperCase();
    const target = this.normalizeText(inputPower).toUpperCase();
    if (!target || !source) {
      return true;
    }
    return source === target || source.includes(target);
  }

  private matchesFreshwaterContext(candidate: SelectionGearCandidate, input: SelectionInput) {
    const targetText = [...(input.targetFish || []), ...(input.useScene || [])].join(' ');
    const wantsFreshwater = ['鲈鱼', '翘嘴', '鳜鱼', '黑鱼', '马口', '野河', '水库', '管理场', '溪流'].some((term) =>
      targetText.includes(term),
    );
    if (!wantsFreshwater) {
      return true;
    }

    const text = candidate.rawText;
    const saltwaterOnlyTerms = [
      '船钓',
      '海水',
      'saltwater',
      'offshore',
      'light jigging',
      'shore jigging',
      'metal sutte',
      'sephia',
      'rockfish',
      '鱿',
      '墨鱼',
    ];

    return !saltwaterOnlyTerms.some((term) => text.includes(term.toLowerCase()));
  }

  private extractPriceInfo(...sources: Record<string, any>[]) {
    const keys = ['price', 'marketPrice', 'Market Reference Price', '参考价', 'priceText'];
    for (const source of sources) {
      for (const key of keys) {
        const value = source[key];
        const numberValue = this.extractNumber(value);
        if (numberValue) {
          return {
            value: numberValue,
            text: this.formatPriceText(value, numberValue),
          };
        }
      }
    }
    return { value: null, text: '' };
  }

  private extractNumber(value: any) {
    const text = this.normalizeText(value);
    if (!text) return null;
    const match = text.match(/\d+(?:\.\d+)?/);
    if (!match) return null;
    const numberValue = Number(match[0]);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
  }

  private formatPriceText(rawValue: any, numberValue: number) {
    const text = this.normalizeText(rawValue);
    return text ? `约 ${text}` : `约 ${numberValue}`;
  }

  private resolveCompleteness(values: any[]) {
    const filled = values.filter((value) => {
      if (typeof value === 'number') return value > 0;
      return this.normalizeText(value) !== '';
    }).length;
    return Math.min(1, filled / values.length);
  }

  private normalizeGearCategory(value?: string) {
    const text = this.normalizeText(value).toLowerCase();
    if (text === 'rods') return 'rod';
    if (text === 'reels') return 'reel';
    if (text === 'lures') return 'lure';
    return text;
  }

  private normalizeVisibilityFlag(value: any) {
    const text = this.normalizeText(value);
    if (!text) {
      return 1;
    }
    return text === '0' ? 0 : 1;
  }

  private normalizeObject(value: any) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  private normalizeStringList(value: any) {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeText(item)).filter(Boolean);
    }
    return String(value)
      .split(',')
      .map((item) => this.normalizeText(item))
      .filter(Boolean);
  }

  private normalizeNumber(value: any) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
  }

  private normalizeText(value: any) {
    return String(value ?? '').trim();
  }
}
