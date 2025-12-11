import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as express from "express";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Increase payload size limit for large drawings/notes
	app.use(express.json({ limit: "50mb" }));
	app.use(express.urlencoded({ limit: "50mb", extended: true }));

	// Allow multiple frontend URLs in development
	const allowedOrigins = [
		process.env.FRONTEND_URL || "http://localhost:5173",
		"http://localhost:8080",
		"http://localhost:3000",
		"http://localhost:5174",
	];

	app.enableCors({
		origin: (origin, callback) => {
			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) return callback(null, true);

			if (allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
	});

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	const port = process.env.PORT || 3001;
	await app.listen(port);

	console.log(`🚀 Server is running on http://localhost:${port}`);
	console.log(`📊 API endpoints available at http://localhost:${port}/api`);
	console.log(`💚 Health check: http://localhost:${port}/api/health`);
}
bootstrap();
