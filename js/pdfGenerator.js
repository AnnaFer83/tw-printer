/* ==========================================================================
   TECNOWORK - Generador de Informes en PDF (html2pdf.js)
   ========================================================================== */

const PDFGenerator = {
    /**
     * Formatea un número al estilo local de Argentina (separador de miles con punto)
     */
    formatNumber(num) {
        if (num === undefined || num === null || isNaN(num)) return '0';
        return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(num);
    },

    /**
     * Formatea una moneda ($ con separador de miles con punto)
     */
    formatCurrency(val) {
        if (val === undefined || val === null || isNaN(val)) return '$0';
        return '$' + this.formatNumber(val);
    },

    /**
     * Genera y descarga el PDF en el formato exacto de TecnoWork
     * @param {Object} record - Registro mensual agrupado por cliente
     * @param {Object} config - Configuración de la empresa
     * @param {string} clientObs - Observación general de la ficha de cliente
     */
    generateIndividualPDF(record, config, clientObs) {
        const template = document.querySelector('#pdf-print-template .invoice-container');
        if (!template) return;

        // Clonar el template para su manipulación fuera de la vista
        const clone = template.cloneNode(true);
        clone.style.position = 'static';

        // Modificar cabeceras en el clon
        const logoSub = clone.querySelector('.pdf-logo-sub');
        if (logoSub) {
            logoSub.innerText = config.companyName || 'LEXORER S.R.L.';
        }
        clone.querySelector('.pdf-client-name').innerText = record.clientName.toUpperCase();
        
        // Generar detalle dinámico de abonos si no hay observación manual
        let displayObs = "";
        if (record.observations && record.observations.trim() !== "") {
            displayObs = record.observations;
        } else if (clientObs && clientObs.trim() !== "") {
            displayObs = clientObs;
        } else {
            const client = AppState.clients.find(c => c.id === record.clientId);
            displayObs = window.generateDefaultObservations ? window.generateDefaultObservations(client) : "";
            if (!displayObs) {
                displayObs = "Detalle de abono y consumos del período";
            }
        }
        clone.querySelector('.pdf-client-observations').innerText = displayObs;
        
        // Período
        clone.querySelector('.pdf-period-month').innerText = record.periodMonth.toUpperCase();

        // Rellenar filas de la tabla
        const tbody = clone.querySelector('#pdf-table-items-body');
        tbody.innerHTML = "";

        let totalCopPrev = 0, totalCopCurr = 0, totalCopCons = 0;
        let totalImpPrev = 0, totalImpCurr = 0, totalImpCons = 0;
        let totalPPPrev = 0, totalPPCurr = 0, totalPPCons = 0;
        let totalPFPrev = 0, totalPFCurr = 0, totalPFCons = 0;
        let hasSub = false;
        let firstLaserExcessPrice = AppState.config.defaultExcessPrice || 90;
        let foundLaserPrice = false;

        record.machineReadings.forEach(mr => {
            const type = window.getMachineType(mr.name);
            const hasRep = mr.hasReplacement || false;

            if (mr.isFixed) {
                // Concepto fijo
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td style="font-weight: 700; padding: 8px 10px;">${mr.name}</td>
                    <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.planCost)}</td>
                    <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">0</td>
                    <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">0</td>
                    <td style="text-align: right; padding: 8px 10px;">0</td>
                    <td style="text-align: right; padding: 8px 10px;">0</td>
                    <td style="text-align: right; padding: 8px 10px;">0</td>
                    <td style="text-align: right; font-weight: 700; padding: 8px 10px;">${this.formatNumber(mr.totalCost)}</td>
                `;
                tbody.appendChild(tr);
            } else if (mr.isPending) {
                // Pendiente de lectura
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td style="font-weight: 700; padding: 8px 10px;">${mr.name}</td>
                    <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.planCost)}</td>
                    <td style="text-align: right; padding: 8px 10px; color: #dc2626 !important; font-weight: 600;" class="pdf-cell-yellow">Pendiente</td>
                    <td style="text-align: right; padding: 8px 10px; color: #dc2626 !important; font-weight: 600;" class="pdf-cell-yellow">Pendiente</td>
                    <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.planCopies === 0 ? mr.excessPrice : mr.planCopies)}</td>
                    <td style="text-align: right; padding: 8px 10px; color: #dc2626 !important;">Pendiente</td>
                    <td style="text-align: right; padding: 8px 10px; color: #dc2626 !important;">Pendiente</td>
                    <td style="text-align: right; font-weight: 700; padding: 8px 10px; color: #dc2626 !important;">Pendiente</td>
                `;
                tbody.appendChild(tr);
            } else {
                if (type === "color") {
                    hasSub = true;
                    const ppPrice = AppState.config.defaultPPPrice !== undefined ? AppState.config.defaultPPPrice : 300;
                    const pfPrice = AppState.config.defaultPFPrice !== undefined ? AppState.config.defaultPFPrice : 600;

                    const consPP_ant = Math.max(0, (mr.currPP || 0) - (mr.prevPP || 0));
                    const consPF_ant = Math.max(0, (mr.currPF || 0) - (mr.prevPF || 0));
                    const excessCost_ant = (consPP_ant * ppPrice) + (consPF_ant * pfPrice);

                    totalPPPrev += mr.prevPP || 0;
                    totalPPCurr += mr.currPP || 0;
                    totalPPCons += consPP_ant;

                    totalPFPrev += mr.prevPF || 0;
                    totalPFCurr += mr.currPF || 0;
                    totalPFCons += consPF_ant;

                    if (hasRep) {
                        const repPrevPP = mr.repPrevPP || 0;
                        const repCurrPP = mr.repCurrPP || 0;
                        const repPrevPF = mr.repPrevPF || 0;
                        const repCurrPF = mr.repCurrPF || 0;

                        const consPP_nvo = Math.max(0, repCurrPP - repPrevPP);
                        const consPF_nvo = Math.max(0, repCurrPF - repPrevPF);
                        const excessCost_nvo = (consPP_nvo * ppPrice) + (consPF_nvo * pfPrice);

                        totalPPPrev += repPrevPP;
                        totalPPCurr += repCurrPP;
                        totalPPCons += consPP_nvo;

                        totalPFPrev += repPrevPF;
                        totalPFCurr += repCurrPF;
                        totalPFCons += consPF_nvo;

                        // Fila Anterior (Color)
                        const trAnt = document.createElement("tr");
                        trAnt.innerHTML = `
                            <td style="font-weight: 700; padding: 8px 10px;">[Ant] ${mr.name}</td>
                            <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.planCost)}</td>
                            <td style="text-align: right; padding: 8px 10px; font-size: 8px;" class="pdf-cell-yellow">PP:${mr.prevPP} | PF:${mr.prevPF}</td>
                            <td style="text-align: right; padding: 8px 10px; font-size: 8px;" class="pdf-cell-yellow">PP:${mr.currPP} | PF:${mr.currPF}</td>
                            <td style="text-align: right; padding: 8px 10px;">-</td>
                            <td style="text-align: right; padding: 8px 10px; font-weight: 700; color: ${excessCost_ant > 0 ? '#d97706' : '#1e293b'}; font-size: 8px;">PP:${consPP_ant} | PF:${consPF_ant}</td>
                            <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(excessCost_ant)}</td>
                            <td style="text-align: right; font-weight: 700; padding: 8px 10px;">${this.formatNumber(mr.planCost + excessCost_ant)}</td>
                        `;
                        tbody.appendChild(trAnt);

                        // Fila Nuevo (Color)
                        const trNvo = document.createElement("tr");
                        trNvo.style.backgroundColor = "rgba(0,0,0,0.01)";
                        trNvo.innerHTML = `
                            <td style="font-weight: 700; padding: 8px 10px; padding-left: 15px;">[Nvo] ${mr.repModel}</td>
                            <td style="text-align: right; padding: 8px 10px;">0</td>
                            <td style="text-align: right; padding: 8px 10px; font-size: 8px;" class="pdf-cell-yellow">PP:${repPrevPP} | PF:${repPrevPF}</td>
                            <td style="text-align: right; padding: 8px 10px; font-size: 8px;" class="pdf-cell-yellow">PP:${repCurrPP} | PF:${repCurrPF}</td>
                            <td style="text-align: right; padding: 8px 10px;">-</td>
                            <td style="text-align: right; padding: 8px 10px; font-weight: 700; color: ${excessCost_nvo > 0 ? '#d97706' : '#1e293b'}; font-size: 8px;">PP:${consPP_nvo} | PF:${consPF_nvo}</td>
                            <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(excessCost_nvo)}</td>
                            <td style="text-align: right; font-weight: 700; padding: 8px 10px;">${this.formatNumber(excessCost_nvo)}</td>
                        `;
                        tbody.appendChild(trNvo);
                    } else {
                        // Fila Única (Color)
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td style="font-weight: 700; padding: 8px 10px;">${mr.name}</td>
                            <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.planCost)}</td>
                            <td style="text-align: right; padding: 8px 10px; font-size: 8px;" class="pdf-cell-yellow">PP:${mr.prevPP} | PF:${mr.prevPF}</td>
                            <td style="text-align: right; padding: 8px 10px; font-size: 8px;" class="pdf-cell-yellow">PP:${mr.currPP} | PF:${mr.currPF}</td>
                            <td style="text-align: right; padding: 8px 10px;">-</td>
                            <td style="text-align: right; padding: 8px 10px; font-weight: 700; color: ${mr.excessCost > 0 ? '#d97706' : '#1e293b'}; font-size: 8px;">PP:${consPP_ant} | PF:${consPF_ant}</td>
                            <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.excessCost)}</td>
                            <td style="text-align: right; font-weight: 700; padding: 8px 10px;">${this.formatNumber(mr.totalCost)}</td>
                        `;
                        tbody.appendChild(tr);
                    }
                } else {
                    // Laser / BN
                    if (!foundLaserPrice && mr.excessPrice !== undefined && mr.excessPrice !== null) {
                        firstLaserExcessPrice = mr.excessPrice;
                        foundLaserPrice = true;
                    }

                    const hasSubVals = (mr.prevImpresiones || mr.currImpresiones || mr.prevCopias || mr.currCopias ||
                                        mr.repPrevImpresiones || mr.repCurrImpresiones || mr.repPrevCopias || mr.repCurrCopias);
                    if (hasSubVals) {
                        hasSub = true;
                        totalImpPrev += mr.prevImpresiones || 0;
                        totalImpCurr += mr.currImpresiones || 0;
                        totalImpCons += Math.max(0, (mr.currImpresiones || 0) - (mr.prevImpresiones || 0));

                        totalCopPrev += mr.prevCopias || 0;
                        totalCopCurr += mr.currCopias || 0;
                        totalCopCons += Math.max(0, (mr.currCopias || 0) - (mr.prevCopias || 0));
                    }

                    if (hasRep) {
                        const repPrev = mr.repPrevCounter || 0;
                        const repCurr = mr.repCurrCounter || 0;
                        const repCons = Math.max(0, repCurr - repPrev);

                        if (hasSubVals) {
                            totalImpPrev += mr.repPrevImpresiones || 0;
                            totalImpCurr += mr.repCurrImpresiones || 0;
                            totalImpCons += Math.max(0, (mr.repCurrImpresiones || 0) - (mr.repPrevImpresiones || 0));

                            totalCopPrev += mr.repPrevCopias || 0;
                            totalCopCurr += mr.repCurrCopias || 0;
                            totalCopCons += Math.max(0, (mr.repCurrCopias || 0) - (mr.repPrevCopias || 0));
                        }

                        // Redistribution logic
                        let excessAnt = 0;
                        let excessNvo = 0;

                        if (mr.planCopies === 0) {
                            excessAnt = mr.consumption;
                            excessNvo = repCons;
                        } else {
                            excessAnt = Math.max(0, mr.consumption - mr.planCopies);
                            const remainingPlan = Math.max(0, mr.planCopies - mr.consumption);
                            excessNvo = Math.max(0, repCons - remainingPlan);
                        }

                        const excessCost_ant = excessAnt * mr.excessPrice;
                        const excessCost_nvo = excessNvo * mr.excessPrice;

                        // Fila Anterior (Laser)
                        const trAnt = document.createElement("tr");
                        trAnt.innerHTML = `
                            <td style="font-weight: 700; padding: 8px 10px;">[Ant] ${mr.name}</td>
                            <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.planCost)}</td>
                            <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.prevCounter)}</td>
                            <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.currCounter)}</td>
                            <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.planCopies === 0 ? mr.excessPrice : mr.planCopies)}</td>
                            <td style="text-align: right; padding: 8px 10px; font-weight: 700; color: ${excessAnt > 0 ? '#d97706' : '#1e293b'}">${this.formatNumber(excessAnt)}</td>
                            <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(excessCost_ant)}</td>
                            <td style="text-align: right; font-weight: 700; padding: 8px 10px;">${this.formatNumber(mr.planCost + excessCost_ant)}</td>
                        `;
                        tbody.appendChild(trAnt);

                        // Fila Nuevo (Laser)
                        const trNvo = document.createElement("tr");
                        trNvo.style.backgroundColor = "rgba(0,0,0,0.01)";
                        trNvo.innerHTML = `
                            <td style="font-weight: 700; padding: 8px 10px; padding-left: 15px;">[Nvo] ${mr.repModel}</td>
                            <td style="text-align: right; padding: 8px 10px;">0</td>
                            <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(repPrev)}</td>
                            <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(repCurr)}</td>
                            <td style="text-align: right; padding: 8px 10px;">-</td>
                            <td style="text-align: right; padding: 8px 10px; font-weight: 700; color: ${excessNvo > 0 ? '#d97706' : '#1e293b'}">${this.formatNumber(excessNvo)}</td>
                            <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(excessCost_nvo)}</td>
                            <td style="text-align: right; font-weight: 700; padding: 8px 10px;">${this.formatNumber(excessCost_nvo)}</td>
                        `;
                        tbody.appendChild(trNvo);
                    } else {
                        // Fila Única (Laser)
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td style="font-weight: 700; padding: 8px 10px;">${mr.name}</td>
                            <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.planCost)}</td>
                            <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.prevCounter)}</td>
                            <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.currCounter)}</td>
                            <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.planCopies === 0 ? mr.excessPrice : mr.planCopies)}</td>
                            <td style="text-align: right; padding: 8px 10px; font-weight: 700; color: ${mr.excess > 0 ? '#d97706' : '#1e293b'}">${this.formatNumber(mr.excess)}</td>
                            <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.excessCost)}</td>
                            <td style="text-align: right; font-weight: 700; padding: 8px 10px;">${this.formatNumber(mr.totalCost)}</td>
                        `;
                        tbody.appendChild(tr);
                    }
                }
            }
        });

        // Si hay subcontadores activos, append de la tabla consolidada en el clon de PDF
        if (hasSub) {
            const ppPrice = AppState.config.defaultPPPrice !== undefined ? AppState.config.defaultPPPrice : 300;
            const pfPrice = AppState.config.defaultPFPrice !== undefined ? AppState.config.defaultPFPrice : 600;

            let pdfRowsHtml = "";
            if (totalCopCons > 0 || totalCopPrev > 0 || totalCopCurr > 0) {
                pdfRowsHtml += `
                    <tr style="border-bottom: 1px solid #cbd5e1;">
                        <td style="padding: 4px 6px; text-align: left; font-weight: 600;">Fotocopias (Copias)</td>
                        <td style="padding: 4px 6px; text-align: right;">${this.formatNumber(totalCopPrev)}</td>
                        <td style="padding: 4px 6px; text-align: right;">${this.formatNumber(totalCopCurr)}</td>
                        <td style="padding: 4px 6px; text-align: right; font-weight: 700; color: #3b4b61;">${this.formatNumber(totalCopCons)}</td>
                        <td style="padding: 4px 6px; text-align: right;">${this.formatCurrency(firstLaserExcessPrice)}</td>
                        <td style="padding: 4px 6px; text-align: right; font-weight: 700; color: #16a34a;">${this.formatCurrency(totalCopCons * firstLaserExcessPrice)}</td>
                    </tr>
                `;
            }
            if (totalImpCons > 0 || totalImpPrev > 0 || totalImpCurr > 0) {
                pdfRowsHtml += `
                    <tr style="border-bottom: 1px solid #cbd5e1;">
                        <td style="padding: 4px 6px; text-align: left; font-weight: 600;">Impresiones (Printouts)</td>
                        <td style="padding: 4px 6px; text-align: right;">${this.formatNumber(totalImpPrev)}</td>
                        <td style="padding: 4px 6px; text-align: right;">${this.formatNumber(totalImpCurr)}</td>
                        <td style="padding: 4px 6px; text-align: right; font-weight: 700; color: #3b4b61;">${this.formatNumber(totalImpCons)}</td>
                        <td style="padding: 4px 6px; text-align: right;">${this.formatCurrency(firstLaserExcessPrice)}</td>
                        <td style="padding: 4px 6px; text-align: right; font-weight: 700; color: #16a34a;">${this.formatCurrency(totalImpCons * firstLaserExcessPrice)}</td>
                    </tr>
                `;
            }
            if (totalPPCons > 0 || totalPPPrev > 0 || totalPPCurr > 0) {
                pdfRowsHtml += `
                    <tr style="border-bottom: 1px solid #cbd5e1;">
                        <td style="padding: 4px 6px; text-align: left; font-weight: 600;">Color (Papel Común PP)</td>
                        <td style="padding: 4px 6px; text-align: right;">${this.formatNumber(totalPPPrev)}</td>
                        <td style="padding: 4px 6px; text-align: right;">${this.formatNumber(totalPPCurr)}</td>
                        <td style="padding: 4px 6px; text-align: right; font-weight: 700; color: #3b4b61;">${this.formatNumber(totalPPCons)}</td>
                        <td style="padding: 4px 6px; text-align: right;">${this.formatCurrency(ppPrice)}</td>
                        <td style="padding: 4px 6px; text-align: right; font-weight: 700; color: #16a34a;">${this.formatCurrency(totalPPCons * ppPrice)}</td>
                    </tr>
                `;
            }
            if (totalPFCons > 0 || totalPFPrev > 0 || totalPFCurr > 0) {
                pdfRowsHtml += `
                    <tr style="border-bottom: 1px solid #cbd5e1;">
                        <td style="padding: 4px 6px; text-align: left; font-weight: 600;">Fotografía (Papel Fotográfico PF)</td>
                        <td style="padding: 4px 6px; text-align: right;">${this.formatNumber(totalPFPrev)}</td>
                        <td style="padding: 4px 6px; text-align: right;">${this.formatNumber(totalPFCurr)}</td>
                        <td style="padding: 4px 6px; text-align: right; font-weight: 700; color: #3b4b61;">${this.formatNumber(totalPFCons)}</td>
                        <td style="padding: 4px 6px; text-align: right;">${this.formatCurrency(pfPrice)}</td>
                        <td style="padding: 4px 6px; text-align: right; font-weight: 700; color: #16a34a;">${this.formatCurrency(totalPFCons * pfPrice)}</td>
                    </tr>
                `;
            }

            if (pdfRowsHtml) {
                const tableSection = clone.querySelector('.invoice-table-section');
                if (tableSection) {
                    const div = document.createElement('div');
                    div.className = 'pdf-breakdown-section';
                    div.style.marginTop = '12px';
                    div.style.marginBottom = '8px';
                    div.style.width = '100%';
                    div.innerHTML = `
                        <h4 style="font-family: 'Outfit', sans-serif; font-size: 10px; font-weight: 700; color: #3b4b61; margin: 0 0 6px 0; text-transform: uppercase; text-align: left; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px;">
                            Desglose Consolidado de Consumos
                        </h4>
                        <table class="pdf-table" style="border: 1px solid #94a3b8; width: 100%; font-size: 8px; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #3b4b61; color: white !important;">
                                    <th style="padding: 4px 6px; text-align: left; font-weight: 700; border-right: 1px solid #cbd5e1; color: white !important;">CONCEPTO</th>
                                    <th style="padding: 4px 6px; text-align: right; font-weight: 700; border-right: 1px solid #cbd5e1; color: white !important;">ANTERIOR</th>
                                    <th style="padding: 4px 6px; text-align: right; font-weight: 700; border-right: 1px solid #cbd5e1; color: white !important;">ACTUAL</th>
                                    <th style="padding: 4px 6px; text-align: right; font-weight: 700; border-right: 1px solid #cbd5e1; color: white !important;">CONSUMO</th>
                                    <th style="padding: 4px 6px; text-align: right; font-weight: 700; border-right: 1px solid #cbd5e1; color: white !important;">PRECIO UNIT.</th>
                                    <th style="padding: 4px 6px; text-align: right; font-weight: 700; color: white !important;">VALOR VENTA</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pdfRowsHtml}
                            </tbody>
                        </table>
                    `;
                    tableSection.parentNode.insertBefore(div, tableSection.nextSibling);
                }
            }
        }

        // Total general en la caja verde (con indicador si hay pendientes)
        const hasPending = record.machineReadings.some(mr => mr.isPending);
        clone.querySelector('.pdf-grand-total').innerText = this.formatNumber(record.totalGeneral) + (hasPending ? ' (Pte)' : '');


        // Configuración de html2pdf
        const periodFormatted = `${record.periodMonth}_${record.periodYear}`;
        const filename = `Consumo_${record.clientName.replace(/\s+/g, '_')}_${periodFormatted}.pdf`;

        const opt = {
            margin:       0,
            filename:     filename,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 4.0, useCORS: true, letterRendering: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(clone).save();
    },

    /**
     * Genera un reporte consolidado general de todos los clientes procesados
     */
    generateConsolidatedPDF(records, config, stats) {
        if (!records || records.length === 0) return;

        const container = document.createElement('div');
        container.className = 'invoice-container';
        container.style.width = '210mm';
        container.style.padding = '15mm';
        container.style.backgroundColor = '#ffffff';
        container.style.color = '#1e293b';
        container.style.fontFamily = 'Inter, sans-serif';

        const today = new Date();
        const dateStr = today.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        // Período (mes anterior)
        const periodFormatted = `${records[0].periodMonth} ${records[0].periodYear}`;

        let html = `
            <div class="invoice-header" style="margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
                <div class="invoice-brand">
                    <h2 class="pdf-logo-text" style="color: #3b4b61 !important; font-family: Outfit, sans-serif; font-size: 24px; font-weight: 800; margin-bottom: 2px;">${config.companyName || 'LEXORER S.R.L.'}</h2>
                    <p class="pdf-logo-sub" style="font-size: 11px; color: #64748b !important; font-weight: 700;">${config.companySub || 'TW - Informes de Consumo de Impresión'}</p>
                </div>
                <div class="invoice-details" style="text-align: right;">
                    <h3 style="font-family: Outfit, sans-serif; font-size: 16px; font-weight: 700; color: #3b4b61 !important; margin-bottom: 4px;">CONSOLIDADO MENSUAL</h3>
                    <p style="font-size: 10px; color: #64748b !important; margin: 2px 0;"><strong>Fecha:</strong> ${dateStr}</p>
                    <p style="font-size: 10px; color: #64748b !important; margin: 2px 0;"><strong>Período:</strong> ${periodFormatted}</p>
                </div>
            </div>

            <div class="invoice-divider" style="height: 1px; background-color: #cbd5e1 !important; margin: 15px 0;"></div>

            <div style="margin-bottom: 25px;">
                <h4 style="font-family: Outfit, sans-serif; font-size: 12px; font-weight: 600; color: #3b4b61 !important; text-transform: uppercase; margin-bottom: 8px;">Estadísticas del Período</h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background-color: #f1f5f9; padding: 12px; border-radius: 4px; border: 1px solid #cbd5e1;">
                    <div style="text-align: center;">
                        <span style="font-size: 9px; color: #64748b; display: block; text-transform: uppercase; font-weight:600;">Clientes</span>
                        <strong style="font-size: 14px; color: #0f172a;">${stats.totalClients}</strong>
                    </div>
                    <div style="text-align: center;">
                        <span style="font-size: 9px; color: #64748b; display: block; text-transform: uppercase; font-weight:600;">Equipos Totales</span>
                        <strong style="font-size: 14px; color: #0f172a;">${stats.totalMachines}</strong>
                    </div>
                    <div style="text-align: center;">
                        <span style="font-size: 9px; color: #64748b; display: block; text-transform: uppercase; font-weight:600;">Excedente Copias</span>
                        <strong style="font-size: 14px; color: #d97706;">${this.formatNumber(stats.totalExcess)}</strong>
                    </div>
                    <div style="text-align: center;">
                        <span style="font-size: 9px; color: #64748b; display: block; text-transform: uppercase; font-weight:600;">Facturación General</span>
                        <strong style="font-size: 14px; color: #16a34a;">${this.formatCurrency(stats.totalBilling)}</strong>
                    </div>
                </div>
            </div>

            <div>
                <h4 style="font-family: Outfit, sans-serif; font-size: 12px; font-weight: 600; color: #3b4b61 !important; text-transform: uppercase; margin-bottom: 8px;">Resumen por Cliente</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid #cbd5e1;">
                    <thead>
                        <tr style="background-color: #3b4b61; border-bottom: 2px solid #cbd5e1;">
                            <th style="padding: 8px; text-align: left; color: white !important; font-weight: 700; border-right: 1px solid #cbd5e1;">Cliente</th>
                            <th style="padding: 8px; text-align: center; color: white !important; font-weight: 700; border-right: 1px solid #cbd5e1;">Equipos</th>
                            <th style="padding: 8px; text-align: right; color: white !important; font-weight: 700; border-right: 1px solid #cbd5e1;">Lectura Anterior</th>
                            <th style="padding: 8px; text-align: right; color: white !important; font-weight: 700; border-right: 1px solid #cbd5e1;">Lectura Actual</th>
                            <th style="padding: 8px; text-align: right; color: white !important; font-weight: 700; border-right: 1px solid #cbd5e1;">Consumo</th>
                            <th style="padding: 8px; text-align: right; color: white !important; font-weight: 700; border-right: 1px solid #cbd5e1;">Excedente</th>
                            <th style="padding: 8px; text-align: right; color: white !important; font-weight: 700; border-right: 1px solid #cbd5e1;">Monto Abono</th>
                            <th style="padding: 8px; text-align: right; color: white !important; font-weight: 700; border-right: 1px solid #cbd5e1;">Monto Excedente</th>
                            <th style="padding: 8px; text-align: right; color: white !important; font-weight: 700;">Total Facturado</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        records.forEach((rec, idx) => {
            const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
            
            let sumPrev = 0, sumCurr = 0, sumCons = 0, sumExc = 0;
            let anyPending = false;
            let allPending = true;
            let nonFixedCount = 0;

            rec.machineReadings.forEach(mr => {
                if (!mr.isFixed) {
                    nonFixedCount++;
                    if (mr.isPending) {
                        anyPending = true;
                    } else {
                        allPending = false;
                        sumPrev += mr.prevCounter;
                        sumCurr += mr.currCounter;
                        sumCons += mr.consumption;
                        sumExc += mr.excess;
                    }
                }
            });

            if (nonFixedCount === 0) allPending = false;

            const prevText = allPending ? 'Pendiente' : this.formatNumber(sumPrev) + (anyPending ? ' (Pte)' : '');
            const currText = allPending ? 'Pendiente' : this.formatNumber(sumCurr) + (anyPending ? ' (Pte)' : '');
            const consText = allPending ? 'Pendiente' : this.formatNumber(sumCons) + (anyPending ? ' (Pte)' : '');
            const excText = allPending ? 'Pendiente' : this.formatNumber(sumExc) + (anyPending ? ' (Pte)' : '');
            const totalText = this.formatCurrency(rec.totalGeneral) + (anyPending ? ' (Pte)' : '');

            html += `
                <tr style="background-color: ${rowBg}; border-bottom: 1px solid #cbd5e1;">
                    <td style="padding: 8px; font-weight: 600; color: #0f172a; border-right: 1px solid #cbd5e1;">${rec.clientName}</td>
                    <td style="padding: 8px; text-align: center; color: #475569; border-right: 1px solid #cbd5e1;"><span style="background-color:#e2e8f0; padding:2px 6px; border-radius:3px; font-weight:600;">${rec.machineReadings.length}</span></td>
                    <td style="padding: 8px; text-align: right; color: #0f172a; border-right: 1px solid #cbd5e1;">${prevText}</td>
                    <td style="padding: 8px; text-align: right; color: #0f172a; border-right: 1px solid #cbd5e1;">${currText}</td>
                    <td style="padding: 8px; text-align: right; color: #0f172a; border-right: 1px solid #cbd5e1;">${consText}</td>
                    <td style="padding: 8px; text-align: right; font-weight: 600; color: ${sumExc > 0 ? '#d97706' : '#64748b'}; border-right: 1px solid #cbd5e1;">${excText}</td>
                    <td style="padding: 8px; text-align: right; color: #475569; border-right: 1px solid #cbd5e1;">${this.formatCurrency(rec.totalAbono)}</td>
                    <td style="padding: 8px; text-align: right; color: #475569; border-right: 1px solid #cbd5e1;">${this.formatCurrency(rec.totalExcessCost)}</td>
                    <td style="padding: 8px; text-align: right; font-weight: 700; color: #16a34a;">${totalText}</td>
                </tr>
            `;
        });

        html += `
                        <tr style="background-color: #e2e8f0; border-top: 2px solid #cbd5e1; font-weight: 700; font-size: 10px;">
                            <td style="padding: 10px 8px; color: #0f172a; border-right: 1px solid #cbd5e1;">TOTAL CONSOLIDADO</td>
                            <td style="padding: 10px 8px; text-align: center; color: #475569; border-right: 1px solid #cbd5e1;">${stats.totalMachines}</td>
                            <td style="padding: 10px 8px; text-align: right; color: #0f172a; border-right: 1px solid #cbd5e1;">-</td>
                            <td style="padding: 10px 8px; text-align: right; color: #0f172a; border-right: 1px solid #cbd5e1;">-</td>
                            <td style="padding: 10px 8px; text-align: right; color: #0f172a; border-right: 1px solid #cbd5e1;">-</td>
                            <td style="padding: 10px 8px; text-align: right; color: #d97706; border-right: 1px solid #cbd5e1;">${this.formatNumber(stats.totalExcess)}</td>
                            <td style="padding: 10px 8px; text-align: right; color: #475569; border-right: 1px solid #cbd5e1;">${this.formatCurrency(stats.totalPlanCost)}</td>
                            <td style="padding: 10px 8px; text-align: right; color: #475569; border-right: 1px solid #cbd5e1;">${this.formatCurrency(stats.totalExcessCost)}</td>
                            <td style="padding: 10px 8px; text-align: right; color: #16a34a; font-size: 11px;">${this.formatCurrency(stats.totalBilling)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="invoice-footer" style="text-align: center; border-top: 1px solid #cbd5e1 !important; padding-top: 15px; margin-top: 40px;">
                <p style="font-size: 9px; color: #94a3b8 !important;">TecnoWork - Reporte Administrativo Consolidado</p>
            </div>
        `;

        container.innerHTML = html;

        const filename = `Reporte_Consolidado_TecnoWork_${records[0].periodMonth}_${records[0].periodYear}.pdf`;
        
        const opt = {
            margin:       [10, 10, 10, 10],
            filename:     filename,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 3.5, useCORS: true, letterRendering: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(container).save();
    }
};
