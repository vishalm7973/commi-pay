import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Installment, InstallmentSchema } from 'src/schemas/installment.schema';
import { InstallmentPayment, InstallmentPaymentSchema } from 'src/schemas/installment-payment.schema';
import { Committee, CommitteeSchema } from 'src/schemas/committee.schema';
import { InstallmentController } from './installment.controller';
import { InstallmentService } from './installment.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Installment.name, schema: InstallmentSchema }]),
    MongooseModule.forFeature([{ name: InstallmentPayment.name, schema: InstallmentPaymentSchema }]),
    MongooseModule.forFeature([{ name: Committee.name, schema: CommitteeSchema }]),
  ],
  controllers: [InstallmentController],
  providers: [InstallmentService],
})
export class InstallmentModule {}
