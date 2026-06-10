/* =============================================================================
   TECNOWORK — Supabase Adapter (js/supabase-adapter.js)
   Reemplaza internamente las llamadas a /api/data y /api/save.
   El resto de app.js no se modifica.
   =============================================================================

   ⚠️  CONFIGURACIÓN REQUERIDA:
   Antes de usar, reemplazar los valores de SUPABASE_URL y SUPABASE_ANON_KEY
   con los de tu proyecto en: Supabase Dashboard → Project Settings → API

   ============================================================================= */

const SUPABASE_URL      = 'https://sngigxlfemzteyokqlbd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuZ2lneGxmZW16dGV5b2txbGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDg0NTAsImV4cCI6MjA5NjEyNDQ1MH0.K-EreESHk-JjB3cZNDDJCENVSDJuKYJzUMLF78h-zkc';

// Cliente Supabase (inicializado con el CDN cargado en index.html)
let _sb = null;
if (window.supabase) {
    try {
        _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (err) {
        console.error("Error al crear el cliente de Supabase:", err);
    }
} else {
    console.warn("La biblioteca de Supabase no está cargada (posiblemente sin conexión o bloqueado por Brave Shields).");
}

const SupabaseAdapter = {

    // -------------------------------------------------------------------------
    // CARGA: reconstruye el AppState desde todas las tablas de Supabase
    // -------------------------------------------------------------------------
    async loadData() {
        if (!_sb) {
            throw new Error("Supabase no está inicializado o no está disponible.");
        }
        const [configRes, plansRes, clientsRes, machinesRes, readingsRes, mrRes] = await Promise.all([
            _sb.from('config').select('*'),
            _sb.from('plans').select('*'),
            _sb.from('clients').select('*'),
            _sb.from('machines').select('*'),
            _sb.from('readings').select('*'),
            _sb.from('machine_readings').select('*').order('id'),
        ]);

        const firstError = [configRes, plansRes, clientsRes, machinesRes, readingsRes, mrRes]
            .map(r => r.error).find(Boolean);
        if (firstError) throw new Error(firstError.message);

        // Config: filas key/value → objeto
        const config = {};
        (configRes.data || []).forEach(row => {
            try   { config[row.key] = JSON.parse(row.value); }
            catch { config[row.key] = row.value; }
        });

        // Planes: snake_case → camelCase
        const plans = (plansRes.data || []).map(p => ({
            id:          p.id,
            name:        p.name,
            copies:      p.copies,
            cost:        p.cost,
            excessPrice: p.excess_price ?? null,
            components:  p.components ?? [],
        }));

        // Índice de máquinas por cliente
        const machinesByClient = {};
        (machinesRes.data || []).forEach(m => {
            if (!machinesByClient[m.client_id]) machinesByClient[m.client_id] = [];
            machinesByClient[m.client_id].push({
                id:               m.id,
                clientId:         m.client_id,
                name:             m.name,
                serialNumber:     m.serial_number || '',
                isFixed:          m.is_fixed,
                planId:           m.plan_id,
                planComponentId:   m.plan_component_id || '',
                customCost:       m.custom_cost,
                customExcessPrice: m.custom_excess_price,
            });
        });

        // Clientes con máquinas embebidas
        const clients = (clientsRes.data || []).map(c => ({
            id:           c.id,
            name:         c.name,
            phone:        c.phone || '',
            observations: c.observations || '',
            machines:     machinesByClient[c.id] || [],
        }));

        // Índice de machine_readings por lectura
        const mrByReading = {};
        (mrRes.data || []).forEach(mr => {
            if (!mrByReading[mr.reading_id]) mrByReading[mr.reading_id] = [];
            mrByReading[mr.reading_id].push({
                machineId:    mr.machine_id,
                name:         mr.machine_name,       // app.js usa mr.name
                serialNumber: mr.serial_number || '',
                isFixed:      mr.is_fixed,
                prevCounter:  mr.prev_counter,
                currCounter:  mr.curr_counter,
                consumption:  mr.consumption,
                planCopies:   mr.plan_copies,
                excess:       mr.excess,
                excessPrice:  mr.excess_price,
                planCost:     mr.plan_cost,
                excessCost:   mr.excess_cost,
                totalCost:    mr.total_cost,
                customCost:   mr.custom_cost,
                isPending:    mr.is_pending,
                
                // Nuevos campos
                prevImpresiones: mr.prev_impresiones ?? 0,
                currImpresiones: mr.curr_impresiones ?? 0,
                prevCopias:      mr.prev_copias ?? 0,
                currCopias:      mr.curr_copias ?? 0,
                prevPP:          mr.prev_pp ?? 0,
                currPP:          mr.curr_pp ?? 0,
                prevPF:          mr.prev_pf ?? 0,
                currPF:          mr.curr_pf ?? 0,
                
                // Campos de reemplazo
                hasReplacement:  mr.has_replacement ?? false,
                repModel:        mr.rep_model || '',
                repSerialNumber: mr.rep_serial_number || '',
                repPrevCounter:  mr.rep_prev_counter ?? 0,
                repCurrCounter:  mr.rep_curr_counter ?? 0,
                repConsumption:  mr.rep_consumption ?? 0,
                repPrevImpresiones: mr.rep_prev_impresiones ?? 0,
                repCurrImpresiones: mr.rep_curr_impresiones ?? 0,
                repPrevCopias:      mr.rep_prev_copias ?? 0,
                repCurrCopias:      mr.rep_curr_copias ?? 0,
                repPrevPP:          mr.rep_prev_pp ?? 0,
                repCurrPP:          mr.rep_curr_pp ?? 0,
                repPrevPF:          mr.rep_prev_pf ?? 0,
                repCurrPF:          mr.rep_curr_pf ?? 0,
                planComponentId:    mr.plan_component_id || '',
            });
        });

        // Lecturas con machineReadings embebidas
        const readings = (readingsRes.data || []).map(r => ({
            id:              r.id,
            clientId:        r.client_id,
            clientName:      r.client_name,
            periodMonth:     r.period_month,
            periodYear:      r.period_year,
            observations:    r.observations || '',
            totalAbono:      r.total_abono,
            totalExcessCost: r.total_excess_cost,
            totalGeneral:    r.total_general,
            uploadDate:      r.upload_date || '',
            user:            r.uploaded_by || '',
            machineReadings: mrByReading[r.id] || [],
        }));

        return { clients, plans, readings, config };
    },

    // -------------------------------------------------------------------------
    // GUARDADO: reemplaza todo el contenido de las tablas con el payload actual
    // Estrategia: delete-then-insert (igual que sobrescribir database.json)
    // -------------------------------------------------------------------------
    async saveData(payload) {
        if (!_sb) {
            throw new Error("Supabase no está inicializado o no está disponible.");
        }
        // Orden de borrado: clientes primero (cascade elimina máquinas, lecturas y detalles)
        // Luego planes (ya sin máquinas que los referencien)
        const delClients = await _sb.from('clients').delete().not('id', 'is', null);
        if (delClients.error) throw delClients.error;

        const delPlans = await _sb.from('plans').delete().not('id', 'is', null);
        if (delPlans.error) throw delPlans.error;

        // Config: upsert (no borrar, conservar claves existentes)
        const configRows = Object.entries(payload.config).map(([key, value]) => ({
            key,
            value: JSON.stringify(value),
        }));
        if (configRows.length) {
            const { error } = await _sb.from('config').upsert(configRows, { onConflict: 'key' });
            if (error) throw error;
        }

        // Planes
        if (payload.plans?.length) {
            const planRows = payload.plans.map(p => ({
                id:          p.id,
                name:        p.name,
                copies:      p.copies,
                cost:        p.cost,
                excess_price: p.excessPrice ?? null,
                components:  p.components ?? [],
            }));
            const { error } = await _sb.from('plans').insert(planRows);
            if (error) throw error;
        }

        // Clientes
        if (payload.clients?.length) {
            const clientRows = payload.clients.map(c => ({
                id:           c.id,
                name:         c.name,
                phone:        c.phone || '',
                observations: c.observations || '',
            }));
            const { error: cErr } = await _sb.from('clients').insert(clientRows);
            if (cErr) throw cErr;

            // Máquinas (todas en una sola inserción)
            const machineRows = payload.clients.flatMap(c =>
                (c.machines || []).map(m => ({
                    id:                  m.id,
                    client_id:           c.id,
                    name:                m.name,
                    serial_number:       m.serialNumber || '',
                    is_fixed:            m.isFixed ?? false,
                    plan_id:             m.planId ?? null,
                    plan_component_id:   m.planComponentId ?? '',
                    custom_cost:         m.customCost ?? null,
                    custom_excess_price: m.customExcessPrice ?? null,
                }))
            );
            if (machineRows.length) {
                const { error: mErr } = await _sb.from('machines').insert(machineRows);
                if (mErr) throw mErr;
            }
        }

        // Lecturas
        if (payload.readings?.length) {
            const readingRows = payload.readings.map(r => ({
                id:               r.id,
                client_id:        r.clientId,
                client_name:      r.clientName,
                period_month:     r.periodMonth,
                period_year:      r.periodYear,
                observations:     r.observations || '',
                total_abono:      r.totalAbono ?? 0,
                total_excess_cost: r.totalExcessCost ?? 0,
                total_general:    r.totalGeneral ?? 0,
                upload_date:      r.uploadDate || '',
                uploaded_by:      r.user || '',
            }));
            const { error: rErr } = await _sb.from('readings').insert(readingRows);
            if (rErr) throw rErr;

            // Detalle por máquina (todos en una sola inserción)
            const mrRows = payload.readings.flatMap(r =>
                (r.machineReadings || []).map(mr => ({
                    reading_id:   r.id,
                    machine_id:   mr.machineId || '',
                    machine_name: mr.name || '',          // app.js usa mr.name
                    serial_number: mr.serialNumber || '',
                    is_fixed:     mr.isFixed ?? false,
                    prev_counter: mr.prevCounter ?? 0,
                    curr_counter: mr.currCounter ?? 0,
                    consumption:  mr.consumption ?? 0,
                    plan_copies:  mr.planCopies ?? 0,
                    excess:       mr.excess ?? 0,
                    excess_price: mr.excessPrice ?? 0,
                    plan_cost:    mr.planCost ?? 0,
                    excess_cost:  mr.excessCost ?? 0,
                    total_cost:   mr.totalCost ?? 0,
                    custom_cost:  mr.customCost ?? 0,
                    is_pending:   mr.isPending ?? false,
                    
                    // Nuevos campos
                    prev_impresiones: mr.prevImpresiones ?? 0,
                    curr_impresiones: mr.currImpresiones ?? 0,
                    prev_copias:      mr.prevCopias ?? 0,
                    curr_copias:      mr.currCopias ?? 0,
                    prev_pp:          mr.prevPP ?? 0,
                    curr_pp:          mr.currPP ?? 0,
                    prev_pf:          mr.prevPF ?? 0,
                    curr_pf:          mr.currPF ?? 0,
                    
                    // Campos de reemplazo
                    has_replacement:  mr.hasReplacement ?? false,
                    rep_model:        mr.repModel || '',
                    rep_serial_number: mr.repSerialNumber || '',
                    rep_prev_counter:  mr.repPrevCounter ?? 0,
                    rep_curr_counter:  mr.repCurrCounter ?? 0,
                    rep_consumption:  mr.repConsumption ?? 0,
                    rep_prev_impresiones: mr.repPrevImpresiones ?? 0,
                    rep_curr_impresiones: mr.repCurrImpresiones ?? 0,
                    rep_prev_copias:      mr.repPrevCopias ?? 0,
                    rep_curr_copias:      mr.repCurrCopias ?? 0,
                    rep_prev_pp:          mr.repPrevPP ?? 0,
                    rep_curr_pp:          mr.repCurrPP ?? 0,
                    rep_prev_pf:          mr.repPrevPF ?? 0,
                    rep_curr_pf:          mr.repCurrPF ?? 0,
                    plan_component_id:    mr.planComponentId ?? '',
                }))
            );
            if (mrRows.length) {
                const { error: mrErr } = await _sb.from('machine_readings').insert(mrRows);
                if (mrErr) throw mrErr;
            }
        }
    },
};
