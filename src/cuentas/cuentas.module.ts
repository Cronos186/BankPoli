import { Module } from '@nestjs/common';
import { CuentasController } from './cuentas.controller';
import { CuentasService } from './cuentas.service';

/** Modulo de cuentas: consulta de cuentas y saldos disponibles. */
@Module({
  controllers: [CuentasController],
  providers: [CuentasService],
  exports: [CuentasService],
})
export class CuentasModule {}
