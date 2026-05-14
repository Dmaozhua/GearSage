import { Injectable } from '@nestjs/common';
import { ROD_SELECTION_BRANCHES } from './config/rod-selection-rules';
import {
  SelectionBranchRule,
  SelectionBudgetFit,
  SelectionConfidence,
  SelectionGearCandidate,
  SelectionGearCard,
  SelectionInput,
} from './recommend.types';

@Injectable()
export class RecommendRuleService {
  getRodBranches() {
    return ROD_SELECTION_BRANCHES;
  }

  scoreCandidate(
    candidate: SelectionGearCandidate,
    rule: SelectionBranchRule,
    input: SelectionInput,
  ) {
    let score = 0;
    const reasons: string[] = [];

    if (this.matchesPower(candidate.power, input.power)) {
      score += rule.scoring.powerMatch;
      reasons.push(`匹配 ${String(input.power || '').toUpperCase()} 硬度`);
    }

    const budgetFit = this.resolveBudgetFit(candidate, input, rule);
    if (budgetFit === 'in_budget') {
      score += rule.scoring.budgetMatch;
      reasons.push('预算区间内可看');
    } else if (budgetFit === 'budget_down' || budgetFit === 'slightly_up') {
      score += Math.round(rule.scoring.budgetMatch * 0.7);
      reasons.push(budgetFit === 'budget_down' ? '更偏压预算' : '预算略上浮可看');
    } else if (!candidate.price) {
      score += Math.round(rule.scoring.budgetMatch * 0.35);
      reasons.push('价格数据不完整，需进详情确认');
    }

    const techniqueScore = this.scoreTextOverlap(
      input.technique || [],
      rule.preferredTechniques,
      rule.scoring.techniqueMatch,
    );
    if (techniqueScore > 0) {
      score += techniqueScore;
      reasons.push('玩法倾向与该路线接近');
    }

    const traitScore = this.scoreTextOverlap(
      [
        candidate.rawText,
        ...candidate.traits,
        ...(input.carePriorities || []),
        ...(input.targetFish || []),
        ...(input.useScene || []),
      ],
      rule.preferredTraits,
      rule.scoring.traitMatch,
    );
    if (traitScore > 0) {
      score += traitScore;
      reasons.push('资料标签与路线特征接近');
    }

    const contextScore = this.scoreContextMatch(candidate, input, 15);
    if (contextScore > 0) {
      score += contextScore;
      reasons.push('目标鱼或场景与装备资料语境接近');
    }

    const completenessScore = Math.round(rule.scoring.dataCompleteness * candidate.dataCompleteness);
    score += completenessScore;
    if (candidate.dataCompleteness >= 0.65) {
      reasons.push('装备库资料相对完整');
    }

    return {
      score,
      reasons: this.unique(reasons).slice(0, 4),
      budgetFit,
      confidence: this.resolveConfidence(score, candidate, budgetFit),
    };
  }

  buildGearCard(candidate: SelectionGearCandidate): SelectionGearCard {
    const detailUrlParams: SelectionGearCard['detailUrlParams'] = {
      id: candidate.gearItemId,
      type: 'rods',
    };
    if (candidate.variantKey) {
      detailUrlParams.variantKey = candidate.variantKey;
    }

    return {
      gearItemId: candidate.gearItemId,
      gearCategory: 'rod',
      gearLabel: candidate.gearLabel,
      brandName: candidate.brandName,
      model: candidate.model,
      variantKey: candidate.variantKey,
      variantLabel: candidate.variantLabel,
      priceText: candidate.priceText,
      detailUrlParams,
    };
  }

  resolveInputSummary(input: SelectionInput) {
    const parts = [
      this.labelRodType(input.rodType),
      input.power ? `${String(input.power).toUpperCase()} 硬度` : '',
      input.budgetMax ? `${input.budgetMax} 预算` : '',
      ...(input.targetFish || []),
      ...(input.useScene || []),
    ].filter(Boolean);

    return parts.join(' / ');
  }

  buildTopicDraftPayload(input: SelectionInput, candidates: SelectionGearCard[]) {
    const candidateOptions = candidates.slice(0, 3).map((candidate) => ({
      gearItemId: candidate.gearItemId,
      label: candidate.gearLabel,
      source: 'selection_guide',
      branchKey: '',
      variantKey: candidate.variantKey || '',
      variantLabel: candidate.variantLabel || '',
    }));

    return {
      topicCategory: 2,
      questionType: 'recommend',
      relatedGearCategory: 'rod',
      recommendMeta: {
        recommendIntent: 'compare_options',
        budgetRange: this.formatBudgetRange(input),
        budgetFlexible: input.budgetFlexible || '',
        targetFish: input.targetFish || [],
        useScene: input.useScene || [],
        carePriorities: input.carePriorities || [],
        avoidPoints: input.avoidPoints || [],
        candidateOptions,
        coreQuestion: '系统按我的预算和场景生成了几个方向，我主要纠结哪条路线更适合。',
        selectionSource: {
          source: 'selection_guide',
          inputSummary: this.resolveInputSummary(input),
        },
      },
    };
  }

  private scoreTextOverlap(sourceValues: string[], preferredValues: string[], maxScore: number) {
    const sourceText = sourceValues.map((item) => this.normalizeText(item)).join(' ');
    if (!sourceText) {
      return 0;
    }

    const matched = preferredValues.filter((value) => {
      const target = this.normalizeText(value);
      return target && sourceText.includes(target);
    });

    if (!matched.length) {
      return 0;
    }

    return Math.min(maxScore, Math.round((maxScore * matched.length) / 2));
  }

  private scoreContextMatch(candidate: SelectionGearCandidate, input: SelectionInput, maxScore: number) {
    const terms = this.resolveContextTerms(input);
    if (!terms.length || !candidate.rawText) {
      return 0;
    }

    const matched = terms.filter((term) => candidate.rawText.includes(term));
    if (!matched.length) {
      return 0;
    }

    return Math.min(maxScore, Math.round((maxScore * matched.length) / 3));
  }

  private resolveContextTerms(input: SelectionInput) {
    const source = [...(input.targetFish || []), ...(input.useScene || [])]
      .map((item) => this.normalizeText(item))
      .filter(Boolean);
    const terms = new Set<string>();
    const addTerms = (values: string[]) => {
      values.map((value) => this.normalizeText(value)).filter(Boolean).forEach((value) => terms.add(value));
    };

    source.forEach((value) => {
      if (['鲈鱼', 'largemouth_bass', 'bass'].includes(value)) {
        addTerms(['bass', 'black bass', '淡水']);
      } else if (['翘嘴', 'topmouth_culter'].includes(value)) {
        addTerms(['翘嘴', '远投', '淡水']);
      } else if (['鳜鱼', 'mandarin_fish'].includes(value)) {
        addTerms(['鳜鱼', '底', '结构', '淡水']);
      } else if (['黑鱼', 'snakehead'].includes(value)) {
        addTerms(['黑鱼', '雷强', '重障碍', 'cover']);
      } else if (['马口', 'stream_small_fish'].includes(value)) {
        addTerms(['马口', '溪流', 'stream', 'light']);
      } else if (['野河', 'wild_river', '城市河道', 'urban_river'].includes(value)) {
        addTerms(['野河', '河', 'river', '岸', '淡水']);
      } else if (['水库', 'reservoir'].includes(value)) {
        addTerms(['水库', 'reservoir', '远投', '淡水']);
      } else if (['溪流', 'stream'].includes(value)) {
        addTerms(['溪流', 'stream', 'light']);
      } else if (['管理场', 'managed_water'].includes(value)) {
        addTerms(['管理场', '黑坑', 'pond', '淡水']);
      } else {
        terms.add(value);
      }
    });

    return Array.from(terms);
  }

  private resolveBudgetFit(
    candidate: SelectionGearCandidate,
    input: SelectionInput,
    rule: SelectionBranchRule,
  ): SelectionBudgetFit {
    const price = candidate.price;
    const budgetMax = Number(input.budgetMax || 0);
    const budgetMin = Number(input.budgetMin || 0);

    if (!price || !budgetMax) {
      return 'unknown';
    }

    if (rule.budgetMode === 'down') {
      return price <= budgetMax * 0.85 ? 'budget_down' : price <= budgetMax ? 'in_budget' : 'unknown';
    }

    if (rule.budgetMode === 'up') {
      if (price > budgetMax && price <= budgetMax * 1.25) {
        return 'slightly_up';
      }
      return price <= budgetMax ? 'in_budget' : 'unknown';
    }

    if (price <= budgetMax && (!budgetMin || price >= budgetMin)) {
      return 'in_budget';
    }

    if (price > budgetMax && input.budgetFlexible === 'slightly_up' && price <= budgetMax * 1.15) {
      return 'slightly_up';
    }

    return price < budgetMin ? 'budget_down' : 'unknown';
  }

  private resolveConfidence(
    score: number,
    candidate: SelectionGearCandidate,
    budgetFit: SelectionBudgetFit,
  ): SelectionConfidence {
    if (score >= 75 && candidate.dataCompleteness >= 0.7 && budgetFit !== 'unknown') {
      return 'high';
    }
    if (score >= 50) {
      return 'medium';
    }
    return 'low';
  }

  private matchesPower(candidatePower: string, inputPower?: string) {
    const source = this.normalizeText(candidatePower).toUpperCase();
    const target = this.normalizeText(inputPower).toUpperCase();
    if (!target) {
      return true;
    }
    return !source || source === target || source.includes(target);
  }

  private labelRodType(value?: string) {
    const text = this.normalizeText(value);
    if (text === 'casting') return '枪柄';
    if (text === 'spinning') return '直柄';
    return text;
  }

  private formatBudgetRange(input: SelectionInput) {
    if (input.budgetMin && input.budgetMax) {
      return `${input.budgetMin}_${input.budgetMax}`;
    }
    return input.budgetMax ? `0_${input.budgetMax}` : '';
  }

  private unique(values: string[]) {
    return values.filter((value, index) => Boolean(value) && values.indexOf(value) === index);
  }

  private normalizeText(value: any) {
    return String(value ?? '').trim().toLowerCase();
  }
}
