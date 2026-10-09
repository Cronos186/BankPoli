import { Module } from '@nestjs/common';
import { TransferenciasController } from './transferencias.controller';
import { TransferenciasService } from './transferencias.service';

/**
 * Modulo de transferencias.
 *
 * LegacyAdapterService y LegacyCoreClient son provistos por LegacyModule
 * (modulo global), de modo que esta capa de negocio no declara dependencias
 * con el sistema heredado.
 */
@Module({
  controllers: [TransferenciasController],
  providers: [TransferenciasService],
  exports: [TransferenciasService],
})
export class TransferenciasModule {}
