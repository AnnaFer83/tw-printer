/* ==========================================================================
   TECNOWORK - Motor de Importación y Parsing de Datos (Excel, CSV, PDF, Imagen, Texto)
   ========================================================================== */

// Configurar worker de PDF.js si la librería está cargada
if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const DataParser = {
    // Variable temporal para almacenar el archivo cargado en el proceso de mapeo
    activeWorkbookData: null,

    /**
     * Procesa un archivo arrastrado o seleccionado detectando su formato
     * @param {File} file - El archivo a procesar
     * @param {Function} onMappingRequired - Callback si es Excel/CSV y requiere mapear
     * @param {Function} onComplete - Callback al terminar la importación con array de registros
     * @param {Function} onError - Callback ante un error
     * @param {Function} onProgress - Callback para reportar progreso en OCR/PDF
     */
    processFile(file, onMappingRequired, onComplete, onError, onProgress = () => {}) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const fileType = file.type || '';

        // 1. Detectar archivos de texto plano (.txt, .log)
        if (fileType === 'text/plain' || fileExtension === 'txt' || fileExtension === 'log') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const records = this.parseRawText(text);
                onComplete(records);
            };
            reader.onerror = () => onError("Error al leer el archivo de texto.");
            reader.readAsText(file, 'UTF-8');
            return;
        }

        // 2. Detectar documentos PDF (.pdf)
        if (fileType === 'application/pdf' || fileExtension === 'pdf') {
            this.processPDF(file, onComplete, onError, onProgress);
            return;
        }

        // 3. Detectar imágenes para OCR (.jpg, .jpeg, .png, .webp)
        if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension)) {
            this.processImage(file, onComplete, onError, onProgress);
            return;
        }

        // 4. Detectar planillas CSV
        if (fileExtension === 'csv' || fileType === 'text/csv') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                Papa.parse(text, {
                    header: false,
                    skipEmptyLines: true,
                    complete: (results) => {
                        this.handleRawRows(results.data, onMappingRequired, onComplete);
                    },
                    error: (err) => {
                        onError("Error al leer el archivo CSV: " + err.message);
                    }
                });
            };
            reader.readAsText(file, 'UTF-8');
            return;
        }

        // 5. Detectar planillas Excel (.xlsx, .xls)
        if (fileExtension === 'xlsx' || fileExtension === 'xls' || fileType.includes('sheet') || fileType.includes('excel')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    this.handleRawRows(rows, onMappingRequired, onComplete);
                } catch (err) {
                    onError("Error al decodificar el archivo Excel: " + err.message);
                }
            };
            reader.readAsBinaryString(file);
            return;
        }

        // Si no coincide con ningún formato
        onError(`El formato de archivo ".${fileExtension}" no está soportado. Sube planillas de Excel, CSV, PDF, Imágenes o Texto.`);
    },

    /**
     * Extrae texto plano de un archivo PDF usando PDF.js
     */
    processPDF(file, onComplete, onError, onProgress) {
        onProgress("Cargando documento PDF...", 10);
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const typedarray = new Uint8Array(e.target.result);
            
            if (!window.pdfjsLib) {
                onError("La librería PDF.js no se cargó correctamente.");
                return;
            }

            pdfjsLib.getDocument({ data: typedarray }).promise.then(pdf => {
                onProgress("PDF cargado. Leyendo páginas...", 30);
                const maxPages = pdf.numPages;
                let count = 0;
                let fullText = "";
                const pagePromises = [];

                for (let i = 1; i <= maxPages; i++) {
                    pagePromises.push(
                        pdf.getPage(i).then(page => {
                            return page.getTextContent().then(textContent => {
                                const textItems = textContent.items.map(item => item.str);
                                fullText += textItems.join(" ") + "\n";
                                count++;
                                const pct = 30 + Math.round((count / maxPages) * 60);
                                onProgress(`Extrayendo texto: página ${count} de ${maxPages}...`, pct);
                            });
                        })
                    );
                }

                Promise.all(pagePromises).then(() => {
                    onProgress("Analizando lecturas del texto extraído...", 95);
                    const records = this.parseRawText(fullText);
                    onComplete(records);
                }).catch(err => {
                    onError("Error al extraer texto de las páginas: " + err.message);
                });
            }).catch(err => {
                onError("Error al abrir el archivo PDF: " + err.message);
            });
        };

        reader.onerror = () => onError("Error al leer el archivo PDF.");
        reader.readAsArrayBuffer(file);
    },

    /**
     * Ejecuta OCR sobre una imagen usando Tesseract.js
     */
    processImage(file, onComplete, onError, onProgress) {
        onProgress("Iniciando motor de reconocimiento óptico (OCR)...", 10);

        if (!window.Tesseract) {
            onError("La librería Tesseract.js no se cargó correctamente.");
            return;
        }

        // Usar Tesseract para extraer texto en español e inglés
        Tesseract.recognize(
            file,
            'spa', // Idioma principal español
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progressPct = 20 + Math.round(m.progress * 75);
                        onProgress(`Reconociendo caracteres: ${Math.round(m.progress * 100)}%`, progressPct);
                    } else if (m.status === 'loading spa.traineddata') {
                        onProgress("Cargando diccionario en español...", 15);
                    }
                }
            }
        ).then(({ data: { text } }) => {
            onProgress("OCR finalizado. Analizando texto...", 95);
            const records = this.parseRawText(text);
            onComplete(records);
        }).catch(err => {
            // Intentar con 'eng' como fallback en caso de fallo al descargar diccionario español
            onProgress("Fallo idioma español, reintentando con inglés...", 30);
            Tesseract.recognize(
                file,
                'eng',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            const progressPct = 40 + Math.round(m.progress * 55);
                            onProgress(`OCR (Inglés): ${Math.round(m.progress * 100)}%`, progressPct);
                        }
                    }
                }
            ).then(({ data: { text } }) => {
                const records = this.parseRawText(text);
                onComplete(records);
            }).catch(innerErr => {
                onError("Error de reconocimiento OCR: " + innerErr.message);
            });
        });
    },

    /**
     * Evalúa las filas crudas obtenidas del archivo e identifica encabezados
     */
    handleRawRows(rows, onMappingRequired, onComplete) {
        if (!rows || rows.length === 0) {
            throw new Error("El archivo está vacío.");
        }

        let headerIndex = 0;
        let headers = [];
        
        for (let i = 0; i < Math.min(rows.length, 5); i++) {
            const row = rows[i];
            const textCells = row.filter(cell => cell !== null && cell !== undefined && cell.toString().trim() !== "");
            if (textCells.length >= 2) {
                headerIndex = i;
                headers = row.map((cell, idx) => ({
                    index: idx,
                    name: cell ? cell.toString().trim() : `Columna ${idx + 1}`
                }));
                break;
            }
        }

        if (headers.length === 0) {
            const maxCols = Math.max(...rows.map(r => r.length));
            for (let idx = 0; idx < maxCols; idx++) {
                headers.push({ index: idx, name: `Columna ${idx + 1}` });
            }
            headerIndex = -1;
        }

        const dataRows = rows.slice(headerIndex + 1);

        this.activeWorkbookData = {
            headers: headers,
            rows: dataRows
        };

        const mappingGuesses = this.guessColumnMappings(headers);
        onMappingRequired(headers, mappingGuesses);
    },

    /**
     * Intenta adivinar las columnas correctas
     */
    guessColumnMappings(headers) {
        const guesses = {
            client: -1,
            prev: -1,
            curr: -1
        };

        const clientKeywords = ['cliente', 'nombre', 'razon', 'usuario', 'empresa', 'razon_social'];
        const prevKeywords = ['anterior', 'previo', 'prev', 'ant', 'inicial', 'lectura_ant', 'contador_ant'];
        const currKeywords = ['actual', 'nuevo', 'new', 'act', 'final', 'lectura_act', 'contador_act', 'hoy'];

        headers.forEach(h => {
            const name = h.name.toLowerCase();
            
            if (guesses.client === -1 && clientKeywords.some(kw => name.includes(kw))) {
                guesses.client = h.index;
            }
            if (guesses.prev === -1 && prevKeywords.some(kw => name.includes(kw))) {
                guesses.prev = h.index;
            }
            if (guesses.curr === -1 && currKeywords.some(kw => name.includes(kw))) {
                guesses.curr = h.index;
            }
        });

        if (guesses.client === -1 && headers.length > 0) guesses.client = 0;
        if (guesses.prev === -1 && headers.length > 1) guesses.prev = 1;
        if (guesses.curr === -1 && headers.length > 2) guesses.curr = 2;

        return guesses;
    },

    /**
     * Aplica el mapeo seleccionado y extrae los registros finales
     */
    applyMapping(mapping) {
        if (!this.activeWorkbookData) return [];

        const { clientIdx, prevIdx, currIdx, machineIdx } = mapping;
        const records = [];

        this.activeWorkbookData.rows.forEach(row => {
            const clientVal = row[clientIdx];
            if (clientVal === null || clientVal === undefined || clientVal.toString().trim() === "") {
                return;
            }

            const clientName = clientVal.toString().trim();
            
            let machineName = "Equipo Copiadora";
            if (machineIdx !== undefined && machineIdx !== -1) {
                const mVal = row[machineIdx];
                if (mVal !== null && mVal !== undefined && mVal.toString().trim() !== "") {
                    machineName = mVal.toString().trim();
                }
            }
            
            const cleanNumber = (val) => {
                if (val === null || val === undefined) return 0;
                let cleanStr = val.toString().replace(/[^0-9,\.\-]/g, '');
                if (cleanStr.includes('.') && cleanStr.includes(',')) {
                    if (cleanStr.indexOf('.') < cleanStr.indexOf(',')) {
                        cleanStr = cleanStr.replace(/\./g, '').replace(/,/g, '.');
                    } else {
                        cleanStr = cleanStr.replace(/,/g, '');
                    }
                } else if (cleanStr.includes('.')) {
                    const parts = cleanStr.split('.');
                    if (parts[parts.length - 1].length === 3) {
                        cleanStr = cleanStr.replace(/\./g, '');
                    }
                } else if (cleanStr.includes(',')) {
                    const parts = cleanStr.split(',');
                    if (parts[parts.length - 1].length === 3) {
                        cleanStr = cleanStr.replace(/,/g, '');
                    } else {
                        cleanStr = cleanStr.replace(/,/g, '.');
                    }
                }
                const num = parseFloat(cleanStr);
                return isNaN(num) ? 0 : Math.round(num);
            };

            const prevCounter = cleanNumber(row[prevIdx]);
            const currCounter = cleanNumber(row[currIdx]);

            records.push({
                clientName: clientName,
                machineName: machineName,
                prevCounter: prevCounter,
                currCounter: currCounter
            });
        });

        this.activeWorkbookData = null;
        return records;
    },

    /**
     * Parsea específicamente una Página de Mantenimiento de Ricoh para extraer el Contador Total
     * @param {string} rawText
     */
    parseRicohMaintenancePage(rawText) {
        // Buscar el modelo (ej: modelo: RICOH SP 3710SF)
        const modelMatch = rawText.match(/modelo\s*:\s*([^\n\r]+)/i) || rawText.match(/(RICOH\s+SP\s+\d+\w*)/i);
        let machineModel = "RICOH SP 3710SF";
        if (modelMatch) {
            machineModel = modelMatch[1].replace(/[:\-\–\—\=\,]+/g, '').trim();
        }

        // Buscar la sección de "Contador total" o "Contador"
        let counterValue = null;
        let index = rawText.toLowerCase().indexOf("contador total");
        if (index === -1) {
            index = rawText.toLowerCase().indexOf("contador");
        }

        if (index !== -1) {
            const afterContadorText = rawText.substring(index);
            
            // Buscar la primera línea que diga "Total páginas" o similar en esta sección
            const pageMatch = afterContadorText.match(/(?:total\s*p[áa]ginas|total\s*p[áa]gs\.?\s*impr\.?)\s*:\s*(\d+)/i) 
                           || afterContadorText.match(/(?:total\s*p[áa]ginas|total\s*p[áa]gs\.?\s*impr\.?)\s+(\d+)/i);
            
            if (pageMatch) {
                counterValue = parseInt(pageMatch[1], 10);
            }
        }

        if (counterValue !== null && !isNaN(counterValue)) {
            return [{
                clientName: machineModel,
                machineName: machineModel,
                prevCounter: 0,
                currCounter: counterValue,
                observation: "Lectura tomada desde la sección superior derecha 'Contador Total'."
            }];
        } else {
            return [{
                clientName: machineModel,
                machineName: machineModel,
                prevCounter: 0,
                currCounter: 0,
                observation: "Contador total no encontrado. Requiere revisión manual."
            }];
        }
    },

    /**
     * Parsea un texto crudo pegado desde el portapapeles o extraído de PDFs e imágenes
     */
    parseRawText(rawText) {
        if (!rawText || rawText.trim() === "") return [];

        // Check if this is a Ricoh Maintenance Page
        const isRicohReport = /ricoh|pagina de mantenimiento|página de mantenimiento|referencia sistema/i.test(rawText);
        if (isRicohReport) {
            return this.parseRicohMaintenancePage(rawText);
        }

        const lines = rawText.split('\n');
        const records = [];
        
        // Match numbers, allowing for dots/commas inside the number sequence
        const pairRegex = /([\d\.\,]+)\s*(?:a|al|y|-|–|—|to|->|=>)\s*([\d\.\,]+)\s*$/i;
        const singleRegex = /([\d\.\,]+)\s*$/;

        let currentClientName = "";

        // Helper to clean and parse number
        const parseNumberClean = (str) => {
            if (!str) return 0;
            const cleanStr = str.replace(/[\.\,]/g, '');
            const val = parseInt(cleanStr, 10);
            return isNaN(val) ? 0 : val;
        };

        // Fetch known clients to help identify clients when combined in a single line
        const knownClients = (window.AppState && window.AppState.clients) 
            ? window.AppState.clients.map(c => c.name.trim()) 
            : [];

        lines.forEach(line => {
            const cleanLine = line.trim();
            if (cleanLine === "") return;

            // Check if there are any numbers at the end of the line
            const pairMatch = cleanLine.match(pairRegex);
            const singleMatch = cleanLine.match(singleRegex);

            if (pairMatch) {
                const prevVal = parseNumberClean(pairMatch[1]);
                const currVal = parseNumberClean(pairMatch[2]);
                
                // Text before the number sequence
                const matchIndex = cleanLine.lastIndexOf(pairMatch[0]);
                let nameText = cleanLine.substring(0, matchIndex).trim();
                nameText = nameText.replace(/[:\-\–\—\=\,]+$/g, '').trim();

                let clientName = "";
                let machineName = "";

                // 1. Check if nameText starts with a known client name
                let matchedKnown = false;
                for (const known of knownClients) {
                    if (nameText.toLowerCase().startsWith(known.toLowerCase())) {
                        clientName = known;
                        let rest = nameText.substring(known.length).trim();
                        rest = rest.replace(/^[:\-\–\—\=\,\s]+/g, '').trim();
                        machineName = rest || "Equipo Copiadora";
                        matchedKnown = true;
                        currentClientName = known;
                        break;
                    }
                }

                if (!matchedKnown) {
                    // 2. Check if there's a delimiter like hyphen or colon that separates them (client - machine)
                    const splitDelim = nameText.match(/\s+[\-\–\—\:]\s+/);
                    if (splitDelim) {
                        const splitIndex = nameText.indexOf(splitDelim[0]);
                        clientName = nameText.substring(0, splitIndex).trim();
                        machineName = nameText.substring(splitIndex + splitDelim[0].length).trim();
                        currentClientName = clientName;
                    } else if (currentClientName) {
                        // 3. Fall back to current client context
                        clientName = currentClientName;
                        machineName = nameText || "Equipo Copiadora";
                    } else {
                        // 4. Default: Use entire nameText as client name
                        clientName = nameText || "Cliente Desconocido";
                        machineName = "Equipo Copiadora";
                    }
                }

                records.push({
                    clientName: clientName,
                    machineName: machineName,
                    prevCounter: prevVal,
                    currCounter: currVal
                });

            } else if (singleMatch) {
                const currVal = parseNumberClean(singleMatch[1]);
                
                const matchIndex = cleanLine.lastIndexOf(singleMatch[0]);
                let nameText = cleanLine.substring(0, matchIndex).trim();
                nameText = nameText.replace(/[:\-\–\—\=\,]+$/g, '').trim();

                let clientName = "";
                let machineName = "";

                // 1. Check if nameText starts with a known client name
                let matchedKnown = false;
                for (const known of knownClients) {
                    if (nameText.toLowerCase().startsWith(known.toLowerCase())) {
                        clientName = known;
                        let rest = nameText.substring(known.length).trim();
                        rest = rest.replace(/^[:\-\–\—\=\,\s]+/g, '').trim();
                        machineName = rest || "Equipo Copiadora";
                        matchedKnown = true;
                        currentClientName = known;
                        break;
                    }
                }

                if (!matchedKnown) {
                    // 2. Check if there's a delimiter like hyphen or colon that separates client - machine
                    const splitDelim = nameText.match(/\s+[\-\–\—\:]\s+/);
                    if (splitDelim) {
                        const splitIndex = nameText.indexOf(splitDelim[0]);
                        clientName = nameText.substring(0, splitIndex).trim();
                        machineName = nameText.substring(splitIndex + splitDelim[0].length).trim();
                        currentClientName = clientName;
                    } else if (currentClientName) {
                        // 3. Fall back to current client context
                        clientName = currentClientName;
                        machineName = nameText || "Equipo Copiadora";
                    } else {
                        clientName = nameText || "Cliente Sin Nombre";
                        machineName = "Equipo Copiadora";
                    }
                }

                records.push({
                    clientName: clientName,
                    machineName: machineName,
                    prevCounter: 0,
                    currCounter: currVal
                });

            } else {
                // Line has no numbers. It might be a client header!
                let possibleClient = cleanLine.replace(/[:\-\–\—\=\,]+$/g, '').trim();
                if (possibleClient.length > 0 && possibleClient.length < 60) {
                    // Update current client name context
                    currentClientName = possibleClient;
                }
            }
        });

        return records;
    }
};
