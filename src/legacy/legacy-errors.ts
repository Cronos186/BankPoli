import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Error de negocio controlado.
 *
 * Extiende HttpException para que el filtro global de excepciones pueda
 * responder con un codigo HTTP semantico y un identificador de error estable
 * que los canales digitales pueden interpretar, sin exponer detalles internos.
 */
export class ErrorNegocio extends HttpException {
  constructor(
    readonly codigo: string,
    mensaje: string,
    status: HttpStatus,
  ) {
    super({ statusCode: status, message: mensaje, codigo }, status);
  }
}

export class CuentaNoEncontradaError extends ErrorNegocio {
  constructor(numeroCuenta: string) {
    super('CUENTA_NO_ENCONTRADA', `La cuenta ${numeroCuenta} no existe.`, HttpStatus.NOT_FOUND);
  }
}

export class CuentaInactivaError extends ErrorNegocio {
  constructor(numeroCuenta: string, estado: string) {
    super(
      'CUENTA_INACTIVA',
      `La cuenta ${numeroCuenta} no se encuentra activa (estado: ${estado}).`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class SaldoInsuficienteError extends ErrorNegocio {
  constructor(saldoDisponible: number, montoSolicitado: number) {
    super(
      'SALDO_INSUFICIENTE',
      `Saldo insuficiente: disponible ${saldoDisponible.toFixed(2)}, solicitado ${montoSolicitado.toFixed(2)}.`,
      HttpStatus.CONFLICT,
    );
  }
}

export class MismaCuentaError extends ErrorNegocio {
  constructor() {
    super('MISMA_CUENTA', 'La cuenta de origen y la cuenta de destino deben ser diferentes.', HttpStatus.BAD_REQUEST);
  }
}

export class TransferenciaNoEncontradaError extends ErrorNegocio {
  constructor(id: string) {
    super(
      'TRANSFERENCIA_NO_ENCONTRADA',
      `No existe una transferencia con el identificador ${id}.`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class OperacionRechazadaError extends ErrorNegocio {
  constructor(codigo: string, mensaje: string) {
    super(codigo, mensaje, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

/**
 * Error de infraestructura del nucleo heredado.
 *
 * Su mensaje es deliberadamente generico: la causa tecnica se registra en los
 * logs del proveedor, nunca en la respuesta HTTP.
 */
export class NucleoLegacyNoDisponibleError extends ErrorNegocio {
  constructor() {
    super(
      'NUCLEO_NO_DISPONIBLE',
      'El nucleo transaccional no se encuentra disponible en este momento. Intente nuevamente mas tarde.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class CredencialesInvalidasError extends ErrorNegocio {
  constructor() {
    // Mensaje unico para usuario inexistente, clave incorrecta o usuario inactivo:
    // evita revelar que cuentas de usuario existen.
    super('CREDENCIALES_INVALIDAS', 'Usuario o contrasena incorrectos.', HttpStatus.UNAUTHORIZED);
  }
}
