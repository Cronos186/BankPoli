/**
 * Contrato de acceso al nucleo transaccional heredado (core legacy).
 *
 * Este contrato es la frontera del patron Legacy Wrapper: es el unico punto por
 * el cual la aplicacion puede interactuar con el sistema heredado. Las
 * estructuras que se declaran aqui son deliberadamente "crudas": reflejan la
 * nomenclatura abreviada y los tipos del modelo de datos legacy (por ejemplo,
 * los valores numericos viajan como texto), de modo que cualquier detalle del
 * sistema existente quede confinado a la capa de adaptacion.
 */

/** Estructura cruda de una cuenta del core heredado. */
export interface CuentaLegacy {
  num_cta: string;
  tit_cta: string;
  tip_cta: string;
  /** Saldo tal como lo entrega el core (texto con dos decimales). */
  sal_cta: string;
  /** ACTIVA | INACTIVA | BLOQUEADA */
  est_cta: string;
  mon_cta: string;
}

/** Estructura cruda de un usuario registrado en el core heredado. */
export interface UsuarioLegacy {
  id_usr: string;
  log_usr: string;
  nom_usr: string;
  /** Hash de la contrasena administrado por el sistema heredado. */
  pwd_usr: string;
  rol_usr: string;
  /** Cuenta principal asociada al usuario, si aplica. */
  num_cta: string | null;
  /** ACTIVO | INACTIVO */
  est_usr: string;
}

/** Estructura cruda de una transferencia registrada en el core heredado. */
export interface TransferenciaLegacy {
  id_trf: string;
  cta_org: string;
  cta_dst: string;
  val_trf: string;
  con_trf: string;
  /** PROCESADA | RECHAZADA */
  est_trf: string;
  cod_err: string | null;
  /** Fecha en formato ISO 8601 UTC. */
  fec_cre: string;
  fec_pro: string | null;
}

/** Parametros que espera la rutina transaccional del core heredado. */
export interface SolicitudTransferenciaLegacy {
  cta_org: string;
  cta_dst: string;
  val_trf: string;
  con_trf: string;
}

/** Resultado devuelto por la rutina transaccional del core heredado. */
export interface ResultadoOperacionLegacy {
  /** Identificador de la transferencia. Es null cuando la operacion fue rechazada. */
  id_trf: string | null;
  est_trf: string;
  cod_err: string | null;
  msg_err: string | null;
}

/**
 * Codigos de error que el core heredado devuelve como parte de su contrato
 * interno (no son errores de infraestructura, son rechazos de negocio).
 */
export const CODIGOS_ERROR_LEGACY = {
  MONTO_INVALIDO: 'MONTO_INVALIDO',
  MISMA_CUENTA: 'MISMA_CUENTA',
  CUENTA_ORIGEN_NO_EXISTE: 'CUENTA_ORIGEN_NO_EXISTE',
  CUENTA_DESTINO_NO_EXISTE: 'CUENTA_DESTINO_NO_EXISTE',
  CUENTA_ORIGEN_INACTIVA: 'CUENTA_ORIGEN_INACTIVA',
  CUENTA_DESTINO_INACTIVA: 'CUENTA_DESTINO_INACTIVA',
  SALDO_INSUFICIENTE: 'SALDO_INSUFICIENTE',
} as const;

export type CodigoErrorLegacy = keyof typeof CODIGOS_ERROR_LEGACY;

/**
 * Puerto de salida hacia el core transaccional heredado.
 *
 * Se implementa mediante una clase abstracta para poder usarla como token de
 * inyeccion de dependencias y permitir varias implementaciones (PostgreSQL o
 * memoria) sin cambiar el resto de la aplicacion.
 */
export abstract class LegacyCoreClient {
  /** Nombre del motor que implementa el nucleo, usado en trazas y diagnostico. */
  abstract readonly motor: string;

  /** Ejecuta la rutina heredada de consulta de cuenta. */
  abstract consultarCuenta(numeroCuenta: string): Promise<CuentaLegacy | null>;

  /** Ejecuta la rutina heredada de autenticacion de usuario. */
  abstract autenticarUsuario(usuario: string): Promise<UsuarioLegacy | null>;

  /** Ejecuta la rutina transaccional heredada que aplica el debito y el credito. */
  abstract procesarTransferencia(solicitud: SolicitudTransferenciaLegacy): Promise<ResultadoOperacionLegacy>;

  /** Consulta una transferencia previamente registrada en el core heredado. */
  abstract consultarTransferencia(id: string): Promise<TransferenciaLegacy | null>;

  /** Lista las transferencias registradas, opcionalmente filtradas por cuenta. */
  abstract listarTransferencias(cuenta: string | null, limite: number): Promise<TransferenciaLegacy[]>;
}
