import {
	type ArgumentsHost,
	Catch,
	type ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class DevExceptionFilter implements ExceptionFilter {
	readonly #logger = new Logger('DevExceptionFilter');

	catch(exception: unknown, host: ArgumentsHost): void {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		const status =
			exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

		const message = exception instanceof Error ? exception.message : String(exception);

		const stack = exception instanceof Error ? exception.stack : undefined;

		this.#logger.error(`[${status}] ${message}`, stack ?? '(no stack)');

		response.status(status).json({
			statusCode: status,
			message,
			...(stack ? { stack } : {}),
		});
	}
}
