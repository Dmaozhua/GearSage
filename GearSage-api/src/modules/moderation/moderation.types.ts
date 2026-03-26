export type ModerationDecisionResult = 'PASS' | 'REJECT' | 'REVIEW';

export type ModerationContentType = 'text' | 'image';

export type ModerationOperatorType = 'system' | 'admin';

export type ModerationScene =
  | 'user_nickname'
  | 'user_bio'
  | 'topic_title'
  | 'topic_content'
  | 'comment_content'
  | 'avatar_image'
  | 'background_image'
  | 'topic_image';

export type ModerationDecision = {
  result: ModerationDecisionResult;
  provider: string;
  riskLevel: string;
  riskReason: string;
  hitLabels: string[];
  requestId?: string;
  raw: Record<string, any>;
};

export type ModerationMetadata = {
  userId?: number | null;
  targetType: string;
  targetId?: string | number | null;
  operatorType?: ModerationOperatorType;
  operatorId?: string | number | null;
  dataId?: string;
  extra?: Record<string, any>;
};

export type ModerationRuleRecord = {
  id: number;
  rule_type: string;
  match_type: string;
  keyword: string;
  status: string;
  remark: string;
};
