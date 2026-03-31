import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { DevExceptionFilter } from './common/filters/dev-exception.filter.js';
import { EnvSchema } from './config/env.schema.js';

function validateEnv() {
	const result = EnvSchema.safeParse(process.env);
	if (!result.success) {
		const issues = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
		process.stderr.write(`\nEnvironment validation failed:\n${issues}\n\n`);
		process.exit(1);
	}
	return result.data;
}

async function bootstrap() {
	validateEnv();

	const app = await NestFactory.create(AppModule);

	const swaggerEnabled = process.env.ENABLE_SWAGGER === 'true';

	app.use(
		helmet({
			contentSecurityPolicy: {
				directives: {
					defaultSrc: ["'self'"],
					scriptSrc: ["'self'", ...(swaggerEnabled ? ['https://cdn.jsdelivr.net'] : [])],
					styleSrc: ["'self'", "'unsafe-inline'"],
					imgSrc: ["'self'", 'data:', 'https://cf.geekdo-images.com', 'https://tile.jawg.io'],
					connectSrc: ["'self'", process.env.FRONTEND_URL ?? 'http://localhost:4200'],
					fontSrc: ["'self'", ...(swaggerEnabled ? ['https://cdn.jsdelivr.net'] : [])],
					objectSrc: ["'none'"],
					frameAncestors: ["'none'"],
				},
			},
			crossOriginEmbedderPolicy: false,
		}),
	);

	if (process.env.NODE_ENV !== 'production') {
		app.useGlobalFilters(new DevExceptionFilter());
	}

	app.setGlobalPrefix('api');
	app.enableVersioning({ type: VersioningType.URI });

	app.enableCors({
		origin: process.env.FRONTEND_URL ?? 'http://localhost:4200',
		credentials: true,
	});

	if (swaggerEnabled) {
		const config = new DocumentBuilder()
			.setTitle('GameNight Hub API')
			.setDescription('REST API for the GameNight Hub application')
			.setVersion('1.0')
			.addBearerAuth()
			.build();

		const document = SwaggerModule.createDocument(app, config);

		app.use(
			'/api/docs',
			apiReference({
				content: document,
			}),
		);
	}

	await app.listen(process.env.PORT ?? 3000);
}

process.on('uncaughtException', (err) => {
	process.stderr.write(`uncaughtException: ${err.stack ?? err.message}\n`);
	process.exit(1);
});
process.on('unhandledRejection', (reason) => {
	process.stderr.write(`unhandledRejection: ${String(reason)}\n`);
	process.exit(1);
});

bootstrap().catch((err: unknown) => {
	const message = err instanceof Error ? err.stack || err.message : String(err);
	process.stderr.write(`bootstrap() failed: ${message}\n`);
	process.exit(1);
});
