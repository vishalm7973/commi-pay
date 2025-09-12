import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from 'src/schemas/user.schema';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminSeed implements OnApplicationBootstrap {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private readonly configService: ConfigService,

    ) { }

    async onApplicationBootstrap() {
        const adminExists = await this.userModel.exists({ role: UserRole.ADMIN });
        if (!adminExists) {
            const saltRounds = 10;
            const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
            const adminPassword = this.configService.get<string>('ADMIN_PASS');

            const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

            const adminUser = new this.userModel({
                firstName: 'Vishal',
                lastName: 'Maurya',
                email: adminEmail,
                password: hashedPassword,
                role: UserRole.ADMIN,
                avatarUrl: null,
                countryCode: '+XX',
                phoneNumber: 'XXXXXXXXXX',
                isActive: true,
            });

            await adminUser.save();
            console.log('Admin user seeded');
        } else {
            console.log('Admin user already exists, skipping seed');
        }
    }
}