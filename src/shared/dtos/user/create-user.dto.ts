import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/common/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ description: 'First name of the user', example: 'John' })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({ description: 'Last name of the user', required: false, example: 'Doe' })
  @IsString({ message: 'Last name must be a string' })
  @IsOptional()
  lastName?: string;

  @ApiProperty({ description: 'URL of user avatar', example: 'https://example.com/avatar.jpg' })
  @IsString({ message: 'Avatar URL must be a string' })
  @IsNotEmpty({ message: 'Avatar URL is required' })
  avatarUrl: string;

  @ApiProperty({ description: 'Country dial code', example: '+1' })
  @IsString({ message: 'Country code must be a string' })
  @IsNotEmpty({ message: 'Country code is required' })
  countryCode: string;

  @ApiProperty({ description: 'Phone number', example: '1234567890' })
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  phoneNumber: string;
}
