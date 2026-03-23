import { IsInt, Min } from 'class-validator';

export class ToggleTopicLikeDto {
  @IsInt()
  @Min(1)
  topicId!: number;
}
