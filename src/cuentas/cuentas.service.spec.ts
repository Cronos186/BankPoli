import { CuentasService } from './cuentas.service';
import { InMemoryLegacyCoreClient } from '../legacy/in-memory-legacy-core.client';
import { LegacyAdapterService } from '../transferencias/legacy-adapter.service';

describe('CuentasService', () => {
  let servicio: CuentasService;

  beforeEach(() => {
    servicio = new CuentasService(new LegacyAdapterService(new InMemoryLegacyCoreClient()));
  });

  it('consulta el saldo disponible de una cuenta existente', async () => {
    const cuenta = await servicio.consultarCuenta('1000123456');

    expect(cuenta.numero).toBe('1000123456');
    expect(cuenta.saldo).toBe(2500000);
    expect(cuenta.moneda).toBe('COP');
    expect(cuenta.activa).toBe(true);
  });

  it('informa una cuenta inactiva sin ocultar su estado', async () => {
    const cuenta = await servicio.consultarCuenta('3000111222');

    expect(cuenta.estado).toBe('INACTIVA');
    expect(cuenta.activa).toBe(false);
  });

  it('lanza 404 cuando la cuenta no existe en el nucleo transaccional', async () => {
    await expect(servicio.consultarCuenta('9999999999')).rejects.toMatchObject({
      codigo: 'CUENTA_NO_ENCONTRADA',
      status: 404,
    });
  });
});
