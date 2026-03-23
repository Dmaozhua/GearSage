import { IsOptional, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^\d{11}$/)
  phone!: string;

  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  inviteCode?: string;

  @IsOptional()
  @IsString()
  inviterUid?: string;

  @IsOptional()
  @IsString()
  inviterName?: string;
}
