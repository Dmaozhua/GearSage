import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserGearSetDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  rodItemId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  reelItemId?: number;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  lureItemIds?: number[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetFish?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  useScene?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;

  @IsOptional()
  @IsBoolean()
  showOnProfile?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsObject()
  compatibilityOverrides?: {
    rodHandleType?: 'spinning' | 'casting';
    reelSubtype?: 'spinning' | 'baitcasting' | 'drum';
  };
}
