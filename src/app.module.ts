import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import configuration from './config/configuration';
import { CuentasModule } from './cuentas/cuentas.module';
import { LegacyModule } from './legacy/legacy.module';
import { TransferenciasModule } from './transferencias/transferencias.module';

/**
 * Modulo raiz de la API REST de BankPoli.
 *
 * Registra de forma global los mecanismos transversales de la arquitectura:
 *  - JwtAuthGuard: autenticacion obligatoria por defecto.
 *  - RolesGuard: autorizacion por roles.
 *  - HttpExceptionFilter: proteccion de errores internos.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      envFilePath: ['.env'],
    }),
    LegacyModule,
    AuthModule,
    CuentasModule,
    TransferenciasModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
