import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class SubmitRecommendFeedbackDto {
  @IsInt()
  @Min(1)
  topicId!: number;

  @IsString()
  finalDecisionType!: string;

  @IsOptional()
  @IsObject()
  finalProduct?: Record<string, any>;

  @IsArray()
  decisionReason!: string[];

  @IsOptional()
  @IsString()
  resultSatisfaction?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  feedbackText?: string;

  @IsOptional()
  @IsString()
  willPostLongReview?: string;
}
