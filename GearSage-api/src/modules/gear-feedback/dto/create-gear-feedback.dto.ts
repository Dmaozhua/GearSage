import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export const GEAR_FEEDBACK_TYPES = [
  '参数错误',
  '图片问题',
  '技术说明错误',
  '型号缺失',
  '权利问题',
  '其他',
] as const;

export class CreateGearFeedbackDto {
  @IsString()
  @IsIn(['reels', 'rods', 'lures', 'line', 'lines', 'hook', 'hooks'])
  gearType!: string;

  @IsString()
  @MaxLength(64)
  masterId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  variantId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  fieldKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  fieldLabel?: string;

  @IsString()
  @IsIn(GEAR_FEEDBACK_TYPES)
  feedbackType!: (typeof GEAR_FEEDBACK_TYPES)[number];

  @IsString()
  @MaxLength(800)
  content!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsUrl({}, { each: true })
  images?: string[];
}
