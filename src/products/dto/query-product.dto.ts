// src/products/dto/query-product.dto.ts
import { IsOptional, IsString, IsIn, IsNumberString } from 'class-validator';
export class QueryProductDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsNumberString() minPrice?: string;
  @IsOptional() @IsNumberString() maxPrice?: string;
  @IsOptional() @IsString() sortBy?: 'price' | 'name' | 'createdAt';
  @IsOptional() @IsIn(['asc', 'desc']) sortOrder?: 'asc' | 'desc';
  @IsOptional() @IsNumberString() page?: string;
  @IsOptional() @IsNumberString() limit?: string;
  @IsOptional()
  @IsIn(['men', 'women', 'kids', 'baby', 'unisex'])
  audience?: string;
}
