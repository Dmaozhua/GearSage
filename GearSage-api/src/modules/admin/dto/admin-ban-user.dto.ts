import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminBanUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
