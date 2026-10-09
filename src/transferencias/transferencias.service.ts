import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { RolUsuario } from '../auth/entities/usuario.entity';
import { UsuarioAutenticado } from '../auth/interfaces/usuario-autenticado.interface';
import { CuentaInactivaError, MismaCuentaError, SaldoInsuficienteError } from '../legacy/legacy-errors';
import { CrearTransferenciaDto } from './dto/crear-transferencia.dto';
import { ListarTransferenciasQueryDto } from './dto/consulta-transferencia.dto';
import { Transferencia } from './entities/transferencia.entity';
import { LegacyAdapterService } from './legacy-adapter.service';

/** Cantidad de resultados por defecto al listar transferencias. */
const LIMITE_POR_DEFECTO = 20;

/**
 * Servicio de transferencias: orquestador de la operacion financiera.
 *
 * Concentra la logica de aplicacion del caso de estudio (validaciones de
 * negocio, orden de las verificaciones, trazabilidad) y delega toda interaccion
 * con el nucleo transaccional en el Legacy Wrapper. Los controladores no
 * conocen ni el nucleo heredado ni sus mecanismos de acceso.
 */
@Injectable()
export class TransferenciasService {
  private readonly logger = new Logger(TransferenciasService.name);

  constructor(private readonly adapter: LegacyAdapterService) {}

  /**
   * Procesa una transferencia interbancaria.
   *
   * Flujo: validacion de la solicitud -> verificacion de la cuenta de origen y
   * su saldo disponible -> verificacion de la cuenta de destino -> ejecucion
   * atomica en el nucleo transaccional.
   */
  async crear(dto: CrearTransferenciaDto, usuario: UsuarioAutenticado): Promise<Transferencia> {
    if (dto.cuentaOrigen === dto.cuentaDestino) {
      throw new MismaCuentaError();
    }

    const cuentaOrigen = await this.adapter.consultarCuenta(dto.cuentaOrigen);
    if (!cuentaOrigen.activa) {
      throw new CuentaInactivaError(cuentaOrigen.numero, cuentaOrigen.estado);
    }
    if (cuentaOrigen.saldo < dto.monto) {
      throw new SaldoInsuficienteError(cuentaOrigen.saldo, dto.monto);
    }

    const cuentaDestino = await this.adapter.consultarCuenta(dto.cuentaDestino);
    if (!cuentaDestino.activa) {
      throw new CuentaInactivaError(cuentaDestino.numero, cuentaDestino.estado);
    }

    const transferencia = await this.adapter.procesarTransferencia({
      cuentaOrigen: dto.cuentaOrigen,
      cuentaDestino: dto.cuentaDestino,
      monto: dto.monto,
      concepto: dto.concepto,
    });

    this.logger.log(
      `Transferencia ${transferencia.id} por ${transferencia.monto.toFixed(2)} ${cuentaOrigen.moneda} ` +
        `de ${transferencia.cuentaOrigen} a ${transferencia.cuentaDestino} solicitada por "${usuario.usuario}" (${usuario.rol}).`,
    );

    return transferencia;
  }

  /** Consulta una transferencia por su identificador aplicando control de acceso. */
  async obtener(id: string, usuario: UsuarioAutenticado): Promise<Transferencia> {
    const transferencia = await this.adapter.consultarTransferencia(id);

    if (usuario.rol === RolUsuario.CLIENTE && !transferencia.involucraCuenta(usuario.cuentaPrincipal)) {
      this.logger.warn(
        `El usuario "${usuario.usuario}" intento consultar la transferencia ${id} sin ser parte de la operacion.`,
      );
      throw new ForbiddenException('No tiene permisos para consultar esta transferencia.');
    }

    return transferencia;
  }

  /** Lista transferencias segun el rol del solicitante. */
  async listar(usuario: UsuarioAutenticado, filtros: ListarTransferenciasQueryDto): Promise<Transferencia[]> {
    const limite = filtros.limite ?? LIMITE_POR_DEFECTO;

    if (usuario.rol === RolUsuario.CLIENTE) {
      if (filtros.cuenta && filtros.cuenta !== usuario.cuentaPrincipal) {
        throw new ForbiddenException('Un cliente solo puede consultar las transferencias de su cuenta principal.');
      }
      if (!usuario.cuentaPrincipal) {
        return [];
      }
      return this.adapter.listarTransferencias(usuario.cuentaPrincipal, limite);
    }

    return this.adapter.listarTransferencias(filtros.cuenta ?? null, limite);
  }
}
