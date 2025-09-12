import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { JwtAuthMiddleware } from './common/middleware/auth.middleware';
import { JwtService } from '@nestjs/jwt';
import { UserModule } from './modules/user/user.module';
import { AdminSeed } from './seeds/admin.seed';
import { User, UserSchema } from './schemas/user.schema';
import { AuthModule } from './modules/auth/auth.module';
import { CommitteeModule } from './modules/committee/committee.module';
import { InstallmentModule } from './modules/installment/installment.module';
const { ALL } = RequestMethod;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AuthModule,
    UserModule,
    CommitteeModule,
    InstallmentModule,
  ],
  controllers: [],
  providers: [JwtService, AdminSeed],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
    consumer.apply(JwtAuthMiddleware)
      .exclude(
        { path: 'auth/*path', method: ALL },
      )
      .forRoutes('*');
  }
}
