# Análisis de Reglas de Negocio — TecnoWork (LEXORER S.R.L.)

---

## 1. ¿Qué es este sistema?

**TecnoWork** es una aplicación web de gestión interna de facturación de consumo de impresión, desarrollada para **LEXORER S.R.L.** El cliente la opera desde su computadora local, cargando datos mensualmente y generando reportes en PDF para enviar a sus clientes finales.

El sistema gestiona el alquiler/abono de impresoras multifunción. Cada cliente tiene una o varias máquinas con un plan de impresión contratado. Cada mes se registran los contadores de cada máquina y el sistema calcula automáticamente si hubo excedentes sobre el plan contratado.

---

## 2. Entidades Principales (Modelo de Datos)

### 2.1 Planes de Impresión (`plans`)

Son los "productos" que la empresa ofrece. Definen cuántas copias incluye el abono mensual y su costo base.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador único (ej: `p1500`) |
| `name` | string | Nombre del plan (ej: "Plan 1.500 Copias") |
| `copies` | number | Cantidad de copias incluidas en el abono mensual |
| `cost` | number | Costo base mensual en pesos argentinos ($) |

**Planes por defecto al iniciar:**
- Plan 500 Copias → $35.000
- Plan 1.000 Copias → $60.000
- Plan 1.500 Copias → $85.500

**Reglas:**
- Los planes son globales, reutilizables por cualquier cliente y máquina.
- Al editar el costo de un plan, el sistema **recalcula automáticamente** todas las lecturas existentes que lo usen.
- Existe una función de **aumento porcentual masivo** que incrementa todos los planes base y, opcionalmente, los abonos personalizados de los clientes, en un porcentaje dado.

---

### 2.2 Clientes (`clients`)

Representan a las empresas o personas que contratan el servicio de impresión.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador único generado al crear |
| `name` | string | Nombre comercial / Razón Social |
| `phone` | string | Teléfono WhatsApp (formato: código país + área + número, sin +) |
| `observations` | string | Texto descriptivo del plan. Aparece en el PDF enviado al cliente |
| `machines` | array | Lista de equipos (impresoras) asignados a este cliente |

**Reglas:**
- No pueden existir dos clientes con el mismo nombre (validación case-insensitive).
- El campo `observations` es la descripción del plan que aparece impresa en el informe PDF que recibe el cliente (ej: "Plan BYN 1500 impresoras y multifuncion Ricoh 3710 y Xerox B405 incluye 1500 impresiones - Excedente $90").
- El teléfono se usa para generar un enlace directo a WhatsApp desde la tabla del dashboard.

---

### 2.3 Equipos / Máquinas (`machines`, sub-entidad de cliente)

Cada cliente tiene uno o más equipos. Los equipos pueden ser:

**Tipo A — Con contador de impresión (impresoras):**

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | ID único de la máquina |
| `name` | string | Nombre/Modelo (ej: "XEROX B405", "RICOH 3710 dn") |
| `serialNumber` | string | Número de serie (SN) de la máquina |
| `isFixed` | boolean | `false` → usa contador de impresión |
| `planId` | string | ID del plan de impresión asignado |
| `customCost` | number \| null | Si `null`, usa el costo base del plan. Si tiene valor, lo sobrescribe (abono personalizado) |
| `customExcessPrice` | number \| null | Si `null`, usa el precio de excedente global. Si tiene valor, lo sobrescribe |

**Tipo B — Abono fijo (sin contador):**

| Campo | Tipo | Descripción |
|---|---|---|
| `isFixed` | boolean | `true` → concepto fijo, sin contadores |
| `customCost` | number | Monto fijo mensual en $ (siempre requerido) |
| `planId` | null | No aplica |

**Ejemplo real (cliente ACLISA):**
- 9 impresoras con Plan 1.500 Copias, abonos personalizados entre $45.500 y $94.575
- 1 escáner con abono fijo de $187.200/mes (sin contadores)

---

### 2.4 Lecturas Mensuales (`readings`)

Son el registro central del negocio. Cada mes se genera una lectura por cliente con los contadores de todas sus máquinas.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | `r-{clientId}-{mes}-{año}` |
| `clientId` | string | Referencia al cliente |
| `clientName` | string | Nombre del cliente (desnormalizado para historial) |
| `periodMonth` | string | Mes de la lectura (ej: "Mayo") |
| `periodYear` | number | Año (ej: 2026) |
| `observations` | string | Notas del período (aparecen al pie del PDF) |
| `machineReadings` | array | Detalle por equipo |
| `totalAbono` | number | Suma de todos los abonos del período |
| `totalExcessCost` | number | Suma de todos los costos por excedente |
| `totalGeneral` | number | Total a facturar = `totalAbono + totalExcessCost` |

**Detalle de cada máquina en la lectura (`machineReadings`):**

| Campo | Descripción |
|---|---|
| `prevCounter` | Contador del mes anterior |
| `currCounter` | Contador del mes actual |
| `consumption` | `currCounter - prevCounter` |
| `planCopies` | Copias incluidas en el plan |
| `excess` | `max(0, consumption - planCopies)` |
| `excessPrice` | Precio por copia excedente |
| `planCost` | Abono base del período |
| `excessCost` | `excess × excessPrice` |
| `totalCost` | `planCost + excessCost` |
| `isPending` | `true` si no se ingresaron los contadores aún |

---

## 3. Fórmulas de Cálculo (Reglas de Negocio Principales)

```
Consumo mensual = Contador Actual − Contador Anterior

Excedente = max(0, Consumo − Copias del Plan)

Costo por Excedente = Excedente × Precio por Copia Excedente

Total por Máquina = Abono del Plan + Costo por Excedente

Total Cliente (mes) = Σ Total por cada Máquina
```

**Jerarquía de precios (prioridad de mayor a menor):**

1. `machine.customCost` (abono personalizado de esa máquina) → si existe, tiene prioridad
2. `plan.cost` (costo base del plan asignado a la máquina) → si no hay personalizado
3. `config.defaultExcessPrice` → precio de excedente global cuando la máquina no tiene `customExcessPrice`

**Conceptos fijos:** No tienen contadores. Su `totalCost` siempre es igual a `customCost`, independientemente del mes.

**Lecturas pendientes:** Si el operador guarda la lectura de un cliente sin ingresar los contadores de una máquina, esa máquina queda marcada como `isPending: true`. El sistema la incluye en el total usando solo el abono base (sin calcular excedentes), y marca el registro con un indicador visual "Pte" en la tabla y en el PDF.

---

## 4. Configuración Global del Sistema

| Parámetro | Valor por defecto | Descripción |
|---|---|---|
| `defaultExcessPrice` | $90 | Precio por copia excedente cuando la máquina no tiene uno personalizado |
| `companyName` | "LEXORER S.R.L." | Nombre que aparece en los PDFs |
| `companySub` | "TW - Informes de Consumo de Impresión" | Subtítulo/info de contacto en los PDFs |

---

## 5. Flujo de Trabajo Mensual

```
1. CONFIGURAR (una sola vez o cuando hay cambios)
   └─ Registrar clientes y sus máquinas con sus planes y abonos

2. CARGAR DATOS (cada mes, por cliente)
   ├─ Opción A: Ingresar contadores manualmente en la planilla
   ├─ Opción B: Importar archivo (Excel, CSV, PDF, imagen)
   └─ Opción C: Pegar texto libre (ej: desde WhatsApp)

3. REVISAR (Dashboard)
   └─ Ver tabla de facturación con consumo, excedentes y totales por cliente

4. EXPORTAR
   ├─ PDF individual por cliente → descarga con nombre: Consumo_{Cliente}_{Mes}_{Año}.pdf
   └─ PDF consolidado → resumen de todos los clientes del período
```

---

## 6. Módulo de Importación de Datos

El sistema puede procesar múltiples formatos de entrada para cargar los contadores:

| Formato | Motor utilizado | Cómo se usa |
|---|---|---|
| Excel (.xlsx, .xls) | SheetJS | Drag & drop o selección → mapeo de columnas |
| CSV | PapaParse | Drag & drop → mapeo de columnas |
| PDF | PDF.js (extracción de texto) | Drag & drop → parse automático del texto extraído |
| Imagen (JPG, PNG) | Tesseract.js (OCR) | Drag & drop → reconocimiento óptico de caracteres |
| Texto libre | Parser propio | Pegar en el área de texto |
| Página de mantenimiento Ricoh | Parser específico | Detecta automáticamente el formato Ricoh |

**Formato de texto reconocido automáticamente:**
```
ACLISA:
XEROX B405: 31973 a 32961
RICOH 3710 dn: 36463 a 38435
SCANER X 4: 0
```

El motor detecta:
- Líneas sin números → nombre del cliente (contexto)
- Líneas con dos números separados por "a", "-", "al", "→" → contador anterior y actual
- Líneas con un solo número → contador actual (el anterior queda en 0)

---

## 7. Generación de PDF

Cada cliente recibe un informe mensual en PDF que contiene:

1. **Cabecera** — Logo de TecnoWork + mensaje al cliente
2. **Datos del cliente** — Nombre + observaciones del plan (descripción contratada)
3. **Mes del período**
4. **Tabla de máquinas** con columnas: Máquina | Abono | Mes Anterior | Mes Actual | Plan | Excedente | Valor Excedente | Total
5. **Total General** — cuadro verde destacado con el monto total a pagar
6. **Notas al pie** — observaciones del período (ej: número de serie con excedente)

El PDF es generado completamente en el navegador (sin servidor) usando `html2pdf.js`. El nombre del archivo sigue el patrón: `Consumo_{Cliente}_{Mes}_{Año}.pdf`

También existe un **reporte consolidado** con un resumen de todos los clientes del período en una sola página A4.

---

## 8. Persistencia de Datos

### Flujo de guardado:

```
Acción del usuario
       │
       ├─► LocalStorage (copia de respaldo en el navegador)
       │
       └─► POST /api/save → database.json (archivo en el servidor)
```

### Flujo de carga al iniciar:

```
GET /api/data (servidor Python)
       │
       ├─ Si responde con datos → usa datos del servidor ✓
       │
       └─ Si falla → carga desde LocalStorage del navegador
                    └─ Si no hay LocalStorage → carga datos de demo (cliente ACLISA)
```

### Estructura de `database.json`:

```json
{
    "clients": [...],
    "plans": [...],
    "readings": [...],
    "config": {
        "defaultExcessPrice": 90,
        "companyName": "LEXORER S.R.L.",
        "companySub": "TW - Informes de Consumo de Impresión"
    }
}
```

El servidor Python (`server.py`) valida que el payload recibido contenga las cuatro claves (`clients`, `plans`, `readings`, `config`) antes de sobrescribir el archivo, para evitar corrupción accidental.

---

## 9. Arquitectura Técnica

| Componente | Tecnología | Rol |
|---|---|---|
| Frontend | HTML + CSS + JavaScript vanilla | UI completa (SPA sin frameworks) |
| Backend | Python 3 (stdlib: `http.server`, `json`) | Servidor de archivos estáticos + API REST |
| Base de datos | `database.json` (archivo plano) | Persistencia central |
| Respaldo offline | `localStorage` del navegador | Fallback si el servidor no está disponible |
| Generación PDF | html2pdf.js | PDF del lado del cliente (sin servidor) |
| Lectura Excel | SheetJS | Importación desde planillas |
| OCR | Tesseract.js | Reconocimiento de texto en imágenes |
| Gráficos | Chart.js | Gráfico de facturación en el Dashboard |

**API del servidor (solo dos endpoints):**

| Método | Ruta | Función |
|---|---|---|
| `GET` | `/api/data` | Devuelve el contenido completo de `database.json` |
| `POST` | `/api/save` | Sobrescribe `database.json` con el payload completo |

---

## 10. Modelo de Despliegue y Mantenimiento

### Situación actual

El cliente trabaja **en modo local**: ejecuta `python server.py` en su computadora y accede desde el navegador en `http://localhost:8000`.

Los datos viven en `database.json` dentro de la carpeta del proyecto. El cliente modifica los datos desde la interfaz web y el servidor los persiste en ese archivo.

### Nuestra tarea: mantener el sistema vivo y actualizado

**Lo que el cliente modificará con el tiempo:**
- Altas/bajas de clientes y máquinas
- Ajuste de planes y precios (aumentos periódicos por inflación)
- Carga de lecturas mensuales
- Cambios en el diseño del PDF o la interfaz

**Lo que nosotros debemos hacer ante cada cambio:**

1. **Recibir los cambios** — El cliente nos comunica qué modificó o qué necesita
2. **Aplicar los cambios** en el código fuente del repositorio
3. **Probar localmente** que el sistema funciona correctamente
4. **Hacer commit y push** al repositorio de GitHub (`main`)
5. **El cliente actualiza** haciendo `git pull` en su máquina (o nosotros lo hacemos de forma remota)

**Datos vs. código:**
- Los **datos** (clientes, lecturas, precios) los gestiona el cliente directamente desde la interfaz. No requieren intervención nuestra.
- El **código** (nuevas funcionalidades, correcciones, cambios de diseño) es nuestra responsabilidad.

### Punto crítico: `database.json`

El archivo `database.json` **no está en el repositorio** (o debería no estarlo si se agrega al `.gitignore`). Contiene los datos reales del negocio y lo gestiona el cliente. Nunca debemos sobreescribirlo con un `git pull` que traiga datos de demo.

**Recomendación a implementar:** agregar `database.json` al `.gitignore` para que los datos reales del cliente nunca se pisen con un pull del repositorio.

---

## 11. Archivos del Proyecto

```
tw-printer/
├── index.html              # Interfaz completa (SPA de una sola página)
├── server.py               # Servidor Python (API REST + archivos estáticos)
├── database.json           # Base de datos del cliente (generada al iniciar)
├── css/
│   └── styles.css          # Estilos globales (dark mode / light mode)
├── js/
│   ├── app.js              # Controlador principal: estado, eventos, renderizado
│   ├── parser.js           # Motor de importación (Excel, PDF, imagen, texto)
│   └── pdfGenerator.js     # Generación de informes PDF en el navegador
├── img/
│   └── logo.png            # Logo de TecnoWork
└── analisis_propuesta_backend.md   # Documento original de propuesta técnica
```

---

## 12. Resumen Ejecutivo de las Reglas de Negocio

1. **Un cliente puede tener N máquinas.** Cada máquina puede tener su propio plan y abono personalizado.
2. **El abono es fijo por mes**, independientemente del consumo. Si el consumo supera el plan, se agrega el costo por copias excedentes.
3. **Las copias excedentes se calculan por máquina**, no por cliente. Cada máquina se compara individualmente contra su plan.
4. **Un aumento de precios** se puede aplicar de forma global (% sobre todos los planes) y opcionalmente también sobre los abonos personalizados de cada máquina.
5. **El precio de copia excedente** tiene un valor global por defecto ($90) que puede ser sobreescrito por máquina.
6. **Los conceptos fijos** (como un servicio de escaneo) no tienen contadores y su monto siempre es fijo cada mes.
7. **El historial es mensual.** Una lectura por cliente por mes/año. Si se vuelve a guardar el mismo período, se sobreescribe.
8. **El PDF es el producto final** que recibe el cliente. Contiene todo el detalle de su consumo y el monto total a pagar.
