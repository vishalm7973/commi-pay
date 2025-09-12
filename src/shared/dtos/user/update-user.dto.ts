import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'First name of the user', example: 'John' })
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  firstName: string;

  @ApiPropertyOptional({ description: 'Last name of the user', example: 'Doe' })
  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  lastName?: string;

  @ApiPropertyOptional({ description: 'URL of user avatar', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString({ message: 'Avatar URL must be a string' })
  avatarUrl: string;

  @ApiPropertyOptional({ description: 'Country dial code', example: '+1' })
  @IsOptional()
  @IsString({ message: 'Country code must be a string' })
  countryCode: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '1234567890' })
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Active status of the user', example: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}
