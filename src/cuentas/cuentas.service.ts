import { Injectable, Logger } from '@nestjs/common';
import { LegacyAdapterService } from '../transferencias/legacy-adapter.service';
import { Cuenta } from './entities/cuenta.entity';

/**
 * Servicio de gestion de informacion de cuentas.
 *
 * Expone la capacidad de negocio "consultar saldo" reutilizando la capa de
 * integracion; no accede a tablas ni a procedimientos del nucleo heredado.
 */
@Injectable()
export class CuentasService {
  private readonly logger = new Logger(CuentasService.name);

  constructor(private readonly adapter: LegacyAdapterService) {}

  /** Obtiene la cuenta y su saldo disponible. */
  async consultarCuenta(numero: string): Promise<Cuenta> {
    const cuenta = await this.adapter.consultarCuenta(numero);
    this.logger.log(`Consulta de saldo de la cuenta ${numero} atendida (estado ${cuenta.estado}).`);
    return cuenta;
  }
}
