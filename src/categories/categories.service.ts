// src/categories/categories.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category } from './schemas/category.schema';
import type { Audience } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * A "lean" category shape (what you actually get back from .lean()).
 * We add _id and parentId as ObjectIds and keep optional fields.
 */
type CategoryLean = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  parentId?: Types.ObjectId | null;
  audiences?: Audience[];
  order?: number;
  path?: string;
  ancestors?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
};

/** Returned node shape for the tree (adds children[]) */
export type CategoryNode = CategoryLean & { children: CategoryNode[] };

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  /**
   * Small helper: ensure provided parentId exists and is not equal to self.
   * Prevents dangling references and trivial cycles.
   */
  private async assertValidParent(parentId?: string | null, selfId?: string) {
    if (!parentId) return;
    if (selfId && parentId === selfId) {
      throw new BadRequestException('parentId cannot equal the category _id');
    }
    const exists = await this.categoryModel.exists({ _id: parentId });
    if (!exists) {
      throw new NotFoundException('Parent category not found');
    }
  }

  /**
   * Create a single category.
   * - Validates parent existence if provided.
   * - Returns the saved document.
   */
  async create(dto: CreateCategoryDto) {
    await this.assertValidParent(dto.parentId ?? null);
    return new this.categoryModel(dto).save();
  }

  /**
   * Seed-friendly bulk upsert by slug.
   * - If a slug exists, it updates the record.
   * - If it doesn't, it inserts a new one.
   * - Safe to run multiple times.
   */
  async upsertManyBySlug(dtos: CreateCategoryDto[]) {
    const ops = dtos.map((d) => ({
      updateOne: {
        filter: { slug: d.slug },
        update: { $set: d, $setOnInsert: {} },
        upsert: true,
      },
    }));
    return this.categoryModel.bulkWrite(ops, { ordered: false });
  }

  /**
   * Find all categories, optionally filtered by audience.
   * Rule: audiences=[] means "visible to all"; so we include those too.
   * Sorted by `order` then `name` for nice menu rendering.
   * Uses `lean()` for speed and smaller payloads.
   */
  async findAll(audience?: Audience): Promise<CategoryLean[]> {
    const match = audience
      ? { $or: [{ audiences: audience }, { audiences: { $size: 0 } }] }
      : {};
    return this.categoryModel
      .find(match)
      .sort({ order: 1, name: 1 })
      .lean<CategoryLean[]>();
  }

  /**
   * Find a single category by its Mongo _id.
   */
  async findOne(id: string) {
    const doc = await this.categoryModel.findById(id);
    if (!doc) throw new NotFoundException('Category not found');
    return doc;
  }

  /**
   * (Handy for SEO URLs) Find a category by slug.
   */
  async findBySlug(slug: string) {
    const doc = await this.categoryModel.findOne({ slug });
    if (!doc) throw new NotFoundException('Category not found');
    return doc;
  }

  /**
   * Update a category by _id.
   * - Validates new parentId if provided.
   */
  async update(id: string, dto: UpdateCategoryDto) {
    await this.assertValidParent(dto.parentId ?? null, id);
    const doc = await this.categoryModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!doc) throw new NotFoundException('Category not found');
    return doc;
  }

  /**
   * Remove a category by _id.
   * Optional guard: prevent deletion if the category still has children.
   * Comment/Uncomment the guard depending on your needs.
   */
  async remove(id: string) {
    // Guard: block delete if children exist (safer for data integrity)
    const hasChildren = await this.categoryModel.exists({ parentId: id });
    if (hasChildren) {
      throw new BadRequestException(
        'Cannot delete category: it still has child categories. Re-parent or delete children first.',
      );
    }

    const res = await this.categoryModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Category not found');
  }

  /**
   * Build a hierarchy (tree) from the flat list, filtered by audience if provided.
   * - Orphan-safe: if a node references a missing parent, it will appear as a root.
   * - Recursively sorts by `order` then `name` (stable menus).
   * - Returns only roots by default; each node has `children: CategoryNode[]`.
   */
  async findTreeByAudience(audience?: Audience): Promise<CategoryNode[]> {
    const flat = await this.findAll(audience);

    // Prepare a map id -> node with children array
    const byId = new Map<string, CategoryNode>(
      flat.map((c) => [
        String(c._id),
        { ...c, children: [] as CategoryNode[] },
      ]),
    );

    const roots: CategoryNode[] = [];

    // Link children to parents (or fall back to roots if parent is missing)
    for (const node of byId.values()) {
      const parentId = node.parentId ? String(node.parentId) : null;
      if (!parentId) {
        roots.push(node);
        continue;
      }
      const parent = byId.get(parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    // Sort nodes: order ASC, then name ASC
    const sortNodes = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => {
        const ao = a.order ?? 0;
        const bo = b.order ?? 0;
        if (ao !== bo) return ao - bo;
        return a.name.localeCompare(b.name);
      });
      for (const n of nodes) sortNodes(n.children);
    };
    sortNodes(roots);

    return roots;
  }
}
