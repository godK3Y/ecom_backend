// src/categories/dto/create-category.dto.ts
import { IsString, IsOptional, IsMongoId } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsMongoId()
  parentId?: string;
}
