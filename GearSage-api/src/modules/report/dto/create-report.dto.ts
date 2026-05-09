import { IsIn, IsInt, IsString, MaxLength, Min } from 'class-validator';

export class CreateReportDto {
  @IsIn(['topic', 'comment', 'user'])
  targetType!: 'topic' | 'comment' | 'user';

  @IsInt()
  @Min(1)
  targetId!: number;

  @IsString()
  @MaxLength(200)
  reason!: string;
}
