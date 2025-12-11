import { IsString, IsNotEmpty } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
