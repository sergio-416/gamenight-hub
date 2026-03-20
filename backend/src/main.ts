import { VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module.js";
import { DevExceptionFilter } from "./common/filters/dev-exception.filter.js";
import { EnvSchema } from "./config/env.schema.js";

function validateEnv() {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    process.stderr.write(`\nEnvironment validation failed:\n${issues}\n\n`);
    process.exit(1);
  }
  return result.data;
}

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: [
            "'self'",
            "data:",
            "https://cf.geekdo-images.com",
            "https://tile.jawg.io",
          ],
          connectSrc: [
            "'self'",
            process.env.FRONTEND_URL ?? "http://localhost:4200",
          ],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  if (process.env.NODE_ENV !== "production") {
    app.useGlobalFilters(new DevExceptionFilter());
  }

  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI });

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:4200",
    credentials: true,
  });

  if (process.env.ENABLE_SWAGGER === "true") {
    const config = new DocumentBuilder()
      .setTitle("GameNight Hub API")
      .setDescription("REST API for the GameNight Hub application")
      .setVersion("1.0")
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}

process.on("uncaughtException", (err) => {
  process.stderr.write(`uncaughtException: ${err.stack ?? err.message}\n`);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  process.stderr.write(`unhandledRejection: ${String(reason)}\n`);
  process.exit(1);
});

bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.stack || err.message : String(err);
  process.stderr.write(`bootstrap() failed: ${message}\n`);
  process.exit(1);
});
