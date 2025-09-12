import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateInstallmentDto {
  @ApiProperty({ description: 'Committee ID', example: '64651b2edb9a4b3d2e74d9a3' })
  @IsMongoId({ message: 'Committee ID must be a valid MongoDB ID' })
  @IsNotEmpty()
  committee: string;

  @ApiProperty({ description: 'Winning Bidder ID', example: '64651b2edb9a4b3d2e74d9a3' })
  @IsMongoId({ message: 'Winning Bidder ID must be a valid MongoDB ID' })
  @IsNotEmpty()
  winningBidder: string;

  @ApiProperty({ description: 'Winning bid amount', example: 1000 })
  @IsNumber({}, { message: 'Winning bid amount must be a number' })
  @IsNotEmpty()
  winningBidAmount: number;

  @ApiProperty({ description: 'Starting bid amount', example: 150 })
  @IsNumber({}, { message: 'Starting bid must be a number' })
  @IsNotEmpty()
  startingBid: number;
}
