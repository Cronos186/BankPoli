import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { RolUsuario } from './entities/usuario.entity';
import { configuracionDePruebas } from '../config/configuration.fixture';
import { InMemoryLegacyCoreClient } from '../legacy/in-memory-legacy-core.client';
import { LegacyAdapterService } from '../transferencias/legacy-adapter.service';

describe('AuthService', () => {
  const configuracion = configuracionDePruebas();
  const configService = new ConfigService(configuracion);
  const jwtService = new JwtService();
  let adapter: LegacyAdapterService;
  let servicio: AuthService;

  beforeEach(() => {
    adapter = new LegacyAdapterService(new InMemoryLegacyCoreClient());
    servicio = new AuthService(adapter, jwtService, configService);
  });

  it('autentica un usuario valido y emite un token JWT verificable', async () => {
    const respuesta = await servicio.login({ usuario: 'cliente1', contrasena: 'Cliente123*' });

    expect(respuesta.tokenType).toBe('Bearer');
    expect(respuesta.expiresIn).toBe(configuracion.jwt.expiresInSeconds);
    expect(respuesta.usuario).toEqual({
      id: expect.any(String),
      usuario: 'cliente1',
      nombre: 'Ana Maria Cliente',
      rol: RolUsuario.CLIENTE,
      cuentaPrincipal: '1000123456',
    });

    const payload = await jwtService.verifyAsync(respuesta.accessToken, {
      secret: configuracion.jwt.secret,
      issuer: configuracion.jwt.issuer,
      audience: configuracion.jwt.audience,
    });

    expect(payload.sub).toBe(respuesta.usuario.id);
    expect(payload.rol).toBe(RolUsuario.CLIENTE);
    expect(payload.cuentaPrincipal).toBe('1000123456');
  });

  it('rechaza credenciales con contrasena incorrecta sin revelar la causa', async () => {
    await expect(servicio.login({ usuario: 'cliente1', contrasena: 'ClaveEquivocada1' })).rejects.toMatchObject({
      codigo: 'CREDENCIALES_INVALIDAS',
      status: 401,
    });
  });

  it('rechaza un usuario inexistente con el mismo error que una contrasena incorrecta', async () => {
    await expect(servicio.login({ usuario: 'noexiste', contrasena: 'Cliente123*' })).rejects.toMatchObject({
      codigo: 'CREDENCIALES_INVALIDAS',
      status: 401,
    });
  });

  it('rechaza un usuario inactivo aunque la contrasena sea correcta', async () => {
    await expect(servicio.login({ usuario: 'inactivo1', contrasena: 'Cliente123*' })).rejects.toMatchObject({
      codigo: 'CREDENCIALES_INVALIDAS',
      status: 401,
    });
  });

  it('no incluye el hash de la contrasena en la respuesta', async () => {
    const respuesta = await servicio.login({ usuario: 'admin1', contrasena: 'Admin123*' });

    expect(JSON.stringify(respuesta)).not.toContain('$2');
    expect(respuesta.usuario.rol).toBe(RolUsuario.ADMINISTRADOR);
    expect(respuesta.usuario.cuentaPrincipal).toBeNull();
  });
});
