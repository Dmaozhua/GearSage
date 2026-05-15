import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserGearSetDto {
  @IsString()
  @MaxLength(80)
  name!: string;

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
  @IsObject()
  compatibilityOverrides?: {
    rodHandleType?: 'spinning' | 'casting';
    reelSubtype?: 'spinning' | 'baitcasting' | 'drum';
  };
}

export class CompatibilityOverrideDto {
  @IsOptional()
  @IsIn(['spinning', 'casting'])
  rodHandleType?: 'spinning' | 'casting';

  @IsOptional()
  @IsIn(['spinning', 'baitcasting', 'drum'])
  reelSubtype?: 'spinning' | 'baitcasting' | 'drum';
}
