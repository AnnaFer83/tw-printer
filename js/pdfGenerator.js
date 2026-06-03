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
            if (record.machineReadings && record.machineReadings.length > 0) {
                const parts = record.machineReadings.map(mr => {
                    const priceFormatted = mr.planCost ? this.formatNumber(mr.planCost) : "0";
                    if (mr.isFixed) {
                        return `${mr.name}: Abono Fijo $${priceFormatted}`;
                    } else {
                        const copiesFormatted = mr.planCopies ? this.formatNumber(mr.planCopies) : "0";
                        const excessFormatted = mr.excessPrice ? this.formatNumber(mr.excessPrice) : "0";
                        return `${mr.name}: Abono $${priceFormatted} (incluye ${copiesFormatted} copias, exd. $${excessFormatted})`;
                    }
                });
                displayObs = "Detalle: " + parts.join(" | ");
            } else {
                displayObs = "Detalle de abono y consumos del período.";
            }
        }
        clone.querySelector('.pdf-client-observations').innerText = displayObs;
        
        // Período
        clone.querySelector('.pdf-period-month').innerText = record.periodMonth.toUpperCase();

        // Rellenar filas de la tabla
        const tbody = clone.querySelector('#pdf-table-items-body');
        tbody.innerHTML = "";

        record.machineReadings.forEach(mr => {
            const tr = document.createElement("tr");

            if (mr.isFixed) {
                // Concepto fijo
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
            } else if (mr.isPending) {
                // Pendiente de lectura
                tr.innerHTML = `
                    <td style="font-weight: 700; padding: 8px 10px;">${mr.name}</td>
                    <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.planCost)}</td>
                    <td style="text-align: right; padding: 8px 10px; color: #dc2626 !important; font-weight: 600;" class="pdf-cell-yellow">Pendiente</td>
                    <td style="text-align: right; padding: 8px 10px; color: #dc2626 !important; font-weight: 600;" class="pdf-cell-yellow">Pendiente</td>
                    <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.planCopies)}</td>
                    <td style="text-align: right; padding: 8px 10px; color: #dc2626 !important;">Pendiente</td>
                    <td style="text-align: right; padding: 8px 10px; color: #dc2626 !important;">Pendiente</td>
                    <td style="text-align: right; font-weight: 700; padding: 8px 10px; color: #dc2626 !important;">Pendiente</td>
                `;
            } else {
                // Fila con contadores
                tr.innerHTML = `
                    <td style="font-weight: 700; padding: 8px 10px;">${mr.name}</td>
                    <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.planCost)}</td>
                    <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.prevCounter)}</td>
                    <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.currCounter)}</td>
                    <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.planCopies)}</td>
                    <td style="text-align: right; padding: 8px 10px; font-weight: 700; color: ${mr.excess > 0 ? '#d97706' : '#1e293b'}">${this.formatNumber(mr.excess)}</td>
                    <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.excessCost)}</td>
                    <td style="text-align: right; font-weight: 700; padding: 8px 10px;">${this.formatNumber(mr.totalCost)}</td>
                `;
            }
            tbody.appendChild(tr);
        });

        // Total general en la caja verde (con indicador si hay pendientes)
        const hasPending = record.machineReadings.some(mr => mr.isPending);
        clone.querySelector('.pdf-grand-total').innerText = this.formatNumber(record.totalGeneral) + (hasPending ? ' (Pte)' : '');

        // Notas al pie
        const noteEl = clone.querySelector('#pdf-val-notes');
        if (record.observations && record.observations.trim() !== "") {
            noteEl.innerText = record.observations;
            noteEl.parentElement.style.display = 'block';
        } else {
            noteEl.parentElement.style.display = 'none'; // ocultar si está vacío
        }

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
