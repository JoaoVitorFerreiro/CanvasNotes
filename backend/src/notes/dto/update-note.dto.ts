import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  canvasBackground?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  githubSha?: string;

  @IsOptional()
  @IsString()
  @IsIn(['pending', 'synced', 'conflict'])
  syncStatus?: 'pending' | 'synced' | 'conflict';
}
