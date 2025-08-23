// src/orders/schemas/order.schema.ts
import { Schema as MongooseSchema, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
}

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Number, min: 1, required: true })
  quantity: number;

  // snapshot pricing to preserve history
  @Prop({ type: Number, min: 0, required: true })
  unitPrice: number;

  @Prop({ type: Number, min: 0, required: true })
  lineTotal: number; // quantity * unitPrice
}
export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class ShippingAddress {
  @Prop({ required: true }) fullName: string;
  @Prop({ required: true }) address1: string;
  @Prop() address2?: string;
  @Prop({ required: true }) city: string;
  @Prop({ required: true }) state: string;
  @Prop({ required: true }) postalCode: string;
  @Prop({ required: true }) country: string;
  @Prop() phone?: string;
}
export const ShippingAddressSchema =
  SchemaFactory.createForClass(ShippingAddress);

@Schema({
  collection: 'orders',
  timestamps: true, // createdAt, updatedAt
})
export class Order {
  _id: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: [OrderItemSchema],
    required: true,
    validate: [(v: any[]) => v.length > 0, 'At least 1 item'],
  })
  items: OrderItem[];

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    index: true,
  })
  status: OrderStatus;

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress: ShippingAddress;

  @Prop({ type: Number, min: 0, required: true })
  total: number;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// helpful indexes
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ userId: 1, createdAt: -1 });

// auto-calc line totals & order total if not provided / ensure consistency
OrderSchema.pre('validate', function (next) {
  const doc = this as any as Order;
  if (doc.items?.length) {
    doc.items = doc.items.map((it) => ({
      ...it,
      lineTotal:
        Math.round((it.quantity * it.unitPrice + Number.EPSILON) * 100) / 100,
    }));
    const sum = doc.items.reduce((acc, it) => acc + (it.lineTotal || 0), 0);
    doc.total = Math.round((sum + Number.EPSILON) * 100) / 100;
  }
  next();
});
