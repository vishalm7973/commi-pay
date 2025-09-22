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
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation,
  ApiTags, ApiNotFoundResponse,
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { CommitteeService } from './committee.service';
import { sendResponse } from 'src/common/utils/response.util';
import { CreateCommitteeDto } from 'src/shared/dtos/committee/create-committee.dto';
import type { UserRequest } from 'src/shared/interfaces/user-request.interface';
import { UpdateCommitteeDto } from 'src/shared/dtos/committee/update-committee.dto';
const { OK, CREATED } = HttpStatus;

@ApiTags('Committee')
@ApiBearerAuth()
@Controller('committee')
export class CommitteeController {
  constructor(private readonly committeeService: CommitteeService) { }

  @Post()
  @ApiOperation({ summary: 'Create a committee' })
  @ApiBody({ type: CreateCommitteeDto })
  @ApiCreatedResponse({ description: 'Committee created successfully' })
  async create(@Body() createCommitteeDto: CreateCommitteeDto, @Req() req: UserRequest) {
    const response = await this.committeeService.create(createCommitteeDto, req.user);
    return sendResponse(true, CREATED, 'Committee created successfully', response);
  }

  @Get()
  @ApiOperation({ summary: 'Get all committees' })
  @ApiQuery({ name: 'page', required: false, default: 1, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, default: 10, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for filtering committees by amount' })
  @ApiOkResponse({ description: 'Committees fetched successfully' })
  async findAll(
    @Req() req: UserRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
  ) {
    // Validate & convert to numbers if needed
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const limitNum = Number(limit) > 0 ? Number(limit) : 10;

    const result = await this.committeeService.findAll(req.user, pageNum, limitNum, search);
    return sendResponse(true, OK, 'Committees fetched successfully', result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get committee by ID' })
  @ApiNotFoundResponse({ description: 'Committee not found' })
  async findById(@Param('id') id: string, @Req() req: UserRequest) {
    const response = await this.committeeService.findById(id, req.user);
    return sendResponse(true, OK, 'Committee fetched successfully', response);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update committee by ID' })
  @ApiOkResponse({ description: 'Committee updated successfully' })
  @ApiNotFoundResponse({ description: 'Committee not found' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateCommitteeDto, @Req() req: UserRequest) {
    const response = await this.committeeService.update(id, updateDto, req.user);
    return sendResponse(true, OK, 'Committee updated successfully', response);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete committee by ID' })
  @ApiOkResponse({ description: 'Committee deleted successfully' })
  @ApiNotFoundResponse({ description: 'Committee not found' })
  async delete(@Param('id') id: string, @Req() req: UserRequest) {
    await this.committeeService.delete(id, req.user);
    return sendResponse(true, OK, 'Committee deleted successfully', null);
  }
}
