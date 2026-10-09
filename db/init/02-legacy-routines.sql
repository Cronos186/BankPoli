-- =============================================================================
-- BankPoli - Rutinas almacenadas del nucleo heredado
--
-- Estas rutinas son el unico mecanismo de acceso a los datos del sistema
-- existente. El LegacyAdapterService de la API las invoca a traves del puerto
-- LegacyCoreClient, de modo que la logica transaccional permanece donde reside
-- actualmente: dentro del core bancario.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Consulta de una cuenta
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION legacy.fn_consultar_cuenta(p_num_cta varchar)
RETURNS TABLE (
    num_cta varchar,
    tit_cta varchar,
    tip_cta varchar,
    sal_cta numeric,
    est_cta varchar,
    mon_cta varchar
)
LANGUAGE sql
STABLE
AS $$
    SELECT c.num_cta, c.tit_cta, c.tip_cta, c.sal_cta, c.est_cta, c.mon_cta
      FROM legacy.cuentas c
     WHERE c.num_cta = p_num_cta;
$$;

COMMENT ON FUNCTION legacy.fn_consultar_cuenta(varchar) IS 'Devuelve la cuenta indicada o cero filas si no existe.';

-- -----------------------------------------------------------------------------
-- Autenticacion de usuario (devuelve el hash administrado por el core)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION legacy.fn_autenticar_usuario(p_log_usr varchar)
RETURNS TABLE (
    id_usr  uuid,
    log_usr varchar,
    nom_usr varchar,
    pwd_usr varchar,
    rol_usr varchar,
    num_cta varchar,
    est_usr varchar
)
LANGUAGE sql
STABLE
AS $$
    SELECT u.id_usr, u.log_usr, u.nom_usr, u.pwd_usr, u.rol_usr, u.num_cta, u.est_usr
      FROM legacy.usuarios u
     WHERE u.log_usr = p_log_usr;
$$;

-- -----------------------------------------------------------------------------
-- Consulta de una transferencia
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION legacy.fn_consultar_transferencia(p_id_trf uuid)
RETURNS TABLE (
    id_trf  uuid,
    cta_org varchar,
    cta_dst varchar,
    val_trf numeric,
    con_trf varchar,
    est_trf varchar,
    cod_err varchar,
    fec_cre timestamptz,
    fec_pro timestamptz
)
LANGUAGE sql
STABLE
AS $$
    SELECT t.id_trf, t.cta_org, t.cta_dst, t.val_trf, t.con_trf, t.est_trf, t.cod_err, t.fec_cre, t.fec_pro
      FROM legacy.transferencias t
     WHERE t.id_trf = p_id_trf;
$$;

-- -----------------------------------------------------------------------------
-- Listado de transferencias (opcionalmente filtrado por cuenta)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION legacy.fn_listar_transferencias(p_num_cta varchar DEFAULT NULL, p_limite integer DEFAULT 20)
RETURNS TABLE (
    id_trf  uuid,
    cta_org varchar,
    cta_dst varchar,
    val_trf numeric,
    con_trf varchar,
    est_trf varchar,
    cod_err varchar,
    fec_cre timestamptz,
    fec_pro timestamptz
)
LANGUAGE sql
STABLE
AS $$
    SELECT t.id_trf, t.cta_org, t.cta_dst, t.val_trf, t.con_trf, t.est_trf, t.cod_err, t.fec_cre, t.fec_pro
      FROM legacy.transferencias t
     WHERE p_num_cta IS NULL
        OR t.cta_org = p_num_cta
        OR t.cta_dst = p_num_cta
     ORDER BY t.fec_cre DESC
     LIMIT GREATEST(1, LEAST(COALESCE(p_limite, 20), 100));
$$;

-- -----------------------------------------------------------------------------
-- Rutina transaccional principal: debita, acredita y registra la operacion.
--
-- Devuelve una fila con el resultado:
--   est_trf = 'PROCESADA' -> id_trf contiene el identificador de la operacion.
--   est_trf = 'RECHAZADA' -> cod_err y msg_err describen el rechazo de negocio.
--
-- La funcion se ejecuta dentro de la transaccion del llamador: si ocurre un
-- fallo tecnico, todas las escrituras se revierten de forma atomica.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION legacy.fn_procesar_transferencia(
    p_cta_org varchar,
    p_cta_dst varchar,
    p_val_trf numeric,
    p_con_trf varchar
)
RETURNS TABLE (
    id_trf  uuid,
    est_trf varchar,
    cod_err varchar,
    msg_err varchar
)
LANGUAGE plpgsql
AS $$
#variable_conflict use_column
DECLARE
    v_id      uuid;
    v_origen  legacy.cuentas%ROWTYPE;
    v_destino legacy.cuentas%ROWTYPE;
    v_ahora   timestamptz := clock_timestamp();
BEGIN
    IF p_val_trf IS NULL OR p_val_trf <= 0 THEN
        RETURN QUERY SELECT NULL::uuid, 'RECHAZADA'::varchar, 'MONTO_INVALIDO'::varchar,
                            'El monto de la transferencia debe ser mayor que cero.'::varchar;
        RETURN;
    END IF;

    IF p_cta_org = p_cta_dst THEN
        RETURN QUERY SELECT NULL::uuid, 'RECHAZADA'::varchar, 'MISMA_CUENTA'::varchar,
                            'La cuenta de origen y la cuenta de destino no pueden ser la misma.'::varchar;
        RETURN;
    END IF;

    -- Bloqueo pesimista de ambas cuentas para evitar condiciones de carrera
    -- cuando dos transferencias afectan la misma cuenta de forma concurrente.
    SELECT c.* INTO v_origen FROM legacy.cuentas c WHERE c.num_cta = p_cta_org FOR UPDATE;
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::uuid, 'RECHAZADA'::varchar, 'CUENTA_ORIGEN_NO_EXISTE'::varchar,
                            'La cuenta de origen no existe en el nucleo.'::varchar;
        RETURN;
    END IF;

    SELECT c.* INTO v_destino FROM legacy.cuentas c WHERE c.num_cta = p_cta_dst FOR UPDATE;
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::uuid, 'RECHAZADA'::varchar, 'CUENTA_DESTINO_NO_EXISTE'::varchar,
                            'La cuenta de destino no existe en el nucleo.'::varchar;
        RETURN;
    END IF;

    IF v_origen.est_cta <> 'ACTIVA' THEN
        RETURN QUERY SELECT NULL::uuid, 'RECHAZADA'::varchar, 'CUENTA_ORIGEN_INACTIVA'::varchar,
                            ('La cuenta de origen esta ' || v_origen.est_cta || '.')::varchar;
        RETURN;
    END IF;

    IF v_destino.est_cta <> 'ACTIVA' THEN
        RETURN QUERY SELECT NULL::uuid, 'RECHAZADA'::varchar, 'CUENTA_DESTINO_INACTIVA'::varchar,
                            ('La cuenta de destino esta ' || v_destino.est_cta || '.')::varchar;
        RETURN;
    END IF;

    IF v_origen.sal_cta < p_val_trf THEN
        RETURN QUERY SELECT NULL::uuid, 'RECHAZADA'::varchar, 'SALDO_INSUFICIENTE'::varchar,
                            'La cuenta de origen no tiene saldo disponible suficiente.'::varchar;
        RETURN;
    END IF;

    v_id := gen_random_uuid();

    INSERT INTO legacy.transferencias (id_trf, cta_org, cta_dst, val_trf, con_trf, est_trf, fec_cre, fec_pro)
    VALUES (v_id, p_cta_org, p_cta_dst, p_val_trf, p_con_trf, 'PROCESADA', v_ahora, v_ahora);

    UPDATE legacy.cuentas SET sal_cta = sal_cta - p_val_trf WHERE num_cta = p_cta_org;
    UPDATE legacy.cuentas SET sal_cta = sal_cta + p_val_trf WHERE num_cta = p_cta_dst;

    INSERT INTO legacy.movimientos (num_cta, id_trf, tip_mov, val_mov, sal_dsp, fec_mov)
    VALUES (p_cta_org, v_id, 'DEBITO', p_val_trf, v_origen.sal_cta - p_val_trf, v_ahora),
           (p_cta_dst, v_id, 'CREDITO', p_val_trf, v_destino.sal_cta + p_val_trf, v_ahora);

    RETURN QUERY SELECT v_id, 'PROCESADA'::varchar, NULL::varchar,
                        'Transferencia procesada correctamente por el nucleo transaccional.'::varchar;
END;
$$;

COMMENT ON FUNCTION legacy.fn_procesar_transferencia(varchar, varchar, numeric, varchar)
    IS 'Rutina transaccional del core heredado: valida, debita, acredita y registra la transferencia.';

-- -----------------------------------------------------------------------------
-- Permisos del usuario de aplicacion (la API nunca usa un superusuario)
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA legacy TO bankpoli;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA legacy TO bankpoli;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA legacy TO bankpoli;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA legacy TO bankpoli;
