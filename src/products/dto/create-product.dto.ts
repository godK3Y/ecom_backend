// src/products/dto/create-product.dto.ts
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsArray()
  @IsOptional()
  videos?: string[];

  @IsNumber()
  price: number;

  @IsMongoId()
  categoryId: string;

  @IsOptional()
  @IsMongoId()
  subCategoryId?: string;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsOptional()
  variants?: any[];

  @IsOptional()
  variantCombinations?: any[];

  @IsNumber()
  @IsOptional()
  rating?: number;

  @IsNumber()
  @IsOptional()
  totalReviews?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
