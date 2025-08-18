// src/products/dto/create-product.dto.ts
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @IsString() name!: string;
  @IsString() slug!: string;
  @IsOptional() @IsString() description?: string;

  @IsNumber() price!: number;

  @IsMongoId() categoryId!: string;
  @IsOptional() @IsMongoId() subCategoryId?: string | null;

  @IsOptional() @IsNumber() stock?: number;

  @IsOptional() @IsArray() images?: string[];
  @IsOptional() @IsArray() videos?: string[];

  @IsOptional() @IsArray() variants?: any[];
  @IsOptional() @IsArray() variantCombinations?: any[];

  @IsOptional() @IsNumber() rating?: number;
  @IsOptional() @IsNumber() totalReviews?: number;

  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;

  @IsOptional() @IsArray() tags?: string[];

  @IsOptional() @IsString() sku?: string;
}

export class UpdateProductDto extends CreateProductDto {}
