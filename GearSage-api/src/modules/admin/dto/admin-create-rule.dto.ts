import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminCreateRuleDto {
  @IsOptional()
  @IsString()
  @IsIn(['text', 'all'])
  ruleType?: string;

  @IsOptional()
  @IsString()
  @IsIn(['contains', 'exact'])
  matchType?: string;

  @IsString()
  @MaxLength(255)
  keyword!: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'disabled'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
