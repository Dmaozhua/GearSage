export type SelectionGearCategory = 'rod' | 'reel' | 'lure';

export type SelectionConfidence = 'high' | 'medium' | 'low';

export type SelectionBudgetFit = 'in_budget' | 'slightly_up' | 'budget_down' | 'unknown';

export interface SelectionInput {
  gearCategory: SelectionGearCategory | string;
  rodType?: string;
  power?: string;
  budgetMin?: number;
  budgetMax?: number;
  budgetFlexible?: string;
  targetFish?: string[];
  useScene?: string[];
  technique?: string[];
  carePriorities?: string[];
  avoidPoints?: string[];
  brandPreference?: string[];
  ownedGear?: string;
  source?: string;
  limit?: number;
}

export interface SelectionBranchRule {
  branchKey: string;
  branchTitle: string;
  branchSummary: string;
  preferredTechniques: string[];
  preferredTraits: string[];
  budgetMode: 'normal' | 'down' | 'up';
  scoring: {
    techniqueMatch: number;
    powerMatch: number;
    budgetMatch: number;
    traitMatch: number;
    dataCompleteness: number;
  };
  tradeOffs: string[];
}

export interface SelectionGearCandidate {
  gearItemId: string;
  gearCategory: 'rod';
  gearLabel: string;
  brandName: string;
  model: string;
  modelCn: string;
  modelYear: string;
  rodType: string;
  power: string;
  action: string;
  typeTips: string;
  variantKey: string;
  variantLabel: string;
  price: number | null;
  priceText: string;
  traits: string[];
  rawText: string;
  dataCompleteness: number;
}

export interface SelectionEvidencePost {
  topicId: number;
  title: string;
  summary: string;
  topicCategory: number;
  authorNickName: string;
  reason: string;
}

export interface SelectionGearCard {
  gearItemId: string;
  gearCategory: 'rod';
  gearLabel: string;
  brandName: string;
  model: string;
  variantKey: string;
  variantLabel: string;
  priceText: string;
  detailUrlParams: {
    id: string;
    type: 'rods';
    variantKey?: string;
  };
}

export interface SelectionBranch {
  branchKey: string;
  branchTitle: string;
  branchSummary: string;
  primaryGear: SelectionGearCard | null;
  alternativeGears: SelectionGearCard[];
  whyRecommended: string[];
  tradeOffs: string[];
  budgetFit: SelectionBudgetFit;
  confidence: SelectionConfidence;
  evidencePosts: SelectionEvidencePost[];
  actions: {
    canViewDetail: boolean;
    canAddCompare: boolean;
    canCreateRecommendTopic: boolean;
  };
}
