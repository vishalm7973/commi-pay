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
