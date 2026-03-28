import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminReviewActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
