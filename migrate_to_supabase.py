#!/usr/bin/env python3
"""
migrate_to_supabase.py — Migración one-time: database.json → Supabase
======================================================================
Sin dependencias externas. Usa solo urllib de la biblioteca estándar de Python.

Uso:
    python3 migrate_to_supabase.py
    python3 migrate_to_supabase.py --json otra_ruta.json
"""
import json
import sys
import os
import argparse
import urllib.request
import urllib.error

# ---------------------------------------------------------------------------
# Argumentos
# ---------------------------------------------------------------------------
parser = argparse.ArgumentParser(description="Migra database.json a Supabase")
parser.add_argument("--json", default="database.json", help="Archivo JSON de origen")
args = parser.parse_args()

JSON_FILE = args.json

# ---------------------------------------------------------------------------
# Credenciales Supabase (se piden al ejecutar para no guardarlas en el código)
# ---------------------------------------------------------------------------
SUPABASE_URL = "https://sngigxlfemzteyokqlbd.supabase.co"
# service_role key — bypasea RLS, solo para este script de migración (nunca va al browser)
SUPABASE_KEY = "SERVICE_ROLE_KEY"  # reemplazar con la clave real antes de ejecutar (no commitear)

print("\n=== Migración TecnoWork → Supabase ===")
print(f"Proyecto: {SUPABASE_URL}\n")

# ---------------------------------------------------------------------------
# Cargar JSON
# ---------------------------------------------------------------------------
if not os.path.exists(JSON_FILE):
    print(f"\nERROR: No se encontró '{JSON_FILE}'")
    sys.exit(1)

with open(JSON_FILE, "r", encoding="utf-8") as f:
    try:
        data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"\nERROR: JSON inválido: {e}")
        sys.exit(1)

required = ("clients", "plans", "readings", "config")
missing  = [k for k in required if k not in data]
if missing:
    print(f"\nERROR: Claves faltantes en el JSON: {missing}")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Helpers para llamadas a la API REST de Supabase
# ---------------------------------------------------------------------------

def sb(method, table, body=None, params="", extra_headers=None):
    """Realiza una llamada a la API REST de Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/{table}{params}"
    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "return=minimal",
    }
    if extra_headers:
        headers.update(extra_headers)

    encoded = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=encoded, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            return True, resp.read().decode()
    except urllib.error.HTTPError as e:
        msg = e.read().decode()
        return False, f"HTTP {e.code}: {msg}"
    except urllib.error.URLError as e:
        return False, str(e)


# Clave primaria por tabla (para construir el filtro de DELETE correcto)
TABLE_PK = {
    "config":           "key",
    "plans":            "id",
    "clients":          "id",
    "machines":         "id",
    "readings":         "id",
    "machine_readings": "id",
}

def delete_all(table):
    pk = TABLE_PK.get(table, "id")
    ok, msg = sb("DELETE", table, params=f"?{pk}=not.is.null")
    if not ok:
        print(f"  ⚠  Error borrando {table}: {msg}")
    return ok


def insert_batch(table, rows, batch_size=50):
    """Inserta en lotes para evitar payloads muy grandes."""
    if not rows:
        return True
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        ok, msg = sb("POST", table, body=batch)
        if not ok:
            print(f"  ⚠  Error insertando en {table}: {msg}")
            return False
    return True


# ---------------------------------------------------------------------------
# Migración
# ---------------------------------------------------------------------------

print("\n--- Limpiando tablas existentes ---")

# Borrar en orden: clients primero (cascade elimina machines, readings, machine_readings)
# Luego plans (machines ya eliminadas por cascade)
for table in ["clients", "plans", "config"]:
    result = delete_all(table)
    status = "✓" if result else "✗"
    print(f"  {status} DELETE {table}")

print("\n--- Insertando datos ---")

# Config
cfg = data.get("config", {})
config_rows = [{"key": k, "value": json.dumps(v)} for k, v in cfg.items()]
ok = insert_batch("config", config_rows)
print(f"  {'✓' if ok else '✗'} config ({len(config_rows)} claves)")

# Planes
plan_rows = [
    {
        "id":          p["id"],
        "name":        p["name"],
        "copies":      p["copies"],
        "cost":        p["cost"],
        "excess_price": p.get("excessPrice"),
    }
    for p in data.get("plans", [])
]
ok = insert_batch("plans", plan_rows)
print(f"  {'✓' if ok else '✗'} plans ({len(plan_rows)} registros)")

# Clientes
client_rows = [
    {
        "id":           c["id"],
        "name":         c["name"],
        "phone":        c.get("phone", ""),
        "observations": c.get("observations", ""),
    }
    for c in data.get("clients", [])
]
ok = insert_batch("clients", client_rows)
print(f"  {'✓' if ok else '✗'} clients ({len(client_rows)} registros)")

# Máquinas
machine_rows = [
    {
        "id":                  m["id"],
        "client_id":           c["id"],
        "name":                m["name"],
        "serial_number":       m.get("serialNumber", ""),
        "is_fixed":            m.get("isFixed", False),
        "plan_id":             m.get("planId"),
        "custom_cost":         m.get("customCost"),
        "custom_excess_price": m.get("customExcessPrice"),
    }
    for c in data.get("clients", [])
    for m in c.get("machines", [])
]
ok = insert_batch("machines", machine_rows)
print(f"  {'✓' if ok else '✗'} machines ({len(machine_rows)} registros)")

# Lecturas
reading_rows = [
    {
        "id":               r["id"],
        "client_id":        r["clientId"],
        "client_name":      r["clientName"],
        "period_month":     r["periodMonth"],
        "period_year":      r["periodYear"],
        "observations":     r.get("observations", ""),
        "total_abono":      r.get("totalAbono", 0),
        "total_excess_cost": r.get("totalExcessCost", 0),
        "total_general":    r.get("totalGeneral", 0),
        "upload_date":      r.get("uploadDate", ""),
        "uploaded_by":      r.get("user", ""),
    }
    for r in data.get("readings", [])
]
ok = insert_batch("readings", reading_rows)
print(f"  {'✓' if ok else '✗'} readings ({len(reading_rows)} registros)")

# Detalle por máquina
mr_rows = [
    {
        "reading_id":   r["id"],
        "machine_id":   mr.get("machineId", ""),
        "machine_name": mr.get("name", ""),
        "serial_number": mr.get("serialNumber", ""),
        "is_fixed":     mr.get("isFixed", False),
        "prev_counter": mr.get("prevCounter", 0),
        "curr_counter": mr.get("currCounter", 0),
        "consumption":  mr.get("consumption", 0),
        "plan_copies":  mr.get("planCopies", 0),
        "excess":       mr.get("excess", 0),
        "excess_price": mr.get("excessPrice", 0),
        "plan_cost":    mr.get("planCost", 0),
        "excess_cost":  mr.get("excessCost", 0),
        "total_cost":   mr.get("totalCost", 0),
        "custom_cost":  mr.get("customCost", 0),
        "is_pending":   mr.get("isPending", False),
    }
    for r in data.get("readings", [])
    for mr in r.get("machineReadings", [])
]
ok = insert_batch("machine_readings", mr_rows)
print(f"  {'✓' if ok else '✗'} machine_readings ({len(mr_rows)} registros)")

# ---------------------------------------------------------------------------
# Resumen
# ---------------------------------------------------------------------------
print(f"""
=== Migración completada ===
  Clientes        : {len(client_rows)}
  Máquinas        : {len(machine_rows)}
  Planes          : {len(plan_rows)}
  Lecturas        : {len(reading_rows)}
  Detalle máq.    : {len(mr_rows)}

Próximo paso:
  1. Verificar datos en Supabase Dashboard → Table Editor
  2. Completar SUPABASE_URL y SUPABASE_ANON_KEY en js/supabase-adapter.js
  3. Subir los cambios al repositorio (git add, commit, push)
  4. Activar GitHub Pages en: repo → Settings → Pages → Deploy from branch main
""")
