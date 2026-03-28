import { IsInt, Min } from 'class-validator';

export class ReadMessageDto {
  @IsInt()
  @Min(1)
  messageId!: number;
}
