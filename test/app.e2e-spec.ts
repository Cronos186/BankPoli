import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApi } from '../src/app.setup';

/**
 * Pruebas de integracion de la API REST de BankPoli.
 *
 * Se ejecutan con DB_DRIVER=memory (ver test/jest-setup.ts), de modo que la
 * suite es autocontenida y no requiere PostgreSQL ni Docker.
 */
describe('API REST BankPoli (e2e)', () => {
  let app: INestApplication;

  const PREFIJO = '/api/v1';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configurarApi(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const servidor = () => app.getHttpServer();

  async function iniciarSesion(usuario: string, contrasena: string): Promise<string> {
    const respuesta = await request(servidor()).post(`${PREFIJO}/auth/login`).send({ usuario, contrasena }).expect(200);
    return respuesta.body.accessToken as string;
  }

  async function consultarSaldo(numero: string, token: string): Promise<number> {
    const respuesta = await request(servidor())
      .get(`${PREFIJO}/cuentas/${numero}/saldo`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    return respuesta.body.saldo as number;
  }

  describe('Estado del servicio y catalogo de contratos', () => {
    it('expone un recurso publico de health', async () => {
      const respuesta = await request(servidor()).get(`${PREFIJO}/health`).expect(200);

      expect(respuesta.body.estado).toBe('UP');
      expect(respuesta.body.motorNucleo).toBe('memory');
    });

    it('publica la especificacion OpenAPI 3.x y Swagger UI en /api/docs', async () => {
      await request(servidor()).get('/api/docs').expect(200);

      const documento = await request(servidor()).get('/api/docs-json').expect(200);
      expect(documento.body.openapi).toMatch(/^3\./);
      expect(Object.keys(documento.body.paths)).toEqual(
        expect.arrayContaining([
          '/api/v1/auth/login',
          '/api/v1/transferencias',
          '/api/v1/transferencias/{id}',
          '/api/v1/cuentas/{numero}/saldo',
        ]),
      );
      expect(documento.body.components.securitySchemes.JWT).toBeDefined();
    });
  });

  describe('Autenticacion', () => {
    it('rechaza el acceso a los servicios protegidos sin token (401)', async () => {
      const respuesta = await request(servidor()).get(`${PREFIJO}/cuentas/1000123456/saldo`).expect(401);

      expect(respuesta.body.statusCode).toBe(401);
      expect(respuesta.body.codigo).toBeUndefined();
    });

    it('rechaza un token manipulado (401)', async () => {
      await request(servidor())
        .get(`${PREFIJO}/cuentas/1000123456/saldo`)
        .set('Authorization', 'Bearer token.falso.invalido')
        .expect(401);
    });

    it('autentica un usuario valido y devuelve el token JWT (200)', async () => {
      const respuesta = await request(servidor())
        .post(`${PREFIJO}/auth/login`)
        .send({ usuario: 'cliente1', contrasena: 'Cliente123*' })
        .expect(200);

      expect(respuesta.body.tokenType).toBe('Bearer');
      expect(respuesta.body.expiresIn).toBe(3600);
      expect(respuesta.body.accessToken.split('.')).toHaveLength(3);
      expect(respuesta.body.usuario.rol).toBe('CLIENTE');
      expect(respuesta.body.usuario.cuentaPrincipal).toBe('1000123456');
    });

    it('rechaza credenciales invalidas con un mensaje unico (401)', async () => {
      const incorrecta = await request(servidor())
        .post(`${PREFIJO}/auth/login`)
        .send({ usuario: 'cliente1', contrasena: 'NoEsLaClave1' })
        .expect(401);

      const inexistente = await request(servidor())
        .post(`${PREFIJO}/auth/login`)
        .send({ usuario: 'usuario.inexistente', contrasena: 'NoEsLaClave1' })
        .expect(401);

      expect(incorrecta.body.codigo).toBe('CREDENCIALES_INVALIDAS');
      expect(incorrecta.body.message).toBe(inexistente.body.message);
    });

    it('rechaza un cuerpo invalido con la lista de errores de validacion (400)', async () => {
      const respuesta = await request(servidor())
        .post(`${PREFIJO}/auth/login`)
        .send({ usuario: 'cliente1', contrasena: 'corta' })
        .expect(400);

      expect(Array.isArray(respuesta.body.message)).toBe(true);
      expect(respuesta.body.message.join(' ')).toContain('8 caracteres');
    });

    it('devuelve el perfil del usuario autenticado', async () => {
      const token = await iniciarSesion('cajero1', 'Cajero123*');

      const respuesta = await request(servidor())
        .get(`${PREFIJO}/auth/perfil`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(respuesta.body.usuario).toBe('cajero1');
      expect(respuesta.body.rol).toBe('CAJERO');
    });
  });

  describe('Consulta de cuentas', () => {
    let token: string;

    beforeAll(async () => {
      token = await iniciarSesion('cliente1', 'Cliente123*');
    });

    it('devuelve el saldo disponible de una cuenta existente (200)', async () => {
      const respuesta = await request(servidor())
        .get(`${PREFIJO}/cuentas/1000123456/saldo`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(respuesta.body).toMatchObject({
        numero: '1000123456',
        moneda: 'COP',
        estado: 'ACTIVA',
        disponible: true,
      });
      expect(typeof respuesta.body.saldo).toBe('number');
    });

    it('informa 404 cuando la cuenta no existe', async () => {
      const respuesta = await request(servidor())
        .get(`${PREFIJO}/cuentas/9999999999/saldo`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(respuesta.body.codigo).toBe('CUENTA_NO_ENCONTRADA');
    });

    it('informa 400 cuando el numero de cuenta no tiene el formato esperado', async () => {
      await request(servidor()).get(`${PREFIJO}/cuentas/123/saldo`).set('Authorization', `Bearer ${token}`).expect(400);
    });
  });

  describe('Transferencias', () => {
    let tokenCliente: string;
    let tokenCajero: string;
    let tokenAdmin: string;

    beforeAll(async () => {
      tokenCliente = await iniciarSesion('cliente1', 'Cliente123*');
      tokenCajero = await iniciarSesion('cajero1', 'Cajero123*');
      tokenAdmin = await iniciarSesion('admin1', 'Admin123*');
    });

    it('procesa una transferencia y refleja el debito en la cuenta de origen (201)', async () => {
      const saldoAntes = await consultarSaldo('1000123456', tokenCliente);

      const respuesta = await request(servidor())
        .post(`${PREFIJO}/transferencias`)
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          cuentaOrigen: '1000123456',
          cuentaDestino: '2000654321',
          monto: 250000,
          concepto: 'Transferencia interbancaria',
        })
        .expect(201);

      expect(respuesta.body).toMatchObject({
        cuentaOrigen: '1000123456',
        cuentaDestino: '2000654321',
        monto: 250000,
        estado: 'PROCESADA',
        codigoError: null,
      });
      expect(respuesta.body.id).toMatch(/^[0-9a-f-]{36}$/);

      expect(await consultarSaldo('1000123456', tokenCliente)).toBe(saldoAntes - 250000);
    });

    it('permite consultar el estado de una transferencia creada (200)', async () => {
      const creada = await request(servidor())
        .post(`${PREFIJO}/transferencias`)
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ cuentaOrigen: '1000123456', cuentaDestino: '2000654321', monto: 1000, concepto: 'Consulta posterior' })
        .expect(201);

      const respuesta = await request(servidor())
        .get(`${PREFIJO}/transferencias/${creada.body.id}`)
        .set('Authorization', `Bearer ${tokenCliente}`)
        .expect(200);

      expect(respuesta.body.id).toBe(creada.body.id);
      expect(respuesta.body.estado).toBe('PROCESADA');
    });

    it('informa 404 al consultar una transferencia inexistente', async () => {
      const respuesta = await request(servidor())
        .get(`${PREFIJO}/transferencias/11111111-1111-4111-8111-111111111111`)
        .set('Authorization', `Bearer ${tokenCliente}`)
        .expect(404);

      expect(respuesta.body.codigo).toBe('TRANSFERENCIA_NO_ENCONTRADA');
    });

    it('rechaza la transferencia entre la misma cuenta (400)', async () => {
      const respuesta = await request(servidor())
        .post(`${PREFIJO}/transferencias`)
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ cuentaOrigen: '1000123456', cuentaDestino: '1000123456', monto: 1000, concepto: 'Misma cuenta' })
        .expect(400);

      expect(respuesta.body.codigo).toBe('MISMA_CUENTA');
    });

    it('rechaza la operacion cuando el saldo es insuficiente (409)', async () => {
      const respuesta = await request(servidor())
        .post(`${PREFIJO}/transferencias`)
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ cuentaOrigen: '4000123456', cuentaDestino: '2000654321', monto: 500000, concepto: 'Sin saldo' })
        .expect(409);

      expect(respuesta.body.codigo).toBe('SALDO_INSUFICIENTE');
    });

    it('rechaza la operacion cuando la cuenta de origen esta inactiva (422)', async () => {
      const respuesta = await request(servidor())
        .post(`${PREFIJO}/transferencias`)
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ cuentaOrigen: '3000111222', cuentaDestino: '2000654321', monto: 1000, concepto: 'Cuenta inactiva' })
        .expect(422);

      expect(respuesta.body.codigo).toBe('CUENTA_INACTIVA');
    });

    it('rechaza montos invalidos con la lista de errores de validacion (400)', async () => {
      const respuesta = await request(servidor())
        .post(`${PREFIJO}/transferencias`)
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ cuentaOrigen: '1000123456', cuentaDestino: '2000654321', monto: -100, concepto: 'Monto invalido' })
        .expect(400);

      expect(Array.isArray(respuesta.body.message)).toBe(true);
    });

    it('rechaza campos no declarados en el contrato (400)', async () => {
      await request(servidor())
        .post(`${PREFIJO}/transferencias`)
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          cuentaOrigen: '1000123456',
          cuentaDestino: '2000654321',
          monto: 1000,
          concepto: 'Campo extra',
          saldo: 999999,
        })
        .expect(400);
    });

    it('devuelve 403 cuando el rol no esta autorizado para crear transferencias', async () => {
      const respuesta = await request(servidor())
        .post(`${PREFIJO}/transferencias`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ cuentaOrigen: '1000123456', cuentaDestino: '2000654321', monto: 1000, concepto: 'No autorizado' })
        .expect(403);

      expect(respuesta.body.statusCode).toBe(403);
    });

    it('impide que un cliente consulte una transferencia en la que no participa (403)', async () => {
      const ajena = await request(servidor())
        .post(`${PREFIJO}/transferencias`)
        .set('Authorization', `Bearer ${tokenCajero}`)
        .send({ cuentaOrigen: '4000123456', cuentaDestino: '2000654321', monto: 500, concepto: 'Operacion de caja' })
        .expect(201);

      await request(servidor())
        .get(`${PREFIJO}/transferencias/${ajena.body.id}`)
        .set('Authorization', `Bearer ${tokenCliente}`)
        .expect(403);
    });

    it('lista las transferencias del cliente y del administrador segun su alcance', async () => {
      const propias = await request(servidor())
        .get(`${PREFIJO}/transferencias`)
        .set('Authorization', `Bearer ${tokenCliente}`)
        .expect(200);

      expect(propias.body.total).toBeGreaterThan(0);
      for (const transferencia of propias.body.transferencias) {
        expect([transferencia.cuentaOrigen, transferencia.cuentaDestino]).toContain('1000123456');
      }

      const todas = await request(servidor())
        .get(`${PREFIJO}/transferencias?limite=50`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(todas.body.total).toBeGreaterThanOrEqual(propias.body.total);
    });

    it('prohibe al cliente filtrar transferencias de una cuenta ajena (403)', async () => {
      await request(servidor())
        .get(`${PREFIJO}/transferencias?cuenta=2000654321`)
        .set('Authorization', `Bearer ${tokenCliente}`)
        .expect(403);
    });

    it('exige autenticacion en todos los recursos de transferencias (401)', async () => {
      await request(servidor()).get(`${PREFIJO}/transferencias`).expect(401);
      await request(servidor()).post(`${PREFIJO}/transferencias`).send({}).expect(401);
    });
  });
});
