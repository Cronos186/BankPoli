/**
 * Datos de prueba del nucleo transaccional simulado.
 *
 * Estos datos representan el estado inicial del core heredado de BankPoli.
 * Deben permanecer sincronizados con los scripts SQL de `db/init/03-seed.sql`.
 */

export interface SemillaUsuario {
  log_usr: string;
  nom_usr: string;
  /** Contrasena en claro solo con fines academicos; el core almacena el hash. */
  password: string;
  rol_usr: string;
  num_cta: string | null;
  est_usr: string;
}

export interface SemillaCuenta {
  num_cta: string;
  tit_cta: string;
  tip_cta: string;
  sal_cta: string;
  est_cta: string;
  mon_cta: string;
}

export const USUARIOS_SEMILLA: SemillaUsuario[] = [
  {
    log_usr: 'cliente1',
    nom_usr: 'Ana Maria Cliente',
    password: 'Cliente123*',
    rol_usr: 'CLIENTE',
    num_cta: '1000123456',
    est_usr: 'ACTIVO',
  },
  {
    log_usr: 'cliente2',
    nom_usr: 'Carlos Destino',
    password: 'Cliente123*',
    rol_usr: 'CLIENTE',
    num_cta: '2000654321',
    est_usr: 'ACTIVO',
  },
  {
    log_usr: 'cajero1',
    nom_usr: 'Marta Cajera',
    password: 'Cajero123*',
    rol_usr: 'CAJERO',
    num_cta: null,
    est_usr: 'ACTIVO',
  },
  {
    log_usr: 'admin1',
    nom_usr: 'Administrador BankPoli',
    password: 'Admin123*',
    rol_usr: 'ADMINISTRADOR',
    num_cta: null,
    est_usr: 'ACTIVO',
  },
  {
    log_usr: 'inactivo1',
    nom_usr: 'Usuario Inactivo',
    password: 'Cliente123*',
    rol_usr: 'CLIENTE',
    num_cta: null,
    est_usr: 'INACTIVO',
  },
];

export const CUENTAS_SEMILLA: SemillaCuenta[] = [
  {
    num_cta: '1000123456',
    tit_cta: 'Ana Maria Cliente',
    tip_cta: 'AHORROS',
    sal_cta: '2500000.00',
    est_cta: 'ACTIVA',
    mon_cta: 'COP',
  },
  {
    num_cta: '1000987654',
    tit_cta: 'Ana Maria Cliente',
    tip_cta: 'CORRIENTE',
    sal_cta: '800000.00',
    est_cta: 'ACTIVA',
    mon_cta: 'COP',
  },
  {
    num_cta: '2000654321',
    tit_cta: 'Carlos Destino',
    tip_cta: 'AHORROS',
    sal_cta: '150000.00',
    est_cta: 'ACTIVA',
    mon_cta: 'COP',
  },
  {
    num_cta: '3000111222',
    tit_cta: 'Beatriz Inactiva',
    tip_cta: 'AHORROS',
    sal_cta: '100000.00',
    est_cta: 'INACTIVA',
    mon_cta: 'COP',
  },
  {
    num_cta: '4000123456',
    tit_cta: 'Diego Sin Saldo',
    tip_cta: 'AHORROS',
    sal_cta: '1000.00',
    est_cta: 'ACTIVA',
    mon_cta: 'COP',
  },
];
