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

  /**
   * FIXED:
   * - Accept DTOs (strings for ids are fine; Mongoose will cast)
   * - Safe casts for sku/slug
   * - BulkWrite summary using public fields (no .result/.nMatched/.nModified)
   */
  // async upsertManyByKey(items: Partial<CreateProductDto>[]) {
  //   // Build typed bulk ops
  //   const ops: AnyBulkWriteOperation[] = [];

  //   for (const raw of items) {
  //     const p = raw;

  //     // Optional category validation per item (Mongoose will cast strings to ObjectId on write)
  //     const categoryId =
  //       typeof p.categoryId === 'string' ? p.categoryId : undefined;
  //     const subCategoryId =
  //       typeof p.subCategoryId === 'string' ? p.subCategoryId : undefined;
  //     if (categoryId || subCategoryId) {
  //       await this.ensureCategoriesExist(
  //         categoryId ?? null,
  //         subCategoryId ?? null,
  //       );
  //     }

  //     // Decide upsert key
  //     const sku = typeof p.sku === 'string' ? p.sku : undefined;
  //     const slug = typeof p.slug === 'string' ? p.slug : undefined;
  //     if (!sku && !slug) {
  //       throw new BadRequestException(
  //         'Each item must have sku or slug for upsert',
  //       );
  //     }

  //     ops.push({
  //       updateOne: {
  //         filter: sku ? { sku } : { slug: slug! },
  //         update: { $set: p },
  //         upsert: true,
  //       },
  //     });
  //   }

  //   // Typed result — no "any" casts, no private .result access
  //   const res: BulkWriteResult = await this.productModel.bulkWrite(ops, {
  //     ordered: false,
  //   });

  //   return {
  //     upserted: res.upsertedCount ?? 0,
  //     modified: res.modifiedCount ?? 0,
  //     matched: res.matchedCount ?? 0,
  //     inserted: res.insertedCount ?? 0,
  //     // deleted:  res.deletedCount  ?? 0, // include if you add delete ops later
  //   };
  // }

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
