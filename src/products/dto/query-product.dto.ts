// src/products/dto/query-product.dto.ts
import { IsOptional, IsString, IsNumberString, IsIn } from 'class-validator';

export class QueryProductDto {
  @IsOptional() @IsString() categoryId?: string; // use ObjectId string
  @IsOptional() @IsString() search?: string; // name/description/tags

  @IsOptional() @IsNumberString() minPrice?: string;
  @IsOptional() @IsNumberString() maxPrice?: string;

  @IsOptional() @IsString() sortBy?: 'price' | 'name' | 'createdAt';
  @IsOptional() @IsIn(['asc', 'desc']) sortOrder?: 'asc' | 'desc';

  @IsOptional() @IsNumberString() page?: string; // default 1
  @IsOptional() @IsNumberString() limit?: string; // default 12

  @IsOptional() @IsIn(['true', 'false']) inStock?: 'true' | 'false';
}
