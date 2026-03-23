import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AddCommentDto {
  @IsInt()
  @Min(1)
  topicId!: number;

  @IsString()
  @MaxLength(200)
  content!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  replayCommentId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  replayUserId?: number | null;
}
