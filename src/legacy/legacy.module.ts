import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '../config/configuration';
import { LegacyAdapterService } from '../transferencias/legacy-adapter.service';
import { InMemoryLegacyCoreClient } from './in-memory-legacy-core.client';
import { LegacyCoreClient } from './legacy-core.client';
import { PostgresLegacyCoreClient } from './postgres-legacy-core.client';

/**
 * Modulo que publica la capa de integracion con el sistema heredado.
 *
 * Se declara global porque el Legacy Wrapper es una capacidad compartida: los
 * servicios de cuentas y de transferencias la consumen, pero ninguno de ellos
 * conoce la tecnologia del nucleo transaccional.
 */
@Global()
@Module({
  providers: [
    {
      provide: LegacyCoreClient,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): LegacyCoreClient => {
        const { driver } = configService.getOrThrow<DatabaseConfig>('database');
        if (driver === 'postgres') {
          return new PostgresLegacyCoreClient(configService);
        }
        Logger.warn(
          'DB_DRIVER=memory: se utiliza el nucleo transaccional simulado en memoria (solo desarrollo y pruebas).',
          'LegacyModule',
        );
        return new InMemoryLegacyCoreClient();
      },
    },
    LegacyAdapterService,
  ],
  exports: [LegacyCoreClient, LegacyAdapterService],
})
export class LegacyModule {}
