import { ArgumentsHost, BadRequestException, HttpStatus, NotFoundException } from '@nestjs/common';
import { HttpExceptionFilter, MENSAJE_ERROR_INTERNO, RespuestaError } from './http-exception.filter';
import { CuentaNoEncontradaError } from '../../legacy/legacy-errors';

interface RespuestaCapturada {
  estado: number;
  cuerpo: RespuestaError;
}

function crearHost(): { host: ArgumentsHost; capturada: RespuestaCapturada } {
  const capturada: RespuestaCapturada = { estado: 0, cuerpo: {} as RespuestaError };

  const respuesta = {
    status(codigo: number) {
      capturada.estado = codigo;
      return this;
    },
    json(cuerpo: RespuestaError) {
      capturada.cuerpo = cuerpo;
      return this;
    },
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => respuesta,
      getRequest: () => ({ url: '/api/v1/transferencias', method: 'POST' }),
    }),
  } as unknown as ArgumentsHost;

  return { host, capturada };
}

describe('HttpExceptionFilter', () => {
  let filtro: HttpExceptionFilter;

  beforeEach(() => {
    filtro = new HttpExceptionFilter();
  });

  it('conserva el codigo y el mensaje de las excepciones de negocio', () => {
    const { host, capturada } = crearHost();

    filtro.catch(new CuentaNoEncontradaError('9999999999'), host);

    expect(capturada.estado).toBe(HttpStatus.NOT_FOUND);
    expect(capturada.cuerpo.codigo).toBe('CUENTA_NO_ENCONTRADA');
    expect(capturada.cuerpo.message).toContain('9999999999');
    expect(capturada.cuerpo.path).toBe('/api/v1/transferencias');
  });

  it('mantiene la lista de mensajes de validacion de la ValidationPipe', () => {
    const { host, capturada } = crearHost();

    filtro.catch(new BadRequestException(['El monto debe ser mayor que cero.']), host);

    expect(capturada.estado).toBe(HttpStatus.BAD_REQUEST);
    expect(capturada.cuerpo.message).toEqual(['El monto debe ser mayor que cero.']);
  });

  it('normaliza el nombre del estado HTTP de las excepciones conocidas', () => {
    const { host, capturada } = crearHost();

    filtro.catch(new NotFoundException('Recurso no encontrado.'), host);

    expect(capturada.cuerpo.error).toBe('Not Found');
  });

  it('oculta los detalles internos cuando ocurre un fallo no controlado', () => {
    const { host, capturada } = crearHost();
    const errorInterno = new Error('relation "legacy.cuentas" does not exist (SQL: SELECT * FROM ...)');

    filtro.catch(errorInterno, host);

    expect(capturada.estado).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(capturada.cuerpo.message).toBe(MENSAJE_ERROR_INTERNO);
    expect(capturada.cuerpo.codigo).toBe('ERROR_INTERNO');
    expect(JSON.stringify(capturada.cuerpo)).not.toContain('legacy.cuentas');
  });
});
