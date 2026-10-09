import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

/** Estructura uniforme de error devuelta por la API. */
export interface RespuestaError {
  statusCode: number;
  message: string | string[];
  error?: string;
  /** Codigo de negocio estable, interpretable por los canales digitales. */
  codigo?: string;
  path: string;
  timestamp: string;
}

/** Mensaje generico para fallos no controlados (no revela detalles internos). */
export const MENSAJE_ERROR_INTERNO = 'No fue posible procesar la operación.';

/** Nombre legible asociado a cada codigo HTTP utilizado por la API. */
const NOMBRES_ESTADO: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
};

/**
 * Filtro global de excepciones.
 *
 * Garantiza que la API nunca exponga informacion interna del proveedor
 * (nombres de tablas, sentencias SQL, direcciones, credenciales o trazas):
 *  - Las excepciones HTTP conocidas se responden con su codigo semantico.
 *  - Cualquier otro fallo se convierte en un 500 generico y se registra
 *    unicamente en los logs del servidor.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const contexto = host.switchToHttp();
    const respuesta = contexto.getResponse<Response>();
    const peticion = contexto.getRequest<Request>();

    if (exception instanceof HttpException) {
      const estado = exception.getStatus();
      respuesta.status(estado).json(this.construirRespuestaConocida(exception, estado, peticion.url));
      return;
    }

    const detalle = exception instanceof Error ? `${exception.name}: ${exception.message}` : String(exception);
    const traza = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(`Error no controlado en ${peticion.method} ${peticion.url}: ${detalle}`, traza);

    respuesta.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: MENSAJE_ERROR_INTERNO,
      codigo: 'ERROR_INTERNO',
      path: peticion.url,
      timestamp: new Date().toISOString(),
    } satisfies RespuestaError);
  }

  private construirRespuestaConocida(exception: HttpException, estado: number, path: string): RespuestaError {
    const cuerpo = exception.getResponse();

    if (typeof cuerpo === 'string') {
      return {
        statusCode: estado,
        message: cuerpo,
        error: NOMBRES_ESTADO[estado] ?? 'Error',
        path,
        timestamp: new Date().toISOString(),
      };
    }

    const datos = cuerpo as { message?: string | string[]; error?: string; codigo?: string };
    return {
      statusCode: estado,
      message: datos.message ?? exception.message,
      error: datos.error ?? NOMBRES_ESTADO[estado] ?? 'Error',
      codigo: datos.codigo,
      path,
      timestamp: new Date().toISOString(),
    };
  }
}
