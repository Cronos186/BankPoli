import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import {
  CuentaLegacy,
  LegacyCoreClient,
  ResultadoOperacionLegacy,
  SolicitudTransferenciaLegacy,
  TransferenciaLegacy,
  UsuarioLegacy,
} from './legacy-core.client';
import { CUENTAS_SEMILLA, USUARIOS_SEMILLA } from './legacy-seed.data';

/** Costo de bcrypt usado al simular el almacenamiento de contrasenas del core. */
const COSTO_BCRYPT = 10;

/**
 * Implementacion en memoria del nucleo transaccional heredado.
 *
 * Reproduce el comportamiento de las rutinas almacenadas de PostgreSQL
 * (`fn_procesar_transferencia`, `fn_consultar_cuenta`, ...) sin requerir una
 * base de datos. Se usa para demostraciones y para las pruebas automatizadas.
 * NO se debe usar en produccion.
 */
@Injectable()
export class InMemoryLegacyCoreClient extends LegacyCoreClient {
  readonly motor = 'memory';

  private readonly logger = new Logger(InMemoryLegacyCoreClient.name);

  private readonly cuentas = new Map<string, CuentaLegacy>();
  private readonly usuarios = new Map<string, UsuarioLegacy>();
  private readonly transferencias = new Map<string, TransferenciaLegacy>();

  constructor() {
    super();
    this.cargarSemilla();
    this.logger.warn(
      'Nucleo transaccional simulado EN MEMORIA activo (DB_DRIVER=memory). Los datos se reinician en cada arranque.',
    );
  }

  private cargarSemilla(): void {
    for (const cuenta of CUENTAS_SEMILLA) {
      this.cuentas.set(cuenta.num_cta, { ...cuenta });
    }

    for (const usuario of USUARIOS_SEMILLA) {
      this.usuarios.set(usuario.log_usr, {
        id_usr: randomUUID(),
        log_usr: usuario.log_usr,
        nom_usr: usuario.nom_usr,
        pwd_usr: bcrypt.hashSync(usuario.password, COSTO_BCRYPT),
        rol_usr: usuario.rol_usr,
        num_cta: usuario.num_cta,
        est_usr: usuario.est_usr,
      });
    }
  }

  async consultarCuenta(numeroCuenta: string): Promise<CuentaLegacy | null> {
    const cuenta = this.cuentas.get(numeroCuenta);
    return cuenta ? { ...cuenta } : null;
  }

  async autenticarUsuario(usuario: string): Promise<UsuarioLegacy | null> {
    const encontrado = this.usuarios.get(usuario);
    return encontrado ? { ...encontrado } : null;
  }

  async procesarTransferencia(solicitud: SolicitudTransferenciaLegacy): Promise<ResultadoOperacionLegacy> {
    const valor = Number(solicitud.val_trf);

    if (!Number.isFinite(valor) || valor <= 0) {
      return this.rechazo('MONTO_INVALIDO', 'El monto de la transferencia debe ser mayor que cero.');
    }

    if (solicitud.cta_org === solicitud.cta_dst) {
      return this.rechazo('MISMA_CUENTA', 'La cuenta de origen y la cuenta de destino no pueden ser la misma.');
    }

    const origen = this.cuentas.get(solicitud.cta_org);
    if (!origen) {
      return this.rechazo('CUENTA_ORIGEN_NO_EXISTE', 'La cuenta de origen no existe en el nucleo.');
    }

    const destino = this.cuentas.get(solicitud.cta_dst);
    if (!destino) {
      return this.rechazo('CUENTA_DESTINO_NO_EXISTE', 'La cuenta de destino no existe en el nucleo.');
    }

    if (origen.est_cta !== 'ACTIVA') {
      return this.rechazo('CUENTA_ORIGEN_INACTIVA', `La cuenta de origen esta ${origen.est_cta}.`);
    }

    if (destino.est_cta !== 'ACTIVA') {
      return this.rechazo('CUENTA_DESTINO_INACTIVA', `La cuenta de destino esta ${destino.est_cta}.`);
    }

    if (Number(origen.sal_cta) < valor) {
      return this.rechazo('SALDO_INSUFICIENTE', 'La cuenta de origen no tiene saldo disponible suficiente.');
    }

    const id = randomUUID();
    const ahora = new Date().toISOString();

    // Aplicacion atomica del debito y el credito, equivalente a la transaccion
    // que ejecuta la rutina almacenada en PostgreSQL.
    origen.sal_cta = (Number(origen.sal_cta) - valor).toFixed(2);
    destino.sal_cta = (Number(destino.sal_cta) + valor).toFixed(2);

    this.transferencias.set(id, {
      id_trf: id,
      cta_org: solicitud.cta_org,
      cta_dst: solicitud.cta_dst,
      val_trf: valor.toFixed(2),
      con_trf: solicitud.con_trf,
      est_trf: 'PROCESADA',
      cod_err: null,
      fec_cre: ahora,
      fec_pro: ahora,
    });

    return {
      id_trf: id,
      est_trf: 'PROCESADA',
      cod_err: null,
      msg_err: 'Transferencia procesada correctamente por el nucleo transaccional.',
    };
  }

  async consultarTransferencia(id: string): Promise<TransferenciaLegacy | null> {
    const transferencia = this.transferencias.get(id);
    return transferencia ? { ...transferencia } : null;
  }

  async listarTransferencias(cuenta: string | null, limite: number): Promise<TransferenciaLegacy[]> {
    return [...this.transferencias.values()]
      .filter((transferencia) => !cuenta || transferencia.cta_org === cuenta || transferencia.cta_dst === cuenta)
      .sort((a, b) => b.fec_cre.localeCompare(a.fec_cre))
      .slice(0, limite)
      .map((transferencia) => ({ ...transferencia }));
  }

  private rechazo(codigo: string, mensaje: string): ResultadoOperacionLegacy {
    return { id_trf: null, est_trf: 'RECHAZADA', cod_err: codigo, msg_err: mensaje };
  }
}
