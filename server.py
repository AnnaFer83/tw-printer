import http.server
import socketserver
import json
import os
import sqlite3

PORT = 8000
DB_FILE = 'database.db'

# ---------------------------------------------------------------------------
# Base de datos
# ---------------------------------------------------------------------------

def get_conn():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS config (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS plans (
            id           TEXT PRIMARY KEY,
            name         TEXT NOT NULL,
            copies       INTEGER NOT NULL DEFAULT 0,
            cost         REAL NOT NULL DEFAULT 0,
            excess_price REAL
        );

        CREATE TABLE IF NOT EXISTS clients (
            id           TEXT PRIMARY KEY,
            name         TEXT UNIQUE NOT NULL,
            phone        TEXT DEFAULT '',
            observations TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS machines (
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

        CREATE TABLE IF NOT EXISTS readings (
            id                TEXT PRIMARY KEY,
            client_id         TEXT NOT NULL,
            client_name       TEXT NOT NULL,
            period_month      TEXT NOT NULL,
            period_year       INTEGER NOT NULL,
            observations      TEXT DEFAULT '',
            total_abono       REAL DEFAULT 0,
            total_excess_cost REAL DEFAULT 0,
            total_general     REAL DEFAULT 0,
            upload_date       TEXT DEFAULT '',
            uploaded_by       TEXT DEFAULT '',
            UNIQUE (client_id, period_month, period_year),
            FOREIGN KEY (client_id) REFERENCES clients(id)
        );

        CREATE TABLE IF NOT EXISTS machine_readings (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            reading_id    TEXT NOT NULL,
            machine_id    TEXT DEFAULT '',
            machine_name  TEXT DEFAULT '',
            serial_number TEXT DEFAULT '',
            is_fixed      INTEGER DEFAULT 0,
            prev_counter  REAL DEFAULT 0,
            curr_counter  REAL DEFAULT 0,
            consumption   REAL DEFAULT 0,
            plan_copies   INTEGER DEFAULT 0,
            excess        REAL DEFAULT 0,
            excess_price  REAL DEFAULT 0,
            plan_cost     REAL DEFAULT 0,
            excess_cost   REAL DEFAULT 0,
            total_cost    REAL DEFAULT 0,
            custom_cost   REAL DEFAULT 0,
            is_pending    INTEGER DEFAULT 0,
            FOREIGN KEY (reading_id) REFERENCES readings(id)
        );
    """)

    if not conn.execute("SELECT 1 FROM config LIMIT 1").fetchone():
        conn.executemany(
            "INSERT INTO config (key, value) VALUES (?, ?)",
            [
                ("defaultExcessPrice", "90"),
                ("companyName",        '"LEXORER S.R.L."'),
                ("companySub",         '"TW - Informes de Consumo de Impresión"'),
            ]
        )

    conn.commit()
    conn.close()
    print(f"Base de datos inicializada: {os.path.abspath(DB_FILE)}")


def load_data():
    conn = get_conn()

    # Config
    config = {}
    for row in conn.execute("SELECT key, value FROM config"):
        try:
            config[row["key"]] = json.loads(row["value"])
        except (json.JSONDecodeError, TypeError):
            config[row["key"]] = row["value"]

    # Planes (incluye excess_price)
    plans = []
    for p in conn.execute("SELECT id, name, copies, cost, excess_price FROM plans"):
        plans.append({
            "id":          p["id"],
            "name":        p["name"],
            "copies":      p["copies"],
            "cost":        p["cost"],
            "excessPrice": p["excess_price"],
        })

    # Clientes + máquinas embebidas
    clients = []
    for c in conn.execute("SELECT id, name, phone, observations FROM clients"):
        client = {
            "id":           c["id"],
            "name":         c["name"],
            "phone":        c["phone"] or "",
            "observations": c["observations"] or "",
            "machines":     [],
        }
        for m in conn.execute("SELECT * FROM machines WHERE client_id = ?", (c["id"],)):
            client["machines"].append({
                "id":               m["id"],
                "clientId":         m["client_id"],
                "name":             m["name"],
                "serialNumber":     m["serial_number"] or "",
                "isFixed":          bool(m["is_fixed"]),
                "planId":           m["plan_id"],
                "customCost":       m["custom_cost"],
                "customExcessPrice": m["custom_excess_price"],
            })
        clients.append(client)

    # Lecturas + machineReadings embebidas
    readings = []
    for r in conn.execute("SELECT * FROM readings"):
        reading = {
            "id":              r["id"],
            "clientId":        r["client_id"],
            "clientName":      r["client_name"],
            "periodMonth":     r["period_month"],
            "periodYear":      r["period_year"],
            "observations":    r["observations"] or "",
            "totalAbono":      r["total_abono"],
            "totalExcessCost": r["total_excess_cost"],
            "totalGeneral":    r["total_general"],
            "uploadDate":      r["upload_date"] or "",
            "user":            r["uploaded_by"] or "",
            "machineReadings": [],
        }
        for mr in conn.execute(
            "SELECT * FROM machine_readings WHERE reading_id = ?", (r["id"],)
        ):
            reading["machineReadings"].append({
                "machineId":   mr["machine_id"],
                "name":        mr["machine_name"],   # app.js usa mr.name
                "serialNumber": mr["serial_number"] or "",
                "isFixed":     bool(mr["is_fixed"]),
                "prevCounter": mr["prev_counter"],
                "currCounter": mr["curr_counter"],
                "consumption": mr["consumption"],
                "planCopies":  mr["plan_copies"],
                "excess":      mr["excess"],
                "excessPrice": mr["excess_price"],
                "planCost":    mr["plan_cost"],
                "excessCost":  mr["excess_cost"],
                "totalCost":   mr["total_cost"],
                "customCost":  mr["custom_cost"],
                "isPending":   bool(mr["is_pending"]),
            })
        readings.append(reading)

    conn.close()
    return {"clients": clients, "plans": plans, "readings": readings, "config": config}


def save_data(payload):
    conn = get_conn()
    try:
        conn.execute("BEGIN")

        # Config
        for key, value in payload["config"].items():
            conn.execute(
                "INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)",
                (key, json.dumps(value))
            )

        # Planes
        conn.execute("DELETE FROM plans")
        for p in payload.get("plans", []):
            conn.execute(
                "INSERT INTO plans (id, name, copies, cost, excess_price) VALUES (?, ?, ?, ?, ?)",
                (p["id"], p["name"], p["copies"], p["cost"], p.get("excessPrice"))
            )

        # Borrar en cascada (machine_readings → readings → machines → clients)
        conn.execute("DELETE FROM machine_readings")
        conn.execute("DELETE FROM readings")
        conn.execute("DELETE FROM machines")
        conn.execute("DELETE FROM clients")

        # Clientes + máquinas
        for c in payload.get("clients", []):
            conn.execute(
                "INSERT INTO clients (id, name, phone, observations) VALUES (?, ?, ?, ?)",
                (c["id"], c["name"], c.get("phone", ""), c.get("observations", ""))
            )
            for m in c.get("machines", []):
                conn.execute(
                    """INSERT INTO machines
                       (id, client_id, name, serial_number, is_fixed, plan_id, custom_cost, custom_excess_price)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        m["id"], c["id"], m["name"],
                        m.get("serialNumber", ""),
                        1 if m.get("isFixed") else 0,
                        m.get("planId"),
                        m.get("customCost"),
                        m.get("customExcessPrice"),
                    )
                )

        # Lecturas + detalle
        for r in payload.get("readings", []):
            conn.execute(
                """INSERT INTO readings
                   (id, client_id, client_name, period_month, period_year, observations,
                    total_abono, total_excess_cost, total_general, upload_date, uploaded_by)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    r["id"], r["clientId"], r["clientName"],
                    r["periodMonth"], r["periodYear"],
                    r.get("observations", ""),
                    r.get("totalAbono", 0),
                    r.get("totalExcessCost", 0),
                    r.get("totalGeneral", 0),
                    r.get("uploadDate", ""),
                    r.get("user", ""),
                )
            )
            for mr in r.get("machineReadings", []):
                conn.execute(
                    """INSERT INTO machine_readings
                       (reading_id, machine_id, machine_name, serial_number, is_fixed,
                        prev_counter, curr_counter, consumption, plan_copies, excess,
                        excess_price, plan_cost, excess_cost, total_cost, custom_cost, is_pending)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        r["id"],
                        mr.get("machineId", ""),
                        mr.get("name", ""),            # app.js usa mr.name
                        mr.get("serialNumber", ""),
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

        conn.commit()
        return True, "Datos persistidos correctamente."
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Servidor HTTP
# ---------------------------------------------------------------------------

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_GET(self):
        if self.path == "/api/data":
            try:
                data = load_data()
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                self._json_error(500, str(e))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/save":
            try:
                length  = int(self.headers["Content-Length"])
                payload = json.loads(self.rfile.read(length).decode("utf-8"))

                if not (isinstance(payload, dict) and
                        all(k in payload for k in ("clients", "plans", "readings", "config"))):
                    self._json_error(400, "Estructura de payload incorrecta.")
                    return

                ok, msg = save_data(payload)
                if ok:
                    self.send_response(200)
                    self.send_header("Content-type", "application/json")
                    self.end_headers()
                    self.wfile.write(
                        json.dumps({"status": "success", "message": msg}).encode("utf-8")
                    )
                else:
                    self._json_error(500, msg)
            except Exception as e:
                self._json_error(500, str(e))
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def _json_error(self, code, message):
        self.send_response(code)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(
            json.dumps({"status": "error", "message": message}).encode("utf-8")
        )

    def log_message(self, format, *args):
        if "/api/" in args[0]:
            super().log_message(format, *args)


# ---------------------------------------------------------------------------
# Arranque
# ---------------------------------------------------------------------------

init_db()

socketserver.TCPServer.allow_reuse_address = True

try:
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"\n{'='*74}")
        print(f"  SERVIDOR TECNOWORK — PUERTO {PORT}  [modo local / desarrollo]")
        print(f"{'='*74}")
        print(f"  Base de datos : {os.path.abspath(DB_FILE)}")
        print(f"  Local         : http://localhost:{PORT}")
        print(f"  Red local     : http://<tu-ip-local>:{PORT}")
        print(f"{'='*74}\n")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServidor detenido.")
except Exception as e:
    print(f"Error al iniciar el servidor: {e}")
