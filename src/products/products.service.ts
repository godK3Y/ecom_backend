// src/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
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

  /** Validate category references */
  private async ensureCategoriesExist(
    categoryId?: string | null,
    subCategoryId?: string | null,
  ) {
    if (!categoryId) throw new BadRequestException('categoryId is required');
    const [cat, sub] = await Promise.all([
      this.categoryModel.exists({ _id: categoryId }),
      subCategoryId
        ? this.categoryModel.exists({ _id: subCategoryId })
        : Promise.resolve(true),
    ]);
    if (!cat) throw new BadRequestException('categoryId not found');
    if (subCategoryId && !sub)
      throw new BadRequestException('subCategoryId not found');
  }

  async create(dto: CreateProductDto) {
    await this.ensureCategoriesExist(dto.categoryId, dto.subCategoryId ?? null);
    return new this.productModel(dto).save();
  }

  async findOne(id: string) {
    const doc = await this.productModel
      .findById(id)
      .populate({
        path: 'categoryId',
        select: 'name slug',
        strictPopulate: false,
      })
      .populate({
        path: 'subCategoryId',
        select: 'name slug',
        strictPopulate: false,
      });
    if (!doc) throw new NotFoundException('Product not found');
    return doc;
  }

  async update(id: string, dto: UpdateProductDto) {
    if (dto.categoryId || dto.subCategoryId) {
      const existing = await this.productModel.findById(id).lean();
      if (!existing) throw new NotFoundException('Product not found');
      await this.ensureCategoriesExist(
        dto.categoryId ?? String(existing.categoryId),
        dto.subCategoryId ?? null,
      );
    }
    const doc = await this.productModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!doc) throw new NotFoundException('Product not found');
    return doc;
  }

  async remove(id: string) {
    const res = await this.productModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Product not found');
  }

  async findFeatured(limit = 20) {
    return this.productModel
      .find({ isFeatured: true, isActive: { $ne: false } })
      .limit(limit)
      .exec();
  }

  // /** Upsert by key (sku if present, otherwise slug) */
  // async upsertManyByKey(items: Partial<Product>[]) {
  //   const ops = await Promise.all(
  //     items.map(async (p) => {
  //       // Validate categories for each item that has ids
  //       if (p['categoryId'] || p['subCategoryId']) {
  //         await this.ensureCategoriesExist(
  //           p['categoryId'] as any,
  //           p['subCategoryId'] as any,
  //         );
  //       }
  //       const key = (p['sku'] as any) ?? (p['slug'] as any);
  //       if (!key)
  //         throw new BadRequestException(
  //           'Each item must have sku or slug for upsert',
  //         );
  //       return {
  //         updateOne: {
  //           filter: p['sku'] ? { sku: p['sku'] } : { slug: p['slug'] },
  //           update: { $set: p },
  //           upsert: true,
  //         },
  //       };
  //     }),
  //   );
  //   const res = await this.productModel.bulkWrite(ops, { ordered: false });
  //   return {
  //     upserted: res.upsertedCount ?? (res.result?.upserted?.length || 0),
  //     modified: res.modifiedCount ?? res.nModified ?? 0,
  //     matched: res.matchedCount ?? res.nMatched ?? 0,
  //   };
  // }

  /** Listing with filters, sorting, pagination, and audience via categories */
  async findAllWithQuery(q: QueryProductDto) {
    const {
      categoryId,
      subCategoryId,
      search,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '12',
      audience,
    } = q;

    const filter: FilterQuery<Product> = { isActive: { $ne: false } };

    if (categoryId) filter.categoryId = categoryId;
    if (subCategoryId) filter.subCategoryId = subCategoryId;

    // Category-based audience filter (only when no explicit category filters)
    if (audience && !categoryId && !subCategoryId) {
      const catIds = await this.categoryModel
        .find(
          { $or: [{ audiences: audience }, { audiences: { $size: 0 } }] },
          { _id: 1 },
        )
        .lean();
      filter.categoryId = { $in: catIds.map((c) => c._id) };
    }

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

    if (inStock === 'true') filter.stock = { $gt: 0 };

    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'desc' ? -1 : 1,
    };

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 12, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      this.productModel.find(filter).sort(sort).skip(skip).limit(limitNum),
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
