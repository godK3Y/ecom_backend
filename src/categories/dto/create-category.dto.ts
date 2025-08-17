// src/categories/dto/create-category.dto.ts
import {
  IsString,
  IsOptional,
  IsMongoId,
  IsIn,
  IsArray,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString() name: string;
  @IsString() slug: string;

  @IsOptional()
  @IsMongoId()
  parentId?: string | null;

  @IsOptional()
  @IsArray()
  @IsIn(['men', 'women', 'kids', 'baby', 'unisex'], { each: true })
  audiences?: ('men' | 'women' | 'kids' | 'baby' | 'unisex')[];

  @IsOptional() order?: number;
}
