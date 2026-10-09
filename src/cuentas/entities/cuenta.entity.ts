/** Estados posibles de una cuenta en el nucleo transaccional. */
export enum EstadoCuenta {
  ACTIVA = 'ACTIVA',
  INACTIVA = 'INACTIVA',
  BLOQUEADA = 'BLOQUEADA',
}

/**
 * Modelo de dominio de una cuenta bancaria.
 *
 * El saldo se expresa como numero (pesos con dos decimales), independientemente
 * de la representacion que utilice internamente el core heredado.
 */
export class Cuenta {
  constructor(
    public readonly numero: string,
    public readonly titular: string,
    public readonly tipo: string,
    public readonly moneda: string,
    public readonly saldo: number,
    public readonly estado: EstadoCuenta,
  ) {}

  get activa(): boolean {
    return this.estado === EstadoCuenta.ACTIVA;
  }
}
