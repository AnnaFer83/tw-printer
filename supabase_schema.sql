-- =============================================================================
-- TECNOWORK — Schema de Base de Datos en Supabase
-- =============================================================================
-- Ejecutar UNA SOLA VEZ en: Supabase Dashboard → SQL Editor → New query
-- =============================================================================

-- Config global del sistema
CREATE TABLE IF NOT EXISTS config (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Planes de impresión
CREATE TABLE IF NOT EXISTS plans (
    id           TEXT PRIMARY KEY,
    name         TEXT    NOT NULL,
    copies       INTEGER NOT NULL DEFAULT 0,
    cost         NUMERIC NOT NULL DEFAULT 0,
    excess_price NUMERIC
);

-- Clientes (empresas que contratan el servicio)
CREATE TABLE IF NOT EXISTS clients (
    id           TEXT PRIMARY KEY,
    name         TEXT UNIQUE NOT NULL,
    phone        TEXT DEFAULT '',
    observations TEXT DEFAULT ''
);

-- Máquinas/equipos vinculados a cada cliente
CREATE TABLE IF NOT EXISTS machines (
    id                  TEXT PRIMARY KEY,
    client_id           TEXT    NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name                TEXT    NOT NULL,
    serial_number       TEXT    DEFAULT '',
    is_fixed            BOOLEAN NOT NULL DEFAULT FALSE,
    plan_id             TEXT    REFERENCES plans(id),
    custom_cost         NUMERIC,
    custom_excess_price NUMERIC
);

-- Lecturas mensuales por cliente
CREATE TABLE IF NOT EXISTS readings (
    id                TEXT    PRIMARY KEY,
    client_id         TEXT    NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    client_name       TEXT    NOT NULL,
    period_month      TEXT    NOT NULL,
    period_year       INTEGER NOT NULL,
    observations      TEXT    DEFAULT '',
    total_abono       NUMERIC DEFAULT 0,
    total_excess_cost NUMERIC DEFAULT 0,
    total_general     NUMERIC DEFAULT 0,
    upload_date       TEXT    DEFAULT '',
    uploaded_by       TEXT    DEFAULT '',
    UNIQUE (client_id, period_month, period_year)
);

-- Detalle por equipo dentro de cada lectura mensual
CREATE TABLE IF NOT EXISTS machine_readings (
    id            BIGSERIAL PRIMARY KEY,
    reading_id    TEXT    NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
    machine_id    TEXT    DEFAULT '',
    machine_name  TEXT    DEFAULT '',
    serial_number TEXT    DEFAULT '',
    is_fixed      BOOLEAN DEFAULT FALSE,
    prev_counter  NUMERIC DEFAULT 0,
    curr_counter  NUMERIC DEFAULT 0,
    consumption   NUMERIC DEFAULT 0,
    plan_copies   INTEGER DEFAULT 0,
    excess        NUMERIC DEFAULT 0,
    excess_price  NUMERIC DEFAULT 0,
    plan_cost     NUMERIC DEFAULT 0,
    excess_cost   NUMERIC DEFAULT 0,
    total_cost    NUMERIC DEFAULT 0,
    custom_cost   NUMERIC DEFAULT 0,
    is_pending    BOOLEAN DEFAULT FALSE,
    
    -- Sub-contadores
    prev_impresiones NUMERIC DEFAULT 0,
    curr_impresiones NUMERIC DEFAULT 0,
    prev_copias      NUMERIC DEFAULT 0,
    curr_copias      NUMERIC DEFAULT 0,
    prev_pp          NUMERIC DEFAULT 0,
    curr_pp          NUMERIC DEFAULT 0,
    prev_pf          NUMERIC DEFAULT 0,
    curr_pf          NUMERIC DEFAULT 0,
    
    -- Reemplazo de equipos
    has_replacement  BOOLEAN DEFAULT FALSE,
    rep_model        TEXT    DEFAULT '',
    rep_serial_number TEXT   DEFAULT '',
    rep_prev_counter NUMERIC DEFAULT 0,
    rep_curr_counter NUMERIC DEFAULT 0,
    rep_consumption  NUMERIC DEFAULT 0,
    rep_prev_impresiones NUMERIC DEFAULT 0,
    rep_curr_impresiones NUMERIC DEFAULT 0,
    rep_prev_copias      NUMERIC DEFAULT 0,
    rep_curr_copias      NUMERIC DEFAULT 0,
    rep_prev_pp          NUMERIC DEFAULT 0,
    rep_curr_pp          NUMERIC DEFAULT 0,
    rep_prev_pf          NUMERIC DEFAULT 0,
    rep_curr_pf          NUMERIC DEFAULT 0
);

-- Migraciones para base de datos existente (ejecutar si la tabla ya existía):
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS prev_impresiones NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS curr_impresiones NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS prev_copias NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS curr_copias NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS prev_pp NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS curr_pp NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS prev_pf NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS curr_pf NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS has_replacement BOOLEAN DEFAULT FALSE;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS rep_model TEXT DEFAULT '';
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS rep_serial_number TEXT DEFAULT '';
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS rep_prev_counter NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS rep_curr_counter NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS rep_consumption NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS rep_prev_impresiones NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS rep_curr_impresiones NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS rep_prev_copias NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS rep_curr_copias NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS rep_prev_pp NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS rep_curr_pp NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS rep_prev_pf NUMERIC DEFAULT 0;
-- ALTER TABLE machine_readings ADD COLUMN IF NOT EXISTS rep_curr_pf NUMERIC DEFAULT 0;

-- =============================================================================
-- Acceso para la clave anon (app frontend)
-- Aplicación de uso interno: se desactiva RLS y se conceden todos los permisos.
-- =============================================================================

ALTER TABLE config         DISABLE ROW LEVEL SECURITY;
ALTER TABLE plans          DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients        DISABLE ROW LEVEL SECURITY;
ALTER TABLE machines       DISABLE ROW LEVEL SECURITY;
ALTER TABLE readings       DISABLE ROW LEVEL SECURITY;
ALTER TABLE machine_readings DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE config           TO anon;
GRANT ALL ON TABLE plans            TO anon;
GRANT ALL ON TABLE clients          TO anon;
GRANT ALL ON TABLE machines         TO anon;
GRANT ALL ON TABLE readings         TO anon;
GRANT ALL ON TABLE machine_readings TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =============================================================================
-- Datos iniciales de configuración (solo si la tabla está vacía)
-- =============================================================================

INSERT INTO config (key, value)
SELECT * FROM (VALUES
    ('defaultExcessPrice', '90'),
    ('companyName',        '"LEXORER S.R.L."'),
    ('companySub',         '"TW - Informes de Consumo de Impresión"')
) AS v(key, value)
WHERE NOT EXISTS (SELECT 1 FROM config LIMIT 1);
