import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApi, RUTA_DOCUMENTACION } from './app.setup';

/**
 * Punto de entrada del proveedor de servicios REST de BankPoli.
 *
 * HTTPS/TLS se termina en el proxy inverso del despliegue; en desarrollo la API
 * escucha en HTTP sobre localhost.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const puerto = configService.getOrThrow<number>('port');
  const entorno = configService.getOrThrow<string>('nodeEnv');

  app.enableShutdownHooks();
  configurarApi(app);

  await app.listen(puerto);

  const logger = new Logger('Bootstrap');
  logger.log(`API BankPoli disponible en http://localhost:${puerto}/api/v1 (entorno: ${entorno})`);
  logger.log(`Catalogo de servicios (OpenAPI 3.x + Swagger UI): http://localhost:${puerto}/${RUTA_DOCUMENTACION}`);
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(`No fue posible iniciar la API: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
