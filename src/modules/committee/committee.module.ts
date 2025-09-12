import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommitteeController } from './committee.controller';
import { CommitteeService } from './committee.service';
import { Committee, CommitteeSchema } from 'src/schemas/committee.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Committee.name, schema: CommitteeSchema }])],
  controllers: [CommitteeController],
  providers: [CommitteeService],
})
export class CommitteeModule {}