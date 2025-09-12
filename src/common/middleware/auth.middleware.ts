import {
    Injectable,
    NestMiddleware,
    UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRequest } from 'src/shared/interfaces/user-request.interface';

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
    constructor(
        private readonly jwtService: JwtService,
    ) { }

    async use(req: UserRequest, res: Response, next: NextFunction) {
        // Extract JWT token from request headers
        const token = this.extractTokenFromHeader(req);
        if (!token) {
            throw new UnauthorizedException();
        }
        // Verify and decode JWT token
        try {
            const payload = await this.jwtService.verifyAsync(token);
            const userRole = payload.role;

            if (!userRole) {
                throw new UnauthorizedException('Unauthorized');
            }

            // Add user information to req object for access in route handlers
            req.user = payload;
        } catch (error) {
            console.error('Error decoding JWT token:', error);
            throw new UnauthorizedException('Unauthorized');
        }

        next();
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
