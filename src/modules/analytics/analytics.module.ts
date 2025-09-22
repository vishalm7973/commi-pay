import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Installment, InstallmentSchema } from 'src/schemas/installment.schema';
import { InstallmentPayment, InstallmentPaymentSchema } from 'src/schemas/installment-payment.schema';
import { Committee, CommitteeSchema } from 'src/schemas/committee.schema';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Installment.name, schema: InstallmentSchema }]),
    MongooseModule.forFeature([{ name: InstallmentPayment.name, schema: InstallmentPaymentSchema }]),
    MongooseModule.forFeature([{ name: Committee.name, schema: CommitteeSchema }]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
