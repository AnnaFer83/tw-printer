# Propuesta Técnica y Funcional: Desarrollo Backend y Base de Datos - TecnoWork

Este documento detalla la propuesta de arquitectura para habilitar el acceso multi-usuario en red local de la aplicación de facturación **TecnoWork (LEXORER S.R.L.)**. Su propósito es consolidar la toma de decisiones técnicas, evaluar alternativas de desarrollo y realizar una comparativa detallada respecto a la pila tradicional de Node.js/Express.

---

## 1. Contexto y Requerimientos del Sistema
El sistema actual es una aplicación web del lado del cliente que procesa datos de consumo de impresión. Para escalar a un entorno multi-usuario en la oficina (donde diferentes PC o notebooks accedan y editen de forma concurrente), se requiere:
1. **Centralización**: Los catálogos de clientes, abonos base y lecturas mensuales deben residir en un único punto en red.
2. **Facilidad de Uso**: Instalación inmediata en la máquina servidor, sin requerir software adicional ni configuraciones de red complejas.
3. **Resiliencia**: En caso de caída de la red o desconexión del servidor, la aplicación debe seguir funcionando mediante caché/respaldo local en el navegador.

---

## 2. Diagrama de Arquitectura Propuesta

```mermaid
graph TD
    subgraph Red Local (LAN)
        PC1[Notebook Usuario A - Navegador] -->|HTTP GET/POST| Server[Servidor Principal - Python 3]
        PC2[PC Usuario B - Navegador] -->|HTTP GET/POST| Server
        
        subgraph Servidor de Base de Datos
            Server -->|API REST /api/data| Engine[Controlador de API Estándar]
            Engine -->|Lectura / Escritura| DB[(database.json)]
            Server -->|Servir Archivos| Static[Archivos Estáticos HTML/JS/CSS]
        end
    end
    
    subgraph Respaldo Offline
        PC1 -->|Fallback| LS1[(LocalStorage Navegador A)]
        PC2 -->|Fallback| LS2[(LocalStorage Navegador B)]
    end
```

---

## 3. Comparativa de Tecnologías Backend

Evaluamos dos alternativas para el backend: el enfoque propuesto en **Python 3 Estándar** contra el ecosistema de **Node.js con Express**.

### Tabla Comparativa: Backend

| Factor Técnico | Propuesta: Python 3 Estándar | Alternativa: Node.js / Express |
| :--- | :--- | :--- |
| **Instalación / Dependencias** | **Cero dependencias**. Utiliza librerías nativas (`http.server`, `json`). | Requiere instalar Node.js, `npm init`, e instalar dependencias externas (`express`, `cors`). |
| **Consumo de Memoria** | Muy bajo (aprox. 15-20 MB RAM en reposo). | Medio (aprox. 50-80 MB RAM en reposo por la máquina virtual V8). |
| **Dificultad de Despliegue** | **Ninguna**. Python ya está preinstalado en macOS/Linux. Solo se ejecuta el script `server.py`. | Requiere inicialización de dependencias (`npm install`) en cada nueva PC que actúe como servidor. |
| **Curva de Aprendizaje** | Muy corta. El script se reduce a un solo archivo de menos de 100 líneas de código. | Media. Estructuración en rutas, middlewares de Express y control de paquetes de `node_modules`. |

---

## 4. Comparativa de Persistencia (Base de Datos)

Comparamos el almacenamiento en **archivos planos JSON** con sistemas relacionales (SQL) y bases de datos NoSQL tradicionales en Node.js (MongoDB).

### Tabla Comparativa: Persistencia

| Característica | Archivo Plano JSON (`database.json`) | Base de Datos Relacional (SQLite / PostgreSQL) | Base de Datos NoSQL (MongoDB / Mongoose) |
| :--- | :---: | :---: | :---: |
| **Clase de Base de Datos** | **No Relacional** (Documento JSON) | **Relacional** (Tablas y Relaciones SQL) | **No Relacional** (Orientado a Documentos) |
| **Software Adicional** | **Ninguno** (Lectura/escritura nativa) | Requiere instalar cliente SQL (excepto SQLite que es embebido) | Requiere levantar y configurar el servicio de MongoDB en la PC |
| **Velocidad de Lectura** | Alta (se lee todo en memoria de una sola vez) | Muy alta (indexación indexada de tablas) | Muy alta (diseñado para millones de registros) |
| **Portabilidad / Backup** | **Máxima**. Es un solo archivo de texto legible en la carpeta del proyecto. | Media. Requiere exportar volcados de base de datos (`.sql` o `.db`). | Baja. Requiere comandos de volcado (`mongodump`) y restauración. |
| **Complejidad del Código** | Mínima. Se realiza mediante `json.dump()` y `json.load()`. | Alta. Requiere escribir sentencias `SELECT`, `UPDATE` y gestionar esquemas. | Media-Alta. Requiere modelar esquemas en Mongoose y APIs de consulta. |

---

## 5. Distribución de la Toma de Decisiones (Justificación)

La elección de **Python 3 Estándar + base de datos JSON** está fundamentada en los siguientes compromisos técnicos (*trade-offs*):

1. **Por qué no Express/Node**:
   * *Express* es excelente para proyectos que escalan a nivel empresarial en la nube con miles de peticiones simultáneas. Sin embargo, para la red interna de TecnoWork, el costo operativo de mantener la carpeta `node_modules` (que suele pesar más de 50MB) y obligar a instalar Node.js rompe la simplicidad de la aplicación estática. Python aprovecha el runtime ya presente en tu Mac.
2. **Por qué no bases de datos Relacionales (SQL)**:
   * Las lecturas mensuales se asocian de manera cambiante según el mes de trabajo. Una base de datos rígida de tablas SQL exigiría migraciones de base de datos cada vez que queramos incorporar datos flexibles de observaciones o nuevos parámetros en la plantilla. El formato JSON se adapta nativamente a Javascript, permitiendo iterar y agregar campos de configuración sin alterar tablas físicas.
3. **Control del Concurrencia**:
   * En redes locales de oficina con menos de 10 usuarios concurrentes, las posibilidades de colisión de escritura en `database.json` son prácticamente nulas. El servidor en Python sobrescribirá de forma atómica el archivo JSON en fracciones de milisegundo al recibir un cambio, siendo más que suficiente para garantizar la integridad sin requerir bloqueos transaccionales pesados.
4. **Sencillez ante Fallos**:
   * Si un usuario comete un error grave en la carga y corrompe los datos, la solución técnica con JSON es tan simple como abrir el archivo `database.json` en un editor de texto y corregir la línea dañada directamente, o restaurar la copia de respaldo de la víspera con un simple copiar y pegar.
