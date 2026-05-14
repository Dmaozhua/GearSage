import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSelectionDto {
  @IsOptional()
  @IsString()
  @IsIn(['rod', 'reel', 'lure'])
  gearCategory?: string;

  @IsOptional()
  @IsString()
  @IsIn(['casting', 'spinning'])
  rodType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  power?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  budgetMax?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  budgetFlexible?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  targetFish?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(2)
  @IsString({ each: true })
  useScene?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  technique?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  carePriorities?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  avoidPoints?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  brandPreference?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(160)
  ownedGear?: string;

  @IsOptional()
  @IsString()
  @IsIn(['home', 'gear_list', 'publish', 'compare', 'gear_tab'])
  source?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  limit?: number;
}

