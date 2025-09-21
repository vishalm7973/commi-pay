import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNotEmpty, IsNumber, ArrayNotEmpty, IsMongoId, IsInt, Min, Max } from 'class-validator';
import { Types } from 'mongoose';

export class CreateCommitteeDto {
    @ApiProperty({ description: 'Committee amount', example: 1000 })
    @IsNumber({}, { message: 'Amount must be a number' })
    @IsNotEmpty({ message: 'Amount is required' })
    amount: number;

    @ApiProperty({ description: 'Committee bid amount', example: 150 })
    @IsNumber({}, { message: 'Bid must be a number' })
    @IsNotEmpty({ message: 'Bid is required' })
    bid: number;

    @ApiProperty({ description: 'Start date of the committee', example: '2025-09-11T00:00:00Z' })
    @IsDateString({}, { message: 'Start date must be a valid ISO8601 date string' })
    @IsNotEmpty({ message: 'Start date is required' })
    startDate: Date;

    @ApiProperty({
        description: 'Monthly due day of the committee (1-31)',
        example: 11,
    })
    @IsInt({ message: 'Monthly due day must be an integer' })
    @Min(1, { message: 'Monthly due day must be at least 1' })
    @Max(31, { message: 'Monthly due day must be at most 31' })
    @IsNotEmpty({ message: 'Monthly due day is required' })
    monthlyDueDay: number;

    @ApiProperty({
        description: 'Array of user IDs who are members',
        type: [String],
        example: ['64651b2edb9a4b3d2e74d9a1', '64651b2edb9a4b3d2e74d9a2'],
    })
    @IsArray({ message: 'Members must be an array' })
    @ArrayNotEmpty({ message: 'Members array cannot be empty' })
    @IsMongoId({ each: true, message: 'Each member must be a valid Mongo ID' })
    members: Types.ObjectId[];
}
