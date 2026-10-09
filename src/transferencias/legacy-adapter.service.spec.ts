import { HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { LegacyAdapterService } from './legacy-adapter.service';
import { CuentaInactivaError, NucleoLegacyNoDisponibleError, SaldoInsuficienteError } from '../legacy/legacy-errors';
import {
  CuentaLegacy,
  LegacyCoreClient,
  ResultadoOperacionLegacy,
  SolicitudTransferenciaLegacy,
  TransferenciaLegacy,
  UsuarioLegacy,
} from '../legacy/legacy-core.client';

/** Doble de prueba del core heredado con respuestas controladas. */
class CoreFalso extends LegacyCoreClient {
  readonly motor = 'falso';

  cuenta: CuentaLegacy | null = null;
  usuario: UsuarioLegacy | null = null;
  resultado: ResultadoOperacionLegacy = { id_trf: null, est_trf: 'PROCESADA', cod_err: null, msg_err: null };
  transferencia: TransferenciaLegacy | null = null;
  ultimaSolicitud?: SolicitudTransferenciaLegacy;

  async consultarCuenta(): Promise<CuentaLegacy | null> {
    return this.cuenta;
  }

  async autenticarUsuario(): Promise<UsuarioLegacy | null> {
    return this.usuario;
  }

  async procesarTransferencia(solicitud: SolicitudTransferenciaLegacy): Promise<ResultadoOperacionLegacy> {
    this.ultimaSolicitud = solicitud;
    return this.resultado;
  }

  async consultarTransferencia(): Promise<TransferenciaLegacy | null> {
    return this.transferencia;
  }

  async listarTransferencias(): Promise<TransferenciaLegacy[]> {
    return this.transferencia ? [this.transferencia] : [];
  }
}

const HASH_CONTRASENA = bcrypt.hashSync('Cliente123*', 4);

const CUENTA_LEGACY: CuentaLegacy = {
  num_cta: '1000123456',
  tit_cta: 'Ana Maria Cliente',
  tip_cta: 'AHORROS',
  sal_cta: '2500000.00',
  est_cta: 'ACTIVA',
  mon_cta: 'COP',
};

const TRANSFERENCIA_LEGACY: TransferenciaLegacy = {
  id_trf: '4d3f2c1b-8a7e-4f6d-9c0b-1e2f3a4b5c6d',
  cta_org: '1000123456',
  cta_dst: '2000654321',
  val_trf: '250000.00',
  con_trf: 'Transferencia interbancaria',
  est_trf: 'PROCESADA',
  cod_err: null,
  fec_cre: '2026-10-01T12:00:00.000Z',
  fec_pro: '2026-10-01T12:00:00.120Z',
};

describe('LegacyAdapterService (Legacy Wrapper)', () => {
  let core: CoreFalso;
  let adapter: LegacyAdapterService;

  beforeEach(() => {
    core = new CoreFalso();
    adapter = new LegacyAdapterService(core);
  });

  it('expone el motor del core envuelto para diagnostico', () => {
    expect(adapter.motorCore).toBe('falso');
  });

  describe('consultarCuenta', () => {
    it('traduce la estructura legacy al modelo de dominio (saldo numerico y estado)', async () => {
      core.cuenta = { ...CUENTA_LEGACY };

      const cuenta = await adapter.consultarCuenta('1000123456');

      expect(cuenta.numero).toBe('1000123456');
      expect(cuenta.titular).toBe('Ana Maria Cliente');
      expect(cuenta.saldo).toBe(2500000);
      expect(typeof cuenta.saldo).toBe('number');
      expect(cuenta.activa).toBe(true);
    });

    it('lanza error de negocio 404 cuando la cuenta no existe en el core', async () => {
      core.cuenta = null;

      await expect(adapter.consultarCuenta('9999999999')).rejects.toMatchObject({
        codigo: 'CUENTA_NO_ENCONTRADA',
        status: HttpStatus.NOT_FOUND,
      });
    });
  });

  describe('autenticarUsuario', () => {
    it('devuelve el usuario cuando la contrasena coincide con el hash del core', async () => {
      core.usuario = {
        id_usr: 'id-1',
        log_usr: 'cliente1',
        nom_usr: 'Ana Maria Cliente',
        pwd_usr: HASH_CONTRASENA,
        rol_usr: 'CLIENTE',
        num_cta: '1000123456',
        est_usr: 'ACTIVO',
      };

      const usuario = await adapter.autenticarUsuario('cliente1', 'Cliente123*');

      expect(usuario?.usuario).toBe('cliente1');
      expect(usuario?.rol).toBe('CLIENTE');
      expect(usuario?.activo).toBe(true);
    });

    it('devuelve null cuando la contrasena no coincide (sin exponer el hash)', async () => {
      core.usuario = {
        id_usr: 'id-1',
        log_usr: 'cliente1',
        nom_usr: 'Ana Maria Cliente',
        pwd_usr: HASH_CONTRASENA,
        rol_usr: 'CLIENTE',
        num_cta: null,
        est_usr: 'ACTIVO',
      };

      await expect(adapter.autenticarUsuario('cliente1', 'otraClave123')).resolves.toBeNull();
    });

    it('devuelve null cuando el usuario no existe en el core', async () => {
      core.usuario = null;
      await expect(adapter.autenticarUsuario('nadie', 'Cliente123*')).resolves.toBeNull();
    });
  });

  describe('procesarTransferencia', () => {
    beforeEach(() => {
      core.resultado = { id_trf: TRANSFERENCIA_LEGACY.id_trf, est_trf: 'PROCESADA', cod_err: null, msg_err: null };
      core.transferencia = { ...TRANSFERENCIA_LEGACY };
    });

    it('convierte el monto a texto con dos decimales antes de invocar el core', async () => {
      await adapter.procesarTransferencia({
        cuentaOrigen: '1000123456',
        cuentaDestino: '2000654321',
        monto: 250000,
        concepto: 'Transferencia interbancaria',
      });

      expect(core.ultimaSolicitud).toEqual({
        cta_org: '1000123456',
        cta_dst: '2000654321',
        val_trf: '250000.00',
        con_trf: 'Transferencia interbancaria',
      });
    });

    it('devuelve la transferencia registrada en el core cuando la operacion es exitosa', async () => {
      const transferencia = await adapter.procesarTransferencia({
        cuentaOrigen: '1000123456',
        cuentaDestino: '2000654321',
        monto: 250000,
        concepto: 'Transferencia interbancaria',
      });

      expect(transferencia.id).toBe(TRANSFERENCIA_LEGACY.id_trf);
      expect(transferencia.monto).toBe(250000);
      expect(transferencia.aplicada).toBe(true);
      expect(transferencia.fechaProceso).toBe('2026-10-01T12:00:00.120Z');
    });

    it('traduce SALDO_INSUFICIENTE a un conflicto 409', async () => {
      core.resultado = { id_trf: null, est_trf: 'RECHAZADA', cod_err: 'SALDO_INSUFICIENTE', msg_err: 'Sin saldo.' };

      await expect(
        adapter.procesarTransferencia({
          cuentaOrigen: '1000123456',
          cuentaDestino: '2000654321',
          monto: 250000,
          concepto: 'Prueba',
        }),
      ).rejects.toMatchObject({ codigo: 'SALDO_INSUFICIENTE', status: HttpStatus.CONFLICT });
    });

    it('traduce MISMA_CUENTA a una solicitud invalida 400', async () => {
      core.resultado = { id_trf: null, est_trf: 'RECHAZADA', cod_err: 'MISMA_CUENTA', msg_err: 'Misma cuenta.' };

      await expect(
        adapter.procesarTransferencia({
          cuentaOrigen: '1000123456',
          cuentaDestino: '1000123456',
          monto: 1000,
          concepto: 'Prueba',
        }),
      ).rejects.toMatchObject({ codigo: 'MISMA_CUENTA', status: HttpStatus.BAD_REQUEST });
    });

    it('traduce un codigo desconocido a 422 sin filtrar el detalle tecnico', async () => {
      core.resultado = { id_trf: null, est_trf: 'RECHAZADA', cod_err: 'CODIGO_RARO', msg_err: 'Fallo del core.' };

      await expect(
        adapter.procesarTransferencia({
          cuentaOrigen: '1000123456',
          cuentaDestino: '2000654321',
          monto: 1000,
          concepto: 'Prueba',
        }),
      ).rejects.toMatchObject({ codigo: 'CODIGO_RARO', status: HttpStatus.UNPROCESSABLE_ENTITY });
    });

    it('informa indisponibilidad cuando el core no devuelve la transferencia registrada', async () => {
      core.transferencia = null;

      await expect(
        adapter.procesarTransferencia({
          cuentaOrigen: '1000123456',
          cuentaDestino: '2000654321',
          monto: 1000,
          concepto: 'Prueba',
        }),
      ).rejects.toBeInstanceOf(NucleoLegacyNoDisponibleError);
    });
  });

  describe('consultarTransferencia', () => {
    it('lanza 404 cuando la transferencia no existe', async () => {
      core.transferencia = null;

      await expect(adapter.consultarTransferencia('inexistente')).rejects.toMatchObject({
        codigo: 'TRANSFERENCIA_NO_ENCONTRADA',
        status: HttpStatus.NOT_FOUND,
      });
    });
  });

  it('expone los errores de negocio como excepciones HTTP controladas', () => {
    expect(new SaldoInsuficienteError(1000, 2000).getStatus()).toBe(HttpStatus.CONFLICT);
    expect(new CuentaInactivaError('3000111222', 'INACTIVA').getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });
});
