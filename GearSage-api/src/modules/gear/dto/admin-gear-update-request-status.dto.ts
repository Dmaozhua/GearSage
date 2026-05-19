import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const ADMIN_GEAR_UPDATE_REQUEST_STATUSES = [
  'pending',
  'review',
  'accepted',
  'ignored',
  'done',
] as const;

export class AdminGearUpdateRequestStatusDto {
  @IsString()
  @IsIn(ADMIN_GEAR_UPDATE_REQUEST_STATUSES)
  status!: (typeof ADMIN_GEAR_UPDATE_REQUEST_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
