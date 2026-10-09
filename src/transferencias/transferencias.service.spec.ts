import { RolUsuario } from '../auth/entities/usuario.entity';
import { UsuarioAutenticado } from '../auth/interfaces/usuario-autenticado.interface';
import { InMemoryLegacyCoreClient } from '../legacy/in-memory-legacy-core.client';
import { CrearTransferenciaDto } from './dto/crear-transferencia.dto';
import { EstadoTransferencia } from './entities/transferencia.entity';
import { LegacyAdapterService } from './legacy-adapter.service';
import { TransferenciasService } from './transferencias.service';

const CLIENTE: UsuarioAutenticado = {
  id: 'u-cliente',
  usuario: 'cliente1',
  nombre: 'Ana Maria Cliente',
  rol: RolUsuario.CLIENTE,
  cuentaPrincipal: '1000123456',
};

const CAJERO: UsuarioAutenticado = {
  id: 'u-cajero',
  usuario: 'cajero1',
  nombre: 'Marta Cajera',
  rol: RolUsuario.CAJERO,
  cuentaPrincipal: null,
};

const ADMINISTRADOR: UsuarioAutenticado = {
  id: 'u-admin',
  usuario: 'admin1',
  nombre: 'Administrador BankPoli',
  rol: RolUsuario.ADMINISTRADOR,
  cuentaPrincipal: null,
};

const solicitudBase: CrearTransferenciaDto = {
  cuentaOrigen: '1000123456',
  cuentaDestino: '2000654321',
  monto: 100000,
  concepto: 'Transferencia interbancaria',
};

describe('TransferenciasService', () => {
  let adapter: LegacyAdapterService;
  let servicio: TransferenciasService;

  beforeEach(() => {
    adapter = new LegacyAdapterService(new InMemoryLegacyCoreClient());
    servicio = new TransferenciasService(adapter);
  });

  describe('crear', () => {
    it('procesa la transferencia y actualiza los saldos de origen y destino', async () => {
      const saldoOrigenAntes = (await adapter.consultarCuenta('1000123456')).saldo;
      const saldoDestinoAntes = (await adapter.consultarCuenta('2000654321')).saldo;

      const transferencia = await servicio.crear({ ...solicitudBase }, CLIENTE);

      expect(transferencia.estado).toBe(EstadoTransferencia.PROCESADA);
      expect(transferencia.monto).toBe(100000);
      expect(transferencia.id).toMatch(/^[0-9a-f-]{36}$/);

      expect((await adapter.consultarCuenta('1000123456')).saldo).toBe(saldoOrigenAntes - 100000);
      expect((await adapter.consultarCuenta('2000654321')).saldo).toBe(saldoDestinoAntes + 100000);
    });

    it('rechaza la operacion cuando origen y destino son la misma cuenta', async () => {
      await expect(servicio.crear({ ...solicitudBase, cuentaDestino: '1000123456' }, CLIENTE)).rejects.toMatchObject({
        codigo: 'MISMA_CUENTA',
        status: 400,
      });
    });

    it('rechaza la operacion cuando la cuenta de origen no tiene saldo suficiente', async () => {
      await expect(
        servicio.crear({ ...solicitudBase, cuentaOrigen: '4000123456', monto: 500000 }, CLIENTE),
      ).rejects.toMatchObject({ codigo: 'SALDO_INSUFICIENTE', status: 409 });
    });

    it('rechaza la operacion cuando la cuenta de origen esta inactiva', async () => {
      await expect(servicio.crear({ ...solicitudBase, cuentaOrigen: '3000111222' }, CLIENTE)).rejects.toMatchObject({
        codigo: 'CUENTA_INACTIVA',
        status: 422,
      });
    });

    it('informa 404 cuando la cuenta de destino no existe', async () => {
      await expect(servicio.crear({ ...solicitudBase, cuentaDestino: '9999999999' }, CLIENTE)).rejects.toMatchObject({
        codigo: 'CUENTA_NO_ENCONTRADA',
        status: 404,
      });
    });

    it('permite al cajero operar entre cuentas de terceros', async () => {
      const transferencia = await servicio.crear(
        { ...solicitudBase, cuentaOrigen: '4000123456', cuentaDestino: '2000654321', monto: 500 },
        CAJERO,
      );

      expect(transferencia.estado).toBe(EstadoTransferencia.PROCESADA);
    });
  });

  describe('obtener', () => {
    it('permite al cliente consultar una transferencia de su cuenta', async () => {
      const creada = await servicio.crear({ ...solicitudBase }, CLIENTE);

      const consultada = await servicio.obtener(creada.id, CLIENTE);

      expect(consultada.id).toBe(creada.id);
    });

    it('prohibe al cliente consultar una transferencia ajena', async () => {
      const ajena = await servicio.crear(
        { ...solicitudBase, cuentaOrigen: '4000123456', cuentaDestino: '2000654321', monto: 500 },
        CAJERO,
      );

      await expect(servicio.obtener(ajena.id, CLIENTE)).rejects.toMatchObject({ status: 403 });
    });

    it('permite al administrador consultar cualquier transferencia', async () => {
      const ajena = await servicio.crear(
        { ...solicitudBase, cuentaOrigen: '4000123456', cuentaDestino: '2000654321', monto: 500 },
        CAJERO,
      );

      await expect(servicio.obtener(ajena.id, ADMINISTRADOR)).resolves.toMatchObject({ id: ajena.id });
    });

    it('informa 404 cuando la transferencia no existe', async () => {
      await expect(servicio.obtener('11111111-1111-4111-8111-111111111111', ADMINISTRADOR)).rejects.toMatchObject({
        codigo: 'TRANSFERENCIA_NO_ENCONTRADA',
        status: 404,
      });
    });
  });

  describe('listar', () => {
    it('devuelve al cliente unicamente las transferencias de su cuenta principal', async () => {
      await servicio.crear({ ...solicitudBase }, CLIENTE);
      await servicio.crear(
        { ...solicitudBase, cuentaOrigen: '4000123456', cuentaDestino: '2000654321', monto: 500 },
        CAJERO,
      );

      const transferencias = await servicio.listar(CLIENTE, {});

      expect(transferencias).toHaveLength(1);
      expect(transferencias[0].cuentaOrigen).toBe('1000123456');
    });

    it('prohibe al cliente filtrar por una cuenta que no le pertenece', async () => {
      await expect(servicio.listar(CLIENTE, { cuenta: '2000654321' })).rejects.toMatchObject({ status: 403 });
    });

    it('permite al administrador listar y filtrar por cualquier cuenta', async () => {
      await servicio.crear({ ...solicitudBase }, CLIENTE);

      const todas = await servicio.listar(ADMINISTRADOR, {});
      const filtradas = await servicio.listar(ADMINISTRADOR, { cuenta: '2000654321', limite: 5 });

      expect(todas).toHaveLength(1);
      expect(filtradas).toHaveLength(1);
    });

    it('devuelve una lista vacia cuando el cliente no tiene cuenta principal', async () => {
      const sinCuenta: UsuarioAutenticado = { ...CLIENTE, cuentaPrincipal: null };

      await expect(servicio.listar(sinCuenta, {})).resolves.toEqual([]);
    });
  });
});
