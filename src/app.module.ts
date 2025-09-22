import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { JwtAuthMiddleware } from './common/middleware/auth.middleware';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from './modules/user/user.module';
import { AdminSeed } from './seeds/admin.seed';
import { User, UserSchema } from './schemas/user.schema';
import { AuthModule } from './modules/auth/auth.module';
import { CommitteeModule } from './modules/committee/committee.module';
import { InstallmentModule } from './modules/installment/installment.module';
import { CurrentUserModule } from './modules/current-user/current-user.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION') },
      }),
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AuthModule,
    CurrentUserModule,
    UserModule,
    CommitteeModule,
    InstallmentModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [AdminSeed],
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
