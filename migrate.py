#!/usr/bin/env python3
"""
migrate.py — Migración one-time: database.json → database.db
=============================================================
Ejecutar UNA SOLA VEZ antes de iniciar el nuevo server.py.

Uso:
    python3 migrate.py
    python3 migrate.py --json otro_archivo.json
    python3 migrate.py --db  otra_base.db
"""
import json
import sqlite3
import os
import sys
import argparse
import shutil
from datetime import datetime

# ---------------------------------------------------------------------------
# Argumentos
# ---------------------------------------------------------------------------

parser = argparse.ArgumentParser(description="Migra database.json a database.db")
parser.add_argument("--json", default="database.json", help="Archivo JSON de origen")
parser.add_argument("--db",   default="database.db",   help="Archivo SQLite de destino")
args = parser.parse_args()

JSON_FILE = args.json
DB_FILE   = args.db

# ---------------------------------------------------------------------------
# Validaciones previas
# ---------------------------------------------------------------------------

if not os.path.exists(JSON_FILE):
    print(f"ERROR: No se encontró '{JSON_FILE}'")
    sys.exit(1)

with open(JSON_FILE, "r", encoding="utf-8") as f:
    try:
        data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"ERROR: '{JSON_FILE}' no es un JSON válido: {e}")
        sys.exit(1)

required = ("clients", "plans", "readings", "config")
missing  = [k for k in required if k not in data]
if missing:
    print(f"ERROR: Claves faltantes en el JSON: {missing}")
    sys.exit(1)

if os.path.exists(DB_FILE):
    backup = f"{DB_FILE}.bak_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy2(DB_FILE, backup)
    print(f"ADVERTENCIA: '{DB_FILE}' ya existía → backup guardado en '{backup}'")
    os.remove(DB_FILE)

# ---------------------------------------------------------------------------
# Crear esquema
# ---------------------------------------------------------------------------

conn = sqlite3.connect(DB_FILE)
conn.execute("PRAGMA journal_mode=WAL")
conn.execute("PRAGMA foreign_keys=ON")

conn.executescript("""
    CREATE TABLE config (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );

    CREATE TABLE plans (
        id     TEXT PRIMARY KEY,
        name   TEXT NOT NULL,
        copies INTEGER NOT NULL,
        cost   REAL NOT NULL
    );

    CREATE TABLE clients (
        id           TEXT PRIMARY KEY,
        name         TEXT UNIQUE NOT NULL,
        phone        TEXT DEFAULT '',
        observations TEXT DEFAULT ''
    );

    CREATE TABLE machines (
        id                  TEXT PRIMARY KEY,
        client_id           TEXT NOT NULL,
        name                TEXT NOT NULL,
        serial_number       TEXT DEFAULT '',
        is_fixed            INTEGER NOT NULL DEFAULT 0,
        plan_id             TEXT,
        custom_cost         REAL,
        custom_excess_price REAL,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (plan_id)   REFERENCES plans(id)
    );

    CREATE TABLE readings (
        id                TEXT PRIMARY KEY,
        client_id         TEXT NOT NULL,
        client_name       TEXT NOT NULL,
        period_month      TEXT NOT NULL,
        period_year       INTEGER NOT NULL,
        observations      TEXT DEFAULT '',
        total_abono       REAL DEFAULT 0,
        total_excess_cost REAL DEFAULT 0,
        total_general     REAL DEFAULT 0,
        UNIQUE (client_id, period_month, period_year),
        FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE machine_readings (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        reading_id   TEXT NOT NULL,
        machine_id   TEXT DEFAULT '',
        machine_name TEXT DEFAULT '',
        is_fixed     INTEGER DEFAULT 0,
        prev_counter REAL DEFAULT 0,
        curr_counter REAL DEFAULT 0,
        consumption  REAL DEFAULT 0,
        plan_copies  INTEGER DEFAULT 0,
        excess       REAL DEFAULT 0,
        excess_price REAL DEFAULT 0,
        plan_cost    REAL DEFAULT 0,
        excess_cost  REAL DEFAULT 0,
        total_cost   REAL DEFAULT 0,
        custom_cost  REAL DEFAULT 0,
        is_pending   INTEGER DEFAULT 0,
        FOREIGN KEY (reading_id) REFERENCES readings(id)
    );
""")

# ---------------------------------------------------------------------------
# Migrar datos
# ---------------------------------------------------------------------------

conn.execute("BEGIN")

# Config
cfg = data.get("config", {})
for key, value in cfg.items():
    conn.execute(
        "INSERT INTO config (key, value) VALUES (?, ?)",
        (key, json.dumps(value))
    )

# Planes
plans_ok = 0
for p in data.get("plans", []):
    conn.execute(
        "INSERT INTO plans (id, name, copies, cost) VALUES (?, ?, ?, ?)",
        (p["id"], p["name"], p["copies"], p["cost"])
    )
    plans_ok += 1

# Clientes + máquinas
clients_ok  = 0
machines_ok = 0
for c in data.get("clients", []):
    conn.execute(
        "INSERT INTO clients (id, name, phone, observations) VALUES (?, ?, ?, ?)",
        (c["id"], c["name"], c.get("phone", ""), c.get("observations", ""))
    )
    clients_ok += 1
    for m in c.get("machines", []):
        conn.execute(
            """INSERT INTO machines
               (id, client_id, name, serial_number, is_fixed, plan_id, custom_cost, custom_excess_price)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                m["id"],
                c["id"],
                m["name"],
                m.get("serialNumber", ""),
                1 if m.get("isFixed") else 0,
                m.get("planId"),
                m.get("customCost"),
                m.get("customExcessPrice"),
            )
        )
        machines_ok += 1

# Lecturas + detalle
readings_ok = 0
mr_ok       = 0
for r in data.get("readings", []):
    conn.execute(
        """INSERT INTO readings
           (id, client_id, client_name, period_month, period_year, observations,
            total_abono, total_excess_cost, total_general)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            r["id"],
            r["clientId"],
            r["clientName"],
            r["periodMonth"],
            r["periodYear"],
            r.get("observations", ""),
            r.get("totalAbono", 0),
            r.get("totalExcessCost", 0),
            r.get("totalGeneral", 0),
        )
    )
    readings_ok += 1
    for mr in r.get("machineReadings", []):
        conn.execute(
            """INSERT INTO machine_readings
               (reading_id, machine_id, machine_name, is_fixed, prev_counter, curr_counter,
                consumption, plan_copies, excess, excess_price, plan_cost, excess_cost,
                total_cost, custom_cost, is_pending)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                r["id"],
                mr.get("machineId", ""),
                mr.get("machineName", ""),
                1 if mr.get("isFixed") else 0,
                mr.get("prevCounter", 0),
                mr.get("currCounter", 0),
                mr.get("consumption", 0),
                mr.get("planCopies", 0),
                mr.get("excess", 0),
                mr.get("excessPrice", 0),
                mr.get("planCost", 0),
                mr.get("excessCost", 0),
                mr.get("totalCost", 0),
                mr.get("customCost", 0),
                1 if mr.get("isPending") else 0,
            )
        )
        mr_ok += 1

conn.commit()
conn.close()

# ---------------------------------------------------------------------------
# Resultado
# ---------------------------------------------------------------------------

size_kb = os.path.getsize(DB_FILE) / 1024
print(f"\n✓ Migración completada: {os.path.abspath(DB_FILE)} ({size_kb:.1f} KB)")
print(f"  Planes         : {plans_ok}")
print(f"  Clientes       : {clients_ok}")
print(f"  Máquinas       : {machines_ok}")
print(f"  Lecturas       : {readings_ok}")
print(f"  Detalle máq.   : {mr_ok}")
print(f"\nPróximo paso: iniciar el nuevo server.py con 'python3 server.py'")
print(f"El archivo '{JSON_FILE}' puede conservarse como respaldo histórico.\n")
