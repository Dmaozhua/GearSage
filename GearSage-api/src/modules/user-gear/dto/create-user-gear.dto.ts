import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUserGearDto {
  @IsIn(['reel', 'rod', 'lure'])
  gearType!: 'reel' | 'rod' | 'lure';

  @IsString()
  @MaxLength(64)
  gearMasterId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  gearVariantId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  variantKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  variantLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @IsIn(['frequent', 'backup', 'idle'])
  usageStatus!: 'frequent' | 'backup' | 'idle';

  @IsBoolean()
  isPublic!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
