import { IsInt, Min } from 'class-validator';

export class ToggleCommentLikeDto {
  @IsInt()
  @Min(1)
  commentId!: number;
}
