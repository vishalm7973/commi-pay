import {
    Controller,
    Post,
    Body,
    Req,
    Patch,
    Param,
    Get,
    Delete,
    Query,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody, ApiCreatedResponse, ApiOperation,
    ApiOkResponse, ApiTags,
    ApiNotFoundResponse,
    ApiQuery,
} from '@nestjs/swagger';
import { CreateInstallmentDto } from 'src/shared/dtos/installment/create-installment.dto';
import { UpdateInstallmentPaymentDto } from 'src/shared/dtos/installment/update-installment-payment.dto';
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
}
