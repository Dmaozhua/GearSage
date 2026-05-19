import { IsObject, IsOptional, IsString } from 'class-validator';

export const GEAR_UPDATE_REQUEST_TYPES = ['reels', 'rods', 'lures', 'other'] as const;

export class CreateGearUpdateRequestDto {
  @IsOptional()
  @IsString()
  gearName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  gearType?: (typeof GEAR_UPDATE_REQUEST_TYPES)[number];

  @IsOptional()
  @IsString()
  searchKeyword?: string;

  @IsOptional()
  @IsObject()
  searchContext?: Record<string, any>;

  @IsOptional()
  @IsString()
  sourcePage?: string;
}
