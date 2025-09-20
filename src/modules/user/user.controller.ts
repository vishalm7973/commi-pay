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
import { UserService } from './user.service';
import { CreateUserDto } from 'src/shared/dtos/user/create-user.dto';
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
const { CREATED, OK } = HttpStatus;

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @ApiOperation({ summary: 'Create a user' })
  @ApiOkResponse({
    description: 'User created successfully',
    type: ApiResponseDto,
  })
  async create(@Body() createUserDto: CreateUserDto, @Req() req: UserRequest) {
    const createdUser = await this.userService.create(createUserDto, req.user);
    return sendResponse(true, CREATED, 'User created successfully', createdUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with search and pagination' })
  @ApiQuery({ name: 'page', required: false, default: 1, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, default: 20, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for filtering users by name or phone' })
  @ApiOkResponse({
    description: 'List of users retrieved with pagination',
    type: ApiResponseDto,
  })
  async findAll(
    @Req() req: UserRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    // Validate & convert to numbers if needed
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const limitNum = Number(limit) > 0 ? Number(limit) : 10;

    const result = await this.userService.findAll(req.user, pageNum, limitNum, search);

    return sendResponse(true, OK, 'List of users retrieved', result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user by ID' })
  @ApiOkResponse({
    description: 'User retrieved successfully',
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const res = await this.userService.findOne(id);
    return sendResponse(true, OK, 'User retrieved successfully', res);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const res = await this.userService.update(id, updateUserDto);
    return sendResponse(true, OK, 'User updated successfully', res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiOkResponse({
    description: 'User deleted successfully',
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async remove(@Param('id') id: string) {
    const res = await this.userService.remove(id);
    return sendResponse(true, OK, 'User deleted successfully', res);
  }
}