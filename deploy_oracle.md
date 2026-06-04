# Deploy en Oracle Cloud Always Free — TecnoWork

Runbook completo para desplegar el servidor en una instancia gratuita y permanente de Oracle Cloud.

---

## Requisitos previos

- Cuenta Oracle Cloud (oracle.com/cloud/free) — requiere tarjeta de crédito para verificar, no se cobra nada
- Acceso SSH al servidor de producción
- Git instalado localmente
- El cliente debe tener `database.json` con sus datos reales antes de migrar

---

## 1. Crear la instancia

**Ruta en la consola:** Compute → Instances → Create Instance

| Parámetro | Valor |
|---|---|
| Shape | VM.Standard.A1.Flex (ARM, Always Free) |
| OCPUs | 2 |
| RAM | 12 GB |
| OS | Canonical Ubuntu 22.04 |
| Boot volume | 50 GB |

**SSH key:** durante la creación, descargar el par de claves y guardar `ssh-key-*.key` de forma segura. Es la única forma de entrar al servidor.

---

## 2. Abrir puertos en Oracle (Security List)

En la consola: Networking → Virtual Cloud Networks → tu VCN → Security Lists → Default Security List

Agregar dos **Ingress Rules**:

| Source CIDR | Protocol | Destination Port | Descripción |
|---|---|---|---|
| 0.0.0.0/0 | TCP | 80 | HTTP |
| 0.0.0.0/0 | TCP | 443 | HTTPS |

> El puerto 22 (SSH) ya viene habilitado por defecto.

---

## 3. Conectar al servidor

```bash
chmod 400 ssh-key-*.key
ssh -i ssh-key-*.key ubuntu@<IP_PUBLICA>
```

La IP pública se ve en la consola: Compute → Instances → detalle de la instancia.

---

## 4. Preparar el servidor

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx python3 git certbot python3-certbot-nginx ufw

# Firewall del sistema operativo (Oracle tiene dos capas: red + SO)
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Oracle además usa iptables — abrir los mismos puertos en la cadena de SO
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80  -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

> **Nota:** Oracle Cloud tiene DOS capas de firewall: la Security List de la VCN (paso 2) y el firewall del SO (iptables/ufw). Ambas deben estar abiertas o el tráfico no llega. Este es el error más frecuente en despliegues en Oracle.

---

## 5. Clonar el repositorio

```bash
sudo mkdir -p /opt/tecnowork
sudo git clone https://github.com/AnnaFer83/tw-printer.git /opt/tecnowork
sudo chown -R ubuntu:ubuntu /opt/tecnowork
```

---

## 6. Migrar los datos del cliente

Este paso traslada el `database.json` del cliente al servidor y lo convierte a SQLite.

**En la máquina local del cliente:**
```bash
# Copiar database.json al servidor
scp -i ssh-key-*.key database.json ubuntu@<IP_PUBLICA>:/opt/tecnowork/
```

**En el servidor:**
```bash
cd /opt/tecnowork
python3 migrate.py
```

La salida confirma cuántos clientes, planes y lecturas se migraron. Si todo está bien, el archivo `database.db` queda listo. El `database.json` puede conservarse como backup histórico.

---

## 7. Configurar el servicio systemd

El servicio asegura que el servidor arranque automáticamente al reiniciar la VM.

```bash
sudo nano /etc/systemd/system/tecnowork.service
```

Contenido del archivo:

```ini
[Unit]
Description=TecnoWork — Servidor de facturación
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/opt/tecnowork
ExecStart=/usr/bin/python3 server.py
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Activar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable tecnowork
sudo systemctl start tecnowork
sudo systemctl status tecnowork   # debe mostrar "active (running)"
```

---

## 8. Configurar Nginx como reverse proxy

```bash
sudo nano /etc/nginx/sites-available/tecnowork
```

Contenido (reemplazar `tu-dominio.com` con el dominio real):

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Autenticación básica — protege todos los endpoints
    auth_basic           "TecnoWork — Acceso restringido";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass         http://127.0.0.1:8000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 30s;
    }
}
```

Activar el sitio:
```bash
sudo ln -s /etc/nginx/sites-available/tecnowork /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   # desactivar sitio por defecto
sudo nginx -t                                  # verificar configuración
sudo systemctl reload nginx
```

### Crear usuario de acceso

```bash
sudo apt install -y apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd tecnowork
# Ingresar la contraseña cuando lo pida
```

> Todos los usuarios del equipo LEXORER usan este mismo usuario/contraseña para acceder desde el navegador.

---

## 9. Apuntar el dominio

En el panel del proveedor de dominio, crear un registro A:

```
Tipo  : A
Nombre: @ (o subdominio, ej: tw)
Valor : <IP_PUBLICA del servidor Oracle>
TTL   : 300
```

Esperar 5-15 minutos a que propague.

---

## 10. Habilitar HTTPS con Let's Encrypt

```bash
sudo certbot --nginx -d tu-dominio.com
```

Certbot edita automáticamente la configuración de Nginx y configura renovación automática. SSL gratis, válido 90 días, se renueva solo.

Verificar renovación automática:
```bash
sudo certbot renew --dry-run
```

---

## 11. Verificación final

```bash
# Estado del servicio Python
sudo systemctl status tecnowork

# Logs en tiempo real
sudo journalctl -u tecnowork -f

# Probar el endpoint desde el servidor mismo
curl http://localhost:8000/api/data | python3 -m json.tool | head -20
```

Desde el navegador, acceder a `https://tu-dominio.com` e iniciar sesión con las credenciales creadas en el paso 8.

---

## Backups automáticos de database.db

El archivo `database.db` es la única fuente de verdad en producción. Un backup diario es indispensable.

```bash
# Crear carpeta de backups
mkdir -p /opt/tecnowork/backups

# Crear script de backup
nano /opt/tecnowork/backup.sh
```

Contenido de `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M)
sqlite3 /opt/tecnowork/database.db ".backup /opt/tecnowork/backups/database_$DATE.db"
# Conservar solo los últimos 30 backups
ls -t /opt/tecnowork/backups/database_*.db | tail -n +31 | xargs -r rm
```

```bash
chmod +x /opt/tecnowork/backup.sh

# Programar en cron: backup diario a las 3 AM
crontab -e
# Agregar esta línea:
0 3 * * * /opt/tecnowork/backup.sh
```

---

## Actualizaciones de código

Cada vez que el cliente sube cambios al repositorio:

```bash
cd /opt/tecnowork
git pull origin main
sudo systemctl restart tecnowork
```

> No es necesario re-ejecutar `migrate.py`. La migración es solo una vez. Los datos viven en `database.db` y no se tocan con un `git pull`.

---

## Resumen de URLs y comandos útiles

| Acción | Comando |
|---|---|
| Ver estado del servidor | `sudo systemctl status tecnowork` |
| Reiniciar servidor | `sudo systemctl restart tecnowork` |
| Ver logs | `sudo journalctl -u tecnowork -f` |
| Actualizar código | `cd /opt/tecnowork && git pull && sudo systemctl restart tecnowork` |
| Backup manual | `/opt/tecnowork/backup.sh` |
| Editar usuario Nginx | `sudo htpasswd /etc/nginx/.htpasswd tecnowork` |
