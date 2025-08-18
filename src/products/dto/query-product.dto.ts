// src/products/dto/query-product.dto.ts
import { IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';

export class QueryProductDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() subCategoryId?: string;
  @IsOptional() @IsString() search?: string;

  @IsOptional() @IsNumberString() minPrice?: string;
  @IsOptional() @IsNumberString() maxPrice?: string;

  @IsOptional() @IsIn(['price', 'name', 'createdAt']) sortBy?:
    | 'price'
    | 'name'
    | 'createdAt';
  @IsOptional() @IsIn(['asc', 'desc']) sortOrder?: 'asc' | 'desc';

  @IsOptional() @IsNumberString() page?: string;
  @IsOptional() @IsNumberString() limit?: string;

  @IsOptional() @IsIn(['true', 'false']) inStock?: 'true' | 'false';

  @IsOptional()
  @IsIn(['men', 'women', 'kids', 'baby', 'unisex'])
  audience?: string;
}
