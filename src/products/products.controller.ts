import { Controller, Get, Post, Body } from '@nestjs/common';
import { ProductsService } from './products.service';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
  @Get()
  getProducts(): Product[] {
    return this.productsService.findAll();
  }

  @Post()
  addProduct(@Body() product: Product): Product {
    return this.productsService.create(product);
  }
}
