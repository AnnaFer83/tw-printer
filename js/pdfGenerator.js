/* ==========================================================================
   TECNOWORK - Generador de Informes en PDF (window.print)

   Usa el renderizador nativo del browser vía window.print().
   Funciona en Mac y Windows, desde file://, en cualquier versión de Chrome/Brave/Edge.
   html2canvas/html2pdf fallaba en Windows con file:// por las restricciones de
   seguridad de Chrome al clonar el documento en iframes sobre el protocolo file://.
   ========================================================================== */

const PDFGenerator = {

    formatNumber(num) {
        if (num === undefined || num === null || isNaN(num)) return '0';
        return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(num);
    },

    formatCurrency(val) {
        if (val === undefined || val === null || isNaN(val)) return '$0';
        return '$' + this.formatNumber(val);
    },

    /**
     * Construye las filas de la tabla de máquinas para el template del invoice.
     */
    _buildTableRows(machineReadings) {
        return machineReadings.map(mr => {
            if (mr.isFixed) {
                return `<tr>
                    <td style="font-weight:700;padding:8px 10px;">${mr.name}</td>
                    <td style="text-align:right;padding:8px 10px;">${this.formatNumber(mr.planCost)}</td>
                    <td style="text-align:right;padding:8px 10px;" class="pdf-cell-yellow">0</td>
                    <td style="text-align:right;padding:8px 10px;" class="pdf-cell-yellow">0</td>
                    <td style="text-align:right;padding:8px 10px;">0</td>
                    <td style="text-align:right;padding:8px 10px;">0</td>
                    <td style="text-align:right;padding:8px 10px;">0</td>
                    <td style="text-align:right;font-weight:700;padding:8px 10px;">${this.formatNumber(mr.totalCost)}</td>
                </tr>`;
            } else if (mr.isPending) {
                return `<tr>
                    <td style="font-weight:700;padding:8px 10px;">${mr.name}</td>
                    <td style="text-align:right;padding:8px 10px;">${this.formatNumber(mr.planCost)}</td>
                    <td style="text-align:right;padding:8px 10px;color:#dc2626;font-weight:600;" class="pdf-cell-yellow">Pendiente</td>
                    <td style="text-align:right;padding:8px 10px;color:#dc2626;font-weight:600;" class="pdf-cell-yellow">Pendiente</td>
                    <td style="text-align:right;padding:8px 10px;">${this.formatNumber(mr.planCopies === 0 ? mr.excessPrice : mr.planCopies)}</td>
                    <td style="text-align:right;padding:8px 10px;color:#dc2626;">Pendiente</td>
                    <td style="text-align:right;padding:8px 10px;color:#dc2626;">Pendiente</td>
                    <td style="text-align:right;font-weight:700;padding:8px 10px;color:#dc2626;">Pendiente</td>
                </tr>`;
            } else {
                return `<tr>
                    <td style="font-weight:700;padding:8px 10px;">${mr.name}</td>
                    <td style="text-align:right;padding:8px 10px;">${this.formatNumber(mr.planCost)}</td>
                    <td style="text-align:right;padding:8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.prevCounter)}</td>
                    <td style="text-align:right;padding:8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.currCounter)}</td>
                    <td style="text-align:right;padding:8px 10px;">${this.formatNumber(mr.planCopies === 0 ? mr.excessPrice : mr.planCopies)}</td>
                    <td style="text-align:right;padding:8px 10px;font-weight:700;color:${mr.excess > 0 ? '#d97706' : '#1e293b'}">${this.formatNumber(mr.excess)}</td>
                    <td style="text-align:right;padding:8px 10px;">${this.formatNumber(mr.excessCost)}</td>
                    <td style="text-align:right;font-weight:700;padding:8px 10px;">${this.formatNumber(mr.totalCost)}</td>
                </tr>`;
            }
        }).join('');
    },

    /**
     * Genera el PDF individual de un cliente via window.print().
     * Popula el template existente en el DOM, imprime, y restaura el estado original.
     */
    generateIndividualPDF(record, config, clientObs) {
        const container = document.querySelector('#pdf-print-template .invoice-container');
        if (!container) return;

        // Guardar estado original del template para restaurar después de imprimir
        const saved = {
            clientName:   container.querySelector('.pdf-client-name').innerText,
            observations: container.querySelector('.pdf-client-observations').innerText,
            periodMonth:  container.querySelector('.pdf-period-month').innerText,
            tbody:        container.querySelector('#pdf-table-items-body').innerHTML,
            grandTotal:   container.querySelector('.pdf-grand-total').innerText,
        };

        // Observaciones
        let displayObs = '';
        if (record.observations && record.observations.trim() !== '') {
            displayObs = record.observations;
        } else if (clientObs && clientObs.trim() !== '') {
            displayObs = clientObs;
        } else {
            const client = AppState.clients.find(c => c.id === record.clientId);
            displayObs = window.generateDefaultObservations ? window.generateDefaultObservations(client) : '';
            if (!displayObs) displayObs = 'Detalle de abono y consumos del período';
        }

        // Poblar template
        const logoSub = container.querySelector('.pdf-logo-sub');
        if (logoSub) logoSub.innerText = config.companyName || 'LEXORER S.R.L.';

        container.querySelector('.pdf-client-name').innerText        = record.clientName.toUpperCase();
        container.querySelector('.pdf-client-observations').innerText = displayObs;
        container.querySelector('.pdf-period-month').innerText        = record.periodMonth.toUpperCase();
        container.querySelector('#pdf-table-items-body').innerHTML    = this._buildTableRows(record.machineReadings);

        const hasPending = record.machineReadings.some(mr => mr.isPending);
        container.querySelector('.pdf-grand-total').innerText =
            this.formatNumber(record.totalGeneral) + (hasPending ? ' (Pte)' : '');

        // Sugerir nombre de archivo via document.title (Chrome lo usa como nombre por defecto)
        const originalTitle = document.title;
        document.title = `Consumo_${record.clientName.replace(/\s+/g, '_')}_${record.periodMonth}_${record.periodYear}`;

        window.print();

        // Restaurar template y título después de que el diálogo de impresión cierre
        window.addEventListener('afterprint', () => {
            container.querySelector('.pdf-client-name').innerText        = saved.clientName;
            container.querySelector('.pdf-client-observations').innerText = saved.observations;
            container.querySelector('.pdf-period-month').innerText        = saved.periodMonth;
            container.querySelector('#pdf-table-items-body').innerHTML    = saved.tbody;
            container.querySelector('.pdf-grand-total').innerText         = saved.grandTotal;
            document.title = originalTitle;
        }, { once: true });
    },

    /**
     * Genera el reporte consolidado via window.print().
     * Reemplaza temporalmente el contenido de #pdf-print-template con el HTML consolidado.
     */
    generateConsolidatedPDF(records, config, stats) {
        if (!records || records.length === 0) return;

        const today       = new Date();
        const dateStr     = today.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const periodFormatted = `${records[0].periodMonth} ${records[0].periodYear}`;

        let rowsHtml = '';
        records.forEach((rec, idx) => {
            const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
            let sumPrev = 0, sumCurr = 0, sumCons = 0, sumExc = 0;
            let anyPending = false, allPending = true, nonFixedCount = 0;

            rec.machineReadings.forEach(mr => {
                if (!mr.isFixed) {
                    nonFixedCount++;
                    if (mr.isPending) { anyPending = true; }
                    else { allPending = false; sumPrev += mr.prevCounter; sumCurr += mr.currCounter; sumCons += mr.consumption; sumExc += mr.excess; }
                }
            });
            if (nonFixedCount === 0) allPending = false;

            const prevText  = allPending ? 'Pendiente' : this.formatNumber(sumPrev)  + (anyPending ? ' (Pte)' : '');
            const currText  = allPending ? 'Pendiente' : this.formatNumber(sumCurr)  + (anyPending ? ' (Pte)' : '');
            const consText  = allPending ? 'Pendiente' : this.formatNumber(sumCons)  + (anyPending ? ' (Pte)' : '');
            const excText   = allPending ? 'Pendiente' : this.formatNumber(sumExc)   + (anyPending ? ' (Pte)' : '');
            const totalText = this.formatCurrency(rec.totalGeneral) + (anyPending ? ' (Pte)' : '');

            rowsHtml += `<tr style="background-color:${rowBg};border-bottom:1px solid #cbd5e1;">
                <td style="padding:8px;font-weight:600;color:#0f172a;border-right:1px solid #cbd5e1;">${rec.clientName}</td>
                <td style="padding:8px;text-align:center;color:#475569;border-right:1px solid #cbd5e1;"><span style="background:#e2e8f0;padding:2px 6px;border-radius:3px;font-weight:600;">${rec.machineReadings.length}</span></td>
                <td style="padding:8px;text-align:right;color:#0f172a;border-right:1px solid #cbd5e1;">${prevText}</td>
                <td style="padding:8px;text-align:right;color:#0f172a;border-right:1px solid #cbd5e1;">${currText}</td>
                <td style="padding:8px;text-align:right;color:#0f172a;border-right:1px solid #cbd5e1;">${consText}</td>
                <td style="padding:8px;text-align:right;font-weight:600;color:${sumExc > 0 ? '#d97706' : '#64748b'};border-right:1px solid #cbd5e1;">${excText}</td>
                <td style="padding:8px;text-align:right;color:#475569;border-right:1px solid #cbd5e1;">${this.formatCurrency(rec.totalAbono)}</td>
                <td style="padding:8px;text-align:right;color:#475569;border-right:1px solid #cbd5e1;">${this.formatCurrency(rec.totalExcessCost)}</td>
                <td style="padding:8px;text-align:right;font-weight:700;color:#16a34a;">${totalText}</td>
            </tr>`;
        });

        const consolidatedHtml = `
            <div style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <h2 style="color:#3b4b61;font-family:Outfit,sans-serif;font-size:24px;font-weight:800;margin-bottom:2px;">${config.companyName || 'LEXORER S.R.L.'}</h2>
                    <p style="font-size:11px;color:#64748b;font-weight:700;">${config.companySub || 'TW - Informes de Consumo de Impresión'}</p>
                </div>
                <div style="text-align:right;">
                    <h3 style="font-family:Outfit,sans-serif;font-size:16px;font-weight:700;color:#3b4b61;margin-bottom:4px;">CONSOLIDADO MENSUAL</h3>
                    <p style="font-size:10px;color:#64748b;margin:2px 0;"><strong>Fecha:</strong> ${dateStr}</p>
                    <p style="font-size:10px;color:#64748b;margin:2px 0;"><strong>Período:</strong> ${periodFormatted}</p>
                </div>
            </div>

            <div style="height:1px;background-color:#cbd5e1;margin:15px 0;"></div>

            <div style="margin-bottom:25px;">
                <h4 style="font-family:Outfit,sans-serif;font-size:12px;font-weight:600;color:#3b4b61;text-transform:uppercase;margin-bottom:8px;">Estadísticas del Período</h4>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;background-color:#f1f5f9;padding:12px;border-radius:4px;border:1px solid #cbd5e1;">
                    <div style="text-align:center;"><span style="font-size:9px;color:#64748b;display:block;text-transform:uppercase;font-weight:600;">Clientes</span><strong style="font-size:14px;color:#0f172a;">${stats.totalClients}</strong></div>
                    <div style="text-align:center;"><span style="font-size:9px;color:#64748b;display:block;text-transform:uppercase;font-weight:600;">Equipos Totales</span><strong style="font-size:14px;color:#0f172a;">${stats.totalMachines}</strong></div>
                    <div style="text-align:center;"><span style="font-size:9px;color:#64748b;display:block;text-transform:uppercase;font-weight:600;">Excedente Copias</span><strong style="font-size:14px;color:#d97706;">${this.formatNumber(stats.totalExcess)}</strong></div>
                    <div style="text-align:center;"><span style="font-size:9px;color:#64748b;display:block;text-transform:uppercase;font-weight:600;">Facturación General</span><strong style="font-size:14px;color:#16a34a;">${this.formatCurrency(stats.totalBilling)}</strong></div>
                </div>
            </div>

            <div>
                <h4 style="font-family:Outfit,sans-serif;font-size:12px;font-weight:600;color:#3b4b61;text-transform:uppercase;margin-bottom:8px;">Resumen por Cliente</h4>
                <table style="width:100%;border-collapse:collapse;font-size:9px;border:1px solid #cbd5e1;">
                    <thead>
                        <tr style="background-color:#3b4b61;border-bottom:2px solid #cbd5e1;">
                            <th style="padding:8px;text-align:left;color:white;font-weight:700;border-right:1px solid #cbd5e1;">Cliente</th>
                            <th style="padding:8px;text-align:center;color:white;font-weight:700;border-right:1px solid #cbd5e1;">Equipos</th>
                            <th style="padding:8px;text-align:right;color:white;font-weight:700;border-right:1px solid #cbd5e1;">Lect. Anterior</th>
                            <th style="padding:8px;text-align:right;color:white;font-weight:700;border-right:1px solid #cbd5e1;">Lect. Actual</th>
                            <th style="padding:8px;text-align:right;color:white;font-weight:700;border-right:1px solid #cbd5e1;">Consumo</th>
                            <th style="padding:8px;text-align:right;color:white;font-weight:700;border-right:1px solid #cbd5e1;">Excedente</th>
                            <th style="padding:8px;text-align:right;color:white;font-weight:700;border-right:1px solid #cbd5e1;">Monto Abono</th>
                            <th style="padding:8px;text-align:right;color:white;font-weight:700;border-right:1px solid #cbd5e1;">Monto Excedente</th>
                            <th style="padding:8px;text-align:right;color:white;font-weight:700;">Total Facturado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                        <tr style="background-color:#e2e8f0;border-top:2px solid #cbd5e1;font-weight:700;font-size:10px;">
                            <td style="padding:10px 8px;color:#0f172a;border-right:1px solid #cbd5e1;">TOTAL CONSOLIDADO</td>
                            <td style="padding:10px 8px;text-align:center;color:#475569;border-right:1px solid #cbd5e1;">${stats.totalMachines}</td>
                            <td style="padding:10px 8px;text-align:right;color:#0f172a;border-right:1px solid #cbd5e1;">-</td>
                            <td style="padding:10px 8px;text-align:right;color:#0f172a;border-right:1px solid #cbd5e1;">-</td>
                            <td style="padding:10px 8px;text-align:right;color:#0f172a;border-right:1px solid #cbd5e1;">-</td>
                            <td style="padding:10px 8px;text-align:right;color:#d97706;border-right:1px solid #cbd5e1;">${this.formatNumber(stats.totalExcess)}</td>
                            <td style="padding:10px 8px;text-align:right;color:#475569;border-right:1px solid #cbd5e1;">${this.formatCurrency(stats.totalPlanCost)}</td>
                            <td style="padding:10px 8px;text-align:right;color:#475569;border-right:1px solid #cbd5e1;">${this.formatCurrency(stats.totalExcessCost)}</td>
                            <td style="padding:10px 8px;text-align:right;color:#16a34a;font-size:11px;">${this.formatCurrency(stats.totalBilling)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style="text-align:center;border-top:1px solid #cbd5e1;padding-top:15px;margin-top:40px;">
                <p style="font-size:9px;color:#94a3b8;">TecnoWork - Reporte Administrativo Consolidado</p>
            </div>
        `;

        // Reemplazar contenido del área de impresión temporalmente
        const printArea     = document.getElementById('pdf-print-template');
        const originalHtml  = printArea.innerHTML;
        const originalTitle = document.title;

        // Wrapper sin clase invoice-container para evitar conflictos con el CSS de impresión
        printArea.innerHTML = `<div style="width:100%;padding:15mm;background-color:#ffffff;color:#1e293b;font-family:Inter,sans-serif;box-sizing:border-box;">${consolidatedHtml}</div>`;
        document.title = `Reporte_Consolidado_TecnoWork_${records[0].periodMonth}_${records[0].periodYear}`;

        window.print();

        window.addEventListener('afterprint', () => {
            printArea.innerHTML = originalHtml;
            document.title      = originalTitle;
        }, { once: true });
    },
};
