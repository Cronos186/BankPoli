/** Estados en los que puede quedar una transferencia interbancaria. */
export enum EstadoTransferencia {
  PROCESADA = 'PROCESADA',
  RECHAZADA = 'RECHAZADA',
}

/**
 * Modelo de dominio de una transferencia interbancaria.
 *
 * Es la representacion estable que se expone a los canales digitales a traves
 * de los DTO de respuesta, con independencia de las estructuras del nucleo
 * heredado.
 */
export class Transferencia {
  constructor(
    public readonly id: string,
    public readonly cuentaOrigen: string,
    public readonly cuentaDestino: string,
    public readonly monto: number,
    public readonly concepto: string,
    public readonly estado: EstadoTransferencia,
    public readonly fechaCreacion: string,
    public readonly fechaProceso: string | null,
    public readonly codigoError: string | null,
  ) {}

  /** Indica si la transferencia afecto los saldos de las cuentas involucradas. */
  get aplicada(): boolean {
    return this.estado === EstadoTransferencia.PROCESADA;
  }

  /** Indica si la cuenta participa en la transferencia (como origen o destino). */
  involucraCuenta(numeroCuenta: string | null): boolean {
    if (!numeroCuenta) {
      return false;
    }
    return this.cuentaOrigen === numeroCuenta || this.cuentaDestino === numeroCuenta;
  }
}
