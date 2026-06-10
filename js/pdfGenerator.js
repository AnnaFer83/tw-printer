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
    },    /**
     * Construye las filas de la tabla de máquinas para el template del invoice.
     */
    _buildTableRows(machineReadings) {
        return machineReadings.map(mr => {
            const type = window.getMachineType(mr.name);
            const hasRep = mr.hasReplacement || false;

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
                if (type === "color") {
                    let ppPrice = AppState.config.defaultPPPrice !== undefined ? AppState.config.defaultPPPrice : 300;
                    let pfPrice = AppState.config.defaultPFPrice !== undefined ? AppState.config.defaultPFPrice : 600;
                    let ppCost = mr.planCost || 0;
                    let pfCost = 0;

                    let machine = null;
                    if (AppState.clients) {
                        for (const client of AppState.clients) {
                            machine = client.machines.find(mac => mac.id === mr.machineId);
                            if (machine) break;
                        }
                    }
                    if (machine) {
                        const rates = window.resolveColorRates(machine);
                        ppPrice = rates.ppPrice;
                        pfPrice = rates.pfPrice;
                        ppCost = rates.ppCost;
                        pfCost = rates.pfCost;
                    }

                    if (hasRep) {
                        const repPrevPP = mr.repPrevPP || 0;
                        const repCurrPP = mr.repCurrPP || 0;
                        const repPrevPF = mr.repPrevPF || 0;
                        const repCurrPF = mr.repCurrPF || 0;

                        const consPP_ant = Math.max(0, (mr.currPP || 0) - (mr.prevPP || 0));
                        const consPF_ant = Math.max(0, (mr.currPF || 0) - (mr.prevPF || 0));
                        const consPP_nvo = Math.max(0, repCurrPP - repPrevPP);
                        const consPF_nvo = Math.max(0, repCurrPF - repPrevPF);

                        const excessCostPP_ant = consPP_ant * ppPrice;
                        const excessCostPF_ant = consPF_ant * pfPrice;
                        const excessCostPP_nvo = consPP_nvo * ppPrice;
                        const excessCostPF_nvo = consPF_nvo * pfPrice;

                        const totalCostPP_ant = ppCost + excessCostPP_ant;
                        const totalCostPF_ant = pfCost + excessCostPF_ant;

                        return `
                            <tr>
                                <td style="font-weight: 700; padding: 8px 10px;">[Ant] ${mr.name}</td>
                                <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(ppCost)}</td>
                                <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.prevPP || 0)}</td>
                                <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.currPP || 0)}</td>
                                <td style="text-align: right; padding: 8px 10px;">TEXTO COLOR</td>
                                <td style="text-align: right; padding: 8px 10px; font-weight: 700; color: ${excessCostPP_ant > 0 ? '#d97706' : '#1e293b'}">${this.formatNumber(consPP_ant)}</td>
                                <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(excessCostPP_ant)}</td>
                                <td style="text-align: right; font-weight: 700; padding: 8px 10px;">${this.formatNumber(totalCostPP_ant)}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: 700; padding: 8px 10px;"></td>
                                <td style="text-align: right; padding: 8px 10px;">${pfCost > 0 ? this.formatNumber(pfCost) : ''}</td>
                                <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.prevPF || 0)}</td>
                                <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.currPF || 0)}</td>
                                <td style="text-align: right; padding: 8px 10px;">FOTOGRAFIA</td>
                                <td style="text-align: right; padding: 8px 10px; font-weight: 700; color: ${excessCostPF_ant > 0 ? '#d97706' : '#1e293b'}">${this.formatNumber(consPF_ant)}</td>
                                <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(excessCostPF_ant)}</td>
                                <td style="text-align: right; font-weight: 700; padding: 8px 10px;">${this.formatNumber(totalCostPF_ant)}</td>
                            </tr>
                            <tr style="background-color: rgba(0,0,0,0.01);">
                                <td style="font-weight: 700; padding: 8px 10px; padding-left: 15px;">[Nvo] ${mr.repModel}</td>
                                <td style="text-align: right; padding: 8px 10px;">0</td>
                                <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(repPrevPP)}</td>
                                <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(repCurrPP)}</td>
                                <td style="text-align: right; padding: 8px 10px;">TEXTO COLOR</td>
                                <td style="text-align: right; padding: 8px 10px; font-weight: 700; color: ${excessCostPP_nvo > 0 ? '#d97706' : '#1e293b'}">${this.formatNumber(consPP_nvo)}</td>
                                <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(excessCostPP_nvo)}</td>
                                <td style="text-align: right; font-weight: 700; padding: 8px 10px;">${this.formatNumber(excessCostPP_nvo)}</td>
                            </tr>
                            <tr style="background-color: rgba(0,0,0,0.01);">
                                <td style="font-weight: 700; padding: 8px 10px; padding-left: 15px;"></td>
                                <td style="text-align: right; padding: 8px 10px;"></td>
                                <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(repPrevPF)}</td>
                                <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(repCurrPF)}</td>
                                <td style="text-align: right; padding: 8px 10px;">FOTOGRAFIA</td>
                                <td style="text-align: right; padding: 8px 10px; font-weight: 700; color: ${excessCostPF_nvo > 0 ? '#d97706' : '#1e293b'}">${this.formatNumber(consPF_nvo)}</td>
                                <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(excessCostPF_nvo)}</td>
                                <td style="text-align: right; font-weight: 700; padding: 8px 10px;">${this.formatNumber(excessCostPF_nvo)}</td>
                            </tr>
                        `;
                    } else {
                        const consPP = Math.max(0, (mr.currPP || 0) - (mr.prevPP || 0));
                        const consPF = Math.max(0, (mr.currPF || 0) - (mr.prevPF || 0));

                        const excessCostPP = consPP * ppPrice;
                        const excessCostPF = consPF * pfPrice;

                        const totalCostPP = ppCost + excessCostPP;
                        const totalCostPF = pfCost + excessCostPF;

                        return `
                            <tr>
                                <td style="font-weight: 700; padding: 8px 10px;">${mr.name}</td>
                                <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(ppCost)}</td>
                                <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.prevPP || 0)}</td>
                                <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.currPP || 0)}</td>
                                <td style="text-align: right; padding: 8px 10px;">TEXTO COLOR</td>
                                <td style="text-align: right; padding: 8px 10px; font-weight: 700; color: ${excessCostPP > 0 ? '#d97706' : '#1e293b'}">${this.formatNumber(consPP)}</td>
                                <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(excessCostPP)}</td>
                                <td style="text-align: right; font-weight: 700; padding: 8px 10px;">${this.formatNumber(totalCostPP)}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: 700; padding: 8px 10px;"></td>
                                <td style="text-align: right; padding: 8px 10px;">${pfCost > 0 ? this.formatNumber(pfCost) : ''}</td>
                                <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.prevPF || 0)}</td>
                                <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.currPF || 0)}</td>
                                <td style="text-align: right; padding: 8px 10px;">FOTOGRAFIA</td>
                                <td style="text-align: right; padding: 8px 10px; font-weight: 700; color: ${excessCostPF > 0 ? '#d97706' : '#1e293b'}">${this.formatNumber(consPF)}</td>
                                <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(excessCostPF)}</td>
                                <td style="text-align: right; font-weight: 700; padding: 8px 10px;">${this.formatNumber(totalCostPF)}</td>
                            </tr>
                        `;
                    }
                } else {
                    const excessPrice = mr.excessPrice;
                    if (hasRep) {
                        const repPrev = mr.repPrevCounter || 0;
                        const repCurr = mr.repCurrCounter || 0;
                        const repCons = Math.max(0, repCurr - repPrev);

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

                        const excessCost_ant = excessAnt * excessPrice;
                        const excessCost_nvo = excessNvo * excessPrice;

                        return `
                            <tr>
                                <td style="font-weight: 700; padding: 8px 10px;">[Ant] ${mr.name}</td>
                                <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.planCost)}</td>
                                <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.prevCounter)}</td>
                                <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.currCounter)}</td>
                                <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.planCopies === 0 ? mr.excessPrice : mr.planCopies)}</td>
                                <td style="text-align: right; padding: 8px 10px; font-weight: 700; color: ${excessAnt > 0 ? '#d97706' : '#1e293b'}">${this.formatNumber(excessAnt)}</td>
                                <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(excessCost_ant)}</td>
                                <td style="text-align: right; font-weight: 700; padding: 8px 10px;">${this.formatNumber(mr.planCost + excessCost_ant)}</td>
                            </tr>
                            <tr style="background-color: rgba(0,0,0,0.01);">
                                <td style="font-weight: 700; padding: 8px 10px; padding-left: 15px;">[Nvo] ${mr.repModel}</td>
                                <td style="text-align: right; padding: 8px 10px;">0</td>
                                <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(repPrev)}</td>
                                <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(repCurr)}</td>
                                <td style="text-align: right; padding: 8px 10px;">-</td>
                                <td style="text-align: right; padding: 8px 10px; font-weight: 700; color: ${excessNvo > 0 ? '#d97706' : '#1e293b'}">${this.formatNumber(excessNvo)}</td>
                                <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(excessCost_nvo)}</td>
                                <td style="text-align: right; font-weight: 700; padding: 8px 10px;">${this.formatNumber(excessCost_nvo)}</td>
                            </tr>
                        `;
                    } else {
                        return `<tr>
                            <td style="font-weight: 700; padding: 8px 10px;">${mr.name}</td>
                            <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.planCost)}</td>
                            <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.prevCounter)}</td>
                            <td style="text-align: right; padding: 8px 10px;" class="pdf-cell-yellow">${this.formatNumber(mr.currCounter)}</td>
                            <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.planCopies === 0 ? mr.excessPrice : mr.planCopies)}</td>
                            <td style="text-align: right; padding: 8px 10px; font-weight: 700; color: ${mr.excess > 0 ? '#d97706' : '#1e293b'}">${this.formatNumber(mr.excess)}</td>
                            <td style="text-align: right; padding: 8px 10px;">${this.formatNumber(mr.excessCost)}</td>
                            <td style="text-align: right; font-weight: 700; padding: 8px 10px;">${this.formatNumber(mr.totalCost)}</td>
                        </tr>`;
                    }
                }
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

        // Agregar la tabla consolidada si corresponde
        let hasSub = false;
        let totalCopPrev = 0, totalCopCurr = 0, totalCopCons = 0;
        let totalImpPrev = 0, totalImpCurr = 0, totalImpCons = 0;
        let totalPPPrev = 0, totalPPCurr = 0, totalPPCons = 0;
        let totalPFPrev = 0, totalPFCurr = 0, totalPFCons = 0;
        let firstLaserExcessPrice = AppState.config.defaultExcessPrice || 90;
        let foundLaserPrice = false;

        record.machineReadings.forEach(mr => {
            if (mr.isFixed || mr.isPending) return;
            const type = window.getMachineType(mr.name);
            const hasRep = mr.hasReplacement || false;

            if (type === "color") {
                hasSub = true;
                totalPPPrev += mr.prevPP || 0;
                totalPPCurr += mr.currPP || 0;
                totalPPCons += Math.max(0, (mr.currPP || 0) - (mr.prevPP || 0));

                totalPFPrev += mr.prevPF || 0;
                totalPFCurr += mr.currPF || 0;
                totalPFCons += Math.max(0, (mr.currPF || 0) - (mr.prevPF || 0));

                if (hasRep) {
                    totalPPPrev += mr.repPrevPP || 0;
                    totalPPCurr += mr.repCurrPP || 0;
                    totalPPCons += Math.max(0, (mr.repCurrPP || 0) - (mr.repPrevPP || 0));

                    totalPFPrev += mr.repPrevPF || 0;
                    totalPFCurr += mr.repCurrPF || 0;
                    totalPFCons += Math.max(0, (mr.repCurrPF || 0) - (mr.repPrevPF || 0));
                }
            } else {
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

                    if (hasRep) {
                        totalImpPrev += mr.repPrevImpresiones || 0;
                        totalImpCurr += mr.repCurrImpresiones || 0;
                        totalImpCons += Math.max(0, (mr.repCurrImpresiones || 0) - (mr.repPrevImpresiones || 0));

                        totalCopPrev += mr.repPrevCopias || 0;
                        totalCopCurr += mr.repCurrCopias || 0;
                        totalCopCons += Math.max(0, (mr.repCurrCopias || 0) - (mr.repPrevCopias || 0));
                    }
                }
                if (!foundLaserPrice && mr.excessPrice !== undefined && mr.excessPrice !== null) {
                    firstLaserExcessPrice = mr.excessPrice;
                    foundLaserPrice = true;
                }
            }
        });

        let addedBreakdownEl = null;

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
                const tableSection = container.querySelector('.invoice-table-section');
                if (tableSection) {
                    addedBreakdownEl = document.createElement('div');
                    addedBreakdownEl.className = 'pdf-breakdown-section';
                    addedBreakdownEl.style.marginTop = '12px';
                    addedBreakdownEl.style.marginBottom = '8px';
                    addedBreakdownEl.style.width = '100%';
                    addedBreakdownEl.innerHTML = `
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
                    tableSection.parentNode.insertBefore(addedBreakdownEl, tableSection.nextSibling);
                }
            }
        }

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
            if (addedBreakdownEl) {
                addedBreakdownEl.remove();
            }
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
