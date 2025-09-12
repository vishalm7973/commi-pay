import { Body, Controller, Get, HttpStatus, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from 'src/shared/dtos/auth/login.dto';
import { ApiResponseDto } from 'src/shared/dtos/api-response/api.response.dto';
import { sendResponse } from 'src/common/utils/response.util';
const { OK } = HttpStatus;

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Admin login with email and password' })
    @ApiOkResponse({
        description: 'Login successfully',
        type: ApiResponseDto,
    })
    async login(@Body() authLoginDto: LoginDto) {
        const response = await this.authService.login(authLoginDto.email, authLoginDto.password);
        return sendResponse(true, OK, 'Login successfully', response);
    }

    @Get()
    @ApiOperation({ summary: 'testing......' })
    async test() {
        return sendResponse(true, OK, 'It is working........', null);
    }
}
