# Developer Context — TecnoWork (LEXORER S.R.L.)

> **Cómo usar este archivo:** Pegá el contenido completo al inicio de cualquier conversación con Claude AI. Provee todo el contexto necesario para retomar el proyecto sin fricción.

---

## Rol del equipo

Somos **coordinadores y DevOps** de este proyecto. El cliente (LEXORER S.R.L.) es el desarrollador principal: hace los cambios de código, agrega funcionalidades y evoluciona el sistema según sus necesidades. Nuestra intervención en el código ocurre **solo cuando el cliente lo solicita explícitamente**.

Nuestras responsabilidades concretas:
- Entender y documentar el estado actual del sistema.
- Coordinar y registrar los cambios que el cliente va realizando.
- Gestionar el repositorio GitHub (revisión de commits, estructura del repo, `.gitignore`).
- **Desplegar y mantener el sistema en producción** (primer deploy, actualizaciones, infraestructura).
- Asesorar técnicamente cuando el cliente nos consulte.
- Aplicar cambios de código puntuales si el cliente nos lo pide.

---

## El cliente

**LEXORER S.R.L.** — empresa que alquila impresoras multifunción a otras empresas.  
El sistema que desarrollan es de **gestión interna**: lo usa el propio equipo de LEXORER para registrar consumos mensuales y generar las facturas/informes de sus clientes.  
El cliente trabaja de forma local desde su computadora y va modificando el código según sus necesidades.

---

## El producto: TecnoWork

Aplicación web de facturación de consumo de impresión. Cada mes, LEXORER registra los contadores de cada impresora de cada cliente final, calcula si hubo excedentes sobre el plan contratado y genera un PDF con el detalle para enviarle al cliente.

### Fórmula central del negocio (invariante)
```
Consumo       = Contador Actual − Contador Anterior
Excedente     = max(0, Consumo − Copias incluidas en el Plan)
Total Máquina = Abono Mensual + (Excedente × Precio por Copia Excedente)
Total Cliente = Σ Total de cada Máquina
```

### Entidades principales
- **Planes:** productos base (N copias/mes + costo mensual). Globales, reutilizables.
- **Clientes:** empresas que contratan el servicio. Tienen N máquinas asignadas.
- **Máquinas:** pueden ser con contador (impresoras) o abono fijo (escáneres, servicios). Cada una puede tener abono y precio de excedente personalizado que sobrescribe el del plan.
- **Lecturas:** registro mensual por cliente. Una por mes/año. Contiene el detalle de contadores de cada máquina y los totales calculados.

### Reglas de negocio clave
- No puede haber dos clientes con el mismo nombre.
- Si un abono es "fijo" (`isFixed: true`), no tiene contadores: su costo es siempre igual a `customCost`.
- Jerarquía de precio de abono: `machine.customCost` > `plan.cost`.
- Jerarquía de precio de excedente: `machine.customExcessPrice` > `config.defaultExcessPrice` (default: $90).
- Si se guarda una lectura sin los contadores de una máquina, queda `isPending: true` y usa solo el abono base.
- Al cambiar el costo de un plan, el sistema recalcula todas las lecturas históricas que lo usan.
- Existe una función de aumento porcentual masivo de abonos (aplica a planes y opcionalmente a `customCost` de clientes).

---

## Arquitectura

```
[Navegador del usuario]
     │  GET /api/data   (carga inicial)
     │  POST /api/save  (cada modificación)
     ▼
[server.py — Python 3 stdlib, puerto 8000]
     │  Sirve archivos estáticos (HTML/JS/CSS/img)
     │  2 endpoints REST
     ▼
[database.json — archivo plano local]
```

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | HTML + JS vanilla + CSS | SPA sin frameworks, sin build step |
| Backend | Python 3 stdlib (`http.server`, `json`, `sqlite3`) | Sin dependencias externas. Un solo archivo. |
| Base de datos | SQLite (`database.db`) | WAL mode, transacciones atómicas. Fallback a `localStorage` si el servidor no responde. |
| PDF | html2pdf.js (navegador) | Generación del lado del cliente, sin servidor |
| Importación | SheetJS, PapaParse, PDF.js, Tesseract.js | Excel, CSV, PDF, OCR de imágenes, texto libre |

### Estructura de archivos
```
tw-printer/
├── index.html              # UI completa (SPA)
├── server.py               # Servidor + API REST (usa SQLite)
├── migrate.py              # Migración one-time: database.json → database.db
├── database.db             # Base de datos SQLite [NO debe ir al repo]
├── database.json           # Archivo legacy — conservar como backup, no usar en producción
├── deploy_oracle.md        # Runbook de deploy en Oracle Cloud
├── css/styles.css
├── js/
│   ├── app.js              # Estado global, eventos, renderizado
│   ├── parser.js           # Motor de importación de datos
│   └── pdfGenerator.js     # Generación de PDFs
└── img/logo.png
```

### Endpoints
| Método | Ruta | Función |
|---|---|---|
| `GET` | `/api/data` | Devuelve `database.json` completo |
| `POST` | `/api/save` | Valida y sobrescribe `database.json` |
| `GET` | `/*` | Sirve archivos estáticos |

---

## Regla crítica: archivos de base de datos

`database.db` es la fuente de verdad en producción. **Nunca debe estar en el repositorio.**  
`database.json` es el archivo legacy — conservar localmente como backup histórico, no usar en producción.

**Acción pendiente:** agregar `database.db` y `database.json` al `.gitignore`.

---

## Repositorio

- **URL:** https://github.com/AnnaFer83/tw-printer.git
- **Rama principal:** `main`
- **Quién hace commits:** principalmente el cliente. Nosotros solo cuando se nos solicita o para tareas DevOps.

### Flujo cuando el cliente sube cambios
```
1. El cliente hace push a main
2. Nosotros revisamos el commit si hay algo que coordinar
3. En producción: git pull origin main → reiniciar server.py
```

### Flujo cuando nosotros aplicamos un cambio solicitado
```
1. git pull origin main          # sincronizar
2. Aplicar el cambio
3. Probar localmente con server.py
4. git add <archivos específicos> # nunca git add -A sin revisar
5. git commit -m "descripción del cambio"
6. git push origin main
7. Notificar al cliente para que haga git pull
```

---

## Estado DevOps: primer deploy a producción

**Estado actual:** el cliente opera 100% en modo local (`http://localhost:8000`).  
**Objetivo:** tener una versión accesible desde internet o desde la red de la oficina.

### Preguntas abiertas (necesitan respuesta del cliente)
- [ ] ¿Acceso desde internet o solo desde la red de la oficina (LAN)?
- [ ] ¿Tiene dominio propio o usamos uno nuevo?
- [ ] ¿Cuántos usuarios acceden simultáneamente? (define si el servidor Python actual alcanza)
- [ ] ¿Los datos deben estar en la nube o en una PC de la oficina?
- [ ] ¿Hay presupuesto mensual para hosting? (VPS mínimo ~$5 USD/mes)

### Opción recomendada para primera versión: VPS simple

**Por qué:** el código ya corre en cualquier Linux con Python 3. No requiere cambios al código. Sin riesgo de rotura del sistema actual.

```
[Internet] → [Nginx (reverse proxy + HTTPS)] → [server.py puerto 8000]
                                                [Gestionado por systemd]
```

**Checklist de implementación (pendiente de decisiones del cliente):**
- [ ] Definir proveedor (Hetzner, DigitalOcean, Render con volumen persistente)
- [ ] Crear instancia Linux Ubuntu 22.04 LTS
- [ ] Clonar repo en el servidor
- [ ] Configurar servicio `systemd` para auto-arranque
- [ ] Instalar Nginx como reverse proxy
- [ ] Apuntar dominio/subdominio al VPS
- [ ] Certificado SSL con Certbot (Let's Encrypt, gratuito)
- [ ] Autenticación básica en `/api/save`
- [ ] Estrategia de backup automático de `database.json`
- [ ] Prueba end-to-end desde el navegador del cliente

### Alternativas según contexto

| Escenario | Solución |
|---|---|
| Solo oficina, costo cero | Red local (LAN): PC fija como servidor, acceso por IP |
| Nube, simplicidad máxima | Render.com con disco persistente (free tier con limitaciones) |
| Nube, control total | VPS Hetzner/DigitalOcean (~$5 USD/mes) |
| Frontend estático separado | GitHub Pages (frontend) + API serverless (requiere refactor) |

---

## Log de cambios y decisiones

| Fecha | Tipo | Descripción |
|---|---|---|
| 2026-06-03 | Análisis | Lectura y análisis completo del proyecto. Creación de `ANALISIS_REGLAS_NEGOCIO.md`. |
| 2026-06-03 | Contexto | Creación de `developer_context.md` como documento vivo del proyecto. |
| 2026-06-03 | Contexto | Ajuste del rol: equipo actúa como coordinador y DevOps. El cliente es el desarrollador principal. |
| 2026-06-03 | Arquitectura | Migración de persistencia: `database.json` → SQLite (`database.db`). API sin cambios. WAL mode + transacciones atómicas. Creados `server.py` (reescrito), `migrate.py` (one-time), `deploy_oracle.md` (runbook). |
| 2026-06-03 | DevOps | Decisión de hosting: Oracle Cloud Always Free (ARM VM.Standard.A1.Flex). Runbook documentado en `deploy_oracle.md`. Incluye Nginx + systemd + SSL + auth básica + backups automáticos. |
| 2026-06-04 | Feature | Cliente (Natalia) subió 9 commits (v1.6). Cambios principales: (1) Soporte para **planes con copias = 0** (pago por copia puro) — toca la fórmula central, incluye fix de cálculos, display PDF y migración automática de históricos. (2) **Excedente específico por plan** (nueva jerarquía: `plan.excessPrice`). (3) **Dashboard con historial de 12 meses** agrupado por cliente con doble acordeón y registro de operador/fecha. (4) Simplificación de formato de observaciones y agrupación de máquinas idénticas. (5) Pie de reporte cambiado a datos de contacto fijos de TecnoWork. |

---

## Cómo actualizar este archivo

Agregar una entrada al log cada vez que:
- El cliente sube cambios relevantes al repo.
- Se toma una decisión técnica o de arquitectura.
- Se completa un paso del checklist de producción.
- Cambia alguna regla de negocio.
- Se define algo que antes estaba abierto.

El objetivo es que este archivo refleje siempre el estado real del proyecto, no el estado al momento de su creación.
