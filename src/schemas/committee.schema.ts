import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

export type CommitteeDocument = Committee & Document;

@Schema({ timestamps: true })
export class Committee {
    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    bid: number;

    @Prop({ required: true })
    startDate: Date;

    @Prop({ required: true })
    endDate: Date;

    @Prop({
        type: Number,
        min: 1,
        max: 31,
        required: true,
    })
    monthlyDueDay: number;

    @Prop({ type: [{ type: Types.ObjectId, ref: User.name }], default: [] })
    members: Types.ObjectId[];

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    createdBy: Types.ObjectId;
}

export const CommitteeSchema = SchemaFactory.createForClass(Committee);

CommitteeSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
        const {
            _id,
            __v,
            ...rest
        } = ret;
        return {
            id: _id,
            ...rest,
        };
    },
});
