// src/products/products.controller.ts
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

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  // @Post('bulk')
  // bulk(@Body() items: Partial<CreateProductDto>[]) {
  //   return this.productsService.upsertManyByKey(items);
  // }

  @Get()
  findAll(@Query() q: QueryProductDto) {
    return this.productsService.findAllWithQuery(q);
  }

  @Get('featured')
  featured(@Query('limit') limit?: string) {
    return this.productsService.findFeatured(limit ? Number(limit) : 20);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
