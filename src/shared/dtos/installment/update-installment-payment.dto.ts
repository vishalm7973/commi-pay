import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsNotEmpty } from 'class-validator';

export class UpdateInstallmentPaymentDto {
  @ApiProperty({ description: 'Whether the payment is completed or not', example: true })
  @IsBoolean()
  @IsNotEmpty()
  isPaid: boolean;
}
