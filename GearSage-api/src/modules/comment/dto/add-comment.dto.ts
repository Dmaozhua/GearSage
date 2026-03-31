import { IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AddCommentDto {
  @IsInt()
  @Min(1)
  topicId!: number;

  @IsString()
  @MaxLength(200)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  commentType?: string;

  @IsOptional()
  @IsObject()
  recommendAnswerMeta?: Record<string, any>;

  @IsOptional()
  @IsInt()
  @Min(1)
  replayCommentId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  replayUserId?: number | null;
}
