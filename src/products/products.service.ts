// src/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Category } from '../categories/schemas/category.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async create(dto: CreateProductDto) {
    return new this.productModel(dto).save();
  }

  async findOne(id: string) {
    const doc = await this.productModel.findById(id); // add populate later if you want
    if (!doc) throw new NotFoundException('Product not found');
    return doc;
  }

  async update(id: string, dto: UpdateProductDto) {
    const doc = await this.productModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!doc) throw new NotFoundException('Product not found');
    return doc;
  }

  async remove(id: string) {
    const res = await this.productModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Product not found');
    return;
  }

  async findFeatured() {
    return this.productModel.find({ isFeatured: true }).limit(20).exec();
  }

  async findAllWithQuery(q: QueryProductDto) {
    const {
      categoryId,
      search,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '12',
      audience,
    } = q;

    const filter: FilterQuery<Product> = {};

    // audience via category audiences
    if (audience && !categoryId) {
      const catIds = await this.categoryModel
        .find(
          { $or: [{ audiences: audience }, { audiences: { $size: 0 } }] },
          { _id: 1 },
        )
        .lean();
      filter.categoryId = { $in: catIds.map((c) => c._id) };
    }

    if (categoryId) filter.categoryId = categoryId;
    if (search?.trim()) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
    }
    if (minPrice)
      filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
    if (maxPrice)
      filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };

    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'desc' ? -1 : 1,
    };
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 12, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      products,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }
}
