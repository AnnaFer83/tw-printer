/* ==========================================================================
   TECNOWORK - Controlador Principal de la Aplicación (js/app.js)
   ========================================================================== */

// Estado Global de la Aplicación
const AppState = {
    clients: [],
    plans: [],
    readings: [],
    config: {
        defaultExcessPrice: 90,
        defaultPPPrice: 300,
        defaultPFPrice: 600,
        companyName: "LEXORER S.R.L.",
        companySub: "TW - Informes de Consumo de Impresión"
    },
    activeTab: "dashboard",
    editingClientId: null,
    editingPlanId: null, // Control de edición de planes
    tempClientMachines: [], // Almacén temporal de máquinas al registrar/editar cliente
    editingTempMachineIndex: null, // Control de edición en línea de número de serie de equipo temporal
    billingChart: null
};

window.getMachineType = function(machineName) {
    const name = (machineName || "").toLowerCase();
    if (name.includes("canon") || name.includes("color") || name.includes("g3100") || name.includes("g2100") || name.includes("g1100") || name.includes("g1000")) {
        return "color";
    }
    return "laser";
};

// Datos por Defecto para Inicializar la Aplicación por primera vez (Caso Real ACLISA)
const DefaultData = {
    plans: [
        { id: "p500", name: "Plan 500 Copias", copies: 500, cost: 35000, excessPrice: 90 },
        { id: "p1000", name: "Plan 1.000 Copias", copies: 1000, cost: 60000, excessPrice: 90 },
        { id: "p1500", name: "Plan 1.500 Copias", copies: 1500, cost: 85500, excessPrice: 90 }
    ],
    clients: [
        {
            id: "c-aclisa",
            name: "ACLISA",
            phone: "5491133334444",
            observations: "Plan BYN 1500 impresoras y multifuncion Ricoh 3710 y Xerox B405 incluye 1500 impresiones - Excedente $ 90",
            machines: [
                { id: "m1", name: "XEROX B405", serialNumber: "5160z931098", planId: "p1500", customCost: 94575, customExcessPrice: 90, isFixed: false },
                { id: "m2", name: "RICOH 3710 sf", serialNumber: "SN-02", planId: "p1500", customCost: 54600, customExcessPrice: 90, isFixed: false },
                { id: "m3", name: "RICOH 3710 dn", serialNumber: "SN-03", planId: "p1500", customCost: 45500, customExcessPrice: 90, isFixed: false },
                { id: "m4", name: "RICOH 3710 dn", serialNumber: "SN-04", planId: "p1500", customCost: 45500, customExcessPrice: 90, isFixed: false },
                { id: "m5", name: "RICOH 3710 dn", serialNumber: "SN-05", planId: "p1500", customCost: 45500, customExcessPrice: 90, isFixed: false },
                { id: "m6", name: "RICOH 3710 dn", serialNumber: "SN-06", planId: "p1500", customCost: 45500, customExcessPrice: 90, isFixed: false },
                { id: "m7", name: "RICOH 3710 dn", serialNumber: "SN-07", planId: "p1500", customCost: 45500, customExcessPrice: 90, isFixed: false },
                { id: "m8", name: "RICOH 3710 dn", serialNumber: "SN-08", planId: "p1500", customCost: 45500, customExcessPrice: 90, isFixed: false },
                { id: "m9", name: "RICOH 311 DN", serialNumber: "SN-09", planId: "p1500", customCost: 45500, customExcessPrice: 90, isFixed: false },
                { id: "m10", name: "SCANER X 4", serialNumber: "SN-10", planId: null, customCost: 187200, customExcessPrice: 0, isFixed: true }
            ]
        }
    ],
    readings: [
        {
            id: "r-demo-aclisa",
            clientId: "c-aclisa",
            clientName: "ACLISA",
            periodMonth: "Mayo",
            periodYear: 2026,
            observations: "Maquina SN: 5160z931098, con excedente de impresión.",
            totalAbono: 654875,
            totalExcessCost: 42480,
            totalGeneral: 697355,
            machineReadings: [
                { machineId: "m1", name: "XEROX B405", serialNumber: "5160z931098", prevCounter: 31973, currCounter: 32961, consumption: 988, planCopies: 1500, excess: 0, excessPrice: 90, planCost: 94575, excessCost: 0, totalCost: 94575, isFixed: false },
                { machineId: "m2", name: "RICOH 3710 sf", serialNumber: "SN-02", prevCounter: 26248, currCounter: 27538, consumption: 1290, planCopies: 1500, excess: 0, excessPrice: 90, planCost: 54600, excessCost: 0, totalCost: 54600, isFixed: false },
                { machineId: "m3", name: "RICOH 3710 dn", serialNumber: "SN-03", prevCounter: 26106, currCounter: 26109, consumption: 3, planCopies: 1500, excess: 0, excessPrice: 90, planCost: 45500, excessCost: 0, totalCost: 45500, isFixed: false },
                { machineId: "m4", name: "RICOH 3710 dn", serialNumber: "SN-04", prevCounter: 36463, currCounter: 38435, consumption: 1972, planCopies: 1500, excess: 472, excessPrice: 90, planCost: 45500, excessCost: 42480, totalCost: 87980, isFixed: false },
                { machineId: "m5", name: "RICOH 3710 dn", serialNumber: "SN-05", prevCounter: 57458, currCounter: 58769, consumption: 1311, planCopies: 1500, excess: 0, excessPrice: 90, planCost: 45500, excessCost: 0, totalCost: 45500, isFixed: false },
                { machineId: "m6", name: "RICOH 3710 dn", serialNumber: "SN-06", prevCounter: 35715, currCounter: 36380, consumption: 665, planCopies: 1500, excess: 0, excessPrice: 90, planCost: 45500, excessCost: 0, totalCost: 45500, isFixed: false },
                { machineId: "m7", name: "RICOH 3710 dn", serialNumber: "SN-07", prevCounter: 28579, currCounter: 29015, consumption: 436, planCopies: 1500, excess: 0, excessPrice: 90, planCost: 45500, excessCost: 0, totalCost: 45500, isFixed: false },
                { machineId: "m8", name: "RICOH 3710 dn", serialNumber: "SN-08", prevCounter: 1707, currCounter: 1752, consumption: 45, planCopies: 1500, excess: 0, excessPrice: 90, planCost: 45500, excessCost: 0, totalCost: 45500, isFixed: false },
                { machineId: "m9", name: "RICOH 311 DN", serialNumber: "SN-09", prevCounter: 52930, currCounter: 53456, consumption: 526, planCopies: 1500, excess: 0, excessPrice: 90, planCost: 45500, excessCost: 0, totalCost: 45500, isFixed: false },
                { machineId: "m10", name: "SCANER X 4", serialNumber: "SN-10", prevCounter: 0, currCounter: 0, consumption: 0, planCopies: 0, excess: 0, excessPrice: 0, planCost: 187200, excessCost: 0, totalCost: 187200, isFixed: true }
            ]
        }
    ]
};

// --- CICLO DE VIDA DE LA APLICACIÓN ---
document.addEventListener("DOMContentLoaded", async () => {
    await initApp();
    setupEventListeners();
    renderAll();
});

/**
 * Envía el estado de la aplicación actual al servidor backend para sincronización persistente (centralizada).
 * Al mismo tiempo, guarda una copia local de respaldo en el localStorage de esta máquina.
 */
async function syncWithServer() {
    // 1. Guardar en localStorage siempre como copia de respaldo local
    localStorage.setItem("tw_plans", JSON.stringify(AppState.plans));
    localStorage.setItem("tw_clients", JSON.stringify(AppState.clients));
    localStorage.setItem("tw_readings", JSON.stringify(AppState.readings));
    localStorage.setItem("tw_config", JSON.stringify(AppState.config));
    
    // 2. Intentar guardar en la base de datos centralizada del servidor
    const payload = {
        clients: AppState.clients,
        plans: AppState.plans,
        readings: AppState.readings,
        config: AppState.config
    };
    
    try {
        await SupabaseAdapter.saveData(payload);
    } catch (e) {
        console.warn("No se pudo guardar en Supabase. Los datos quedan en almacenamiento local.", e);
    }
}

function savePlansToStorage() { syncWithServer(); }
function saveClientsToStorage() { syncWithServer(); }
function saveReadingsToStorage() { syncWithServer(); }
function saveConfigToStorage() { syncWithServer(); }

/**
 * Inicializa el estado cargando desde el Servidor centralizado (Base de datos)
 * o cayendo en LocalStorage/DefaultData en caso de que no esté activo el backend.
 */
async function initApp() {
    let dataLoadedFromServer = false;
    
    try {
        const data = await SupabaseAdapter.loadData();
        if (data && data.clients && data.plans && data.readings && data.config) {
            if (data.clients.length > 0 || data.plans.length > 0) {
                AppState.clients = data.clients;
                AppState.plans = data.plans;
                AppState.readings = data.readings;
                AppState.config = data.config;
                dataLoadedFromServer = true;
                console.log("Datos cargados exitosamente desde Supabase.");
            } else {
                console.log("Base de datos Supabase vacía. Se migrarán los datos locales.");
            }
        }
    } catch (e) {
        console.log("Supabase no disponible. Cargando desde el almacenamiento local del navegador.", e);
    }

    if (!dataLoadedFromServer) {
        // Cargar Planes
        const savedPlans = localStorage.getItem("tw_plans");
        if (savedPlans) {
            AppState.plans = JSON.parse(savedPlans);
        } else {
            AppState.plans = [...DefaultData.plans];
            savePlansToStorage();
        }

        // Cargar Clientes
        const savedClients = localStorage.getItem("tw_clients");
        if (savedClients) {
            AppState.clients = JSON.parse(savedClients);
        } else {
            AppState.clients = [...DefaultData.clients];
            saveClientsToStorage();
        }

        // Cargar Parámetros Generales
        const savedConfig = localStorage.getItem("tw_config");
        if (savedConfig) {
            AppState.config = JSON.parse(savedConfig);
        } else {
            saveConfigToStorage();
        }

        // Cargar Lecturas
        const savedReadings = localStorage.getItem("tw_readings");
        if (savedReadings) {
            AppState.readings = JSON.parse(savedReadings);
        } else {
            AppState.readings = [...DefaultData.readings];
            saveReadingsToStorage();
        }
    }

    // Establecer período correspondiente en los selects de período activo
    const today = new Date();
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const currentMonthName = months[today.getMonth()];
    const currentYearNum = today.getFullYear();

    const reportMonthEl = document.getElementById("report-period-month");
    const reportYearEl = document.getElementById("report-period-year");
    if (reportMonthEl) reportMonthEl.value = currentMonthName;
    if (reportYearEl) reportYearEl.value = currentYearNum.toString();

    const entryMonth = document.getElementById("entry-period-month");
    const entryYear = document.getElementById("entry-period-year");
    if (entryMonth) entryMonth.value = currentMonthName;
    if (entryYear) entryYear.value = currentYearNum.toString();

    // Garantizar que todos los planes existentes tengan el valor de excedente configurado
    AppState.plans.forEach(p => {
        if (p.excessPrice === undefined || p.excessPrice === null) {
            p.excessPrice = AppState.config.defaultExcessPrice || 90;
        }
    });

    if (!AppState.config.currentUser) {
        AppState.config.currentUser = "Administrador";
    }

    // Rellenar formulario general de configuración
    document.getElementById("config-default-excess-price").value = AppState.config.defaultExcessPrice;
    document.getElementById("config-default-pp-price").value = AppState.config.defaultPPPrice || 300;
    document.getElementById("config-default-pf-price").value = AppState.config.defaultPFPrice || 600;
    document.getElementById("config-company-name").value = AppState.config.companyName;
    document.getElementById("config-company-sub").value = AppState.config.companySub;
    const userConfigEl = document.getElementById("config-current-user");
    if (userConfigEl) userConfigEl.value = AppState.config.currentUser;

    // Limpieza ortográfica de los datos cargados para corregir "exedente" -> "excedente" en todo el sistema
    let dataModified = false;
    
    // Corregir en planes
    if (AppState.plans) {
        AppState.plans.forEach(p => {
            if (p.name && p.name.includes("exedente")) {
                p.name = p.name.replace(/exedente/gi, "excedente");
                dataModified = true;
            }
        });
    }
    
    // Corregir en clientes
    if (AppState.clients) {
        AppState.clients.forEach(c => {
            if (c.observations && c.observations.includes("exedente")) {
                c.observations = c.observations.replace(/exedente/gi, "excedente");
                dataModified = true;
            }
            if (c.name && c.name.includes("exedente")) {
                c.name = c.name.replace(/exedente/gi, "excedente");
                dataModified = true;
            }
            if (c.machines) {
                c.machines.forEach(m => {
                    if (m.name && m.name.includes("exedente")) {
                        m.name = m.name.replace(/exedente/gi, "excedente");
                        dataModified = true;
                    }
                });
            }
        });
    }
    
    // Corregir en readings, inyectar fecha de carga / usuario si faltan, y recalcular abono si planCopies es 0 y se guardó erróneamente en 0
    if (AppState.readings) {
        AppState.readings.forEach(r => {
            if (r.clientName && r.clientName.includes("exedente")) {
                r.clientName = r.clientName.replace(/exedente/gi, "excedente");
                dataModified = true;
            }
            if (r.observations && r.observations.includes("exedente")) {
                r.observations = r.observations.replace(/exedente/gi, "excedente");
                dataModified = true;
            }

            const clientObj = AppState.clients.find(c => c.id === r.clientId);

            // Regenerar observaciones si tienen el formato viejo, vacío o de carga automática
            if (clientObj) {
                const currentObs = r.observations || "";
                if (currentObs === "" || currentObs.includes("sin copias incl.") || currentObs.includes(" | ") || currentObs.startsWith("Carga automática") || currentObs.includes("excedente por impresión") || currentObs.includes("excedente $")) {
                    const newObs = window.generateDefaultObservations ? window.generateDefaultObservations(clientObj) : "";
                    if (newObs && newObs !== currentObs) {
                        r.observations = newObs;
                        dataModified = true;
                        console.log(`Observaciones actualizadas a formato agrupado para ${r.clientName} (${r.periodMonth} ${r.periodYear})`);
                    }
                }
            }
            let totalAbono = 0;
            let totalExcessCost = 0;
            let totalGeneral = 0;
            let readingModified = false;

            if (r.machineReadings) {
                r.machineReadings.forEach(mr => {
                    if (mr.name && mr.name.includes("exedente")) {
                        mr.name = mr.name.replace(/exedente/gi, "excedente");
                        dataModified = true;
                    }

                    // Corrección de planCost para planCopies === 0 que fueron guardados con 0
                    if (!mr.isFixed && mr.planCopies === 0 && mr.planCost === 0 && clientObj) {
                        const m = clientObj.machines.find(mac => mac.id === mr.machineId);
                        if (m) {
                            const plan = AppState.plans.find(p => p.id === m.planId) || { cost: 0 };
                            const realPlanCost = m.customCost !== null ? m.customCost : plan.cost;
                            if (realPlanCost > 0) {
                                mr.planCost = realPlanCost;
                                mr.totalCost = mr.planCost + mr.excessCost;
                                readingModified = true;
                            }
                        }
                    }

                    totalAbono += mr.planCost || 0;
                    totalExcessCost += mr.excessCost || 0;
                    totalGeneral += mr.totalCost || 0;
                });
            }

            if (readingModified) {
                r.totalAbono = totalAbono;
                r.totalExcessCost = totalExcessCost;
                r.totalGeneral = totalGeneral;
                dataModified = true;
                console.log(`Lectura corregida por migración para cliente: ${r.clientName} - Período: ${r.periodMonth} ${r.periodYear}`);
            }

            if (!r.uploadDate) {
                r.uploadDate = "03/06/2026 21:00:00";
                dataModified = true;
            }
            if (!r.user) {
                r.user = "Administrador";
                dataModified = true;
            }
        });
    }
    // Garantizar que todos los planes tengan la estructura jerárquica de componentes
    if (AppState.plans) {
        AppState.plans.forEach(p => {
            if (!p.components || p.components.length === 0) {
                p.components = [
                    {
                        id: "comp-" + p.id + "-default",
                        name: p.name || "B/N con copias",
                        type: "bn",
                        copies: p.copies !== undefined ? p.copies : 0,
                        cost: p.cost !== undefined ? p.cost : 0,
                        excessPrice: p.excessPrice !== undefined ? p.excessPrice : 90
                    }
                ];
                dataModified = true;
                console.log(`Plan migrado a estructura jerárquica: ${p.name}`);
            }
        });
    }

    // Garantizar que todas las máquinas de clientes tengan un planComponentId válido si tienen planId
    if (AppState.clients) {
        AppState.clients.forEach(c => {
            if (c.machines) {
                c.machines.forEach(m => {
                    if (m.planId && !m.planComponentId) {
                        const plan = AppState.plans.find(p => p.id === m.planId);
                        if (plan && plan.components && plan.components.length > 0) {
                            m.planComponentId = plan.components[0].id;
                            dataModified = true;
                            console.log(`Máquina ${m.name} del cliente ${c.name} vinculada al componente por defecto del plan ${plan.name}`);
                        }
                    }
                });
            }
        });
    }

    // Garantizar que todos los registros de lectura de máquina tengan planComponentId si tienen planId
    if (AppState.readings) {
        AppState.readings.forEach(r => {
            if (r.machineReadings) {
                r.machineReadings.forEach(mr => {
                    if (!mr.planComponentId && mr.machineId) {
                        const clientObj = AppState.clients.find(c => c.id === r.clientId);
                        if (clientObj) {
                            const m = clientObj.machines.find(mac => mac.id === mr.machineId);
                            if (m && m.planComponentId) {
                                mr.planComponentId = m.planComponentId;
                                dataModified = true;
                            }
                        }
                    }
                });
            }
        });
    }

    if (dataModified || !dataLoadedFromServer) {
        syncWithServer();
    }
}

// --- MANEJADORES DE EVENTOS ---
function setupEventListeners() {
    // 1. Navegación por pestañas (Sidebar)
    const menuItems = document.querySelectorAll(".menu-item");
    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const tabId = item.getAttribute("data-tab");
            switchTab(tabId);
        });
    });

    // 2. Control del Tema Oscuro / Claro
    const themeSwitch = document.getElementById("theme-switch");
    themeSwitch.addEventListener("change", () => {
        if (themeSwitch.checked) {
            document.body.classList.remove("light-mode");
            document.body.classList.add("dark-mode");
            document.querySelector(".theme-label").innerHTML = '<i class="fa-solid fa-moon"></i> Modo Oscuro';
        } else {
            document.body.classList.remove("dark-mode");
            document.body.classList.add("light-mode");
            document.querySelector(".theme-label").innerHTML = '<i class="fa-solid fa-sun"></i> Modo Claro';
        }
        updateBillingChart();
    });

    // 3. Toggles de Campos de Máquinas en Ficha de Clientes
    const mPlanSelect = document.getElementById("machine-plan");
    if (mPlanSelect) {
        mPlanSelect.addEventListener("change", () => {
            const planId = mPlanSelect.value;
            const compSelect = document.getElementById("machine-plan-component");
            if (compSelect) {
                compSelect.innerHTML = '<option value="" disabled selected>Seleccione un componente...</option>';
                if (planId) {
                    const plan = AppState.plans.find(p => p.id === planId);
                    if (plan && plan.components) {
                        plan.components.forEach(c => {
                            compSelect.innerHTML += `<option value="${c.id}">${c.name} (${c.type})</option>`;
                        });
                        if (plan.components.length > 0) {
                            compSelect.selectedIndex = 1; // default to first component
                        }
                    }
                }
            }
        });
    }

    const checkFixed = document.getElementById("machine-is-fixed");
    checkFixed.addEventListener("change", () => {
        const planFields = document.getElementById("machine-plan-fields-box");
        const fixedFields = document.getElementById("machine-fixed-fields-box");
        if (checkFixed.checked) {
            planFields.classList.add("hidden");
            fixedFields.classList.remove("hidden");
        } else {
            planFields.classList.remove("hidden");
            fixedFields.classList.add("hidden");
        }
    });

    // Agregar Máquina a la Ficha del Cliente (En Memoria Temporal)
    document.getElementById("btn-add-machine-to-list").addEventListener("click", () => {
        const nameInput = document.getElementById("machine-name-input");
        const serialInput = document.getElementById("machine-serial-input");
        const isFixed = document.getElementById("machine-is-fixed").checked;

        const name = nameInput.value.trim();
        const sn = serialInput.value.trim();

        if (name === "") {
            showToast("Debes ingresar el nombre o modelo del equipo.", "error");
            return;
        }

        let newMachine = {
            id: 'm-' + Date.now() + '-' + Math.floor(Math.random() * 100),
            name: name,
            serialNumber: sn,
            isFixed: isFixed
        };

        if (isFixed) {
            const costVal = parseFloat(document.getElementById("machine-fixed-cost").value) || 0;
            newMachine.customCost = costVal;
            newMachine.planId = null;
            newMachine.customExcessPrice = 0;
        } else {
            const planId = document.getElementById("machine-plan").value;
            const planComponentId = document.getElementById("machine-plan-component").value;
            const costOverride = document.getElementById("machine-custom-cost").value;
            const excessOverride = document.getElementById("machine-custom-excess").value;

            if (!planId) {
                showToast("Por favor selecciona un plan para la máquina.", "error");
                return;
            }
            if (!planComponentId) {
                showToast("Por favor selecciona un componente del plan.", "error");
                return;
            }

            newMachine.planId = planId;
            newMachine.planComponentId = planComponentId;
            newMachine.customCost = costOverride !== "" ? parseFloat(costOverride) : null;
            newMachine.customExcessPrice = excessOverride !== "" ? parseFloat(excessOverride) : null;
        }

        AppState.tempClientMachines.push(newMachine);
        renderTempMachinesList();
        
        // Reset campos de máquina
        nameInput.value = "";
        serialInput.value = "";
        document.getElementById("machine-fixed-cost").value = "";
        document.getElementById("machine-custom-cost").value = "";
        document.getElementById("machine-custom-excess").value = "";
        document.getElementById("machine-plan").selectedIndex = 0;
        document.getElementById("machine-plan-component").innerHTML = '<option value="" disabled selected>Seleccione un componente...</option>';
        checkFixed.checked = false;
        document.getElementById("machine-plan-fields-box").classList.remove("hidden");
        document.getElementById("machine-fixed-fields-box").classList.add("hidden");

        showToast("Equipo vinculado temporalmente. Recuerda guardar el cliente.");
    });

    // 4. Clientes: Guardar Ficha Completa
    document.getElementById("form-client").addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("client-name").value.trim();
        const phone = document.getElementById("client-phone").value.trim();
        const obs = document.getElementById("client-observations").value.trim();

        if (AppState.tempClientMachines.length === 0) {
            if (!confirm("No has asignado ningún equipo a este cliente. ¿Deseas guardarlo de todos modos?")) {
                return;
            }
        }

        if (AppState.editingClientId) {
            // Edición
            const clientIdx = AppState.clients.findIndex(c => c.id === AppState.editingClientId);
            if (clientIdx !== -1) {
                AppState.clients[clientIdx].name = name;
                AppState.clients[clientIdx].phone = phone;
                AppState.clients[clientIdx].observations = obs;
                AppState.clients[clientIdx].machines = AppState.tempClientMachines.map(m => ({ ...m }));
                showToast(`Cliente "${name}" actualizado.`);
            }
            AppState.editingClientId = null;
            AppState.editingTempMachineIndex = null;
            document.getElementById("client-form-title").innerText = "Registrar Nuevo Cliente";
            document.getElementById("btn-submit-client").innerText = "Guardar Cliente";
            document.getElementById("btn-cancel-client-edit").classList.add("hidden");
        } else {
            // Creación
            if (AppState.clients.some(c => c.name.toLowerCase() === name.toLowerCase())) {
                showToast(`El cliente "${name}" ya está registrado.`, "error");
                return;
            }

            const newClient = {
                id: 'c-' + Date.now(),
                name: name,
                phone: phone,
                observations: obs,
                machines: AppState.tempClientMachines.map(m => ({ ...m }))
            };
            AppState.clients.push(newClient);
            showToast(`Cliente "${name}" registrado con éxito.`);
        }

        saveClientsToStorage();
        AppState.tempClientMachines = [];
        AppState.editingTempMachineIndex = null;
        renderTempMachinesList();
        renderClientsTable();
        populateClientSelects();
        recalculateAllReadings();
        renderReadingsTable();
        updateStats();
        updateBillingChart();

        document.getElementById("form-client").reset();
    });

    // Cancelar Edición de Cliente
    document.getElementById("btn-cancel-client-edit").addEventListener("click", () => {
        AppState.editingClientId = null;
        AppState.tempClientMachines = [];
        AppState.editingTempMachineIndex = null;
        renderTempMachinesList();
        document.getElementById("form-client").reset();
        document.getElementById("client-form-title").innerText = "Registrar Nuevo Cliente";
        document.getElementById("btn-submit-client").innerText = "Guardar Cliente";
        document.getElementById("btn-cancel-client-edit").classList.add("hidden");
    });

    // 5. Cargar Planilla Mensual (Dashboard Side Widget)
    const selectClient = document.getElementById("entry-client");
    selectClient.addEventListener("change", () => {
        const clientId = selectClient.value;
        const clientObj = AppState.clients.find(c => c.id === clientId);
        
        if (clientObj) {
            setupMultiMachineInputSheet(clientObj);
        }
    });

    // Guardar lecturas de la planilla del Dashboard
    document.getElementById("btn-save-multi-readings").addEventListener("click", () => {
        const clientId = selectClient.value;
        const clientObj = AppState.clients.find(c => c.id === clientId);
        if (!clientObj) return;

        const month = document.getElementById("entry-period-month").value;
        const year = parseInt(document.getElementById("entry-period-year").value) || 2026;
        const notes = document.getElementById("entry-notes").value.trim();

        const machineReadings = [];
        let totalAbono = 0;
        let totalExcessCost = 0;
        let totalGeneral = 0;
        let validationError = false;

        // Recorrer filas de la planilla
        clientObj.machines.forEach(m => {
            if (validationError) return;

            let isColor = getMachineType(m.name) === "color";
            let isEcografo = false;
            let isOther = false;
            if (!m.isFixed && m.planId) {
                const plan = AppState.plans.find(p => p.id === m.planId);
                if (plan && plan.components) {
                    const comp = plan.components.find(c => c.id === m.planComponentId);
                    if (comp) {
                        if (comp.type === "ecografo") isEcografo = true;
                        if (comp.type === "other") isOther = true;
                    }
                }
            }

            if (m.isFixed || isOther) {
                let readingCost = 0;
                if (m.isFixed) {
                    readingCost = m.customCost || 0;
                } else {
                    readingCost = resolveOtherRates(m).cost;
                }
                machineReadings.push({
                    machineId: m.id,
                    name: m.name,
                    serialNumber: m.serialNumber,
                    prevCounter: 0,
                    currCounter: 0,
                    consumption: 0,
                    planCopies: 0,
                    excess: 0,
                    excessPrice: 0,
                    planCost: readingCost,
                    excessCost: 0,
                    totalCost: readingCost,
                    isFixed: true,
                    isPending: false,
                    planComponentId: m.planComponentId || "",

                    // Sub-contadores y reemplazo inicializados a cero/vacíos
                    prevImpresiones: 0, currImpresiones: 0,
                    prevCopias: 0, currCopias: 0,
                    prevPP: 0, currPP: 0,
                    prevPF: 0, currPF: 0,
                    hasReplacement: false,
                    repModel: "", repSerialNumber: "",
                    repPrevCounter: 0, repCurrCounter: 0, repConsumption: 0,
                    repPrevImpresiones: 0, repCurrImpresiones: 0,
                    repPrevCopias: 0, repCurrCopias: 0,
                    repPrevPP: 0, repCurrPP: 0,
                    repPrevPF: 0, repCurrPF: 0
                });
                totalAbono += readingCost;
                totalGeneral += readingCost;
            } else {
                const hasRep = document.getElementById(`has-replacement-${m.id}`)?.checked || false;

                let isPending = false;
                let prev = 0, curr = 0;
                let prevImp = 0, currImp = 0;
                let prevCop = 0, currCop = 0;
                let prevPP = 0, currPP = 0;
                let prevPF = 0, currPF = 0;

                let repModel = "";
                let repSerial = "";
                let repPrev = 0, repCurr = 0;
                let repPrevImp = 0, repCurrImp = 0;
                let repPrevCop = 0, repCurrCop = 0;
                let repPrevPP = 0, repCurrPP = 0;
                let repPrevPF = 0, repCurrPF = 0;

                let planCopies = 0;
                let planCost = 0;
                let excessPrice = 0;

                if (isColor) {
                    const rates = resolveColorRates(m);
                    planCost = rates.ppCost + rates.pfCost;

                    const prevPPInput = document.getElementById(`prev-pp-${m.id}`);
                    const currPPInput = document.getElementById(`curr-pp-${m.id}`);
                    const prevPFInput = document.getElementById(`prev-pf-${m.id}`);
                    const currPFInput = document.getElementById(`curr-pf-${m.id}`);

                    const prevPPVal = prevPPInput ? prevPPInput.value.trim() : "";
                    const currPPVal = currPPInput ? currPPInput.value.trim() : "";
                    const prevPFVal = prevPFInput ? prevPFInput.value.trim() : "";
                    const currPFVal = currPFInput ? currPFInput.value.trim() : "";

                    isPending = prevPPVal === "" || currPPVal === "" || prevPFVal === "" || currPFVal === "";

                    if (!isPending) {
                        prevPP = parseInt(prevPPVal) || 0;
                        currPP = parseInt(currPPVal) || 0;
                        prevPF = parseInt(prevPFVal) || 0;
                        currPF = parseInt(currPFVal) || 0;

                        if (currPP < prevPP) {
                            showToast(`El contador PP actual de ${m.name} es menor al anterior.`, "error");
                            currPPInput.focus();
                            validationError = true;
                            return;
                        }
                        if (currPF < prevPF) {
                            showToast(`El contador PF actual de ${m.name} es menor al anterior.`, "error");
                            currPFInput.focus();
                            validationError = true;
                            return;
                        }

                        // El total es la suma de ambos
                        prev = prevPP + prevPF;
                        curr = currPP + currPF;
                    }

                    if (hasRep) {
                        const repModelVal = document.getElementById(`rep-model-${m.id}`)?.value.trim() || "";
                        const repSerialVal = document.getElementById(`rep-serial-${m.id}`)?.value.trim() || "";
                        const repPrevPPVal = document.getElementById(`rep-prev-pp-${m.id}`)?.value.trim() || "";
                        const repCurrPPVal = document.getElementById(`rep-curr-pp-${m.id}`)?.value.trim() || "";
                        const repPrevPFVal = document.getElementById(`rep-prev-pf-${m.id}`)?.value.trim() || "";
                        const repCurrPFVal = document.getElementById(`rep-curr-pf-${m.id}`)?.value.trim() || "";

                        if (repModelVal === "" || repSerialVal === "") {
                            showToast(`Complete el Modelo y S/N nuevo para ${m.name}.`, "error");
                            document.getElementById(`rep-model-${m.id}`).focus();
                            validationError = true;
                            return;
                        }

                        if (repPrevPPVal === "" || repCurrPPVal === "" || repPrevPFVal === "" || repCurrPFVal === "") {
                            isPending = true;
                        } else {
                            repModel = repModelVal;
                            repSerial = repSerialVal;
                            repPrevPP = parseInt(repPrevPPVal) || 0;
                            repCurrPP = parseInt(repCurrPPVal) || 0;
                            repPrevPF = parseInt(repPrevPFVal) || 0;
                            repCurrPF = parseInt(repCurrPFVal) || 0;

                            if (repCurrPP < repPrevPP) {
                                showToast(`El contador PP actual del equipo nuevo es menor al inicial.`, "error");
                                document.getElementById(`rep-curr-pp-${m.id}`).focus();
                                validationError = true;
                                return;
                            }
                            if (repCurrPF < repPrevPF) {
                                showToast(`El contador PF actual del equipo nuevo es menor al inicial.`, "error");
                                document.getElementById(`rep-curr-pf-${m.id}`).focus();
                                validationError = true;
                                return;
                            }

                            repPrev = repPrevPP + repPrevPF;
                            repCurr = repCurrPP + repCurrPF;
                        }
                    }
                } else if (isEcografo) {
                    const rates = resolveEcografoRates(m);
                    planCost = rates.cost;
                    excessPrice = rates.pagePrice;

                    const prevInput = document.getElementById(`prev-${m.id}`);
                    const currInput = document.getElementById(`curr-${m.id}`);

                    const prevVal = prevInput ? prevInput.value.trim() : "";
                    const currVal = currInput ? currInput.value.trim() : "";

                    isPending = prevVal === "" || currVal === "";

                    if (!isPending) {
                        prev = parseInt(prevVal) || 0;
                        curr = parseInt(currVal) || 0;

                        if (curr < prev) {
                            showToast(`El contador actual de ${m.name} es menor al anterior.`, "error");
                            currInput.focus();
                            validationError = true;
                            return;
                        }
                    }

                    if (hasRep) {
                        const repModelVal = document.getElementById(`rep-model-${m.id}`)?.value.trim() || "";
                        const repSerialVal = document.getElementById(`rep-serial-${m.id}`)?.value.trim() || "";
                        const repPrevVal = document.getElementById(`rep-prev-${m.id}`)?.value.trim() || "";
                        const repCurrVal = document.getElementById(`rep-curr-${m.id}`)?.value.trim() || "";

                        if (repModelVal === "" || repSerialVal === "") {
                            showToast(`Complete el Modelo y S/N nuevo para ${m.name}.`, "error");
                            document.getElementById(`rep-model-${m.id}`).focus();
                            validationError = true;
                            return;
                        }

                        if (repPrevVal === "" || repCurrVal === "") {
                            isPending = true;
                        } else {
                            repModel = repModelVal;
                            repSerial = repSerialVal;
                            repPrev = parseInt(repPrevVal) || 0;
                            repCurr = parseInt(repCurrVal) || 0;

                            if (repCurr < repPrev) {
                                showToast(`El contador actual del equipo nuevo es menor al inicial.`, "error");
                                document.getElementById(`rep-curr-${m.id}`).focus();
                                validationError = true;
                                return;
                            }
                        }
                    }
                } else {
                    // Laser
                    const rates = resolveBNRates(m);
                    planCost = rates.cost;
                    planCopies = rates.copies;
                    excessPrice = rates.excessPrice;

                    const prevInput = document.getElementById(`prev-${m.id}`);
                    const currInput = document.getElementById(`curr-${m.id}`);

                    const prevVal = prevInput ? prevInput.value.trim() : "";
                    const currVal = currInput ? currInput.value.trim() : "";

                    isPending = prevVal === "" || currVal === "";

                    if (!isPending) {
                        prev = parseInt(prevVal) || 0;
                        curr = parseInt(currVal) || 0;

                        if (curr < prev) {
                            showToast(`El contador actual de ${m.name} es menor al anterior.`, "error");
                            currInput.focus();
                            validationError = true;
                            return;
                        }

                        // Sub-contadores informativos
                        prevImp = parseInt(document.getElementById(`prev-impresiones-${m.id}`)?.value) || 0;
                        currImp = parseInt(document.getElementById(`curr-impresiones-${m.id}`)?.value) || 0;
                        prevCop = parseInt(document.getElementById(`prev-copias-${m.id}`)?.value) || 0;
                        currCop = parseInt(document.getElementById(`curr-copias-${m.id}`)?.value) || 0;
                    }

                    if (hasRep) {
                        const repModelVal = document.getElementById(`rep-model-${m.id}`)?.value.trim() || "";
                        const repSerialVal = document.getElementById(`rep-serial-${m.id}`)?.value.trim() || "";
                        const repPrevVal = document.getElementById(`rep-prev-${m.id}`)?.value.trim() || "";
                        const repCurrVal = document.getElementById(`rep-curr-${m.id}`)?.value.trim() || "";

                        if (repModelVal === "" || repSerialVal === "") {
                            showToast(`Complete el Modelo y S/N nuevo para ${m.name}.`, "error");
                            document.getElementById(`rep-model-${m.id}`).focus();
                            validationError = true;
                            return;
                        }

                        if (repPrevVal === "" || repCurrVal === "") {
                            isPending = true;
                        } else {
                            repModel = repModelVal;
                            repSerial = repSerialVal;
                            repPrev = parseInt(repPrevVal) || 0;
                            repCurr = parseInt(repCurrVal) || 0;

                            if (repCurr < repPrev) {
                                showToast(`El contador actual del equipo nuevo es menor al inicial.`, "error");
                                document.getElementById(`rep-curr-${m.id}`).focus();
                                validationError = true;
                                return;
                            }

                            repPrevImp = parseInt(document.getElementById(`rep-prev-impresiones-${m.id}`)?.value) || 0;
                            repCurrImp = parseInt(document.getElementById(`rep-curr-impresiones-${m.id}`)?.value) || 0;
                            repPrevCop = parseInt(document.getElementById(`rep-prev-copias-${m.id}`)?.value) || 0;
                            repCurrCop = parseInt(document.getElementById(`rep-curr-copias-${m.id}`)?.value) || 0;
                        }
                    }
                }

                // Fórmulas de cálculo final
                let consumption = 0;
                let repConsumption = 0;
                let excess = 0;
                let excessCost = 0;
                let totalCost = planCost;

                if (!isPending) {
                    consumption = Math.max(0, curr - prev);
                    if (hasRep) {
                        repConsumption = Math.max(0, repCurr - repPrev);
                    }

                    if (isColor) {
                        const rates = resolveColorRates(m);
                        let consPP = Math.max(0, currPP - prevPP);
                        let consPF = Math.max(0, currPF - prevPF);
                        if (hasRep) {
                            consPP += Math.max(0, repCurrPP - repPrevPP);
                            consPF += Math.max(0, repCurrPF - repPrevPF);
                        }

                        excessCost = (consPP * rates.ppPrice) + (consPF * rates.pfPrice);
                        excess = consumption + repConsumption;
                        totalCost = planCost + excessCost;
                    } else if (isEcografo) {
                        const rates = resolveEcografoRates(m);
                        const totalCons = consumption + repConsumption;
                        excess = totalCons;
                        excessCost = totalCons * rates.pagePrice;
                        totalCost = planCost + excessCost;
                    } else {
                        // Laser
                        const rates = resolveBNRates(m);
                        if (rates.copies === 0) {
                            let totalCons = consumption;
                            if (hasRep) {
                                totalCons += repConsumption;
                            }
                            excess = totalCons;
                            excessCost = totalCons * rates.excessPrice;
                            totalCost = planCost + excessCost;
                        } else {
                            if (hasRep) {
                                const excessAnt = Math.max(0, consumption - rates.copies);
                                const remainingPlan = Math.max(0, rates.copies - consumption);
                                const excessNvo = Math.max(0, repConsumption - remainingPlan);

                                excess = excessAnt + excessNvo;
                            } else {
                                excess = Math.max(0, consumption - rates.copies);
                            }
                            excessCost = excess * rates.excessPrice;
                            totalCost = planCost + excessCost;
                        }
                    }
                }

                machineReadings.push({
                    machineId: m.id,
                    name: m.name,
                    serialNumber: m.serialNumber,
                    prevCounter: prev,
                    currCounter: curr,
                    consumption: consumption,
                    planCopies: planCopies,
                    excess: excess,
                    excessPrice: excessPrice,
                    planCost: planCost,
                    excessCost: excessCost,
                    totalCost: totalCost,
                    isFixed: false,
                    isPending: isPending,
                    planComponentId: m.planComponentId || "",

                    // Sub-contadores
                    prevImpresiones: prevImp, currImpresiones: currImp,
                    prevCopias: prevCop, currCopias: currCop,
                    prevPP: prevPP, currPP: currPP,
                    prevPF: prevPF, currPF: currPF,

                    // Reemplazo
                    hasReplacement: hasRep,
                    repModel: repModel,
                    repSerialNumber: repSerial,
                    repPrevCounter: repPrev,
                    repCurrCounter: repCurr,
                    repConsumption: repConsumption,
                    repPrevImpresiones: repPrevImp, repCurrImpresiones: repCurrImp,
                    repPrevCopias: repPrevCop, repCurrCopias: repCurrCop,
                    repPrevPP: repPrevPP, repCurrPP: repCurrPP,
                    repPrevPF: repPrevPF, repCurrPF: repCurrPF
                });

                totalAbono += planCost;
                totalExcessCost += excessCost;
                totalGeneral += totalCost;
            }
        });

        if (validationError) return;

        // Crear registro consolidado
        const record = {
            id: 'r-' + clientObj.id + '-' + month.toLowerCase() + '-' + year,
            clientId: clientObj.id,
            clientName: clientObj.name,
            periodMonth: month,
            periodYear: year,
            observations: notes,
            machineReadings: machineReadings,
            totalAbono: totalAbono,
            totalExcessCost: totalExcessCost,
            totalGeneral: totalGeneral,
            uploadDate: new Date().toLocaleString('es-AR'),
            user: AppState.config.currentUser || "Administrador"
        };

        // Reemplazar o insertar en el listado
        const existingIdx = AppState.readings.findIndex(r => 
            r.clientId === clientObj.id && 
            r.periodMonth.toLowerCase() === month.toLowerCase() && 
            parseInt(r.periodYear) === year
        );
        if (existingIdx !== -1) {
            AppState.readings[existingIdx] = record;
            showToast(`Consumos de ${clientObj.name} actualizados.`);
        } else {
            AppState.readings.push(record);
            showToast(`Consumos de ${clientObj.name} guardados correctamente.`);
        }

        saveReadingsToStorage();
        renderReadingsTable();
        updateStats();
        updateBillingChart();

        // Ocultar planilla e inicializar campos
        document.getElementById("multi-machine-entry-container").classList.add("hidden");
        document.getElementById("multi-machine-placeholder").classList.remove("hidden");
        selectClient.selectedIndex = 0;
        
        switchTab("dashboard");
    });

    // 6. Configuración de Planes Habituales: Crear/Editar Plan
    const btnAddCompTemp = document.getElementById("btn-add-comp-temp");
    if (btnAddCompTemp) {
        btnAddCompTemp.addEventListener("click", () => {
            window.addPlanComponentTemp();
        });
    }

    document.getElementById("form-add-plan").addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("new-plan-name").value.trim();
        
        if (!AppState.tempPlanComponents || AppState.tempPlanComponents.length === 0) {
            showToast("Debes agregar al menos un componente al plan.", "error");
            return;
        }

        // Calcular valores del plan principal para mantener compatibilidad
        let copies = 0;
        let cost = 0;
        let excessPrice = AppState.config.defaultExcessPrice || 90;

        AppState.tempPlanComponents.forEach(c => {
            cost += c.cost;
            if (c.type === "bn") {
                copies += c.copies;
                excessPrice = c.excessPrice;
            }
        });

        if (AppState.editingPlanId) {
            // Edición
            const planIdx = AppState.plans.findIndex(p => p.id === AppState.editingPlanId);
            if (planIdx !== -1) {
                AppState.plans[planIdx].name = name;
                AppState.plans[planIdx].copies = copies;
                AppState.plans[planIdx].cost = cost;
                AppState.plans[planIdx].excessPrice = excessPrice;
                AppState.plans[planIdx].components = JSON.parse(JSON.stringify(AppState.tempPlanComponents));
                showToast(`Plan "${name}" actualizado.`);
            }
            AppState.editingPlanId = null;
            document.getElementById("plan-form-title").innerHTML = '<i class="fa-solid fa-folder-plus"></i> Agregar Nuevo Plan';
            document.getElementById("btn-submit-plan").innerHTML = '<i class="fa-solid fa-plus"></i> Crear Plan';
            document.getElementById("btn-cancel-plan-edit").classList.add("hidden");
        } else {
            // Creación
            const newPlan = {
                id: 'p-' + Date.now(),
                name: name,
                copies: copies,
                cost: cost,
                excessPrice: excessPrice,
                components: JSON.parse(JSON.stringify(AppState.tempPlanComponents))
            };
            AppState.plans.push(newPlan);
            showToast(`Plan "${name}" creado exitosamente.`);
        }

        AppState.tempPlanComponents = [];
        window.renderTempComponentsTable();

        savePlansToStorage();
        renderConfigPlansTable();
        populatePlanSelects();
        recalculateAllReadings(); // Recalcular lecturas por si cambió abono o copias
        renderReadingsTable();
        updateStats();
        updateBillingChart();

        document.getElementById("form-add-plan").reset();
    });

    // Cancelar Edición de Plan
    document.getElementById("btn-cancel-plan-edit").addEventListener("click", () => {
        AppState.editingPlanId = null;
        AppState.tempPlanComponents = [];
        window.renderTempComponentsTable();
        document.getElementById("form-add-plan").reset();
        document.getElementById("plan-form-title").innerHTML = '<i class="fa-solid fa-folder-plus"></i> Agregar Nuevo Plan';
        document.getElementById("btn-submit-plan").innerHTML = '<i class="fa-solid fa-plus"></i> Crear Plan';
        document.getElementById("btn-cancel-plan-edit").classList.add("hidden");
    });

    // 7. Configuración General: Guardar
    document.getElementById("form-config-general").addEventListener("submit", (e) => {
        e.preventDefault();
        AppState.config.defaultExcessPrice = parseFloat(document.getElementById("config-default-excess-price").value) || 90;
        AppState.config.defaultPPPrice = parseFloat(document.getElementById("config-default-pp-price").value) || 300;
        AppState.config.defaultPFPrice = parseFloat(document.getElementById("config-default-pf-price").value) || 600;
        AppState.config.companyName = document.getElementById("config-company-name").value || "LEXORER S.R.L.";
        AppState.config.companySub = document.getElementById("config-company-sub").value || "TW - Informes de Consumo de Impresión";
        AppState.config.currentUser = document.getElementById("config-current-user").value || "Administrador";
        
        saveConfigToStorage();
        showToast("Configuración general guardada con éxito.", "success");
        recalculateAllReadings();
        renderAll();
    });

    // 8. Zona de Importación Drag and Drop
    const dropZone = document.getElementById("excel-drop-zone");
    const fileInput = document.getElementById("excel-file-input");

    dropZone.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });
    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    fileInput.addEventListener("change", (e) => {
        if (fileInput.files.length > 0) {
            handleFileUpload(fileInput.files[0]);
        }
    });

    document.getElementById("btn-cancel-mapping").addEventListener("click", () => {
        document.getElementById("column-mapper").classList.add("hidden");
        DataParser.activeWorkbookData = null;
        fileInput.value = "";
    });

    // Confirmar e importar columnas mapeadas (Excel/CSV)
    document.getElementById("btn-apply-mapping").addEventListener("click", () => {
        const clientIdx = parseInt(document.getElementById("map-client").value);
        const machineIdx = parseInt(document.getElementById("map-machine").value);
        const prevIdx = parseInt(document.getElementById("map-prev").value);
        const currIdx = parseInt(document.getElementById("map-curr").value);

        if (clientIdx === prevIdx || clientIdx === currIdx || prevIdx === currIdx) {
            if (!confirm("Has mapeado columnas al mismo dato. ¿Deseas continuar?")) return;
        }

        // Obtener filas mapeadas desde parser.js
        const records = DataParser.applyMapping({
            clientIdx: clientIdx,
            prevIdx: prevIdx,
            currIdx: currIdx,
            machineIdx: machineIdx // Pasamos el índice de la máquina
        });

        if (records.length === 0) {
            showToast("No se encontraron registros procesables en el archivo.", "error");
            return;
        }

        const selectedClientId = document.getElementById("entry-client").value;
        if (selectedClientId) {
            autofillClientInputs(records, selectedClientId);
        } else {
            processImportedRawRecords(records, "planilla Excel/CSV");
        }
        document.getElementById("column-mapper").classList.add("hidden");
        fileInput.value = "";
    });

    // Pegar Texto desde Portapapeles
    document.getElementById("btn-parse-text").addEventListener("click", () => {
        const rawText = document.getElementById("clipboard-text").value.trim();
        if (rawText === "") {
            showToast("Por favor pega texto con lecturas.", "error");
            return;
        }

        const records = DataParser.parseRawText(rawText);
        if (records.length === 0) {
            showToast("No pudimos extraer lecturas. Formatos recomendados: 'ACLISA Xerox: 31973 32961'", "error");
            return;
        }

        const selectedClientId = document.getElementById("entry-client").value;
        if (selectedClientId) {
            autofillClientInputs(records, selectedClientId);
        } else {
            processImportedRawRecords(records, "texto copiado");
        }
        document.getElementById("clipboard-text").value = "";
    });

    // 9. Exportar Reporte Consolidado
    document.getElementById("btn-export-all-pdf").addEventListener("click", () => {
        const readings = getFilteredReadings();
        if (readings.length === 0) {
            showToast("No hay registros en el período seleccionado para generar el reporte.", "error");
            return;
        }
        const stats = getPeriodStats();
        PDFGenerator.generateConsolidatedPDF(readings, AppState.config, stats);
        showToast("Generando reporte consolidado en PDF...", "success");
    });

    // 10. Limpiar Todo (Lecturas de la sesión actual)
    const btnClearData = document.getElementById("btn-clear-data");
    if (btnClearData) {
        btnClearData.addEventListener("click", () => {
            const activeMonth = document.getElementById("report-period-month").value;
            const activeYear = parseInt(document.getElementById("report-period-year").value) || 2026;
            
            if (confirm(`¿Estás seguro de que deseas limpiar las lecturas cargadas para el período ${activeMonth} ${activeYear}? Esto no afectará a los clientes ni planes configurados.`)) {
                AppState.readings = AppState.readings.filter(r => 
                    !(r.periodMonth.toLowerCase() === activeMonth.toLowerCase() && parseInt(r.periodYear) === activeYear)
                );
                saveReadingsToStorage();
                renderAll();
                showToast(`Se han limpiado las lecturas del período ${activeMonth} ${activeYear}.`);
            }
        });
    }

    // 11. Sincronización del Período de Trabajo Activo
    const repMonth = document.getElementById("report-period-month");
    const repYear = document.getElementById("report-period-year");
    const entryMonth = document.getElementById("entry-period-month");
    const entryYear = document.getElementById("entry-period-year");

    if (repMonth && entryMonth) {
        repMonth.addEventListener("change", (e) => {
            entryMonth.value = e.target.value;
            renderAll();
        });
        entryMonth.addEventListener("change", (e) => {
            repMonth.value = e.target.value;
            renderAll();
        });
    }

    if (repYear && entryYear) {
        repYear.addEventListener("change", (e) => {
            entryYear.value = e.target.value;
            renderAll();
        });
        entryYear.addEventListener("change", (e) => {
            repYear.value = e.target.value;
            renderAll();
        });
    }

    // 12. Aumento Porcentual Masivo de Abonos (Planes)
    const btnApplyBulk = document.getElementById("btn-apply-bulk-increase");
    if (btnApplyBulk) {
        btnApplyBulk.addEventListener("click", () => {
            const pctInput = document.getElementById("input-bulk-increase-pct");
            const pct = parseFloat(pctInput.value);
            if (isNaN(pct) || pct === 0) {
                showToast("Por favor ingresa un porcentaje de aumento válido (distinto de cero).", "warning");
                return;
            }

            const alsoCustom = document.getElementById("chk-bulk-increase-custom-costs").checked;
            const actionText = pct > 0 ? "aumentar" : "disminuir";
            const pctAbs = Math.abs(pct);

            if (!confirm(`¿Estás seguro de que deseas ${actionText} todos los abonos base en un ${pctAbs}%?${alsoCustom ? '\nTambién se actualizarán los abonos personalizados de las máquinas de los clientes.' : ''}`)) {
                return;
            }

            const factor = 1 + (pct / 100);

            // Aumentar los planes base
            AppState.plans.forEach(p => {
                p.cost = Math.round(p.cost * factor);
            });

            let customUpdated = 0;
            // Aumentar abonos personalizados de clientes si corresponde
            if (alsoCustom) {
                AppState.clients.forEach(c => {
                    if (c.machines) {
                        c.machines.forEach(m => {
                            if (m.customCost !== null) {
                                m.customCost = Math.round(m.customCost * factor);
                                customUpdated++;
                            }
                        });
                    }
                });
            }

            // Sincronizar y refrescar
            syncWithServer().then(() => {
                renderConfigPlansTable();
                renderClientsTable();
                recalculateAllReadings();
                renderReadingsTable();
                updateStats();
                updateBillingChart();

                pctInput.value = "";
                let msg = `Se aplicó un ${pct > 0 ? 'aumento' : 'descuento'} del ${pctAbs}% a todos los planes base.`;
                if (alsoCustom && customUpdated > 0) {
                    msg += ` También se actualizaron ${customUpdated} abonos personalizados de clientes.`;
                }
                showToast(msg, "success");
            }).catch(e => {
                console.error(e);
                showToast("Error al sincronizar con el servidor.", "error");
            });
        });
    }
}

/**
 * Switch de pestañas
 */
function switchTab(tabId) {
    AppState.activeTab = tabId;

    const menuItems = document.querySelectorAll(".menu-item");
    menuItems.forEach(item => {
        if (item.getAttribute("data-tab") === tabId) item.classList.add("active");
        else item.classList.remove("active");
    });

    const tabs = document.querySelectorAll(".tab-pane");
    tabs.forEach(tab => {
        if (tab.id === `tab-${tabId}`) tab.classList.add("active");
        else tab.classList.remove("active");
    });

    const titleEl = document.getElementById("current-tab-title");
    const descEl = document.getElementById("current-tab-desc");

    switch(tabId) {
        case "dashboard":
            titleEl.innerText = "Resumen de Consumo";
            descEl.innerText = "Visualiza y calcula el consumo e histórico de tus clientes.";
            break;
        case "importar":
            titleEl.innerText = "Carga de Impresiones";
            descEl.innerText = "Sube archivos Excel/CSV o pega texto libre para extraer lecturas.";
            break;
        case "clientes":
            titleEl.innerText = "Clientes y Equipos";
            descEl.innerText = "Registra clientes, asocia números de WhatsApp y vincula múltiples impresoras.";
            break;
        case "configuracion":
            titleEl.innerText = "Configuraciones del Sistema";
            descEl.innerText = "Define precios base, planes habituales y datos de cabecera corporativos.";
            break;
    }

    if (tabId === "dashboard") {
        updateBillingChart();
    }
}

/**
 * Carga el archivo en el mapeador
 */
function handleFileUpload(file) {
    const loader = document.getElementById("drop-zone-loader");
    loader.classList.remove("hidden");
    document.getElementById("loader-title").innerText = "Abriendo archivo...";
    document.getElementById("loader-progress").innerText = "0% completado";

    DataParser.processFile(
        file,
        (headers, guesses) => {
            loader.classList.add("hidden");
            const clientSelect = document.getElementById("map-client");
            const machineSelect = document.getElementById("map-machine");
            const prevSelect = document.getElementById("map-prev");
            const currSelect = document.getElementById("map-curr");

            clientSelect.innerHTML = "";
            machineSelect.innerHTML = "";
            prevSelect.innerHTML = "";
            currSelect.innerHTML = "";

            machineSelect.innerHTML = '<option value="-1">-- No indicar (Usar genérica) --</option>';

            headers.forEach(h => {
                const opt = `<option value="${h.index}">${h.name}</option>`;
                clientSelect.innerHTML += opt;
                machineSelect.innerHTML += opt;
                prevSelect.innerHTML += opt;
                currSelect.innerHTML += opt;
            });

            if (guesses.client !== -1) clientSelect.value = guesses.client;
            if (guesses.prev !== -1) prevSelect.value = guesses.prev;
            if (guesses.curr !== -1) currSelect.value = guesses.curr;
            
            const mHeader = headers.find(h => {
                const n = h.name.toLowerCase();
                return n.includes("maquina") || n.includes("modelo") || n.includes("equipo") || n.includes("serie") || n.includes("device");
            });
            if (mHeader) machineSelect.value = mHeader.index;

            document.getElementById("column-mapper").classList.remove("hidden");
        },
        (records) => {
            loader.classList.add("hidden");
            if (!records || records.length === 0) {
                showToast("No se encontraron registros procesables en el archivo.", "error");
                return;
            }
            const selectedClientId = document.getElementById("entry-client").value;
            if (selectedClientId) {
                autofillClientInputs(records, selectedClientId);
            } else {
                processImportedRawRecords(records, `archivo "${file.name}"`);
            }
        },
        (errorMsg) => {
            loader.classList.add("hidden");
            showToast(errorMsg, "error");
        },
        (statusMsg, pct) => {
            document.getElementById("loader-title").innerText = statusMsg;
            document.getElementById("loader-progress").innerText = `${pct}% completado`;
        }
    );
}

/**
 * Despliega la planilla de ingreso rápido de múltiples máquinas para un cliente
 */
function setupMultiMachineInputSheet(clientObj) {
    const tbody = document.getElementById("multi-machine-entry-body");
    tbody.innerHTML = "";

    if (clientObj.machines.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Este cliente no tiene máquinas asociadas. Regístralas en "Clientes y Equipos".</td></tr>`;
        document.getElementById("multi-machine-entry-container").classList.remove("hidden");
        document.getElementById("multi-machine-placeholder").classList.add("hidden");
        document.getElementById("multi-preview-total-cost").innerText = "$0";
        return;
    }

    // Buscar si ya existe una lectura guardada del mismo período para este cliente y pre-cargar
    const selectedMonth = document.getElementById("entry-period-month").value;
    const selectedYear = parseInt(document.getElementById("entry-period-year").value) || 2026;
    const existingReading = AppState.readings.find(r => r.clientId === clientObj.id && r.periodMonth === selectedMonth && r.periodYear === selectedYear);

    if (existingReading) {
        document.getElementById("entry-notes").value = existingReading.observations || "";
    } else {
        document.getElementById("entry-notes").value = window.generateDefaultObservations ? window.generateDefaultObservations(clientObj) : "";
    }

    clientObj.machines.forEach(m => {
        // Cargar últimos valores o inicializar
        let prevVal = "", currVal = "";
        let prevImpVal = "", currImpVal = "";
        let prevCopVal = "", currCopVal = "";
        let prevPPVal = "", currPPVal = "";
        let prevPFVal = "", currPFVal = "";
        
        let hasRepChecked = "";
        let repModelVal = "", repSerialVal = "";
        let repPrevVal = "", repCurrVal = "";
        let repPrevImpVal = "", repCurrImpVal = "";
        let repPrevCopVal = "", repCurrCopVal = "";
        let repPrevPPVal = "", repCurrPPVal = "";
        let repPrevPFVal = "", repCurrPFVal = "";

        if (existingReading) {
            const mReading = existingReading.machineReadings.find(mr => mr.machineId === m.id);
            if (mReading) {
                prevVal = mReading.isPending ? "" : (mReading.prevCounter !== undefined ? mReading.prevCounter : "");
                currVal = mReading.isPending ? "" : (mReading.currCounter !== undefined ? mReading.currCounter : "");
                prevImpVal = mReading.isPending ? "" : (mReading.prevImpresiones !== undefined ? mReading.prevImpresiones : "");
                currImpVal = mReading.isPending ? "" : (mReading.currImpresiones !== undefined ? mReading.currImpresiones : "");
                prevCopVal = mReading.isPending ? "" : (mReading.prevCopias !== undefined ? mReading.prevCopias : "");
                currCopVal = mReading.isPending ? "" : (mReading.currCopias !== undefined ? mReading.currCopias : "");
                prevPPVal = mReading.isPending ? "" : (mReading.prevPP !== undefined ? mReading.prevPP : "");
                currPPVal = mReading.isPending ? "" : (mReading.currPP !== undefined ? mReading.currPP : "");
                prevPFVal = mReading.isPending ? "" : (mReading.prevPF !== undefined ? mReading.prevPF : "");
                currPFVal = mReading.isPending ? "" : (mReading.currPF !== undefined ? mReading.currPF : "");
                
                hasRepChecked = mReading.hasReplacement ? "checked" : "";
                repModelVal = mReading.repModel || "";
                repSerialVal = mReading.repSerialNumber || "";
                repPrevVal = mReading.isPending ? "" : (mReading.repPrevCounter !== undefined ? mReading.repPrevCounter : "");
                repCurrVal = mReading.isPending ? "" : (mReading.repCurrCounter !== undefined ? mReading.repCurrCounter : "");
                repPrevImpVal = mReading.isPending ? "" : (mReading.repPrevImpresiones !== undefined ? mReading.repPrevImpresiones : "");
                repCurrImpVal = mReading.isPending ? "" : (mReading.repCurrImpresiones !== undefined ? mReading.repCurrImpresiones : "");
                repPrevCopVal = mReading.isPending ? "" : (mReading.repPrevCopias !== undefined ? mReading.repPrevCopias : "");
                repCurrCopias = mReading.isPending ? "" : (mReading.repCurrCopias !== undefined ? mReading.repCurrCopias : "");
                repPrevPPVal = mReading.isPending ? "" : (mReading.repPrevPP !== undefined ? mReading.repPrevPP : "");
                repCurrPPVal = mReading.isPending ? "" : (mReading.repCurrPP !== undefined ? mReading.repCurrPP : "");
                repPrevPFVal = mReading.isPending ? "" : (mReading.repPrevPF !== undefined ? mReading.repPrevPF : "");
                repCurrPFVal = mReading.isPending ? "" : (mReading.repCurrPF !== undefined ? mReading.repCurrPF : "");
            }
        } else {
            // Intentar buscar la lectura anterior (el último actual registrado históricamente)
            const historical = AppState.readings
                .filter(r => r.clientId === clientObj.id)
                .sort((a,b) => b.periodYear - a.periodYear); // simplificado, tomamos el más reciente
            if (historical.length > 0) {
                let lastM = null;
                for (const hist of historical) {
                    lastM = hist.machineReadings.find(mr => mr.machineId === m.id);
                    if (lastM) break;
                }
                if (lastM) {
                    prevVal = lastM.isPending ? "" : (lastM.currCounter !== undefined ? lastM.currCounter : "");
                    prevImpVal = lastM.isPending ? "" : (lastM.currImpresiones !== undefined ? lastM.currImpresiones : "");
                    prevCopVal = lastM.isPending ? "" : (lastM.currCopias !== undefined ? lastM.currCopias : "");
                    prevPPVal = lastM.isPending ? "" : (lastM.currPP !== undefined ? lastM.currPP : "");
                    prevPFVal = lastM.isPending ? "" : (lastM.currPF !== undefined ? lastM.currPF : "");
                }
            }
        }

        let isColor = getMachineType(m.name) === "color";
        let isEcografo = false;
        let isOther = false;
        if (!m.isFixed && m.planId) {
            const plan = AppState.plans.find(p => p.id === m.planId);
            if (plan && plan.components) {
                const comp = plan.components.find(c => c.id === m.planComponentId);
                if (comp) {
                    if (comp.type === "ecografo") isEcografo = true;
                    if (comp.type === "other") isOther = true;
                }
            }
        }

        if (m.isFixed || isOther) {
            const tr = document.createElement("tr");
            let abono = 0;
            if (m.isFixed) {
                abono = m.customCost || 0;
            } else {
                abono = resolveOtherRates(m).cost;
            }
            tr.innerHTML = `
                <td>
                    <div style="font-weight:600;">${m.name}</div>
                    <div style="font-size:0.7rem; color:var(--text-muted);">S/N: ${m.serialNumber || 'Sin serie'}</div>
                </td>
                <td colspan="2" class="text-center text-muted" style="font-size:0.75rem;">Fijo (Sin contadores)</td>
                <td class="text-right font-weight-bold" style="padding-right: 5px; vertical-align: middle;">${PDFGenerator.formatCurrency(abono)}</td>
            `;
            tbody.appendChild(tr);
        } else {
            let abono = 0;
            if (isColor) {
                const rates = resolveColorRates(m);
                abono = rates.ppCost + rates.pfCost;
            } else if (isEcografo) {
                const rates = resolveEcografoRates(m);
                abono = rates.cost;
            } else {
                const rates = resolveBNRates(m);
                abono = rates.cost;
            }

            if (isColor) {
                // Fila principal PP
                const trPP = document.createElement("tr");
                trPP.className = "main-machine-row";
                trPP.innerHTML = `
                    <td>
                        <div style="font-weight:600;">${m.name}</div>
                        <div style="font-size:0.7rem; color:var(--text-muted);">S/N: ${m.serialNumber || 'Sin serie'}</div>
                        <label style="font-size:0.75rem; margin-top:5px; display:inline-block; cursor:pointer; color: var(--color-cyan);">
                            <input type="checkbox" id="has-replacement-${m.id}" onchange="toggleReplacementRow('${m.id}')" ${hasRepChecked}> Hubo cambio de equipo
                        </label>
                    </td>
                    <td>
                        <span style="font-size:0.7rem; color:var(--text-muted); display:block; margin-bottom:2px;">PP Anterior:</span>
                        <input type="number" id="prev-pp-${m.id}" value="${prevPPVal}" min="0" oninput="recalcMultiSheetPreview()">
                    </td>
                    <td>
                        <span style="font-size:0.7rem; color:var(--text-muted); display:block; margin-bottom:2px;">PP Actual:</span>
                        <input type="number" id="curr-pp-${m.id}" value="${currPPVal}" min="0" oninput="recalcMultiSheetPreview()">
                    </td>
                    <td class="text-right" id="total-preview-${m.id}" style="font-weight:600; padding-right: 5px; vertical-align: middle;">${PDFGenerator.formatCurrency(abono)}</td>
                `;
                tbody.appendChild(trPP);

                // Fila sub-contador PF
                const trPF = document.createElement("tr");
                trPF.className = "sub-counter-row";
                trPF.innerHTML = `
                    <td>
                        <div style="padding-left:15px; font-size:0.8rem; color:var(--text-muted);"><i class="fa-solid fa-angle-right" style="margin-right:5px;"></i>Papel Foto (PF)</div>
                    </td>
                    <td>
                        <span style="font-size:0.7rem; color:var(--text-muted); display:block; margin-bottom:2px;">PF Anterior:</span>
                        <input type="number" id="prev-pf-${m.id}" value="${prevPFVal}" min="0" oninput="recalcMultiSheetPreview()">
                    </td>
                    <td>
                        <span style="font-size:0.7rem; color:var(--text-muted); display:block; margin-bottom:2px;">PF Actual:</span>
                        <input type="number" id="curr-pf-${m.id}" value="${currPFVal}" min="0" oninput="recalcMultiSheetPreview()">
                    </td>
                    <td></td>
                `;
                tbody.appendChild(trPF);
            } else if (isEcografo) {
                // Ecógrafo: fila principal Contador
                const trCont = document.createElement("tr");
                trCont.className = "main-machine-row";
                trCont.innerHTML = `
                    <td>
                        <div style="font-weight:600;">${m.name} (Ecógrafo)</div>
                        <div style="font-size:0.7rem; color:var(--text-muted);">S/N: ${m.serialNumber || 'Sin serie'}</div>
                        <label style="font-size:0.75rem; margin-top:5px; display:inline-block; cursor:pointer; color: var(--color-cyan);">
                            <input type="checkbox" id="has-replacement-${m.id}" onchange="toggleReplacementRow('${m.id}')" ${hasRepChecked}> Hubo cambio de equipo
                        </label>
                    </td>
                    <td>
                        <span style="font-size:0.7rem; color:var(--text-muted); display:block; margin-bottom:2px;">Contador Anterior:</span>
                        <input type="number" id="prev-${m.id}" value="${prevVal}" min="0" oninput="recalcMultiSheetPreview()">
                    </td>
                    <td>
                        <span style="font-size:0.7rem; color:var(--text-muted); display:block; margin-bottom:2px;">Contador Actual:</span>
                        <input type="number" id="curr-${m.id}" value="${currVal}" min="0" oninput="recalcMultiSheetPreview()">
                    </td>
                    <td class="text-right" id="total-preview-${m.id}" style="font-weight:600; padding-right: 5px; vertical-align: middle;">${PDFGenerator.formatCurrency(abono)}</td>
                `;
                tbody.appendChild(trCont);
            } else {
                // Laser / B/N con copias
                const trCont = document.createElement("tr");
                trCont.className = "main-machine-row";
                trCont.innerHTML = `
                    <td>
                        <div style="font-weight:600;">${m.name}</div>
                        <div style="font-size:0.7rem; color:var(--text-muted);">S/N: ${m.serialNumber || 'Sin serie'}</div>
                        <label style="font-size:0.75rem; margin-top:5px; display:inline-block; cursor:pointer; color: var(--color-cyan);">
                            <input type="checkbox" id="has-replacement-${m.id}" onchange="toggleReplacementRow('${m.id}')" ${hasRepChecked}> Hubo cambio de equipo
                        </label>
                    </td>
                    <td>
                        <span style="font-size:0.7rem; color:var(--text-muted); display:block; margin-bottom:2px;">Contador Anterior:</span>
                        <input type="number" id="prev-${m.id}" value="${prevVal}" min="0" oninput="recalcMultiSheetPreview()">
                    </td>
                    <td>
                        <span style="font-size:0.7rem; color:var(--text-muted); display:block; margin-bottom:2px;">Contador Actual:</span>
                        <input type="number" id="curr-${m.id}" value="${currVal}" min="0" oninput="recalcMultiSheetPreview()">
                    </td>
                    <td class="text-right" id="total-preview-${m.id}" style="font-weight:600; padding-right: 5px; vertical-align: middle;">${PDFGenerator.formatCurrency(abono)}</td>
                `;
                tbody.appendChild(trCont);

                // Fila sub-contador Impresiones
                const trImp = document.createElement("tr");
                trImp.className = "sub-counter-row";
                trImp.innerHTML = `
                    <td>
                        <div style="padding-left:15px; font-size:0.8rem; color:var(--text-muted);"><i class="fa-solid fa-angle-right" style="margin-right:5px;"></i>Impresiones</div>
                    </td>
                    <td>
                        <span style="font-size:0.7rem; color:var(--text-muted); display:block; margin-bottom:2px;">Imp. Anterior:</span>
                        <input type="number" id="prev-impresiones-${m.id}" value="${prevImpVal}" min="0" oninput="recalcMultiSheetPreview()">
                    </td>
                    <td>
                        <span style="font-size:0.7rem; color:var(--text-muted); display:block; margin-bottom:2px;">Imp. Actual:</span>
                        <input type="number" id="curr-impresiones-${m.id}" value="${currImpVal}" min="0" oninput="recalcMultiSheetPreview()">
                    </td>
                    <td></td>
                `;
                tbody.appendChild(trImp);

                // Fila sub-contador Copias
                const trCop = document.createElement("tr");
                trCop.className = "sub-counter-row";
                trCop.innerHTML = `
                    <td>
                        <div style="padding-left:15px; font-size:0.8rem; color:var(--text-muted);"><i class="fa-solid fa-angle-right" style="margin-right:5px;"></i>Copias</div>
                    </td>
                    <td>
                        <span style="font-size:0.7rem; color:var(--text-muted); display:block; margin-bottom:2px;">Copias Anterior:</span>
                        <input type="number" id="prev-copias-${m.id}" value="${prevCopVal}" min="0" oninput="recalcMultiSheetPreview()">
                    </td>
                    <td>
                        <span style="font-size:0.7rem; color:var(--text-muted); display:block; margin-bottom:2px;">Copias Actual:</span>
                        <input type="number" id="curr-copias-${m.id}" value="${currCopVal}" min="0" oninput="recalcMultiSheetPreview()">
                    </td>
                    <td></td>
                `;
                tbody.appendChild(trCop);
            }

            // Fila colapsable de reemplazo
            const trRep = document.createElement("tr");
            trRep.id = `rep-row-${m.id}`;
            trRep.className = hasRepChecked ? "" : "hidden";
            trRep.style.backgroundColor = "rgba(255,255,255,0.02)";
            trRep.style.borderLeft = "4px solid var(--color-cyan)";
            
            let repInputsHtml = "";
            if (isColor) {
                repInputsHtml = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <label style="font-size:0.7rem; display:block; color:var(--text-muted);">PP Inicial</label>
                            <input type="number" id="rep-prev-pp-${m.id}" value="${repPrevPPVal}" min="0" oninput="recalcMultiSheetPreview()" style="width:100%; padding:4px; font-size:0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-primary);">
                        </div>
                        <div>
                            <label style="font-size:0.7rem; display:block; color:var(--text-muted);">PP Final</label>
                            <input type="number" id="rep-curr-pp-${m.id}" value="${repCurrPPVal}" min="0" oninput="recalcMultiSheetPreview()" style="width:100%; padding:4px; font-size:0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-primary);">
                        </div>
                        <div>
                            <label style="font-size:0.7rem; display:block; color:var(--text-muted);">PF Inicial</label>
                            <input type="number" id="rep-prev-pf-${m.id}" value="${repPrevPFVal}" min="0" oninput="recalcMultiSheetPreview()" style="width:100%; padding:4px; font-size:0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-primary);">
                        </div>
                        <div>
                            <label style="font-size:0.7rem; display:block; color:var(--text-muted);">PF Final</label>
                            <input type="number" id="rep-curr-pf-${m.id}" value="${repCurrPFVal}" min="0" oninput="recalcMultiSheetPreview()" style="width:100%; padding:4px; font-size:0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-primary);">
                        </div>
                    </div>
                `;
            } else if (isEcografo) {
                repInputsHtml = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <label style="font-size:0.7rem; display:block; color:var(--text-muted);">Contador Inicial</label>
                            <input type="number" id="rep-prev-${m.id}" value="${repPrevVal}" min="0" oninput="recalcMultiSheetPreview()" style="width:100%; padding:4px; font-size:0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-primary);">
                        </div>
                        <div>
                            <label style="font-size:0.7rem; display:block; color:var(--text-muted);">Contador Final</label>
                            <input type="number" id="rep-curr-${m.id}" value="${repCurrVal}" min="0" oninput="recalcMultiSheetPreview()" style="width:100%; padding:4px; font-size:0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-primary);">
                        </div>
                    </div>
                `;
            } else {
                repInputsHtml = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <label style="font-size:0.7rem; display:block; color:var(--text-muted);">Contador Inicial</label>
                            <input type="number" id="rep-prev-${m.id}" value="${repPrevVal}" min="0" oninput="recalcMultiSheetPreview()" style="width:100%; padding:4px; font-size:0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-primary);">
                        </div>
                        <div>
                            <label style="font-size:0.7rem; display:block; color:var(--text-muted);">Contador Final</label>
                            <input type="number" id="rep-curr-${m.id}" value="${repCurrVal}" min="0" oninput="recalcMultiSheetPreview()" style="width:100%; padding:4px; font-size:0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-primary);">
                        </div>
                        <div>
                            <label style="font-size:0.7rem; display:block; color:var(--text-muted);">Imp. Inicial</label>
                            <input type="number" id="rep-prev-impresiones-${m.id}" value="${repPrevImpVal}" min="0" oninput="recalcMultiSheetPreview()" style="width:100%; padding:4px; font-size:0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-primary);">
                        </div>
                        <div>
                            <label style="font-size:0.7rem; display:block; color:var(--text-muted);">Imp. Final</label>
                            <input type="number" id="rep-curr-impresiones-${m.id}" value="${repCurrImpVal}" min="0" oninput="recalcMultiSheetPreview()" style="width:100%; padding:4px; font-size:0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-primary);">
                        </div>
                        <div>
                            <label style="font-size:0.7rem; display:block; color:var(--text-muted);">Copias Inicial</label>
                            <input type="number" id="rep-prev-copias-${m.id}" value="${repPrevCopVal}" min="0" oninput="recalcMultiSheetPreview()" style="width:100%; padding:4px; font-size:0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-primary);">
                        </div>
                        <div>
                            <label style="font-size:0.7rem; display:block; color:var(--text-muted);">Copias Final</label>
                            <input type="number" id="rep-curr-copias-${m.id}" value="${repCurrCopVal}" min="0" oninput="recalcMultiSheetPreview()" style="width:100%; padding:4px; font-size:0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-primary);">
                        </div>
                    </div>
                `;
            }

            trRep.innerHTML = `
                <td colspan="4" style="padding: 10px 15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 20px;">
                        <div style="border-right: 1px solid var(--border-color); padding-right: 15px;">
                            <h5 style="margin-bottom:8px; color:var(--text-muted); font-size:0.75rem; font-weight:700; text-transform:uppercase;">Equipo Reemplazado (Anterior)</h5>
                            <div style="font-size:0.8rem; margin-bottom:5px; color: var(--text-secondary);"><strong>Modelo:</strong> ${m.name}</div>
                            <div style="font-size:0.8rem; margin-bottom:10px; color: var(--text-secondary);"><strong>S/N:</strong> ${m.serialNumber || 'Sin serie'}</div>
                            <div style="font-size:0.75rem; color:var(--text-muted); line-height: 1.3;">Las lecturas del equipo anterior se ingresan en los campos principales de arriba.</div>
                        </div>
                        <div>
                            <h5 style="margin-bottom:8px; color:var(--color-cyan); font-size:0.75rem; font-weight:700; text-transform:uppercase;">Equipo Reemplazante (Nuevo)</h5>
                            
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom:10px;">
                                <div>
                                    <label style="font-size:0.7rem; display:block; color:var(--text-muted);">Modelo Nuevo</label>
                                    <input type="text" id="rep-model-${m.id}" value="${repModelVal}" placeholder="Ej: Ricoh 3710 dn" style="width:100%; padding:4px; font-size:0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-primary);">
                                </div>
                                <div>
                                    <label style="font-size:0.7rem; display:block; color:var(--text-muted);">S/N Nuevo</label>
                                    <input type="text" id="rep-serial-${m.id}" value="${repSerialVal}" placeholder="Ej: SN-12345" style="width:100%; padding:4px; font-size:0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-primary);">
                                </div>
                            </div>
                            
                            <div style="font-size:0.7rem; font-weight:700; margin-bottom:5px; text-transform: uppercase; color:var(--text-muted);">Lecturas del Nuevo Equipo:</div>
                            
                            ${repInputsHtml}
                        </div>
                    </div>
                </td>
            `;
            tbody.appendChild(trRep);
        }
    });


    document.getElementById("multi-machine-entry-container").classList.remove("hidden");
    document.getElementById("multi-machine-placeholder").classList.add("hidden");
    recalcMultiSheetPreview();
}

/**
 * Muestra/oculta la fila de reemplazo del equipo
 */
window.toggleReplacementRow = function(machineId) {
    const chk = document.getElementById(`has-replacement-${machineId}`);
    const row = document.getElementById(`rep-row-${machineId}`);
    if (chk && row) {
        if (chk.checked) {
            row.classList.remove("hidden");
        } else {
            row.classList.add("hidden");
        }
    }
    recalcMultiSheetPreview();
};

/**
 * Calcula y muestra el subtotal dinámico de la planilla rápida en el Dashboard
 */
window.recalcMultiSheetPreview = function() {
    const clientId = document.getElementById("entry-client").value;
    const clientObj = AppState.clients.find(c => c.id === clientId);
    if (!clientObj) return;

    let grandTotal = 0;
    let hasPending = false;

    clientObj.machines.forEach(m => {
        let isColor = getMachineType(m.name) === "color";
        let isEcografo = false;
        let isOther = false;
        if (!m.isFixed && m.planId) {
            const plan = AppState.plans.find(p => p.id === m.planId);
            if (plan && plan.components) {
                const comp = plan.components.find(c => c.id === m.planComponentId);
                if (comp) {
                    if (comp.type === "ecografo") isEcografo = true;
                    if (comp.type === "other") isOther = true;
                }
            }
        }

        if (m.isFixed || isOther) {
            let abono = 0;
            if (m.isFixed) {
                abono = m.customCost || 0;
            } else {
                abono = resolveOtherRates(m).cost;
            }
            grandTotal += abono;
        } else {
            const hasRep = document.getElementById(`has-replacement-${m.id}`)?.checked || false;
            let isMachinePending = false;

            if (isColor) {
                const rates = resolveColorRates(m);
                const planCost = rates.ppCost + rates.pfCost;

                const prevPPVal = document.getElementById(`prev-pp-${m.id}`)?.value.trim() || "";
                const currPPVal = document.getElementById(`curr-pp-${m.id}`)?.value.trim() || "";
                const prevPFVal = document.getElementById(`prev-pf-${m.id}`)?.value.trim() || "";
                const currPFVal = document.getElementById(`curr-pf-${m.id}`)?.value.trim() || "";

                if (prevPPVal === "" || currPPVal === "" || prevPFVal === "" || currPFVal === "") {
                    isMachinePending = true;
                }

                if (hasRep) {
                    const repPrevPPVal = document.getElementById(`rep-prev-pp-${m.id}`)?.value.trim() || "";
                    const repCurrPPVal = document.getElementById(`rep-curr-pp-${m.id}`)?.value.trim() || "";
                    const repPrevPFVal = document.getElementById(`rep-prev-pf-${m.id}`)?.value.trim() || "";
                    const repCurrPFVal = document.getElementById(`rep-curr-pf-${m.id}`)?.value.trim() || "";

                    if (repPrevPPVal === "" || repCurrPPVal === "" || repPrevPFVal === "" || repCurrPFVal === "") {
                        isMachinePending = true;
                    }
                }

                if (isMachinePending) {
                    hasPending = true;
                    document.getElementById(`total-preview-${m.id}`).innerText = "Pendiente";
                    grandTotal += planCost;
                } else {
                    const prevPP = parseInt(prevPPVal) || 0;
                    const currPP = parseInt(currPPVal) || 0;
                    const prevPF = parseInt(prevPFVal) || 0;
                    const currPF = parseInt(currPFVal) || 0;

                    let consPP = Math.max(0, currPP - prevPP);
                    let consPF = Math.max(0, currPF - prevPF);

                    if (hasRep) {
                        const repPrevPP = parseInt(document.getElementById(`rep-prev-pp-${m.id}`).value) || 0;
                        const repCurrPP = parseInt(document.getElementById(`rep-curr-pp-${m.id}`).value) || 0;
                        const repPrevPF = parseInt(document.getElementById(`rep-prev-pf-${m.id}`).value) || 0;
                        const repCurrPF = parseInt(document.getElementById(`rep-curr-pf-${m.id}`).value) || 0;

                        consPP += Math.max(0, repCurrPP - repPrevPP);
                        consPF += Math.max(0, repCurrPF - repPrevPF);
                    }

                    const total = planCost + (consPP * rates.ppPrice) + (consPF * rates.pfPrice);
                    grandTotal += total;
                    document.getElementById(`total-preview-${m.id}`).innerText = PDFGenerator.formatCurrency(total);
                }
            } else if (isEcografo) {
                const rates = resolveEcografoRates(m);
                const prevVal = document.getElementById(`prev-${m.id}`)?.value.trim() || "";
                const currVal = document.getElementById(`curr-${m.id}`)?.value.trim() || "";

                if (prevVal === "" || currVal === "") {
                    isMachinePending = true;
                }

                if (hasRep) {
                    const repPrevVal = document.getElementById(`rep-prev-${m.id}`)?.value.trim() || "";
                    const repCurrVal = document.getElementById(`rep-curr-${m.id}`)?.value.trim() || "";

                    if (repPrevVal === "" || repCurrVal === "") {
                        isMachinePending = true;
                    }
                }

                if (isMachinePending) {
                    hasPending = true;
                    document.getElementById(`total-preview-${m.id}`).innerText = "Pendiente";
                    grandTotal += rates.cost;
                } else {
                    const prev = parseInt(prevVal) || 0;
                    const curr = parseInt(currVal) || 0;

                    let consumption = Math.max(0, curr - prev);
                    if (hasRep) {
                        const repPrev = parseInt(document.getElementById(`rep-prev-${m.id}`).value) || 0;
                        const repCurr = parseInt(document.getElementById(`rep-curr-${m.id}`).value) || 0;
                        consumption += Math.max(0, repCurr - repPrev);
                    }

                    const total = rates.cost + (consumption * rates.pagePrice);
                    grandTotal += total;
                    document.getElementById(`total-preview-${m.id}`).innerText = PDFGenerator.formatCurrency(total);
                }
            } else {
                // Laser / BN
                const rates = resolveBNRates(m);
                const prevVal = document.getElementById(`prev-${m.id}`)?.value.trim() || "";
                const currVal = document.getElementById(`curr-${m.id}`)?.value.trim() || "";

                if (prevVal === "" || currVal === "") {
                    isMachinePending = true;
                }

                if (hasRep) {
                    const repPrevVal = document.getElementById(`rep-prev-${m.id}`)?.value.trim() || "";
                    const repCurrVal = document.getElementById(`rep-curr-${m.id}`)?.value.trim() || "";

                    if (repPrevVal === "" || repCurrVal === "") {
                        isMachinePending = true;
                    }
                }

                if (isMachinePending) {
                    hasPending = true;
                    document.getElementById(`total-preview-${m.id}`).innerText = "Pendiente";
                    grandTotal += rates.cost;
                } else {
                    const prev = parseInt(prevVal) || 0;
                    const curr = parseInt(currVal) || 0;

                    const consumption = Math.max(0, curr - prev);
                    let total = 0;

                    if (rates.copies === 0) {
                        let totalCons = consumption;
                        if (hasRep) {
                            const repPrev = parseInt(document.getElementById(`rep-prev-${m.id}`).value) || 0;
                            const repCurr = parseInt(document.getElementById(`rep-curr-${m.id}`).value) || 0;
                            totalCons += Math.max(0, repCurr - repPrev);
                        }
                        total = rates.cost + (totalCons * rates.excessPrice);
                    } else {
                        let excess = 0;
                        if (hasRep) {
                            const repPrev = parseInt(document.getElementById(`rep-prev-${m.id}`).value) || 0;
                            const repCurr = parseInt(document.getElementById(`rep-curr-${m.id}`).value) || 0;
                            const repConsumption = Math.max(0, repCurr - repPrev);

                            const excessAnt = Math.max(0, consumption - rates.copies);
                            const remainingPlan = Math.max(0, rates.copies - consumption);
                            const excessNvo = Math.max(0, repConsumption - remainingPlan);

                            excess = excessAnt + excessNvo;
                        } else {
                            excess = Math.max(0, consumption - rates.copies);
                        }
                        total = rates.cost + (excess * rates.excessPrice);
                    }

                    grandTotal += total;
                    document.getElementById(`total-preview-${m.id}`).innerText = PDFGenerator.formatCurrency(total);
                }
            }
        }
    });

    document.getElementById("multi-preview-total-cost").innerText = hasPending ? 
        `${PDFGenerator.formatCurrency(grandTotal)} (Incompleto)` : 
        PDFGenerator.formatCurrency(grandTotal);
};

/**
 * Recalcula las lecturas de los clientes ante un cambio en tarifas
 */
function recalculateAllReadings() {
    AppState.readings.forEach(r => {
        const clientObj = AppState.clients.find(c => c.id === r.clientId);
        if (!clientObj) return;

        let totalAbono = 0;
        let totalExcessCost = 0;
        let totalGeneral = 0;

        r.machineReadings.forEach(mr => {
            const m = clientObj.machines.find(mac => mac.id === mr.machineId);
            if (!m) return;

            let isColor = getMachineType(m.name) === "color";
            let isEcografo = false;
            let isOther = false;
            if (!m.isFixed && m.planId) {
                const plan = AppState.plans.find(p => p.id === m.planId);
                if (plan && plan.components) {
                    const comp = plan.components.find(c => c.id === m.planComponentId);
                    if (comp) {
                        if (comp.type === "ecografo") isEcografo = true;
                        if (comp.type === "other") isOther = true;
                    }
                }
            }

            if (m.isFixed || isOther) {
                if (m.isFixed) {
                    mr.planCost = m.customCost || 0;
                } else {
                    mr.planCost = resolveOtherRates(m).cost;
                }
                mr.totalCost = mr.planCost;
                mr.excessCost = 0;
                totalAbono += mr.planCost;
                totalGeneral += mr.totalCost;
            } else {
                let planCopies = 0;
                let planCost = 0;
                let excessPrice = 0;

                if (isColor) {
                    const rates = resolveColorRates(m);
                    planCost = rates.ppCost + rates.pfCost;
                } else if (isEcografo) {
                    const rates = resolveEcografoRates(m);
                    planCost = rates.cost;
                    excessPrice = rates.pagePrice;
                } else {
                    const rates = resolveBNRates(m);
                    planCost = rates.cost;
                    planCopies = rates.copies;
                    excessPrice = rates.excessPrice;
                }

                mr.planCopies = planCopies;
                mr.planCost = planCost;
                mr.excessPrice = excessPrice;

                const hasRep = mr.hasReplacement || false;

                if (mr.isPending) {
                    mr.consumption = 0;
                    mr.excess = 0;
                    mr.excessCost = 0;
                    mr.totalCost = mr.planCost;
                } else {
                    mr.consumption = Math.max(0, mr.currCounter - mr.prevCounter);
                    if (hasRep) {
                        mr.repConsumption = Math.max(0, mr.repCurrCounter - mr.repPrevCounter);
                    } else {
                        mr.repConsumption = 0;
                    }

                    if (isColor) {
                        const rates = resolveColorRates(m);
                        let consPP = Math.max(0, (mr.currPP || 0) - (mr.prevPP || 0));
                        let consPF = Math.max(0, (mr.currPF || 0) - (mr.prevPF || 0));

                        if (hasRep) {
                            consPP += Math.max(0, (mr.repCurrPP || 0) - (mr.repPrevPP || 0));
                            consPF += Math.max(0, (mr.repCurrPF || 0) - (mr.repPrevPF || 0));
                        }

                        mr.excessCost = (consPP * rates.ppPrice) + (consPF * rates.pfPrice);
                        mr.excess = mr.consumption + mr.repConsumption;
                        mr.totalCost = mr.planCost + mr.excessCost;
                    } else if (isEcografo) {
                        const rates = resolveEcografoRates(m);
                        const totalCons = mr.consumption + mr.repConsumption;
                        mr.excess = totalCons;
                        mr.excessCost = totalCons * rates.pagePrice;
                        mr.totalCost = mr.planCost + mr.excessCost;
                    } else {
                        // Laser / BN
                        const rates = resolveBNRates(m);
                        if (rates.copies === 0) {
                            let totalCons = mr.consumption;
                            if (hasRep) {
                                totalCons += mr.repConsumption;
                            }
                            mr.excess = totalCons;
                            mr.excessCost = totalCons * rates.excessPrice;
                            mr.totalCost = mr.planCost + mr.excessCost;
                        } else {
                            if (hasRep) {
                                const excessAnt = Math.max(0, mr.consumption - rates.copies);
                                const remainingPlan = Math.max(0, rates.copies - mr.consumption);
                                const excessNvo = Math.max(0, mr.repConsumption - remainingPlan);

                                mr.excess = excessAnt + excessNvo;
                            } else {
                                mr.excess = Math.max(0, mr.consumption - rates.copies);
                            }
                            mr.excessCost = mr.excess * rates.excessPrice;
                            mr.totalCost = mr.planCost + mr.excessCost;
                        }
                    }
                }

                totalAbono += mr.planCost;
                totalExcessCost += mr.excessCost;
                totalGeneral += mr.totalCost;
            }
        });

        r.totalAbono = totalAbono;
        r.totalExcessCost = totalExcessCost;
        r.totalGeneral = totalGeneral;
    });
    saveReadingsToStorage();
}

/**
 * Obtiene sumatoria estadística
 */
function getPeriodStats() {
    let totalMachines = 0;
    let totalExcess = 0;
    let totalPlanCost = 0;
    let totalExcessCost = 0;
    let totalBilling = 0;

    const readings = getFilteredReadings();

    readings.forEach(r => {
        totalMachines += r.machineReadings.length;
        totalPlanCost += r.totalAbono;
        totalExcessCost += r.totalExcessCost;
        totalBilling += r.totalGeneral;
        
        r.machineReadings.forEach(mr => {
            if (!mr.isPending) {
                totalExcess += mr.excess;
            }
        });
    });

    return {
        totalClients: readings.length,
        totalMachines,
        totalExcess,
        totalPlanCost,
        totalExcessCost,
        totalBilling
    };
}

// --- RENDERIZADO DE INTERFAZ Y COMPONENTES ---

function renderAll() {
    populateClientSelects();
    populatePlanSelects();
    renderReadingsTable();
    renderClientsTable();
    renderConfigPlansTable();
    updateStats();
    updateBillingChart();
}

function populateClientSelects() {
    const select = document.getElementById("entry-client");
    select.innerHTML = '<option value="" disabled selected>Seleccione un cliente...</option>';
    const sorted = [...AppState.clients].sort((a,b) => a.name.localeCompare(b.name));
    sorted.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
}

function populatePlanSelects() {
    const selects = [document.getElementById("client-plan"), document.getElementById("machine-plan")];
    selects.forEach(s => {
        if (!s) return;
        s.innerHTML = '<option value="" disabled selected>Seleccione un plan...</option>';
        AppState.plans.forEach(p => {
            const copiesText = p.copies === 0 ? "sin copias incl." : `incluye ${PDFGenerator.formatNumber(p.copies)} copias`;
            s.innerHTML += `<option value="${p.id}">${p.name} (${copiesText})</option>`;
        });
    });
}

/**
 * Renderiza la lista de consumos del Dashboard
 */
/**
 * Obtiene las lecturas filtradas por el mes y año de trabajo activo
 */
function monthNameToNumber(monthName) {
    const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    return months.indexOf(monthName.toLowerCase());
}

function isReadingIn12MonthsWindow(reading, refYear, refMonth) {
    const rYear = parseInt(reading.periodYear);
    const rMonth = monthNameToNumber(reading.periodMonth);
    if (rMonth === -1 || isNaN(rYear)) return false;
    const diff = (refYear - rYear) * 12 + (refMonth - rMonth);
    return diff >= 0 && diff < 12;
}

function getFilteredReadings() {
    const reportMonthEl = document.getElementById("report-period-month");
    const reportYearEl = document.getElementById("report-period-year");
    if (!reportMonthEl || !reportYearEl) return AppState.readings;

    const month = reportMonthEl.value;
    const year = parseInt(reportYearEl.value) || 2026;

    return AppState.readings.filter(r => 
        r.periodMonth.toLowerCase() === month.toLowerCase() && 
        parseInt(r.periodYear) === year
    );
}

function renderReadingsTable() {
    const tbody = document.getElementById("table-readings-body");
    tbody.innerHTML = "";

    const reportMonthEl = document.getElementById("report-period-month");
    const reportYearEl = document.getElementById("report-period-year");
    if (!reportMonthEl || !reportYearEl) return;

    const refMonthName = reportMonthEl.value;
    const refYear = parseInt(reportYearEl.value) || 2026;
    const refMonth = monthNameToNumber(refMonthName);

    // Filtrar lecturas en la ventana de 12 meses (inclusive, hacia atrás)
    const visibleReadings = AppState.readings.filter(r => isReadingIn12MonthsWindow(r, refYear, refMonth));

    // Agrupar lecturas por cliente
    const readingsByClient = {};
    visibleReadings.forEach(r => {
        if (!readingsByClient[r.clientId]) {
            readingsByClient[r.clientId] = [];
        }
        readingsByClient[r.clientId].push(r);
    });

    const clientsWithReadings = AppState.clients.filter(c => readingsByClient[c.id] && readingsByClient[c.id].length > 0);

    if (clientsWithReadings.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state-row">
                <td colspan="3">
                    <div class="empty-state">
                        <i class="fa-solid fa-folder-open"></i>
                        <p>No hay resúmenes de consumo cargados en los últimos 12 meses.</p>
                        <p class="sub-text">Carga contadores desde "Cargar Datos" o registra en el formulario rápido.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const sortedClients = [...clientsWithReadings].sort((a, b) => a.name.localeCompare(b.name));

    sortedClients.forEach(c => {
        const clientReadings = readingsByClient[c.id];
        
        // Ordenar lecturas por fecha descendente (más recientes primero)
        const sortedReadings = [...clientReadings].sort((a, b) => {
            const diffYear = parseInt(b.periodYear) - parseInt(a.periodYear);
            if (diffYear !== 0) return diffYear;
            return monthNameToNumber(b.periodMonth) - monthNameToNumber(a.periodMonth);
        });

        // Fila principal del cliente
        const clientTr = document.createElement("tr");
        clientTr.className = "client-group-row";
        clientTr.style.cursor = "pointer";
        clientTr.style.backgroundColor = "rgba(51, 65, 85, 0.15)";
        clientTr.innerHTML = `
            <td style="font-weight: 600; padding: 12px 15px;" onclick="toggleClientExpand('${c.id}')">
                <i id="icon-client-${c.id}" class="fa-solid fa-chevron-right" style="margin-right: 10px; color: var(--text-muted); transition: transform 0.2s; display: inline-block;"></i>
                ${c.name}
            </td>
            <td style="padding: 12px 15px;" onclick="toggleClientExpand('${c.id}')">
                <span class="badge badge-info" style="font-size:0.75rem; padding: 3px 6px;">${c.machines.length} equipos</span>
            </td>
            <td style="padding: 12px 15px;" onclick="toggleClientExpand('${c.id}')">
                <span class="badge badge-secondary" style="font-size:0.75rem; padding: 3px 6px;">${clientReadings.length} resúmenes</span>
            </td>
        `;
        tbody.appendChild(clientTr);

        // Fila colapsable de períodos
        const periodsTr = document.createElement("tr");
        periodsTr.id = `periods-row-${c.id}`;
        periodsTr.className = "periods-row hidden";
        
        let periodsHtml = `
            <td colspan="3" style="padding: 10px 15px 15px 30px; background-color: rgba(15, 23, 42, 0.15);">
                <div style="border-left: 2px solid var(--color-cyan); padding-left: 15px; margin: 5px 0;">
                    <table class="periods-table">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.75rem;">
                                <th style="text-align: left; padding: 8px 10px;">Período</th>
                                <th style="text-align: right; padding: 8px 10px;">Consumo Total</th>
                                <th style="text-align: right; padding: 8px 10px;">Monto Abono</th>
                                <th style="text-align: right; padding: 8px 10px;">Monto Excedente</th>
                                <th style="text-align: right; padding: 8px 10px;">Total Factura</th>
                                <th style="text-align: left; padding: 8px 10px;">Fecha Carga</th>
                                <th style="text-align: left; padding: 8px 10px;">Operador</th>
                                <th style="text-align: right; padding: 8px 10px; width: 140px;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        sortedReadings.forEach(r => {
            // Calcular consumo
            let sumCons = 0;
            let anyPending = false;
            r.machineReadings.forEach(mr => {
                if (!mr.isFixed) {
                    if (mr.isPending) {
                        anyPending = true;
                    } else {
                        sumCons += mr.consumption;
                    }
                }
            });

            const pteBadge = ' <span class="badge badge-warning" style="font-size:0.65rem; padding:1px 4px; border-radius:3px;">Pte</span>';
            const consCell = anyPending ? `<span class="text-danger" style="font-weight:600;">Pendiente</span>` : (PDFGenerator.formatNumber(sumCons) + (anyPending ? pteBadge : ''));
            const totalCell = PDFGenerator.formatCurrency(r.totalGeneral) + (anyPending ? pteBadge : '');

            // Fila de período
            periodsHtml += `
                <tr class="period-item-row" onclick="togglePeriodExpand('${r.id}')" style="cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 10px; font-weight: 600; color: var(--text-primary);">
                        <i id="icon-period-${r.id}" class="fa-solid fa-chevron-right" style="margin-right: 8px; color: var(--text-muted); transition: transform 0.2s; display: inline-block;"></i>
                        ${r.periodMonth} ${r.periodYear}
                    </td>
                    <td style="text-align: right; padding: 10px;">${consCell}</td>
                    <td style="text-align: right; padding: 10px;">${PDFGenerator.formatCurrency(r.totalAbono)}</td>
                    <td style="text-align: right; padding: 10px;">${PDFGenerator.formatCurrency(r.totalExcessCost)}</td>
                    <td style="text-align: right; padding: 10px; font-weight: 700; color: var(--color-success);">${totalCell}</td>
                    <td style="padding: 10px; color: var(--text-muted); font-size: 0.8rem;">${r.uploadDate || '-'}</td>
                    <td style="padding: 10px; color: var(--text-muted); font-size: 0.8rem;">${r.user || '-'}</td>
                    <td style="text-align: right; padding: 10px;" onclick="event.stopPropagation();">
                        <div class="action-buttons" style="justify-content: flex-end;">
                            <button class="btn-icon btn-pdf" title="Descargar PDF" onclick="downloadClientPDF('${r.id}')">
                                <i class="fa-solid fa-file-pdf"></i>
                            </button>
                            <button class="btn-icon btn-wsp" title="Enviar WhatsApp" onclick="shareWhatsApp('${r.id}')">
                                <i class="fa-brands fa-whatsapp"></i>
                            </button>
                            <button class="btn-icon btn-delete" title="Borrar Registro" onclick="deleteReading('${r.id}')">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;

            // Fila colapsable de detalles por equipo del período
            let detailsHtml = `
                <tr id="details-period-${r.id}" class="period-details-row hidden">
                    <td colspan="8" style="padding: 12px 15px 12px 25px; background-color: rgba(0,0,0,0.15);">
                        <div class="details-container" style="border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; background: rgba(15,23,42,0.6);">
                            <h4 style="margin-bottom: 12px; color: var(--color-cyan); font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">
                                Detalle por Equipo - ${r.clientName} (${r.periodMonth} ${r.periodYear})
                            </h4>
                            <table class="details-table" style="width: 100%;">
                                <thead>
                                    <tr>
                                        <th style="text-align: left; padding: 6px 10px;">Máquina / Equipo</th>
                                        <th style="text-align: right; padding: 6px 10px;">Mes Anterior</th>
                                        <th style="text-align: right; padding: 6px 10px;">Mes Actual</th>
                                        <th style="text-align: right; padding: 6px 10px;">Consumo</th>
                                        <th style="text-align: right; padding: 6px 10px;">Excedente</th>
                                        <th style="text-align: right; padding: 6px 10px;">Monto Abono</th>
                                        <th style="text-align: right; padding: 6px 10px;">Monto Excedente</th>
                                        <th style="text-align: right; padding: 6px 10px;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;

            let totalCopPrev = 0, totalCopCurr = 0, totalCopCons = 0;
            let totalImpPrev = 0, totalImpCurr = 0, totalImpCons = 0;
            let totalPPPrev = 0, totalPPCurr = 0, totalPPCons = 0;
            let totalPFPrev = 0, totalPFCurr = 0, totalPFCons = 0;
            let hasSub = false;
            let firstLaserExcessPrice = AppState.config.defaultExcessPrice || 90;
            let foundLaserPrice = false;

            r.machineReadings.forEach(mr => {
                const type = getMachineType(mr.name);
                const hasRep = mr.hasReplacement || false;

                if (mr.isFixed) {
                    detailsHtml += `
                        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                            <td style="text-align: left; padding: 8px 10px; font-weight: 600; color: var(--text-primary);">${mr.name} <span class="badge badge-secondary" style="font-size:0.65rem; padding: 1px 4px; border-radius:3px; background-color: rgba(255,255,255,0.1); margin-left: 5px;">Abono Fijo</span></td>
                            <td style="text-align: right; padding: 8px 10px;">-</td>
                            <td style="text-align: right; padding: 8px 10px;">-</td>
                            <td style="text-align: right; padding: 8px 10px;">-</td>
                            <td style="text-align: right; padding: 8px 10px;">-</td>
                            <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatCurrency(mr.planCost)}</td>
                            <td style="text-align: right; padding: 8px 10px;">-</td>
                            <td style="text-align: right; padding: 8px 10px; font-weight: 600; color: var(--color-success);">${PDFGenerator.formatCurrency(mr.totalCost)}</td>
                        </tr>
                    `;
                } else if (mr.isPending) {
                    detailsHtml += `
                        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                            <td style="text-align: left; padding: 8px 10px; font-weight: 600; color: var(--text-primary);">${mr.name} ${mr.serialNumber ? `<span style="font-size:0.75rem; color:var(--text-muted);">(${mr.serialNumber})</span>` : ''} <span class="badge badge-danger" style="font-size:0.65rem; padding: 1px 4px; border-radius:3px; background-color: rgba(220,38,38,0.2); color: #ef4444; margin-left: 5px;">Pendiente</span></td>
                            <td style="text-align: right; padding: 8px 10px; color: #ef4444; font-weight:600;">Pendiente</td>
                            <td style="text-align: right; padding: 8px 10px; color: #ef4444; font-weight:600;">Pendiente</td>
                            <td style="text-align: right; padding: 8px 10px; color: #ef4444; font-weight:600;">Pendiente</td>
                            <td style="text-align: right; padding: 8px 10px; color: #ef4444; font-weight:600;">Pendiente</td>
                            <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatCurrency(mr.planCost)}</td>
                            <td style="text-align: right; padding: 8px 10px; color: #ef4444; font-weight:600;">Pendiente</td>
                            <td style="text-align: right; padding: 8px 10px; font-weight: 600; color: var(--color-warning);">${PDFGenerator.formatCurrency(mr.totalCost)} (Abono)</td>
                        </tr>
                    `;
                } else {
                    if (type === "color") {
                        hasSub = true;
                        let ppPrice = AppState.config.defaultPPPrice !== undefined ? AppState.config.defaultPPPrice : 300;
                        let pfPrice = AppState.config.defaultPFPrice !== undefined ? AppState.config.defaultPFPrice : 600;
                        let ppCost = mr.planCost || 0;
                        let pfCost = 0;

                        const m = c.machines.find(mac => mac.id === mr.machineId);
                        if (m) {
                            const rates = window.resolveColorRates(m);
                            ppPrice = rates.ppPrice;
                            pfPrice = rates.pfPrice;
                            ppCost = rates.ppCost;
                            pfCost = rates.pfCost;
                        }

                        const consPP_ant = Math.max(0, (mr.currPP || 0) - (mr.prevPP || 0));
                        const consPF_ant = Math.max(0, (mr.currPF || 0) - (mr.prevPF || 0));

                        const excessCostPP_ant = consPP_ant * ppPrice;
                        const excessCostPF_ant = consPF_ant * pfPrice;

                        const totalCostPP_ant = ppCost + excessCostPP_ant;
                        const totalCostPF_ant = pfCost + excessCostPF_ant;

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

                            const excessCostPP_nvo = consPP_nvo * ppPrice;
                            const excessCostPF_nvo = consPF_nvo * pfPrice;

                            totalPPPrev += repPrevPP;
                            totalPPCurr += repCurrPP;
                            totalPPCons += consPP_nvo;

                            totalPFPrev += repPrevPF;
                            totalPFCurr += repCurrPF;
                            totalPFCons += consPF_nvo;

                            const totalPP_ant = excessCostPP_ant;
                            const totalPF_ant = excessCostPF_ant;
                            const totalPP_nvo = ppCost + excessCostPP_nvo;
                            const totalPF_nvo = pfCost + excessCostPF_nvo;

                            // Fila Anterior (Color)
                            detailsHtml += `
                                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                                    <td style="text-align: left; padding: 8px 10px; font-weight: 600; color: var(--text-primary);">[Ant] ${mr.name} ${mr.serialNumber ? `<span style="font-size:0.75rem; color:var(--text-muted);">(${mr.serialNumber})</span>` : ''} <span style="font-size:0.7rem; background:rgba(255,255,255,0.05); padding: 1px 4px; border-radius: 3px; margin-left: 5px; color: var(--color-cyan);">TEXTO COLOR</span></td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(mr.prevPP || 0)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(mr.currPP || 0)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(consPP_ant)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(consPP_ant)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">$0</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatCurrency(excessCostPP_ant)}</td>
                                    <td style="text-align: right; padding: 8px 10px; font-weight: 600; color: var(--color-success);">${PDFGenerator.formatCurrency(totalPP_ant)}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                                    <td style="text-align: left; padding: 8px 10px; font-weight: 600; color: var(--text-primary);"><span style="margin-left: 20px;"></span> <span style="font-size:0.7rem; background:rgba(255,255,255,0.05); padding: 1px 4px; border-radius: 3px; color: var(--color-cyan);">FOTOGRAFIA</span></td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(mr.prevPF || 0)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(mr.currPF || 0)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(consPF_ant)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(consPF_ant)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">-</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatCurrency(excessCostPF_ant)}</td>
                                    <td style="text-align: right; padding: 8px 10px; font-weight: 600; color: var(--color-success);">${PDFGenerator.formatCurrency(totalPF_ant)}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); background-color: rgba(255,255,255,0.01);">
                                    <td style="text-align: left; padding: 8px 10px; font-weight: 600; color: var(--color-cyan); padding-left: 20px;"><i class="fa-solid fa-angle-right" style="margin-right:5px;"></i>[Nvo] ${mr.repModel} ${mr.repSerialNumber ? `<span style="font-size:0.75rem; color:var(--text-muted);">(${mr.repSerialNumber})</span>` : ''} <span style="font-size:0.7rem; background:rgba(255,255,255,0.05); padding: 1px 4px; border-radius: 3px; margin-left: 5px; color: var(--color-cyan);">TEXTO COLOR</span></td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(repPrevPP)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(repCurrPP)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(consPP_nvo)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(consPP_nvo)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatCurrency(ppCost)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatCurrency(excessCostPP_nvo)}</td>
                                    <td style="text-align: right; padding: 8px 10px; font-weight: 600; color: var(--color-success);">${PDFGenerator.formatCurrency(totalPP_nvo)}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); background-color: rgba(255,255,255,0.01);">
                                    <td style="text-align: left; padding: 8px 10px; font-weight: 600; color: var(--color-cyan); padding-left: 20px;"><span style="margin-left: 20px;"></span> <span style="font-size:0.7rem; background:rgba(255,255,255,0.05); padding: 1px 4px; border-radius: 3px; color: var(--color-cyan);">FOTOGRAFIA</span></td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(repPrevPF)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(repCurrPF)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(consPF_nvo)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(consPF_nvo)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${pfCost > 0 ? PDFGenerator.formatCurrency(pfCost) : '-'}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatCurrency(excessCostPF_nvo)}</td>
                                    <td style="text-align: right; padding: 8px 10px; font-weight: 600; color: var(--color-success);">${PDFGenerator.formatCurrency(totalPF_nvo)}</td>
                                </tr>
                            `;
                        } else {
                            // Fila Única (Color)
                            detailsHtml += `
                                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                                    <td style="text-align: left; padding: 8px 10px; font-weight: 600; color: var(--text-primary);">${mr.name} ${mr.serialNumber ? `<span style="font-size:0.75rem; color:var(--text-muted);">(${mr.serialNumber})</span>` : ''} <span style="font-size:0.7rem; background:rgba(255,255,255,0.05); padding: 1px 4px; border-radius: 3px; margin-left: 5px; color: var(--color-cyan);">TEXTO COLOR</span></td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(mr.prevPP || 0)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(mr.currPP || 0)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(consPP_ant)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(consPP_ant)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatCurrency(ppCost)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatCurrency(excessCostPP_ant)}</td>
                                    <td style="text-align: right; padding: 8px 10px; font-weight: 600; color: var(--color-success);">${PDFGenerator.formatCurrency(totalCostPP_ant)}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                                    <td style="text-align: left; padding: 8px 10px; font-weight: 600; color: var(--text-primary);"><span style="margin-left: 20px;"></span> <span style="font-size:0.7rem; background:rgba(255,255,255,0.05); padding: 1px 4px; border-radius: 3px; color: var(--color-cyan);">FOTOGRAFIA</span></td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(mr.prevPF || 0)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(mr.currPF || 0)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(consPF_ant)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(consPF_ant)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${pfCost > 0 ? PDFGenerator.formatCurrency(pfCost) : '-'}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatCurrency(excessCostPF_ant)}</td>
                                    <td style="text-align: right; padding: 8px 10px; font-weight: 600; color: var(--color-success);">${PDFGenerator.formatCurrency(totalCostPF_ant)}</td>
                                </tr>
                            `;
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
                            detailsHtml += `
                                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                                    <td style="text-align: left; padding: 8px 10px; font-weight: 600; color: var(--text-primary);">[Ant] ${mr.name} ${mr.serialNumber ? `<span style="font-size:0.75rem; color:var(--text-muted);">(${mr.serialNumber})</span>` : ''}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(mr.prevCounter)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(mr.currCounter)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(mr.consumption)}</td>
                                    <td style="text-align: right; padding: 8px 10px; font-weight: 600; color: ${excessAnt > 0 ? 'var(--color-warning)' : 'var(--text-secondary)'}">${PDFGenerator.formatNumber(excessAnt)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">$0</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatCurrency(excessCost_ant)}</td>
                                    <td style="text-align: right; padding: 8px 10px; font-weight: 600; color: var(--color-success);">${PDFGenerator.formatCurrency(excessCost_ant)}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); background-color: rgba(255,255,255,0.01);">
                                    <td style="text-align: left; padding: 8px 10px; font-weight: 600; color: var(--color-cyan); padding-left: 20px;"><i class="fa-solid fa-angle-right" style="margin-right:5px;"></i>[Nvo] ${mr.repModel} ${mr.repSerialNumber ? `<span style="font-size:0.75rem; color:var(--text-muted);">(${mr.repSerialNumber})</span>` : ''}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(repPrev)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(repCurr)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(repCons)}</td>
                                    <td style="text-align: right; padding: 8px 10px; font-weight: 600; color: ${excessNvo > 0 ? 'var(--color-warning)' : 'var(--text-secondary)'}">${PDFGenerator.formatNumber(excessNvo)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatCurrency(mr.planCost)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatCurrency(excessCost_nvo)}</td>
                                    <td style="text-align: right; padding: 8px 10px; font-weight: 600; color: var(--color-success);">${PDFGenerator.formatCurrency(mr.planCost + excessCost_nvo)}</td>
                                </tr>
                            `;
                        } else {
                            // Fila Única (Laser)
                            detailsHtml += `
                                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                                    <td style="text-align: left; padding: 8px 10px; font-weight: 600; color: var(--text-primary);">${mr.name} ${mr.serialNumber ? `<span style="font-size:0.75rem; color:var(--text-muted);">(${mr.serialNumber})</span>` : ''}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(mr.prevCounter)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(mr.currCounter)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatNumber(mr.consumption)}</td>
                                    <td style="text-align: right; padding: 8px 10px; font-weight: 600; color: ${mr.excess > 0 ? 'var(--color-warning)' : 'var(--text-secondary)'}">${PDFGenerator.formatNumber(mr.excess)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatCurrency(mr.planCost)}</td>
                                    <td style="text-align: right; padding: 8px 10px;">${PDFGenerator.formatCurrency(mr.excessCost)}</td>
                                    <td style="text-align: right; padding: 8px 10px; font-weight: 600; color: var(--color-success);">${PDFGenerator.formatCurrency(mr.totalCost)}</td>
                                </tr>
                            `;
                        }
                    }
                }
            });

            // Si hay subcontadores activos, append de la tabla consolidada de consumos
            if (hasSub) {
                const ppPrice = AppState.config.defaultPPPrice !== undefined ? AppState.config.defaultPPPrice : 300;
                const pfPrice = AppState.config.defaultPFPrice !== undefined ? AppState.config.defaultPFPrice : 600;

                let rowsHtml = "";
                if (totalCopCons > 0 || totalCopPrev > 0 || totalCopCurr > 0) {
                    rowsHtml += `
                        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                            <td style="text-align: left; padding: 6px 10px; font-weight:600;">Fotocopias (Copias)</td>
                            <td style="text-align: right; padding: 6px 10px;">${PDFGenerator.formatNumber(totalCopPrev)}</td>
                            <td style="text-align: right; padding: 6px 10px;">${PDFGenerator.formatNumber(totalCopCurr)}</td>
                            <td style="text-align: right; padding: 6px 10px; font-weight:600; color: var(--color-cyan);">${PDFGenerator.formatNumber(totalCopCons)}</td>
                            <td style="text-align: right; padding: 6px 10px;">${PDFGenerator.formatCurrency(firstLaserExcessPrice)}</td>
                            <td style="text-align: right; padding: 6px 10px; font-weight:600; color: var(--color-success);">${PDFGenerator.formatCurrency(totalCopCons * firstLaserExcessPrice)}</td>
                        </tr>
                    `;
                }
                if (totalImpCons > 0 || totalImpPrev > 0 || totalImpCurr > 0) {
                    rowsHtml += `
                        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                            <td style="text-align: left; padding: 6px 10px; font-weight:600;">Impresiones (Printouts)</td>
                            <td style="text-align: right; padding: 6px 10px;">${PDFGenerator.formatNumber(totalImpPrev)}</td>
                            <td style="text-align: right; padding: 6px 10px;">${PDFGenerator.formatNumber(totalImpCurr)}</td>
                            <td style="text-align: right; padding: 6px 10px; font-weight:600; color: var(--color-cyan);">${PDFGenerator.formatNumber(totalImpCons)}</td>
                            <td style="text-align: right; padding: 6px 10px;">${PDFGenerator.formatCurrency(firstLaserExcessPrice)}</td>
                            <td style="text-align: right; padding: 6px 10px; font-weight:600; color: var(--color-success);">${PDFGenerator.formatCurrency(totalImpCons * firstLaserExcessPrice)}</td>
                        </tr>
                    `;
                }
                if (totalPPCons > 0 || totalPPPrev > 0 || totalPPCurr > 0) {
                    rowsHtml += `
                        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                            <td style="text-align: left; padding: 6px 10px; font-weight:600;">Color (Papel Común PP)</td>
                            <td style="text-align: right; padding: 6px 10px;">${PDFGenerator.formatNumber(totalPPPrev)}</td>
                            <td style="text-align: right; padding: 6px 10px;">${PDFGenerator.formatNumber(totalPPCurr)}</td>
                            <td style="text-align: right; padding: 6px 10px; font-weight:600; color: var(--color-cyan);">${PDFGenerator.formatNumber(totalPPCons)}</td>
                            <td style="text-align: right; padding: 6px 10px;">${PDFGenerator.formatCurrency(ppPrice)}</td>
                            <td style="text-align: right; padding: 6px 10px; font-weight:600; color: var(--color-success);">${PDFGenerator.formatCurrency(totalPPCons * ppPrice)}</td>
                        </tr>
                    `;
                }
                if (totalPFCons > 0 || totalPFPrev > 0 || totalPFCurr > 0) {
                    rowsHtml += `
                        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                            <td style="text-align: left; padding: 6px 10px; font-weight:600;">Fotografía (Papel Fotográfico PF)</td>
                            <td style="text-align: right; padding: 6px 10px;">${PDFGenerator.formatNumber(totalPFPrev)}</td>
                            <td style="text-align: right; padding: 6px 10px;">${PDFGenerator.formatNumber(totalPFCurr)}</td>
                            <td style="text-align: right; padding: 6px 10px; font-weight:600; color: var(--color-cyan);">${PDFGenerator.formatNumber(totalPFCons)}</td>
                            <td style="text-align: right; padding: 6px 10px;">${PDFGenerator.formatCurrency(pfPrice)}</td>
                            <td style="text-align: right; padding: 6px 10px; font-weight:600; color: var(--color-success);">${PDFGenerator.formatCurrency(totalPFCons * pfPrice)}</td>
                        </tr>
                    `;
                }

                if (rowsHtml) {
                    detailsHtml += `
                                    </tbody>
                                </table>
                                
                                <div style="margin-top: 15px; border-top: 1px solid var(--border-color); padding-top: 12px;">
                                    <h5 style="margin-bottom: 8px; color: var(--color-cyan); font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">
                                        Resumen Consolidado de Sub-contadores
                                    </h5>
                                    <table class="details-table" style="width: 100%; font-size: 0.75rem;">
                                        <thead>
                                            <tr>
                                                <th style="text-align: left; padding: 4px 8px;">Concepto</th>
                                                <th style="text-align: right; padding: 4px 8px;">Anterior</th>
                                                <th style="text-align: right; padding: 4px 8px;">Actual</th>
                                                <th style="text-align: right; padding: 4px 8px;">Consumo</th>
                                                <th style="text-align: right; padding: 4px 8px;">Precio Unit.</th>
                                                <th style="text-align: right; padding: 4px 8px;">Total Venta</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${rowsHtml}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </td>
                    </tr>
                    `;
                } else {
                    detailsHtml += `
                                    </tbody>
                                </table>
                            </div>
                        </td>
                    </tr>
                    `;
                }
            } else {
                detailsHtml += `
                                </tbody>
                            </table>
                        </div>
                    </td>
                </tr>
                `;
            }

            periodsHtml += detailsHtml;
        });

        periodsHtml += `
                        </tbody>
                    </table>
                </div>
            </td>
        `;
        periodsTr.innerHTML = periodsHtml;
        tbody.appendChild(periodsTr);
    });
}

window.toggleClientExpand = function(clientId) {
    const periodRow = document.getElementById(`periods-row-${clientId}`);
    const icon = document.getElementById(`icon-client-${clientId}`);
    if (periodRow) {
        periodRow.classList.toggle("hidden");
        if (icon) {
            if (periodRow.classList.contains("hidden")) {
                icon.style.transform = "rotate(0deg)";
            } else {
                icon.style.transform = "rotate(90deg)";
            }
        }
    }
};

window.togglePeriodExpand = function(readingId) {
    const detailRow = document.getElementById(`details-period-${readingId}`);
    const icon = document.getElementById(`icon-period-${readingId}`);
    if (detailRow) {
        detailRow.classList.toggle("hidden");
        if (icon) {
            if (detailRow.classList.contains("hidden")) {
                icon.style.transform = "rotate(0deg)";
            } else {
                icon.style.transform = "rotate(90deg)";
            }
        }
    }
};

/**
 * Calcula el abono puro total de un cliente (abonos fijos y base de planes) sin excedentes
 */
function getClientBaseAbono(client) {
    let totalBase = 0;
    if (!client.machines) return totalBase;
    client.machines.forEach(m => {
        if (m.isFixed) {
            totalBase += m.customCost !== null ? m.customCost : 0;
        } else {
            if (m.customCost !== null) {
                totalBase += m.customCost;
            } else {
                const plan = AppState.plans.find(p => p.id === m.planId);
                if (plan) {
                    let cost = plan.cost;
                    if (m.planComponentId && plan.components) {
                        const comp = plan.components.find(c => c.id === m.planComponentId);
                        if (comp) {
                            cost = comp.cost;
                        }
                    }
                    totalBase += cost;
                }
            }
        }
    });
    return totalBase;
}

/**
 * Renderiza el listado de clientes
 */
function renderClientsTable() {
    const tbody = document.getElementById("table-clients-body");
    tbody.innerHTML = "";

    if (AppState.clients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-muted text-center" style="padding:2rem;">No hay clientes registrados. Registra uno a la derecha.</td></tr>`;
        return;
    }

    const sorted = [...AppState.clients].sort((a,b) => a.name.localeCompare(b.name));

    sorted.forEach(c => {
        const phoneFormatted = c.phone ? `+${c.phone}` : '<span class="text-muted" style="font-size:0.8rem;">Sin registrar</span>';
        const obsTrimmed = c.observations ? (c.observations.length > 50 ? c.observations.substring(0, 48) + "..." : c.observations) : "-";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="font-weight:600;">${c.name}</td>
            <td>${phoneFormatted}</td>
            <td>
                <span class="badge badge-info cursor-pointer" style="cursor:pointer;" onclick="toggleClientMachinesExpand('${c.id}')">
                    <i class="fa-solid fa-chevron-down" id="icon-client-expand-${c.id}" style="margin-right: 4px; transition: transform 0.2s;"></i>
                    ${c.machines.length} equipos
                </span>
            </td>
            <td style="font-size:0.85rem;" title="${c.observations || ''}">${obsTrimmed}</td>
            <td style="font-weight:600; text-align:right; font-family: monospace;">${PDFGenerator.formatCurrency(getClientBaseAbono(c))}</td>
            <td class="actions-col">
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" title="Editar Cliente" onclick="editClient('${c.id}')">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-icon btn-delete" title="Borrar Cliente" onclick="deleteClient('${c.id}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);

        // Fila colapsable de detalle de equipos
        const detailsTr = document.createElement("tr");
        detailsTr.id = `client-machines-${c.id}`;
        detailsTr.className = "details-row hidden";
        
        let machinesHtml = "";
        if (c.machines.length === 0) {
            machinesHtml = `<tr><td colspan="4" class="text-muted text-center" style="padding: 10px;">Este cliente no tiene equipos vinculados.</td></tr>`;
        } else {
            c.machines.forEach(m => {
                const labelFixed = m.isFixed ? `<span class="badge badge-secondary" style="font-size:0.65rem; background-color: rgba(255,255,255,0.1); margin-left: 5px;">Abono Fijo</span>` : '';
                let planDesc = "-";
                let costDesc = "-";
                let defaultExcess = AppState.config.defaultExcessPrice;
                if (!m.isFixed) {
                    const plan = AppState.plans.find(p => p.id === m.planId);
                    let compDesc = "";
                    if (plan && m.planComponentId) {
                        const comp = plan.components.find(c => c.id === m.planComponentId);
                        if (comp) {
                            if (comp.type === 'bn') {
                                compDesc = ` - ${comp.name} (${comp.copies} copias incl.)`;
                            } else {
                                compDesc = ` - ${comp.name}`;
                            }
                        }
                    }
                    planDesc = plan ? `${plan.name}${compDesc}` : "Plan no encontrado";
                    costDesc = m.customCost !== null ? `${PDFGenerator.formatCurrency(m.customCost)} (Pers.)` : (plan ? (m.planComponentId && plan.components.find(c => c.id === m.planComponentId) ? PDFGenerator.formatCurrency(plan.components.find(c => c.id === m.planComponentId).cost) : PDFGenerator.formatCurrency(plan.cost)) : "-");
                    if (plan && plan.excessPrice !== undefined && plan.excessPrice !== null) {
                        defaultExcess = plan.excessPrice;
                    }
                } else {
                    costDesc = m.customCost !== null ? PDFGenerator.formatCurrency(m.customCost) : "-";
                }
                const excessPriceCell = !m.isFixed ? (m.customExcessPrice !== null ? PDFGenerator.formatCurrency(m.customExcessPrice) : `Defecto ($${defaultExcess})`) : "-";

                machinesHtml += `
                    <tr>
                        <td style="padding: 6px; font-weight: 600;">${m.name}${labelFixed}</td>
                        <td style="padding: 6px; font-family: monospace;">${m.serialNumber || '<span class="text-muted">Sin SN</span>'}</td>
                        <td style="padding: 6px;">${planDesc}</td>
                        <td style="padding: 6px;">Abono: ${costDesc} | Excedente: ${excessPriceCell}</td>
                    </tr>
                `;
            });
        }

        detailsTr.innerHTML = `
            <td colspan="6" style="padding: 12px 20px;">
                <div class="details-container" style="background-color: rgba(30, 41, 59, 0.5); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px;">
                    <h4 style="margin-bottom: 12px; color: var(--color-cyan); font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing:0.5px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-print"></i> Equipos Vinculados - ${c.name}
                    </h4>
                    <table class="details-table" style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--border-color); text-align: left;">
                                <th style="padding: 6px; color: var(--text-secondary); font-weight: 600;">Nombre / Modelo</th>
                                <th style="padding: 6px; color: var(--text-secondary); font-weight: 600;">Número de Serie (SN)</th>
                                <th style="padding: 6px; color: var(--text-secondary); font-weight: 600;">Plan Contratado</th>
                                <th style="padding: 6px; color: var(--text-secondary); font-weight: 600;">Valores del Abono / Excedente</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${machinesHtml}
                        </tbody>
                    </table>
                </div>
            </td>
        `;
        tbody.appendChild(detailsTr);
    });
}

window.toggleClientMachinesExpand = function(clientId) {
    const detailRow = document.getElementById(`client-machines-${clientId}`);
    const icon = document.getElementById(`icon-client-expand-${clientId}`);
    if (detailRow) {
        detailRow.classList.toggle("hidden");
        if (icon) {
            if (detailRow.classList.contains("hidden")) {
                icon.style.transform = "rotate(0deg)";
            } else {
                icon.style.transform = "rotate(180deg)";
            }
        }
    }
};

function renderConfigPlansTable() {
    const tbody = document.getElementById("table-config-plans-body");
    tbody.innerHTML = "";
    const sorted = [...AppState.plans].sort((a,b) => a.copies - b.copies);
    sorted.forEach(p => {
        const tr = document.createElement("tr");
        
        let compsHtml = "";
        if (p.components && p.components.length > 0) {
            compsHtml = `<div class="plan-components-sublist" style="margin-top: 6px; padding-left: 10px; border-left: 2px solid var(--color-cyan); display: flex; flex-direction: column; gap: 4px;">`;
            p.components.forEach(c => {
                let details = "";
                let typeText = "";
                if (c.type === "bn") {
                    typeText = "B/N";
                    details = `Base: ${PDFGenerator.formatCurrency(c.cost)} | Copias: ${PDFGenerator.formatNumber(c.copies)} | Exc: ${PDFGenerator.formatCurrency(c.excessPrice)}`;
                } else if (c.type === "color_common") {
                    typeText = "Color Común";
                    details = `Base: ${PDFGenerator.formatCurrency(c.cost)} | Pág: ${PDFGenerator.formatCurrency(c.pagePrice)}`;
                } else if (c.type === "photo") {
                    typeText = "Fotografía";
                    details = `Base: ${PDFGenerator.formatCurrency(c.cost)} | Pág: ${PDFGenerator.formatCurrency(c.pagePrice)}`;
                } else if (c.type === "ecografo") {
                    typeText = "Ecógrafo";
                    details = `Base: ${PDFGenerator.formatCurrency(c.cost)} | Pág: ${PDFGenerator.formatCurrency(c.pagePrice)}`;
                } else if (c.type === "other") {
                    typeText = "Otros";
                    details = `Base: ${PDFGenerator.formatCurrency(c.cost)}`;
                }
                compsHtml += `
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">
                        <strong style="color: var(--color-cyan); font-weight: 600;">${c.name}</strong> 
                        <span style="font-size:0.7rem; background:rgba(255,255,255,0.05); padding: 1px 4px; border-radius: 3px; margin: 0 4px;">${typeText}</span> 
                        <span style="font-family: monospace; opacity: 0.85;">${details}</span>
                    </div>
                `;
            });
            compsHtml += `</div>`;
        } else {
            compsHtml = `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; padding-left: 10px;">Sin componentes</div>`;
        }

        tr.innerHTML = `
            <td>
                <div style="font-weight:600; font-size: 0.95rem;">${p.name}</div>
                ${compsHtml}
            </td>
            <td>${PDFGenerator.formatNumber(p.copies)}</td>
            <td>${PDFGenerator.formatCurrency(p.cost)}</td>
            <td>${PDFGenerator.formatCurrency(p.excessPrice !== undefined && p.excessPrice !== null ? p.excessPrice : AppState.config.defaultExcessPrice)}</td>
            <td class="actions-col">
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" title="Editar Plan" onclick="editPlan('${p.id}')">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-icon btn-delete" title="Eliminar Plan" onclick="deletePlan('${p.id}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderTempMachinesList() {
    const container = document.getElementById("temp-machines-list");
    container.innerHTML = "";

    if (AppState.tempClientMachines.length === 0) {
        container.innerHTML = `<p class="text-muted small text-center py-2">No hay equipos asignados a este cliente aún.</p>`;
        return;
    }

    AppState.tempClientMachines.forEach((m, idx) => {
        let planDesc = "Concepto Fijo";
        if (!m.isFixed) {
            const plan = AppState.plans.find(p => p.id === m.planId);
            let compName = "";
            if (plan && m.planComponentId) {
                const comp = plan.components.find(c => c.id === m.planComponentId);
                if (comp) compName = " - " + comp.name;
            }
            planDesc = plan ? (plan.name + compName) : "Plan personalizado";
        }

        const cost = m.customCost !== null ? m.customCost : (m.isFixed ? 0 : "Default");
        const details = m.isFixed ? `Monto: ${PDFGenerator.formatCurrency(cost)}` : `Plan: ${planDesc} | Abono: ${cost === "Default" ? "Default Plan" : PDFGenerator.formatCurrency(cost)}`;

        const isEditing = AppState.editingTempMachineIndex === idx;

        const item = document.createElement("div");
        item.className = "temp-machine-item" + (isEditing ? " editing" : "");

        if (isEditing) {
            item.innerHTML = `
                <div class="info" style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px;">
                    <span class="m-title" style="font-weight:600;">${m.name}</span>
                    <div style="display: flex; gap: 6px; align-items: center; margin-top: 4px; width: 100%;">
                        <span style="font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap;">Nº Serie:</span>
                        <input type="text" id="edit-sn-input-${idx}" value="${m.serialNumber || ''}" class="form-control" style="font-size: 0.8rem; padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); flex-grow: 1; min-width: 0;" placeholder="Ej: 5160z931098">
                    </div>
                    <span class="m-sub" style="margin-top: 2px; display: block;">${details}</span>
                </div>
                <div class="action-buttons" style="display: flex; gap: 6px; align-items: center; margin-left: 10px;">
                    <button type="button" class="btn-icon btn-save" title="Guardar Serie" onclick="saveTempMachineSN(${idx})" style="color: var(--color-success); background: none; border: none; cursor: pointer; font-size: 1.1rem;">
                        <i class="fa-solid fa-check"></i>
                    </button>
                    <button type="button" class="btn-icon btn-cancel" title="Cancelar" onclick="cancelTempMachineEdit()" style="color: var(--text-muted); background: none; border: none; cursor: pointer; font-size: 1.1rem;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;
        } else {
            item.innerHTML = `
                <div class="info" style="flex-grow: 1;">
                    <span class="m-title">${m.name} ${m.serialNumber ? `<span style="font-family: monospace; font-size: 0.8rem; color: var(--color-cyan); margin-left: 5px;">(SN: ${m.serialNumber})</span>` : '<span class="text-muted" style="font-size:0.75rem; margin-left: 5px;">(Sin Serie)</span>'}</span>
                    <span class="m-sub">${details}</span>
                </div>
                <div class="action-buttons" style="display: flex; gap: 6px; align-items: center; margin-left: 10px;">
                    <button type="button" class="btn-icon btn-edit" title="Editar Serie del Equipo" onclick="editTempMachineSN(${idx})" style="color: var(--color-cyan); background: none; border: none; cursor: pointer; font-size: 0.95rem;">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button type="button" class="btn-icon btn-delete" title="Desvincular Equipo" onclick="removeTempMachine(${idx})" style="color: var(--color-danger); background: none; border: none; cursor: pointer; font-size: 1.1rem;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;
        }
        container.appendChild(item);
    });
}

window.removeTempMachine = function(idx) {
    if (AppState.editingTempMachineIndex === idx) {
        AppState.editingTempMachineIndex = null;
    } else if (AppState.editingTempMachineIndex > idx) {
        AppState.editingTempMachineIndex--;
    }
    AppState.tempClientMachines.splice(idx, 1);
    renderTempMachinesList();
};

window.editTempMachineSN = function(idx) {
    AppState.editingTempMachineIndex = idx;
    renderTempMachinesList();
    setTimeout(() => {
        const input = document.getElementById(`edit-sn-input-${idx}`);
        if (input) {
            input.focus();
            input.select();
        }
    }, 50);
};

window.saveTempMachineSN = function(idx) {
    const input = document.getElementById(`edit-sn-input-${idx}`);
    if (input) {
        AppState.tempClientMachines[idx].serialNumber = input.value.trim();
    }
    AppState.editingTempMachineIndex = null;
    renderTempMachinesList();
};

window.cancelTempMachineEdit = function() {
    AppState.editingTempMachineIndex = null;
    renderTempMachinesList();
};

function updateStats() {
    const stats = getPeriodStats();
    document.getElementById("stat-total-clients").innerText = stats.totalClients;
    document.getElementById("stat-total-machines").innerHTML = `${stats.totalMachines} <span class="unit">máquinas</span>`;
    document.getElementById("stat-total-excess").innerHTML = `${PDFGenerator.formatNumber(stats.totalExcess)} <span class="unit">copias</span>`;
    
    const billingEl = document.getElementById("stat-total-billing");
    if (billingEl) {
        billingEl.innerText = PDFGenerator.formatCurrency(stats.totalBilling);
    }
}

function updateBillingChart() {
    const canvas = document.getElementById("billing-chart");
    if (!canvas) return;

    const readings = getFilteredReadings();

    if (readings.length === 0) {
        if (AppState.billingChart) {
            AppState.billingChart.destroy();
            AppState.billingChart = null;
        }
        return;
    }

    const labels = [];
    const planCosts = [];
    const excessCosts = [];

    const sorted = [...readings].sort((a,b) => b.totalGeneral - a.totalGeneral);

    sorted.forEach(r => {
        labels.push(r.clientName);
        planCosts.push(r.totalAbono);
        excessCosts.push(r.totalExcessCost);
    });

    const isDarkMode = !document.body.classList.contains("light-mode");
    const gridColor = isDarkMode ? '#334155' : '#cbd5e1';
    const textColor = isDarkMode ? '#94a3b8' : '#475569';

    if (AppState.billingChart) {
        AppState.billingChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    AppState.billingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Total Abonos ($)', data: planCosts, backgroundColor: '#6366f1', borderRadius: 4 },
                { label: 'Total Excedentes ($)', data: excessCosts, backgroundColor: '#f59e0b', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, grid: { display: false }, ticks: { color: textColor, font: { family: 'Inter' } } },
                y: { stacked: true, grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Inter' } } }
            },
            plugins: {
                legend: { position: 'top', labels: { color: textColor, font: { family: 'Inter', weight: '500' } } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) label += PDFGenerator.formatCurrency(context.parsed.y);
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// --- ACCIONES EN TABLAS ---

window.downloadClientPDF = function(readingId) {
    const record = AppState.readings.find(r => r.id === readingId);
    if (!record) return;
    
    // Obtener observaciones del plan asociadas a la ficha del cliente
    const client = AppState.clients.find(c => c.id === record.clientId);
    const clientObs = client ? client.observations : "";

    PDFGenerator.generateIndividualPDF(record, AppState.config, clientObs);
    showToast(`Preparando PDF para ${record.clientName}...`);
};

window.shareWhatsApp = function(readingId) {
    const record = AppState.readings.find(r => r.id === readingId);
    if (!record) return;

    const client = AppState.clients.find(c => c.id === record.clientId);
    const phone = client ? client.phone : "";

    // Formatear mensaje
    let text = `Estimado cliente *${record.clientName}*,\n\n`;
    text += `A continuación, adjuntamos el detalle de su abono y excedentes correspondientes al período *${record.periodMonth} ${record.periodYear}*:\n\n`;
    
    record.machineReadings.forEach(mr => {
        text += `• *${mr.name}*:\n`;
        if (mr.isFixed) {
            text += `   - Abono Fijo: ${PDFGenerator.formatCurrency(mr.planCost)}\n`;
        } else {
            text += `   - Lecturas: ${PDFGenerator.formatNumber(mr.prevCounter)} a ${PDFGenerator.formatNumber(mr.currCounter)}\n`;
            text += `   - Consumo: ${PDFGenerator.formatNumber(mr.consumption)} copias (Plan: ${PDFGenerator.formatNumber(mr.planCopies === 0 ? mr.excessPrice : mr.planCopies)})\n`;
            if (mr.excess > 0) {
                text += `   - Excedente: *${PDFGenerator.formatNumber(mr.excess)}* copias × $${PDFGenerator.formatNumber(mr.excessPrice)} = *${PDFGenerator.formatCurrency(mr.excessCost)}*\n`;
            }
            text += `   - Total: ${PDFGenerator.formatCurrency(mr.totalCost)}\n`;
        }
        text += `\n`;
    });

    text += `------------------------------------\n`;
    text += `*TOTAL GENERAL A FACTURAR:* *${PDFGenerator.formatCurrency(record.totalGeneral)}*\n`;
    text += `------------------------------------\n\n`;
    text += `Cualquier duda que tenga al respecto, puede comunicarse por esta vía. ¡Muchas gracias por su confianza!\n\n_LEXORER S.R.L._`;

    const encodedText = encodeURIComponent(text);

    if (phone) {
        window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`, '_blank');
        showToast("Abriendo chat de WhatsApp Web...");
    } else {
        // Si no hay teléfono registrado, abrir prompt para copiar
        const customPhone = prompt("Este cliente no tiene teléfono de WhatsApp registrado. Ingresa el número con código de país (ej: 5492944xxxxxx) o deja vacío para copiar el texto al portapapeles:", "");
        if (customPhone === null) return;
        
        if (customPhone.trim() !== "") {
            const cleanPhone = customPhone.replace(/[^0-9]/g, '');
            window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`, '_blank');
        } else {
            navigator.clipboard.writeText(text).then(() => {
                showToast("Mensaje copiado al portapapeles. Pégalo directamente en WhatsApp.", "success");
            });
        }
    }
};

window.deleteReading = function(readingId) {
    const idx = AppState.readings.findIndex(r => r.id === readingId);
    if (idx !== -1) {
        const name = AppState.readings[idx].clientName;
        if (confirm(`¿Eliminar lectura de "${name}"?`)) {
            AppState.readings.splice(idx, 1);
            saveReadingsToStorage();
            renderReadingsTable();
            updateStats();
            updateBillingChart();
            showToast(`Registro de "${name}" quitado del período.`);
        }
    }
};

window.editClient = function(clientId) {
    const client = AppState.clients.find(c => c.id === clientId);
    if (!client) return;

    AppState.editingClientId = client.id;
    document.getElementById("client-name").value = client.name;
    document.getElementById("client-phone").value = client.phone || "";
    document.getElementById("client-observations").value = client.observations || "";
    AppState.tempClientMachines = client.machines.map(m => ({ ...m }));
    AppState.editingTempMachineIndex = null;
    
    renderTempMachinesList();

    document.getElementById("client-form-title").innerText = "Editar Cliente";
    document.getElementById("btn-submit-client").innerText = "Actualizar Ficha";
    document.getElementById("btn-cancel-client-edit").classList.remove("hidden");

    document.getElementById("client-name").focus();
};

window.deleteClient = function(clientId) {
    const client = AppState.clients.find(c => c.id === clientId);
    if (!client) return;

    if (confirm(`¿Estás seguro de eliminar a "${client.name}" y todos sus equipos vinculados?`)) {
        const idx = AppState.clients.findIndex(c => c.id === clientId);
        AppState.clients.splice(idx, 1);
        
        // Quitar lecturas asociadas
        const rIdx = AppState.readings.findIndex(r => r.clientId === clientId);
        if (rIdx !== -1) AppState.readings.splice(rIdx, 1);

        saveClientsToStorage();
        saveReadingsToStorage();
        renderAll();
        showToast(`Cliente "${client.name}" eliminado del catálogo.`);
    }
};

window.deletePlan = function(planId) {
    const isUsed = AppState.clients.some(c => c.machines.some(m => m.planId === planId));
    if (isUsed) {
        showToast("No se puede eliminar porque hay máquinas vinculadas a este plan.", "error");
        return;
    }

    const idx = AppState.plans.findIndex(p => p.id === planId);
    if (idx !== -1) {
        const name = AppState.plans[idx].name;
        AppState.plans.splice(idx, 1);
        savePlansToStorage();
        renderConfigPlansTable();
        populatePlanSelects();
        showToast(`Plan "${name}" eliminado.`);
    }
};

window.editPlan = function(planId) {
    const plan = AppState.plans.find(p => p.id === planId);
    if (!plan) return;

    AppState.editingPlanId = plan.id;
    document.getElementById("new-plan-name").value = plan.name;
    
    AppState.tempPlanComponents = JSON.parse(JSON.stringify(plan.components || []));
    window.renderTempComponentsTable();

    document.getElementById("plan-form-title").innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Editar Plan';
    document.getElementById("btn-submit-plan").innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Cambios';
    document.getElementById("btn-cancel-plan-edit").classList.remove("hidden");

    document.getElementById("new-plan-name").focus();
};

// --- COMPONENTE TOAST DE NOTIFICACIÓN ---
function showToast(message, type = "success") {
    const toast = document.getElementById("notification-toast");
    const msgEl = document.getElementById("toast-message");
    const iconEl = document.getElementById("toast-icon");

    msgEl.innerText = message;
    
    if (type === "success") {
        toast.className = "notification-toast success show";
        iconEl.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    } else {
        toast.className = "notification-toast error show";
        iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    }

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}

/**
 * Auto-completa los campos de lectura manual para el cliente seleccionado con los datos parseados
 */
function autofillClientInputs(records, clientId) {
    const clientObj = AppState.clients.find(c => c.id === clientId);
    if (!clientObj) return;

    let filledCount = 0;
    
    records.forEach(rec => {
        // Coincidir con el cliente o modelo de equipo
        const matchesClient = rec.clientName.toLowerCase() === clientObj.name.toLowerCase();
        const matchesMachineInClient = clientObj.machines.some(m => 
            m.name.toLowerCase().includes(rec.clientName.toLowerCase()) || 
            rec.clientName.toLowerCase().includes(m.name.toLowerCase())
        );

        if (matchesClient || matchesMachineInClient) {
            // Buscar equipo específico en la ficha
            let machine = null;
            if (rec.machineName && rec.machineName !== "Equipo Copiadora") {
                machine = clientObj.machines.find(m => 
                    m.name.toLowerCase().includes(rec.machineName.toLowerCase()) || 
                    rec.machineName.toLowerCase().includes(m.name.toLowerCase())
                );
            }
            
            // Fallbacks si no coincide exacto
            if (!machine && clientObj.machines.length === 1) {
                machine = clientObj.machines[0];
            } else if (!machine) {
                machine = clientObj.machines.find(m => 
                    m.name.toLowerCase().includes(rec.clientName.toLowerCase()) || 
                    rec.clientName.toLowerCase().includes(m.name.toLowerCase())
                );
            }

            if (machine && !machine.isFixed) {
                const prevInput = document.getElementById(`prev-${machine.id}`);
                const currInput = document.getElementById(`curr-${machine.id}`);
                
                if (currInput) {
                    currInput.value = rec.currCounter;
                    if (prevInput && rec.prevCounter > 0) {
                        prevInput.value = rec.prevCounter;
                    }
                    filledCount++;
                }
            }
        }
    });

    if (filledCount > 0) {
        recalcMultiSheetPreview();
        
        // Consolidar observaciones si existen
        let parsedObs = "";
        records.forEach(rec => {
            if (rec.observation) {
                parsedObs += (parsedObs ? " | " : "") + rec.observation;
            }
        });
        if (parsedObs) {
            const notesInput = document.getElementById("entry-notes");
            if (notesInput) {
                notesInput.value = parsedObs;
            }
        }

        showToast(`Se auto-completaron lecturas para ${filledCount} equipo(s). Revisa y haz clic en Guardar.`, "success");
    } else {
        showToast("El archivo/texto no contenía lecturas legibles para el cliente seleccionado.", "warning");
    }
}

/**
 * Procesa y consolida un listado de registros planos ({ clientName, machineName, prevCounter, currCounter })
 * mapeados desde cualquier origen de importación (Excel, CSV, PDF, OCR de Imagen, Texto).
 */
function processImportedRawRecords(records, sourceName) {
    const groupedByClient = {};
    records.forEach(rec => {
        const cName = rec.clientName;
        if (!groupedByClient[cName]) groupedByClient[cName] = [];
        groupedByClient[cName].push(rec);
    });

    const month = document.getElementById("entry-period-month").value;
    const year = parseInt(document.getElementById("entry-period-year").value) || 2026;
    let clientCount = 0;

    for (const [cName, rows] of Object.entries(groupedByClient)) {
        // Buscar o crear cliente
        let clientObj = AppState.clients.find(c => c.name.toLowerCase() === cName.toLowerCase());
        
        // Si no se encuentra por nombre de cliente, verificar si cName es en realidad el nombre/modelo de un equipo de la base de datos
        if (!clientObj) {
            const clientWithMachine = AppState.clients.find(c => 
                c.machines.some(m => m.name.toLowerCase().includes(cName.toLowerCase()) || cName.toLowerCase().includes(m.name.toLowerCase()))
            );
            if (clientWithMachine) {
                clientObj = clientWithMachine;
            }
        }

        if (!clientObj) {
            clientObj = {
                id: 'c-' + Date.now() + '-' + Math.floor(Math.random()*100),
                name: cName,
                phone: "",
                observations: `Equipos cargados mediante ${sourceName}`,
                machines: []
            };
            AppState.clients.push(clientObj);
        }

        // Registrar máquinas faltantes en la ficha del cliente
        rows.forEach(row => {
            const mName = row.machineName || "Equipo Copiadora";
            let machine = clientObj.machines.find(m => m.name.toLowerCase() === mName.toLowerCase());
            
            if (!machine) {
                const defaultPlan = AppState.plans[0] || { id: 'p500', cost: 35000 };
                machine = {
                    id: 'm-' + Date.now() + '-' + Math.floor(Math.random()*1000),
                    name: mName,
                    serialNumber: "",
                    planId: defaultPlan.id,
                    customCost: null,
                    customExcessPrice: null,
                    isFixed: false
                };
                clientObj.machines.push(machine);
            }
        });

        // Consolidar lecturas del período
        const machineReadings = [];
        let totalAbono = 0;
        let totalExcessCost = 0;
        let totalGeneral = 0;

        clientObj.machines.forEach(m => {
            const rowRead = rows.find(r => (r.machineName || "").toLowerCase() === m.name.toLowerCase());
            
            let isColor = getMachineType(m.name) === "color";
            let isEcografo = false;
            let isOther = false;
            if (!m.isFixed && m.planId) {
                const plan = AppState.plans.find(p => p.id === m.planId);
                if (plan && plan.components) {
                    const comp = plan.components.find(c => c.id === m.planComponentId);
                    if (comp) {
                        if (comp.type === "ecografo") isEcografo = true;
                        if (comp.type === "other") isOther = true;
                    }
                }
            }

            if (m.isFixed || isOther) {
                let cost = 0;
                if (m.isFixed) {
                    cost = m.customCost || 0;
                } else {
                    cost = resolveOtherRates(m).cost;
                }
                machineReadings.push({
                    machineId: m.id, name: m.name, serialNumber: m.serialNumber,
                    prevCounter: 0, currCounter: 0, consumption: 0, planCopies: 0, excess: 0, excessPrice: 0,
                    planCost: cost, excessCost: 0, totalCost: cost, isFixed: true, planComponentId: m.planComponentId || ""
                });
                totalAbono += cost;
                totalGeneral += cost;
            } else {
                const hasRead = rowRead !== undefined;
                
                let isPending = true;
                let prev = 0, curr = 0;
                let prevImp = 0, currImp = 0;
                let prevCop = 0, currCop = 0;
                let prevPP = 0, currPP = 0;
                let prevPF = 0, currPF = 0;
                
                if (hasRead) {
                    if (isColor) {
                        const hasPPPF = rowRead.prevPP !== undefined || rowRead.currPP !== undefined || rowRead.prevPF !== undefined || rowRead.currPF !== undefined;
                        if (hasPPPF) {
                            prevPP = parseInt(rowRead.prevPP) || 0;
                            currPP = parseInt(rowRead.currPP) || 0;
                            prevPF = parseInt(rowRead.prevPF) || 0;
                            currPF = parseInt(rowRead.currPF) || 0;
                            isPending = false;
                        } else if (rowRead.prevCounter !== undefined && rowRead.currCounter !== undefined && rowRead.prevCounter !== null && rowRead.currCounter !== null) {
                            prevPP = parseInt(rowRead.prevCounter) || 0;
                            currPP = parseInt(rowRead.currCounter) || 0;
                            prevPF = 0;
                            currPF = 0;
                            isPending = false;
                        }
                        prev = prevPP + prevPF;
                        curr = currPP + currPF;
                    } else {
                        // Laser & Ecografo
                        if (rowRead.prevCounter !== undefined && rowRead.currCounter !== undefined && rowRead.prevCounter !== null && rowRead.currCounter !== null) {
                            prev = parseInt(rowRead.prevCounter) || 0;
                            curr = parseInt(rowRead.currCounter) || 0;
                            isPending = false;
                            
                            if (!isEcografo) {
                                // Informativos
                                prevImp = parseInt(rowRead.prevImpresiones) || 0;
                                currImp = parseInt(rowRead.currImpresiones) || 0;
                                prevCop = parseInt(rowRead.prevCopias) || 0;
                                currCop = parseInt(rowRead.prevCopias) || 0;
                            }
                        }
                    }
                }

                let planCopies = 0;
                let planCost = 0;
                let excessPrice = 0;

                if (isColor) {
                    const rates = resolveColorRates(m);
                    planCost = rates.ppCost + rates.pfCost;
                } else if (isEcografo) {
                    const rates = resolveEcografoRates(m);
                    planCost = rates.cost;
                    excessPrice = rates.pagePrice;
                } else {
                    const rates = resolveBNRates(m);
                    planCost = rates.cost;
                    planCopies = rates.copies;
                    excessPrice = rates.excessPrice;
                }

                // Fórmulas
                let consumption = 0;
                let excess = 0;
                let excessCost = 0;
                let totalCost = planCost;

                if (!isPending) {
                    consumption = Math.max(0, curr - prev);
                    if (isColor) {
                        const rates = resolveColorRates(m);
                        const consPP = Math.max(0, currPP - prevPP);
                        const consPF = Math.max(0, currPF - prevPF);
                        
                        excessCost = (consPP * rates.ppPrice) + (consPF * rates.pfPrice);
                        excess = consumption;
                        totalCost = planCost + excessCost;
                    } else if (isEcografo) {
                        const rates = resolveEcografoRates(m);
                        excess = consumption;
                        excessCost = consumption * rates.pagePrice;
                        totalCost = planCost + excessCost;
                    } else {
                        const rates = resolveBNRates(m);
                        if (rates.copies === 0) {
                            excess = consumption;
                            excessCost = consumption * rates.excessPrice;
                            totalCost = planCost + excessCost;
                        } else {
                            excess = Math.max(0, consumption - rates.copies);
                            excessCost = excess * rates.excessPrice;
                            totalCost = planCost + excessCost;
                        }
                    }
                }

                machineReadings.push({
                    machineId: m.id, name: m.name, serialNumber: m.serialNumber,
                    prevCounter: prev, currCounter: curr, consumption: consumption, planCopies: planCopies,
                    excess: excess, excessPrice: excessPrice, planCost: planCost, excessCost: excessCost, totalCost: totalCost,
                    isFixed: false, isPending: isPending, planComponentId: m.planComponentId || "",
                    
                    // Sub-contadores
                    prevImpresiones: prevImp, currImpresiones: currImp,
                    prevCopias: prevCop, currCopias: currCop,
                    prevPP: prevPP, currPP: currPP,
                    prevPF: prevPF, currPF: currPF,
                    
                    // Reemplazo
                    hasReplacement: false,
                    repModel: "",
                    repSerialNumber: "",
                    repPrevCounter: 0,
                    repCurrCounter: 0,
                    repConsumption: 0,
                    repPrevImpresiones: 0,
                    repCurrImpresiones: 0,
                    repPrevCopias: 0,
                    repCurrCopias: 0,
                    repPrevPP: 0,
                    repCurrPP: 0,
                    repPrevPF: 0,
                    repCurrPF: 0
                });
                totalAbono += planCost;
                totalExcessCost += excessCost;
                totalGeneral += totalCost;
            }
        });

        // Consolidar observaciones particulares de parsing (ej: OCR de Ricoh)
        let customObs = "";
        rows.forEach(r => {
            if (r.observation) {
                customObs += (customObs ? " | " : "") + r.observation;
            }
        });

        const record = {
            id: 'r-' + clientObj.id + '-' + month.toLowerCase() + '-' + year,
            clientId: clientObj.id,
            clientName: clientObj.name,
            periodMonth: month,
            periodYear: year,
            observations: customObs || (window.generateDefaultObservations ? window.generateDefaultObservations(clientObj) : ""),
            machineReadings: machineReadings,
            totalAbono: totalAbono,
            totalExcessCost: totalExcessCost,
            totalGeneral: totalGeneral,
            uploadDate: new Date().toLocaleString('es-AR'),
            user: AppState.config.currentUser || "Administrador"
        };

        const existingIdx = AppState.readings.findIndex(r => 
            r.clientId === clientObj.id && 
            r.periodMonth.toLowerCase() === month.toLowerCase() && 
            parseInt(r.periodYear) === year
        );
        if (existingIdx !== -1) {
            AppState.readings[existingIdx] = record;
        } else {
            AppState.readings.push(record);
        }
        clientCount++;
    }

    saveClientsToStorage();
    saveReadingsToStorage();
    renderAll();
    showToast(`Se cargaron lecturas de ${clientCount} clientes desde ${sourceName}.`, "success");
    switchTab("dashboard");
}

window.generateDefaultObservations = function(clientObj) {
    if (!clientObj || !clientObj.machines || clientObj.machines.length === 0) {
        return "";
    }

    // Función auxiliar para combinar el nombre del plan y de la máquina sin duplicaciones
    function combinePlanAndMachineName(planName, machineName) {
        let cleanPlan = (planName || "").replace(/^plan(es)?\s+/i, '').trim();
        let cleanMachine = (machineName || "").trim();

        if (!cleanPlan) return cleanMachine;

        const lowerPlan = cleanPlan.toLowerCase();
        const lowerMachine = cleanMachine.toLowerCase();

        if (lowerPlan.includes(lowerMachine)) {
            return cleanPlan;
        }
        if (lowerMachine.includes(lowerPlan)) {
            return cleanMachine;
        }

        const planWords = cleanPlan.split(/\s+/);
        const machineWords = cleanMachine.split(/\s+/);
        if (planWords[planWords.length - 1].toLowerCase() === machineWords[0].toLowerCase()) {
            return planWords.join(" ") + " " + machineWords.slice(1).join(" ");
        }

        return `${cleanPlan} ${cleanMachine}`;
    }

    // Agrupar máquinas por configuración
    const groups = {};
    clientObj.machines.forEach(m => {
        let planCopies = 0;
        let planCost = 0;
        let excessPrice = 0;
        let planName = "";

        if (m.isFixed) {
            planCost = m.customCost || 0;
        } else {
            const plan = AppState.plans.find(p => p.id === m.planId) || { name: "", copies: 0, cost: 0, excessPrice: 0 };
            planCopies = plan.copies;
            planCost = m.customCost !== null ? m.customCost : plan.cost;
            excessPrice = m.customExcessPrice !== null ? m.customExcessPrice : (plan.excessPrice !== undefined && plan.excessPrice !== null ? plan.excessPrice : AppState.config.defaultExcessPrice);
            planName = plan.name;
        }

        // Clave única de agrupación
        const key = `${m.name.trim()}||${m.isFixed}||${planCopies}||${planCost}||${excessPrice}||${planName}`;
        if (!groups[key]) {
            groups[key] = {
                machine: m,
                count: 0,
                planCopies,
                planCost,
                excessPrice,
                planName
            };
        }
        groups[key].count++;
    });

    const parts = [];
    Object.values(groups).forEach(g => {
        const m = g.machine;
        const count = g.count;
        const copies = g.planCopies;
        const excessPrice = g.excessPrice;
        const planName = g.planName;

        if (m.isFixed) {
            const costFormatted = PDFGenerator.formatNumber(g.planCost);
            if (count > 1) {
                parts.push(`(${count}) ${m.name} abono fijo $${costFormatted} c/u`);
            } else {
                parts.push(`${m.name} abono fijo $${costFormatted}`);
            }
        } else {
            const excessFormatted = PDFGenerator.formatNumber(excessPrice);
            if (copies === 0) {
                if (count > 1) {
                    parts.push(`(${count}) ${m.name}: cada impresión $${excessFormatted}`);
                } else {
                    parts.push(`${m.name}: cada impresión $${excessFormatted}`);
                }
            } else {
                const copiesFormatted = PDFGenerator.formatNumber(copies);
                const namePart = combinePlanAndMachineName(planName, m.name);

                if (count > 1) {
                    parts.push(`(${count}) Planes ${namePart}, ${copiesFormatted} impresiones o copias c/u (no acumulables) exc. $${excessFormatted}`);
                } else {
                    parts.push(`Plan ${namePart}, ${copiesFormatted} impresiones o copias (no acumulables) exc. $${excessFormatted}`);
                }
            }
        }
    });

    return parts.join(" - ") + ".";
};

// --- CONTROLES DE COMPONENTES DE PLAN ---
window.togglePlanComponentFields = function() {
    const type = document.getElementById("comp-type").value;
    const fieldBn = document.getElementById("comp-field-bn");
    const fieldPrice = document.getElementById("comp-field-price");
    const labelPrice = document.getElementById("comp-price-label");
    const pagePriceInput = document.getElementById("comp-page-price");

    if (type === "bn") {
        fieldBn.classList.remove("hidden");
        fieldPrice.classList.add("hidden");
    } else if (type === "other") {
        fieldBn.classList.add("hidden");
        fieldPrice.classList.add("hidden");
    } else {
        fieldBn.classList.add("hidden");
        fieldPrice.classList.remove("hidden");
        if (type === "color_common") {
            labelPrice.innerText = "Precio Papel Común (PP) ($)";
            pagePriceInput.value = AppState.config.defaultPPPrice || 300;
        } else if (type === "photo") {
            labelPrice.innerText = "Precio Papel Fotográfico (PF) ($)";
            pagePriceInput.value = AppState.config.defaultPFPrice || 600;
        } else if (type === "ecografo") {
            labelPrice.innerText = "Precio por Página ($)";
            pagePriceInput.value = 100;
        }
    }
};

window.renderTempComponentsTable = function() {
    const tbody = document.getElementById("table-temp-components-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!AppState.tempPlanComponents || AppState.tempPlanComponents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 8px;">No hay componentes cargados aún.</td></tr>`;
        return;
    }
    AppState.tempPlanComponents.forEach((c, idx) => {
        let typeLabel = "";
        let details = "";
        if (c.type === "bn") {
            typeLabel = "B/N";
            details = `Copias: ${PDFGenerator.formatNumber(c.copies)} | Exc: ${PDFGenerator.formatCurrency(c.excessPrice)}`;
        } else if (c.type === "color_common") {
            typeLabel = "Color Común";
            details = `Pág: ${PDFGenerator.formatCurrency(c.pagePrice)}`;
        } else if (c.type === "photo") {
            typeLabel = "Fotografía";
            details = `Pág: ${PDFGenerator.formatCurrency(c.pagePrice)}`;
        } else if (c.type === "ecografo") {
            typeLabel = "Ecógrafo";
            details = `Pág: ${PDFGenerator.formatCurrency(c.pagePrice)}`;
        } else if (c.type === "other") {
            typeLabel = "Otros";
            details = "Fijo";
        }
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="padding: 4px 6px; font-weight:600;">${c.name}</td>
            <td style="padding: 4px 6px;">${typeLabel}</td>
            <td style="padding: 4px 6px; font-family:monospace; font-size:0.75rem;">${details}</td>
            <td style="padding: 4px 6px; text-align: right;">${PDFGenerator.formatCurrency(c.cost)}</td>
            <td style="padding: 4px 6px; text-align: center;">
                <button type="button" class="btn-icon" style="color: var(--color-danger); background:none; border:none; cursor:pointer;" onclick="window.removePlanComponentTemp(${idx})">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.addPlanComponentTemp = function() {
    const nameInput = document.getElementById("comp-name");
    const typeSelect = document.getElementById("comp-type");
    const costInput = document.getElementById("comp-cost");
    
    if (!nameInput || !typeSelect || !costInput) return;
    
    const type = typeSelect.value;
    let name = nameInput.value.trim();
    if (!name) {
        name = typeSelect.options[typeSelect.selectedIndex].text;
    }
    const cost = parseFloat(costInput.value) || 0;
    
    const comp = {
        id: "comp-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        name,
        type,
        cost
    };
    
    if (type === "bn") {
        comp.copies = parseInt(document.getElementById("comp-copies").value) || 0;
        comp.excessPrice = parseFloat(document.getElementById("comp-excess-price").value) || 0;
    } else if (type === "color_common" || type === "photo" || type === "ecografo") {
        comp.pagePrice = parseFloat(document.getElementById("comp-page-price").value) || 0;
    }
    
    if (!AppState.tempPlanComponents) {
        AppState.tempPlanComponents = [];
    }
    AppState.tempPlanComponents.push(comp);
    window.renderTempComponentsTable();
    
    // Reset component inputs
    nameInput.value = "";
    costInput.value = "0";
    document.getElementById("comp-copies").value = "1500";
    document.getElementById("comp-excess-price").value = AppState.config.defaultExcessPrice || 90;
    document.getElementById("comp-page-price").value = "200";
};

window.removePlanComponentTemp = function(idx) {
    if (AppState.tempPlanComponents && AppState.tempPlanComponents[idx]) {
        AppState.tempPlanComponents.splice(idx, 1);
        window.renderTempComponentsTable();
    }
};

window.resolveColorRates = function(machine) {
    let ppPrice = AppState.config.defaultPPPrice !== undefined ? AppState.config.defaultPPPrice : 300;
    let pfPrice = AppState.config.defaultPFPrice !== undefined ? AppState.config.defaultPFPrice : 600;
    let ppCost = 0;
    let pfCost = 0;
    
    if (!machine.isFixed && machine.planId) {
        const plan = AppState.plans.find(p => p.id === machine.planId);
        if (plan && plan.components) {
            const compPP = plan.components.find(c => c.type === 'color_common');
            if (compPP) {
                ppPrice = compPP.pagePrice !== undefined ? compPP.pagePrice : ppPrice;
                ppCost = compPP.cost !== undefined ? compPP.cost : 0;
            }
            const compPF = plan.components.find(c => c.type === 'photo');
            if (compPF) {
                pfPrice = compPF.pagePrice !== undefined ? compPF.pagePrice : pfPrice;
                pfCost = compPF.cost !== undefined ? compPF.cost : 0;
            }
        }
    }
    
    if (machine.customCost !== null) ppCost = machine.customCost;
    
    return { ppPrice, pfPrice, ppCost, pfCost };
};

window.resolveBNRates = function(machine) {
    let cost = 0;
    let copies = 0;
    let excessPrice = AppState.config.defaultExcessPrice !== undefined ? AppState.config.defaultExcessPrice : 90;
    
    if (!machine.isFixed && machine.planId) {
        const plan = AppState.plans.find(p => p.id === machine.planId);
        if (plan) {
            cost = plan.cost;
            copies = plan.copies;
            excessPrice = plan.excessPrice !== undefined && plan.excessPrice !== null ? plan.excessPrice : excessPrice;
            
            if (machine.planComponentId && plan.components) {
                const comp = plan.components.find(c => c.id === machine.planComponentId);
                if (comp) {
                    cost = comp.cost !== undefined ? comp.cost : cost;
                    copies = comp.copies !== undefined ? comp.copies : copies;
                    excessPrice = comp.excessPrice !== undefined ? comp.excessPrice : excessPrice;
                }
            }
        }
    }
    
    if (machine.customCost !== null) cost = machine.customCost;
    if (machine.customExcessPrice !== null) excessPrice = machine.customExcessPrice;
    
    return { cost, copies, excessPrice };
};

window.resolveEcografoRates = function(machine) {
    let cost = 0;
    let pagePrice = 100;
    
    if (!machine.isFixed && machine.planId) {
        const plan = AppState.plans.find(p => p.id === machine.planId);
        if (plan) {
            cost = plan.cost;
            if (machine.planComponentId && plan.components) {
                const comp = plan.components.find(c => c.id === machine.planComponentId);
                if (comp) {
                    cost = comp.cost !== undefined ? comp.cost : cost;
                    pagePrice = comp.pagePrice !== undefined ? comp.pagePrice : pagePrice;
                }
            }
        }
    }
    
    if (machine.customCost !== null) cost = machine.customCost;
    if (machine.customExcessPrice !== null) pagePrice = machine.customExcessPrice;
    
    return { cost, pagePrice };
};

window.resolveOtherRates = function(machine) {
    let cost = 0;
    if (!machine.isFixed && machine.planId) {
        const plan = AppState.plans.find(p => p.id === machine.planId);
        if (plan) {
            cost = plan.cost;
            if (machine.planComponentId && plan.components) {
                const comp = plan.components.find(c => c.id === machine.planComponentId);
                if (comp) {
                    cost = comp.cost !== undefined ? comp.cost : cost;
                }
            }
        }
    }
    if (machine.customCost !== null) cost = machine.customCost;
    return { cost };
};
