import { IsInt, Min } from 'class-validator';

export class AcceptRecommendAnswerDto {
  @IsInt()
  @Min(1)
  topicId!: number;

  @IsInt()
  @Min(1)
  commentId!: number;
}
