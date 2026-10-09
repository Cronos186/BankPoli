import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

/** Ruta relativa donde se publica la documentacion del contrato de la API. */
export const RUTA_DOCUMENTACION = 'api/docs';

export interface OpcionesConfiguracionApi {
  /** Permite omitir Swagger UI (por ejemplo, durante las pruebas de integracion). */
  conDocumentacion?: boolean;
}

/**
 * Aplica la configuracion transversal de la API.
 *
 * Se comparte entre el arranque real (main.ts) y las pruebas de integracion,
 * de modo que ambos entornos validen exactamente las mismas reglas de
 * versionado, validacion y documentacion.
 */
export function configurarApi(app: INestApplication, opciones: OpcionesConfiguracionApi = {}): void {
  const configService = app.get(ConfigService);
  const corsOrigins = configService.getOrThrow<string[]>('corsOrigins');

  app.use(
    helmet({
      // La interfaz de Swagger UI requiere recursos en linea; la politica CSP se
      // delega al proxy inverso que termina TLS en un despliegue real.
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.enableCors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: false,
    maxAge: 3600,
  });

  app.setGlobalPrefix('api');

  // Versionado por URI: /api/v1/...
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validateCustomDecorators: true,
      validationError: { target: false, value: false },
    }),
  );

  if (opciones.conDocumentacion !== false) {
    configurarDocumentacion(app);
  }
}

/** Publica la especificacion OpenAPI 3.x y Swagger UI (catalogo de servicios). */
function configurarDocumentacion(app: INestApplication): void {
  const configuracion = new DocumentBuilder()
    .setTitle('BankPoli - API de transferencias interbancarias')
    .setDescription(
      [
        'API REST del escenario academico BankPoli que expone las capacidades de transferencias',
        'interbancarias del nucleo transaccional heredado mediante el patron Legacy Wrapper.',
        '',
        '**Autenticacion:** obtenga un token en `POST /api/v1/auth/login` y envíelo como',
        '`Authorization: Bearer <token>` en los servicios protegidos.',
        '',
        '**Roles:** CLIENTE, CAJERO y ADMINISTRADOR.',
        '',
        '**Nota:** escenario academico simulado; no se procesa dinero real.',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .setContact('Grupo 1 - Arquitectura de Software', 'https://www.poli.edu.co', 'grupo1@bankpoli.local')
    .addServer('http://localhost:3000', 'Entorno local de desarrollo')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido en POST /api/v1/auth/login',
      },
      'JWT',
    )
    .addTag('Autenticación', 'Autenticacion de consumidores y emision de tokens JWT.')
    .addTag('Cuentas', 'Consulta de cuentas y saldos disponibles.')
    .addTag('Transferencias', 'Creacion, consulta y listado de transferencias interbancarias.')
    .addTag('Estado del servicio', 'Verificacion de disponibilidad de la API.')
    .build();

  const documento = SwaggerModule.createDocument(app, configuracion, {
    operationIdFactory: (controllerKey: string, methodKey: string) => `${controllerKey}_${methodKey}`,
  });

  SwaggerModule.setup(RUTA_DOCUMENTACION, app, documento, {
    customSiteTitle: 'BankPoli - Contrato de la API REST',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      displayRequestDuration: true,
    },
    jsonDocumentUrl: `${RUTA_DOCUMENTACION}-json`,
    yamlDocumentUrl: `${RUTA_DOCUMENTACION}-yaml`,
  });
}
