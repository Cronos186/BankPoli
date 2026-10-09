-- =============================================================================
-- BankPoli - Nucleo transaccional heredado (simulado)
-- Esquema de base de datos del sistema existente.
--
-- IMPORTANTE: este esquema representa al sistema LEGACY. La aplicacion NestJS
-- nunca consulta estas tablas de forma directa: solo invoca las rutinas
-- almacenadas definidas en 02-legacy-routines.sql a traves del Legacy Wrapper.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS legacy;

COMMENT ON SCHEMA legacy IS 'Nucleo transaccional heredado de BankPoli (escenario academico simulado).';

-- -----------------------------------------------------------------------------
-- Usuarios del nucleo (clientes, cajeros y administradores)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legacy.usuarios (
    id_usr  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    log_usr varchar(50)  NOT NULL UNIQUE,
    nom_usr varchar(120) NOT NULL,
    pwd_usr varchar(120) NOT NULL,
    rol_usr varchar(20)  NOT NULL CHECK (rol_usr IN ('CLIENTE', 'CAJERO', 'ADMINISTRADOR')),
    num_cta varchar(10),
    est_usr varchar(15)  NOT NULL DEFAULT 'ACTIVO' CHECK (est_usr IN ('ACTIVO', 'INACTIVO')),
    fec_cre timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE legacy.usuarios IS 'Usuarios registrados en el nucleo heredado.';
COMMENT ON COLUMN legacy.usuarios.pwd_usr IS 'Hash bcrypt administrado por el sistema heredado.';

-- -----------------------------------------------------------------------------
-- Cuentas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legacy.cuentas (
    num_cta varchar(10)   PRIMARY KEY,
    tit_cta varchar(120)  NOT NULL,
    tip_cta varchar(20)   NOT NULL DEFAULT 'AHORROS',
    sal_cta numeric(18, 2) NOT NULL DEFAULT 0 CHECK (sal_cta >= 0),
    est_cta varchar(15)   NOT NULL DEFAULT 'ACTIVA' CHECK (est_cta IN ('ACTIVA', 'INACTIVA', 'BLOQUEADA')),
    mon_cta varchar(3)    NOT NULL DEFAULT 'COP',
    fec_ape timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE legacy.cuentas IS 'Cuentas administradas por el nucleo heredado.';

-- -----------------------------------------------------------------------------
-- Transferencias interbancarias
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legacy.transferencias (
    id_trf  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    cta_org varchar(10)   NOT NULL,
    cta_dst varchar(10)   NOT NULL,
    val_trf numeric(18, 2) NOT NULL CHECK (val_trf > 0),
    con_trf varchar(140)  NOT NULL,
    est_trf varchar(15)   NOT NULL CHECK (est_trf IN ('EN_PROCESO', 'PROCESADA', 'RECHAZADA')),
    cod_err varchar(40),
    msg_err varchar(200),
    fec_cre timestamptz   NOT NULL DEFAULT now(),
    fec_pro timestamptz
);

COMMENT ON TABLE legacy.transferencias IS 'Transferencias procesadas por el nucleo heredado.';

CREATE INDEX IF NOT EXISTS idx_transferencias_cta_org ON legacy.transferencias (cta_org);
CREATE INDEX IF NOT EXISTS idx_transferencias_cta_dst ON legacy.transferencias (cta_dst);
CREATE INDEX IF NOT EXISTS idx_transferencias_fec_cre ON legacy.transferencias (fec_cre DESC);

-- -----------------------------------------------------------------------------
-- Movimientos contables generados por cada transferencia
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legacy.movimientos (
    id_mov  bigserial     PRIMARY KEY,
    num_cta varchar(10)   NOT NULL,
    id_trf  uuid,
    tip_mov varchar(10)   NOT NULL CHECK (tip_mov IN ('DEBITO', 'CREDITO')),
    val_mov numeric(18, 2) NOT NULL,
    sal_dsp numeric(18, 2) NOT NULL,
    fec_mov timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movimientos_cuenta ON legacy.movimientos (num_cta, fec_mov DESC);
