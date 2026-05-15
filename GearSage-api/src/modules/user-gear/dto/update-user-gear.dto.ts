import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserGearDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @IsOptional()
  @IsIn(['owned', 'wishlist', 'sold'])
  ownershipStatus?: 'owned' | 'wishlist' | 'sold';

  @IsOptional()
  @IsIn(['frequent', 'backup', 'idle'])
  usageStatus?: 'frequent' | 'backup' | 'idle';

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
