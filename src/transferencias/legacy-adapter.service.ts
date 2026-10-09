import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Cuenta, EstadoCuenta } from '../cuentas/entities/cuenta.entity';
import { EstadoUsuario, RolUsuario, Usuario } from '../auth/entities/usuario.entity';
import {
  CODIGOS_ERROR_LEGACY,
  CuentaLegacy,
  LegacyCoreClient,
  ResultadoOperacionLegacy,
  TransferenciaLegacy,
  UsuarioLegacy,
} from '../legacy/legacy-core.client';
import {
  CuentaNoEncontradaError,
  ErrorNegocio,
  MismaCuentaError,
  NucleoLegacyNoDisponibleError,
  OperacionRechazadaError,
  TransferenciaNoEncontradaError,
} from '../legacy/legacy-errors';
import { EstadoTransferencia, Transferencia } from './entities/transferencia.entity';

/** Datos que la logica de aplicacion entrega al adaptador para ejecutar la transferencia. */
export interface SolicitudTransferenciaDominio {
  cuentaOrigen: string;
  cuentaDestino: string;
  monto: number;
  concepto: string;
}

/**
 * Legacy Wrapper del nucleo transaccional de BankPoli.
 *
 * Responsabilidades (patron Legacy Wrapper):
 *  1. Encapsular: es el unico componente de la aplicacion que conoce la
 *     existencia de `LegacyCoreClient` y de sus estructuras internas.
 *  2. Traducir: convierte el modelo de dominio (DTO en camelCase, montos
 *     numericos, fechas ISO) hacia y desde las estructuras del sistema
 *     heredado (nomenclatura abreviada, numeros como texto).
 *  3. Aislar fallos: transforma los codigos de rechazo del core en errores de
 *     negocio con significado para los canales digitales.
 *
 * Gracias a esta capa, si el core bancario cambia sus tablas o rutinas, el
 * cambio se absorbe aqui y los consumidores de la API REST no se ven afectados.
 */
@Injectable()
export class LegacyAdapterService {
  private readonly logger = new Logger(LegacyAdapterService.name);

  constructor(private readonly core: LegacyCoreClient) {}

  /** Motor del core que esta siendo envuelto (util para diagnostico). */
  get motorCore(): string {
    return this.core.motor;
  }

  /** Consulta una cuenta en el core heredado y la traduce al modelo de dominio. */
  async consultarCuenta(numeroCuenta: string): Promise<Cuenta> {
    const fila = await this.core.consultarCuenta(numeroCuenta);
    if (!fila) {
      throw new CuentaNoEncontradaError(numeroCuenta);
    }
    return this.aCuenta(fila);
  }

  /**
   * Verifica las credenciales contra el core heredado.
   *
   * El hash de la contrasena administrado por el sistema existente nunca sale
   * de esta capa: aqui se compara y solo se devuelve el modelo de dominio.
   * Devuelve null cuando el usuario no existe o la contrasena no coincide.
   */
  async autenticarUsuario(usuario: string, contrasena: string): Promise<Usuario | null> {
    const fila = await this.core.autenticarUsuario(usuario);
    if (!fila) {
      return null;
    }

    const coincide = await bcrypt.compare(contrasena, fila.pwd_usr);
    return coincide ? this.aUsuario(fila) : null;
  }

  /** Ejecuta la operacion transaccional en el core heredado. */
  async procesarTransferencia(solicitud: SolicitudTransferenciaDominio): Promise<Transferencia> {
    const resultado = await this.core.procesarTransferencia({
      cta_org: solicitud.cuentaOrigen,
      cta_dst: solicitud.cuentaDestino,
      val_trf: this.aValorLegacy(solicitud.monto),
      con_trf: solicitud.concepto,
    });

    if (resultado.est_trf !== 'PROCESADA' || !resultado.id_trf) {
      throw this.traducirRechazo(resultado, solicitud);
    }

    // Se relee la transferencia registrada para responder exactamente con lo que
    // el nucleo almaceno (fechas y estado reales), sin inventar datos.
    const registrada = await this.core.consultarTransferencia(resultado.id_trf);
    if (!registrada) {
      this.logger.error(`El core no devolvio la transferencia ${resultado.id_trf} recien procesada.`);
      throw new NucleoLegacyNoDisponibleError();
    }

    return this.aTransferencia(registrada);
  }

  /** Consulta una transferencia registrada en el core heredado. */
  async consultarTransferencia(id: string): Promise<Transferencia> {
    const fila = await this.core.consultarTransferencia(id);
    if (!fila) {
      throw new TransferenciaNoEncontradaError(id);
    }
    return this.aTransferencia(fila);
  }

  /** Lista las transferencias registradas, opcionalmente filtradas por cuenta. */
  async listarTransferencias(cuenta: string | null, limite: number): Promise<Transferencia[]> {
    const filas = await this.core.listarTransferencias(cuenta, limite);
    return filas.map((fila) => this.aTransferencia(fila));
  }

  // ---------------------------------------------------------------------------
  // Traduccion de estructuras legacy -> modelo de dominio
  // ---------------------------------------------------------------------------

  private aCuenta(fila: CuentaLegacy): Cuenta {
    return new Cuenta(
      fila.num_cta,
      fila.tit_cta,
      fila.tip_cta,
      fila.mon_cta,
      Number(fila.sal_cta),
      fila.est_cta as EstadoCuenta,
    );
  }

  private aUsuario(fila: UsuarioLegacy): Usuario {
    return new Usuario(
      fila.id_usr,
      fila.nom_usr,
      fila.log_usr,
      fila.rol_usr as RolUsuario,
      fila.num_cta,
      fila.est_usr as EstadoUsuario,
    );
  }

  private aTransferencia(fila: TransferenciaLegacy): Transferencia {
    return new Transferencia(
      fila.id_trf,
      fila.cta_org,
      fila.cta_dst,
      Number(fila.val_trf),
      fila.con_trf,
      fila.est_trf as EstadoTransferencia,
      fila.fec_cre,
      fila.fec_pro,
      fila.cod_err,
    );
  }

  /** El core heredado recibe los valores monetarios como texto con dos decimales. */
  private aValorLegacy(monto: number): string {
    return monto.toFixed(2);
  }

  /**
   * Convierte un rechazo del core heredado en un error de negocio con codigo
   * HTTP semantico.
   */
  private traducirRechazo(resultado: ResultadoOperacionLegacy, solicitud: SolicitudTransferenciaDominio): Error {
    const codigo = resultado.cod_err ?? 'OPERACION_RECHAZADA';
    const mensaje = resultado.msg_err ?? 'La operacion fue rechazada por el nucleo transaccional.';

    this.logger.warn(`Transferencia rechazada por el core heredado: ${codigo} - ${mensaje}`);

    switch (codigo) {
      case CODIGOS_ERROR_LEGACY.MISMA_CUENTA:
        return new MismaCuentaError();
      case CODIGOS_ERROR_LEGACY.CUENTA_ORIGEN_NO_EXISTE:
        return new CuentaNoEncontradaError(solicitud.cuentaOrigen);
      case CODIGOS_ERROR_LEGACY.CUENTA_DESTINO_NO_EXISTE:
        return new CuentaNoEncontradaError(solicitud.cuentaDestino);
      case CODIGOS_ERROR_LEGACY.SALDO_INSUFICIENTE:
        return new ErrorNegocio('SALDO_INSUFICIENTE', mensaje, HttpStatus.CONFLICT);
      case CODIGOS_ERROR_LEGACY.MONTO_INVALIDO:
        return new ErrorNegocio('MONTO_INVALIDO', mensaje, HttpStatus.BAD_REQUEST);
      case CODIGOS_ERROR_LEGACY.CUENTA_ORIGEN_INACTIVA:
      case CODIGOS_ERROR_LEGACY.CUENTA_DESTINO_INACTIVA:
        return new ErrorNegocio(codigo, mensaje, HttpStatus.UNPROCESSABLE_ENTITY);
      default:
        return new OperacionRechazadaError(codigo, mensaje);
    }
  }
}
