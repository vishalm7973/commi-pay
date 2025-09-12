import {
    Controller,
    Post,
    Body,
    Req,
    Patch,
    Param,
    Get,
    Delete,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody, ApiCreatedResponse, ApiOperation,
    ApiOkResponse, ApiTags,
    ApiNotFoundResponse,
} from '@nestjs/swagger';
import { InstallmentService } from './installment.service';
import { CreateInstallmentDto } from 'src/shared/dtos/installment/create-installment.dto';
import { UpdateInstallmentPaymentDto } from 'src/shared/dtos/installment/update-installment-payment.dto';
import { sendResponse } from 'src/common/utils/response.util';
import type { UserRequest } from 'src/shared/interfaces/user-request.interface';
import { HttpStatus } from '@nestjs/common';

const { OK, CREATED } = HttpStatus;

@ApiTags('installment')
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

    @Patch('/payment/:paymentId')
    @ApiOperation({ summary: 'Mark or unmark an installment payment for a member' })
    @ApiBody({ type: UpdateInstallmentPaymentDto })
    @ApiOkResponse({ description: 'Payment status updated' })
    @ApiNotFoundResponse({ description: 'Installment payment record not found' })
    async markPayment(
        @Param('paymentId') paymentId: string,
        @Body() updateDto: UpdateInstallmentPaymentDto,
        @Req() req: UserRequest
    ) {
        const response = await this.installmentService.markPayment(paymentId, updateDto, req.user);
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
    @ApiOkResponse({ description: 'Installments fetched' })
    async getInstallments(@Param('committeeId') committeeId: string, @Req() req: UserRequest) {
        const response = await this.installmentService.getInstallments(committeeId, req.user);
        return sendResponse(true, OK, 'Installments fetched successfully', response);
    }

    @Get(':installmentId/payments')
    @ApiOperation({ summary: 'Get payment records for an installment' })
    @ApiOkResponse({ description: 'Payment records fetched' })
    async getPaymentsForInstallment(@Param('installmentId') installmentId: string, @Req() req: UserRequest) {
        const response = await this.installmentService.getPaymentsForInstallment(installmentId, req.user);
        return sendResponse(true, OK, 'Payment records fetched successfully', response);
    }
}
