import { Injectable } from '@nestjs/common';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

@Injectable()
export class ProductsService {
  private products: Product[] = [
    {
      id: 1,
      name: 'Laptop',
      price: 999.99,
      description: 'A high-performance laptop for professionals.',
    },
  ];

  findAll(): Product[] {
    return this.products;
  }
  create(product: Product) {
    this.products.push(product);
    return product;
  }
}
