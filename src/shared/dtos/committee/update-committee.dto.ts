import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateCommitteeDto } from './create-committee.dto';

export class UpdateCommitteeDto extends PartialType(CreateCommitteeDto) {
  @IsOptional()
  @ApiProperty({ description: 'End date of the committee', example: '2025-12-31T23:59:59Z' })
  @IsDateString({}, { message: 'End date must be a valid ISO8601 date string' })
  endDate?: Date;
}
