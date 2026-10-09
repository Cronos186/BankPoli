import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DatabaseConfig } from '../config/configuration';
import { NucleoLegacyNoDisponibleError } from './legacy-errors';
import {
  CuentaLegacy,
  LegacyCoreClient,
  ResultadoOperacionLegacy,
  SolicitudTransferenciaLegacy,
  TransferenciaLegacy,
  UsuarioLegacy,
} from './legacy-core.client';

/** Patron que debe cumplir el nombre del esquema para poder interpolarlo con seguridad. */
const PATRON_ESQUEMA = /^[a-z_][a-z0-9_]*$/;

/**
 * Fila devuelta por las rutinas de transferencias del core.
 * Los tipos reflejan lo que entrega el driver `pg`: `numeric` como texto y
 * `timestamptz` como Date.
 */
interface FilaTransferencia {
  id_trf: string;
  cta_org: string;
  cta_dst: string;
  val_trf: string;
  con_trf: string;
  est_trf: string;
  cod_err: string | null;
  fec_cre: Date | string;
  fec_pro: Date | string | null;
}

/**
 * Implementacion del puerto del core heredado sobre PostgreSQL.
 *
 * Toda la interaccion con el sistema existente se realiza invocando rutinas
 * almacenadas (`legacy.fn_*`), nunca mediante SQL embebido en los servicios de
 * aplicacion. Esto mantiene la logica transaccional donde reside actualmente:
 * en el nucleo heredado.
 */
@Injectable()
export class PostgresLegacyCoreClient extends LegacyCoreClient implements OnModuleInit, OnModuleDestroy {
  readonly motor = 'postgres';

  private readonly logger = new Logger(PostgresLegacyCoreClient.name);
  private readonly config: DatabaseConfig;
  private readonly esquema: string;
  private pool!: Pool;

  constructor(configService: ConfigService) {
    super();
    this.config = configService.getOrThrow<DatabaseConfig>('database');
    if (!PATRON_ESQUEMA.test(this.config.schema)) {
      throw new Error(`DB_SCHEMA invalido: "${this.config.schema}".`);
    }
    this.esquema = this.config.schema;
  }

  async onModuleInit(): Promise<void> {
    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      max: this.config.poolMax,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : undefined,
      application_name: 'bankpoli-api-legacy-wrapper',
    });

    this.pool.on('error', (error: Error) => {
      this.logger.error(`Error inesperado en el pool del core legacy: ${error.message}`);
    });

    try {
      await this.pool.query('SELECT 1');
      this.logger.log(
        `Conectado al nucleo transaccional simulado en ${this.config.host}:${this.config.port}/${this.config.database} (esquema ${this.esquema}).`,
      );
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error);
      this.logger.error(`No fue posible conectar con el nucleo transaccional: ${detalle}`);
      throw new Error(
        'No fue posible conectar con el nucleo transaccional (PostgreSQL). ' +
          'Verifique la configuracion DB_* o ejecute "npm run db:up".',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }

  async consultarCuenta(numeroCuenta: string): Promise<CuentaLegacy | null> {
    const filas = await this.consulta<CuentaLegacy>(`${this.esquema}.fn_consultar_cuenta`, [numeroCuenta]);
    return filas.length > 0 ? this.normalizarCuenta(filas[0]) : null;
  }

  async autenticarUsuario(usuario: string): Promise<UsuarioLegacy | null> {
    const filas = await this.consulta<UsuarioLegacy>(`${this.esquema}.fn_autenticar_usuario`, [usuario]);
    return filas.length > 0 ? filas[0] : null;
  }

  async procesarTransferencia(solicitud: SolicitudTransferenciaLegacy): Promise<ResultadoOperacionLegacy> {
    const filas = await this.consulta<ResultadoOperacionLegacy>(`${this.esquema}.fn_procesar_transferencia`, [
      solicitud.cta_org,
      solicitud.cta_dst,
      solicitud.val_trf,
      solicitud.con_trf,
    ]);

    if (filas.length === 0) {
      this.logger.error('La rutina transaccional no devolvio resultado.');
      throw new NucleoLegacyNoDisponibleError();
    }

    return filas[0];
  }

  async consultarTransferencia(id: string): Promise<TransferenciaLegacy | null> {
    const filas = await this.consulta<FilaTransferencia>(`${this.esquema}.fn_consultar_transferencia`, [id]);
    return filas.length > 0 ? this.normalizarTransferencia(filas[0]) : null;
  }

  async listarTransferencias(cuenta: string | null, limite: number): Promise<TransferenciaLegacy[]> {
    const filas = await this.consulta<FilaTransferencia>(`${this.esquema}.fn_listar_transferencias`, [cuenta, limite]);
    return filas.map((fila) => this.normalizarTransferencia(fila));
  }

  /**
   * Invoca una rutina almacenada del core heredado y traduce cualquier fallo
   * tecnico a un error controlado de infraestructura.
   */
  private async consulta<T>(rutina: string, parametros: unknown[]): Promise<T[]> {
    const marcadores = parametros.map((_, indice) => `$${indice + 1}`).join(', ');
    const sentencia = `SELECT * FROM ${rutina}(${marcadores})`;

    try {
      const resultado = await this.pool.query(sentencia, parametros);
      return resultado.rows as T[];
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error);
      this.logger.error(`Fallo al ejecutar ${rutina}: ${detalle}`);
      throw new NucleoLegacyNoDisponibleError();
    }
  }

  private normalizarCuenta(fila: CuentaLegacy): CuentaLegacy {
    return { ...fila, sal_cta: Number(fila.sal_cta).toFixed(2) };
  }

  private normalizarTransferencia(fila: FilaTransferencia): TransferenciaLegacy {
    return {
      id_trf: fila.id_trf,
      cta_org: fila.cta_org,
      cta_dst: fila.cta_dst,
      val_trf: Number(fila.val_trf).toFixed(2),
      con_trf: fila.con_trf,
      est_trf: fila.est_trf,
      cod_err: fila.cod_err,
      fec_cre: this.aFechaIso(fila.fec_cre),
      fec_pro: fila.fec_pro === null ? null : this.aFechaIso(fila.fec_pro),
    };
  }

  private aFechaIso(valor: Date | string): string {
    return valor instanceof Date ? valor.toISOString() : new Date(valor).toISOString();
  }
}
