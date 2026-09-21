import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.use(helmet());

  app.enableCors({
    origin:
      process.env.CORS_ORIGIN?.split(",") ?? [
        "http://localhost:3000",
      ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("ReportHub API")
    .setDescription(
      "API for Social Media Content Reporting System",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  SwaggerModule.setup(
    "docs",
    app,
    SwaggerModule.createDocument(app, config),
  );

  await app.listen(
    Number(process.env.PORT || 4000),
    "0.0.0.0",
  );
}

bootstrap();
