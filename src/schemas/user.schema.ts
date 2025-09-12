import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from 'src/common/enums/user-role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    firstName: string;

    @Prop()
    lastName?: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ required: false, unique: true })
    email: string;

    @Prop({ required: false })
    password: string;

    @Prop({ required: true, enum: UserRole })
    role: UserRole;

    @Prop({ required: false })
    avatarUrl: string;

    @Prop({ required: true })
    countryCode: string;

    @Prop({ required: true, unique: true })
    phoneNumber: string;

    @Prop({ type: Types.ObjectId, ref: User.name, required: false })
    createdBy?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
        const {
            _id,
            password,
            __v,
            ...rest
        } = ret;
        return {
            id: _id,
            ...rest,
        };
    },
});
