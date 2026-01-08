import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    BadRequestException,
    ConflictException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class DatabaseErrorFilter implements ExceptionFilter {
    private readonly logger = new Logger(DatabaseErrorFilter.name);

    catch(exception: QueryFailedError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        // Cast to any to access database-specific properties
        const dbException = exception as any;

        // Log the full error for debugging
        this.logger.error('Database Error:', exception.message);

        // Handle duplicate key constraint violations
        if (dbException.code === '23505') {
            const detail = dbException.detail || '';
            let message = 'This record already exists';
            let field = 'unknown';

            // Parse the detail message to identify which field
            if (detail.includes('email')) {
                message = 'Email already registered. Please use a different email or login.';
                field = 'email';
            } else if (detail.includes('username')) {
                message = 'Username already taken. Please choose a different username.';
                field = 'username';
            }

            return response.status(409).json({
                statusCode: 409,
                error: 'Conflict',
                message,
                field,
                timestamp: new Date().toISOString(),
            });
        }

        // Handle foreign key constraint violations
        if (dbException.code === '23503') {
            return response.status(400).json({
                statusCode: 400,
                error: 'Bad Request',
                message: 'Referenced record does not exist',
                timestamp: new Date().toISOString(),
            });
        }

        // Handle not null constraint violations
        if (dbException.code === '23502') {
            return response.status(400).json({
                statusCode: 400,
                error: 'Bad Request',
                message: 'Required field is missing',
                timestamp: new Date().toISOString(),
            });
        }

        // Handle check constraint violations
        if (dbException.code === '23514') {
            return response.status(400).json({
                statusCode: 400,
                error: 'Bad Request',
                message: 'Invalid data provided',
                timestamp: new Date().toISOString(),
            });
        }

        // Default database error
        this.logger.error('Unhandled database error:', {
            code: (exception as any).code,
            message: exception.message,
        });

        return response.status(500).json({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'Database operation failed',
            timestamp: new Date().toISOString(),
        });
    }
}
