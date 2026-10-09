-- =============================================================================
-- BankPoli - Datos de prueba del nucleo transaccional simulado
--
-- Usuarios y contrasenas de prueba (escenario academico):
--   cliente1  / Cliente123*  -> rol CLIENTE       (cuenta principal 1000123456)
--   cliente2  / Cliente123*  -> rol CLIENTE       (cuenta principal 2000654321)
--   cajero1   / Cajero123*   -> rol CAJERO
--   admin1    / Admin123*    -> rol ADMINISTRADOR
--   inactivo1 / Cliente123*  -> rol CLIENTE, estado INACTIVO
--
-- Las contrasenas se almacenan como hash bcrypt generado por el propio nucleo
-- (pgcrypto), igual que lo haria el sistema heredado real.
-- =============================================================================

INSERT INTO legacy.cuentas (num_cta, tit_cta, tip_cta, sal_cta, est_cta, mon_cta)
VALUES
    ('1000123456', 'Ana Maria Cliente', 'AHORROS',   2500000.00, 'ACTIVA',   'COP'),
    ('1000987654', 'Ana Maria Cliente', 'CORRIENTE',  800000.00, 'ACTIVA',   'COP'),
    ('2000654321', 'Carlos Destino',    'AHORROS',     150000.00, 'ACTIVA',   'COP'),
    ('3000111222', 'Beatriz Inactiva',  'AHORROS',     100000.00, 'INACTIVA', 'COP'),
    ('4000123456', 'Diego Sin Saldo',   'AHORROS',       1000.00, 'ACTIVA',   'COP')
ON CONFLICT (num_cta) DO NOTHING;

INSERT INTO legacy.usuarios (log_usr, nom_usr, pwd_usr, rol_usr, num_cta, est_usr)
VALUES
    ('cliente1',  'Ana Maria Cliente',     crypt('Cliente123*', gen_salt('bf', 10)), 'CLIENTE',       '1000123456', 'ACTIVO'),
    ('cliente2',  'Carlos Destino',        crypt('Cliente123*', gen_salt('bf', 10)), 'CLIENTE',       '2000654321', 'ACTIVO'),
    ('cajero1',   'Marta Cajera',          crypt('Cajero123*',  gen_salt('bf', 10)), 'CAJERO',        NULL,         'ACTIVO'),
    ('admin1',    'Administrador BankPoli', crypt('Admin123*',  gen_salt('bf', 10)), 'ADMINISTRADOR', NULL,         'ACTIVO'),
    ('inactivo1', 'Usuario Inactivo',      crypt('Cliente123*', gen_salt('bf', 10)), 'CLIENTE',       NULL,         'INACTIVO')
ON CONFLICT (log_usr) DO NOTHING;
