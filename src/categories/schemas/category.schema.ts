// src/categories/schemas/category.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type Audience = 'men' | 'women' | 'kids' | 'baby' | 'unisex';

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({ required: true }) name: string;
  @Prop({ required: true, unique: true }) slug: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  parentId: Types.ObjectId | null;

  // NEW: which audiences this category targets (empty = “all”)
  @Prop({
    type: [String],
    enum: ['men', 'women', 'kids', 'baby', 'unisex'],
    default: [],
  })
  audiences: Audience[];

  // Optional niceties for menus/SEO (you can skip if you want)
  @Prop({ default: 0 }) order: number;
  @Prop({ default: '' }) path: string; // e.g., "clothing/t-shirts"
  @Prop({ type: [Types.ObjectId], default: [] }) ancestors: Types.ObjectId[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);
