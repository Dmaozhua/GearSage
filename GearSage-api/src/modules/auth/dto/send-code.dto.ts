import { IsString, Matches } from 'class-validator';

export class SendCodeDto {
  @IsString()
  @Matches(/^\d{11}$/)
  phone!: string;
}
