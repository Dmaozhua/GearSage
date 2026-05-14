import { IsBooleanString, IsIn, IsOptional, IsString } from 'class-validator';

export class ListUserGearDto {
  @IsOptional()
  @IsIn(['reel', 'rod', 'lure'])
  gearType?: 'reel' | 'rod' | 'lure';

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsBooleanString()
  includePrivate?: string;
}
