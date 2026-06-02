import http.server
import socketserver
import json
import os

PORT = 8000
DB_FILE = 'database.json'

# Inicializar base de datos con estructura básica limpia si no existe
if not os.path.exists(DB_FILE):
    initial_db = {
        "clients": [],
        "plans": [],
        "readings": [],
        "config": {
            "defaultExcessPrice": 90,
            "companyName": "LEXORER S.R.L.",
            "companySub": "TW - Informes de Consumo de Impresión"
        }
    }
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(initial_db, f, indent=4, ensure_ascii=False)
    print(f"Base de datos inicializada: {DB_FILE}")

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Habilitar CORS para evitar problemas de peticiones cruzadas en navegadores
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_GET(self):
        if self.path == '/api/data':
            try:
                with open(DB_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        else:
            # Servir archivos estáticos del frontend (HTML, JS, CSS, etc.)
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/save':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                payload = json.loads(post_data.decode('utf-8'))
                
                # Validar la estructura básica para evitar corrupciones de datos
                if isinstance(payload, dict) and all(k in payload for k in ("clients", "plans", "readings", "config")):
                    with open(DB_FILE, 'w', encoding='utf-8') as f:
                        json.dump(payload, f, indent=4, ensure_ascii=False)
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "success", "message": "Datos persistidos correctamente."}).encode('utf-8'))
                else:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "error", "message": "Estructura de base de datos incorrecta."}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        # Responder a las peticiones pre-vuelo de CORS
        self.send_response(200)
        self.end_headers()

# Evitar el error "Address already in use" al reiniciar el servidor rápidamente
socketserver.TCPServer.allow_reuse_address = True

try:
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"\n==========================================================================")
        print(f" SERVIDOR TECNOWORK CORRIENDO EN EL PUERTO {PORT}")
        print(f"==========================================================================")
        print(f" -> Base de datos activa localmente: {os.path.abspath(DB_FILE)}")
        print(f" -> Para acceder desde esta computadora: http://localhost:{PORT}")
        print(f" -> Para acceder desde otras PCs de la red local: http://<tu-ip-local>:{PORT}")
        print(f"==========================================================================\n")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServidor detenido por el usuario.")
except Exception as e:
    print(f"Error al iniciar el servidor: {e}")
