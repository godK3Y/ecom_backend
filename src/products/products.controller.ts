import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Create a single product.
   * - Validates categoryId/subCategoryId in the service.
   */
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  /**
   * Bulk upsert by sku or slug.
   * - Idempotent: re-run safe.
   * - Each item validated (categories).
   */
  // src/products/products.controller.ts
  // @Post('bulk')
  // bulk(@Body() items: Partial<CreateProductDto>[]) {
  //   return this.productsService.upsertManyByKey(items);
  // }

  /**
   * List with filters/pagination/sorting.
   * - Supports: search, audience (via categories), price range, stock, category/subCategory.
   * - Returns { products, total, page, totalPages }.
   */
  @Get()
  findAll(@Query() q: QueryProductDto) {
    return this.productsService.findAllWithQuery(q);
  }

  /** Featured products (limit optional, defaults inside service). */
  @Get('featured')
  featured(@Query('limit') limit?: string) {
    return this.productsService.findFeatured(limit ? Number(limit) : undefined);
  }

  /** Get one by id (404 if not found). */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  /**
   * Update by id.
   * - If categoryId/subCategoryId present, service re-validates references.
   */
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  /** Delete by id (404 if not found). */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
