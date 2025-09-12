import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Installment } from './installment.schema';
import { User } from './user.schema';
import { PaymentStatus } from 'src/common/enums/payment.enum';

export type InstallmentPaymentDocument = InstallmentPayment & Document;

@Schema({ timestamps: true })
export class InstallmentPayment {
    @Prop({ type: Types.ObjectId, ref: Installment.name, required: true })
    installment: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    member: Types.ObjectId;

    @Prop({ required: false, default: 0 })
    amountPaid: number;

    @Prop({ type: Date, required: false, default: null })
    paymentDate?: Date | null;

    @Prop({
        type: String,
        enum: PaymentStatus,
        default: PaymentStatus.PENDING
    })
    status: PaymentStatus;

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    createdBy: Types.ObjectId;
}

export const InstallmentPaymentSchema = SchemaFactory.createForClass(InstallmentPayment);

InstallmentPaymentSchema.set('toJSON', {
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
