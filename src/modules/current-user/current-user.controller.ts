import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Req,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { UpdateUserDto } from 'src/shared/dtos/user/update-user.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiNotFoundResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiResponseDto } from 'src/shared/dtos/api-response/api.response.dto';
import type { UserRequest } from 'src/shared/interfaces/user-request.interface';
import { sendResponse } from 'src/common/utils/response.util';
import { UserService } from '../user/user.service';
const { CREATED, OK } = HttpStatus;

@ApiTags('Current User')
@ApiBearerAuth()
@Controller('current-user')
export class CurrentUserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  @ApiOperation({ summary: 'Get logged in user profile' })
  @ApiOkResponse({
    description: 'Profile retrieved successfully',
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getProfile(@Req() req: UserRequest,) {
    const res = await this.userService.findOne(req.user.id);
    return sendResponse(true, OK, 'Profile retrieved successfully', res);
  }

  @Put()
  @ApiOperation({ summary: 'Update logged in user profile' })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Profile not found' })
  async updateProfile(@Req() req: UserRequest, @Body() updateUserDto: UpdateUserDto) {
    const res = await this.userService.update(req.user.id, updateUserDto);
    return sendResponse(true, OK, 'Profile updated successfully', res);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete logged in user account' })
  @ApiOkResponse({
    description: 'Account deleted successfully',
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async deleteAccount(@Req() req: UserRequest,) {
    const res = await this.userService.remove(req.user.id);
    return sendResponse(true, OK, 'Account deleted successfully', res);
  }
}