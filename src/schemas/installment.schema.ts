import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Committee } from './committee.schema';
import { User } from './user.schema';

export type InstallmentDocument = Installment & Document;

@Schema({ timestamps: true })
export class Installment {
  @Prop({ type: Types.ObjectId, ref: Committee.name, required: true })
  committee: Types.ObjectId;

  @Prop({ required: true })
  monthlyContribution: number; // Monthly fixed amount paid by every member

  // Numeric month (1-12)
  @Prop({
    type: Number,
    required: true,
    min: 1,
    max: 12,
    index: true,
  })
  month: number;

  // Full year, e.g. 2025
  @Prop({
    type: Number,
    required: true,
    min: 1900,
    max: 3000,
    index: true,
  })
  year: number;

  @Prop({ required: true })
  startingBid: number; // Starting bid value for the bidding process

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  winningBidder: Types.ObjectId; // User who wins the bid this month

  @Prop({ required: true })
  winningBidAmount: number; // Winning bid amount for this installment

  @Prop({ default: false })
  isSettled: boolean; // True if the installment (bidding and payment) completed

  @Prop({ default: null })
  settlementDate?: Date; // Date when the installment fund was distributed/paid

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;
}

export const InstallmentSchema = SchemaFactory.createForClass(Installment);

// Compound unique index: prevents duplicate installment for same committee-month-year
InstallmentSchema.index(
  { committee: 1, month: 1, year: 1 },
  { unique: true, name: 'unique_committee_month_year' },
);

InstallmentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const { _id, __v, ...rest } = ret;
    return {
      id: _id,
      ...rest,
    };
  },
});
