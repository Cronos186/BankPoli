/** Roles soportados por el escenario academico BankPoli. */
export enum RolUsuario {
  CLIENTE = 'CLIENTE',
  CAJERO = 'CAJERO',
  ADMINISTRADOR = 'ADMINISTRADOR',
}

/** Estados posibles de un usuario en el nucleo transaccional. */
export enum EstadoUsuario {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
}

/**
 * Modelo de dominio del usuario autenticado.
 *
 * Es la representacion que utiliza la aplicacion; no corresponde a la
 * estructura de tablas del sistema heredado (esa se resuelve en el adaptador).
 */
export class Usuario {
  constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly usuario: string,
    public readonly rol: RolUsuario,
    public readonly cuentaPrincipal: string | null,
    public readonly estado: EstadoUsuario,
  ) {}

  get activo(): boolean {
    return this.estado === EstadoUsuario.ACTIVO;
  }
}
