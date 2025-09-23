import {
    Controller,
    Req,
    Param,
    Get,
    Query,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiOkResponse, ApiTags,
    ApiQuery,
} from '@nestjs/swagger';
import { sendResponse } from 'src/common/utils/response.util';
import type { UserRequest } from 'src/shared/interfaces/user-request.interface';
import { HttpStatus } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

const { OK } = HttpStatus;

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('payments-records/:memberId')
    @ApiOperation({ summary: 'Get pending payment records for member' })
    @ApiOkResponse({ description: 'Pending payment records fetched successfully' })
    async getPaymentDetails(@Param('memberId') memberId: string, @Req() req: UserRequest) {
        const response = await this.analyticsService.getPendingPaymentsReportAgg(memberId, req.user);
        return sendResponse(true, OK, 'Pending payment records fetched successfully', response);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get dashboard stats' })
    @ApiOkResponse({ description: 'Dashboard stats fetched successfully' })
    async getDashboardStats(@Req() req: UserRequest) {
        const response = await this.analyticsService.getDashboardStats(req.user);
        return sendResponse(true, OK, 'Dashboard stats fetched successfully', response);
    }

    @Get('pending-members')
    @ApiOperation({ summary: 'Get members with pending payments (paginated, searchable)' })
    @ApiOkResponse({ description: 'Pending members fetched successfully' })
    @ApiQuery({ name: 'page', required: false, default: 1, description: 'Page number', type: Number })
    @ApiQuery({ name: 'limit', required: false, default: 10, description: 'Page size', type: Number })
    @ApiQuery({ name: 'search', required: false, description: 'Search string (first name / last name / phone number)' })
    async getPendingMembers(
        @Req() req: UserRequest,
        @Query('page') pageQuery?: string,
        @Query('limit') limitQuery?: string,
        @Query('search') search?: string,
    ) {
        const page = Math.max(1, Number.parseInt(pageQuery ?? '1', 10) || 1);
        const limit = Math.max(1, Number.parseInt(limitQuery ?? '10', 10) || 10);

        const response = await this.analyticsService.getPendingMembers(
            req.user,
            page,
            limit,
            search,
        );

        return sendResponse(true, OK, 'Pending members fetched successfully', response);
    }
}
