import { HttpStatus } from "@nestjs/common";

export function sendResponse<T>(
    success: boolean,
    statusCode: HttpStatus,
    message: string,
    data: T,
) {
    return {
        statusCode,
        message,
        data,
        success,
    };
}
