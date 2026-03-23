import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class PublishTopicDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @IsInt()
  @Min(0)
  @Max(4)
  topicCategory!: number;

  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsArray()
  images!: string[];

  @IsInt()
  @Min(1)
  userId!: number;
}
