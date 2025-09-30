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
import { InstallmentService } from './installment.service';
import { CreateInstallmentDto } from 'src/shared/dtos/installment/create-installment.dto';
import { UpdateInstallmentPaymentDto } from 'src/shared/dtos/installment/update-installment-payment.dto';
import { sendResponse } from 'src/common/utils/response.util';
import type { UserRequest } from 'src/shared/interfaces/user-request.interface';
import { HttpStatus } from '@nestjs/common';

const { OK, CREATED } = HttpStatus;

@ApiTags('Installments')
@ApiBearerAuth()
@Controller('installment')
export class InstallmentController {
    constructor(private readonly installmentService: InstallmentService) { }

    @Post()
    @ApiOperation({ summary: 'Create installment and payment records for members' })
    @ApiBody({ type: CreateInstallmentDto })
    @ApiCreatedResponse({ description: 'Installment created and payments initialized' })
    async create(@Body() createInstallmentDto: CreateInstallmentDto, @Req() req: UserRequest) {
        const response = await this.installmentService.create(createInstallmentDto, req.user);
        return sendResponse(true, CREATED, 'Installment created successfully', response);
    }

    @Patch(':installmentId/payment/:memberId')
    @ApiOperation({ summary: 'Mark or unmark all installment payments for a member' })
    @ApiBody({ type: UpdateInstallmentPaymentDto })
    @ApiOkResponse({ description: 'Payment status updated' })
    @ApiNotFoundResponse({ description: 'Installment payment record not found' })
    async markPayment(
        @Param('installmentId') installmentId: string,
        @Param('memberId') memberId: string,
        @Body() updateDto: UpdateInstallmentPaymentDto,
        @Req() req: UserRequest
    ) {
        const response = await this.installmentService.markPayment(
            installmentId,
            memberId,
            updateDto,
            req.user
        );
        return sendResponse(true, OK, 'Payment status updated successfully', response);
    }


    @Delete(':installmentId')
    @ApiOperation({ summary: 'Delete installment and its payment records' })
    @ApiOkResponse({ description: 'Installment and payment records deleted successfully' })
    @ApiNotFoundResponse({ description: 'Installment not found or access denied' })
    async delete(@Param('installmentId') installmentId: string, @Req() req: UserRequest) {
        await this.installmentService.delete(installmentId, req.user);
        return sendResponse(true, OK, 'Installment and payment records deleted successfully', null);
    }

    @Get(':committeeId')
    @ApiOperation({ summary: 'Get installments for user\'s committees' })
    @ApiQuery({ name: 'page', required: false, default: 1, type: Number, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, default: 10, type: Number, description: 'Number of items per page' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for filtering installments by amount' })
    @ApiOkResponse({ description: 'Installments fetched' })
    async getInstallments(
        @Param('committeeId') committeeId: string,
        @Req() req: UserRequest,
        @Query('page') page = 1,
        @Query('limit') limit = 10,
        @Query('search') search?: string,
    ) {
        const pageNum = Number(page) > 0 ? Number(page) : 1;
        const limitNum = Number(limit) > 0 ? Number(limit) : 10;

        const response = await this.installmentService.getInstallments(committeeId, req.user, pageNum, limitNum, search);
        return sendResponse(true, OK, 'Installments fetched successfully', response);
    }

    @Get(':installmentId/payments')
    @ApiOperation({ summary: 'Get payment records for an installment' })
    @ApiQuery({ name: 'page', required: false, default: 1, type: Number, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, default: 10, type: Number, description: 'Number of items per page' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for filtering payments by amount' })
    @ApiOkResponse({ description: 'Payment records fetched' })
    async getPaymentsForInstallment(
        @Param('installmentId') installmentId: string,
        @Req() req: UserRequest,
        @Query('page') page = 1,
        @Query('limit') limit = 10,
        @Query('search') search?: string
    ) {
        const pageNum = Number(page) > 0 ? Number(page) : 1;
        const limitNum = Number(limit) > 0 ? Number(limit) : 10;

        const response = await this.installmentService.getPaymentsForInstallment(installmentId, req.user, pageNum, limitNum, search);
        return sendResponse(true, OK, 'Payment records fetched successfully', response);
    }

    @Get(':committeeId/available-members')
    @ApiOperation({ summary: 'Get available members for an installment of a committee' })
    @ApiOkResponse({ description: 'Available members fetched successfully' })
    async getAvailableMembers(@Param('committeeId') committeeId: string, @Req() req: UserRequest,) {
        const response = await this.installmentService.getAvailableMembersForCommittee(committeeId, req.user);
        return sendResponse(true, OK, 'Available members fetched successfully', response);
    }

    @Get('payments/:paymentId')
    @ApiOperation({ summary: 'Get payment record for an installment' })
    @ApiOkResponse({ description: 'Payment record fetched successfully' })
    async getPaymentDetails(@Param('paymentId') paymentId: string, @Req() req: UserRequest) {
        const response = await this.installmentService.getPaymentDetails(paymentId, req.user);
        return sendResponse(true, OK, 'Payment record fetched successfully', response);
    }
}
