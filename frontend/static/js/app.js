/*************************************************
 * PaintPro - app.js (SPA)  [versión sin imports]
 * Flujo: Analytics → Finance → Dashboard → Optimicer → PaintPro
 **************************************************/


// ================= Estado global =================
const store = {
  ui: { scenario: 'actual', stage: 'base' },
  inputs: {
    // Analytics
    tipo_vehiculo: null, perfil: null, mix_personalizado: null,
    pintores: null, chapistas: null, puestos_chapa: null, puestos_pintura: null,
    jornada: null, horas_dia: null, dias_semana: null, coches_semana: null,
    // Finance
    fijos_alquiler: null, fijos_personal_productivo: null, fijos_personal_indirecto: null, fijos_otros: null,
    prod_gas: null, prod_luz: null, prod_otros: null,
    precio_mo_h: null, compras_pintura_mes: null, compras_recambios_mes: null,
    // Optimicer
    cabinas: null, plenums: null, barniz: 'rapido', ova: false, visualid: false, moonwalk: false
  },
  derived: { horas_reales_mes: null, horas_ideales_mes: null, tarifa_mo_h: null, facturacion_hora: null },
  results: { analytics: null, finance: null, optimicer: null }
};
window.store = store;

// ================= Helpers =================
function $app(){ return document.getElementById('app'); }

function hideLoading() {
  const loader = document.getElementById("pp-loader");
  if (loader) loader.remove();
}

function showLoading(msg="Procesando…"){
  let el = document.getElementById('pp-loading');
  if(!el){
    el = document.createElement('div');
    el.id = 'pp-loading';
    el.style.cssText = "position:fixed;inset:0;background:rgba(255,255,255,.85);display:flex;align-items:center;justify-content:center;z-index:9999;font:600 16px/1.2 system-ui,Arial";
    document.body.appendChild(el);
  }
  el.innerHTML = `<div style="text-align:center">
    <div style="width:48px;height:48px;border:4px solid #e0e0e0;border-top-color:#009fe3;border-radius:50%;margin:0 auto 12px;animation:spin 1s linear infinite"></div>
    ${msg}
  </div>`;
  el.style.display = 'flex';

  if(!document.getElementById('pp-spin-style')){
    const st = document.createElement('style');
    st.id = 'pp-spin-style';
    st.textContent = `@keyframes spin{to{transform:rotate(360deg)}}`;
    document.head.appendChild(st);
  }
}
function hideLoading(){ const el = document.getElementById('pp-loading'); if(el) el.style.display='none'; }

// --- Analytics -> llama al backend y pinta resultados ---
// --- Analytics -> POST y render de resultados (payload limpio) ---
// --- Analytics -> POST y render ---

window.submitAnalytics = async function(payload){
  try{
    showLoading && showLoading('Analizando tu taller…');

    const resp = await fetch('/api/analytics/calc', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload || window.store.inputs || {})
    });
    if(!resp.ok) throw new Error('Error en /api/analytics/calc');
    const data = await resp.json();
    
    console.log("🔍 RESPONSE ANALYTICS:", data);

    // guarda resultados + bridge
    window.store.results.analytics = data;
    if (data.finance_bridge) {
      window.store.derived = { ...window.store.derived, ...data.finance_bridge };
    }

    hideLoading && hideLoading();

    const root = document.getElementById('app');
    root.innerHTML = '';
    // pásale 'data' (tu render ya soporta data o store)
    window.renderAnalyticsResults(root, data);

  }catch(e){
    hideLoading && hideLoading();
    console.error(e);
    alert('No hemos podido calcular Analytics.');
  }
};




// =============== Escenarios ===============
function setScenario(mode){
  store.ui.scenario = mode;
  const root = $app();
  showLoading(mode==="pp" ? "Aplicando PaintPro al taller…" : "Analizando taller…");
  setTimeout(()=>{
    root.innerHTML = '';
    // Funciones globales cargadas por <script> en index.html
    window.renderDashboardCards(root, store);
    if (window.renderPEBlock) window.renderPEBlock(root, store);
    if (window.renderScenarioButtons) window.renderScenarioButtons(root, store);
    hideLoading();
  }, 600);
}
window.setScenario = setScenario;

// ============== Finance ==============
// ========== Finance ==========
async function submitFinance(payload) {
  try {
    showLoading("Calculando salud financiera...");

    // 1️⃣ Recuperamos los datos ya calculados de Analytics
    const analytics = store.results?.analytics || {};
    const bridge = analytics.finance_bridge || {};
    const kpis = analytics.kpis || {};
    const display = analytics.display || {};
    const debug = analytics.debug || {};

    // 2️⃣ Unimos TODO: inputs + derived + analytics + payload extra
    const merged = {
      ...store.inputs,
      ...store.derived,
      ...bridge,
      ...kpis,
      ...display,
      ...debug,
      ...(payload || {})
    };

    // 3️⃣ Petición al backend
    const resp = await fetch("/api/finance/calc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(merged)
    });

    const finRes = await resp.json();

    console.log("📊 RESPONSE FINANCE:", finRes);

    hideLoading();

    // 4️⃣ Guardamos y renderizamos resultados
    store.results.finance = finRes;
    renderFinanceResults(document.getElementById("app"), finRes);

  } catch (err) {
    console.error("Error Finance:", err);
    alert("Error Finance: " + err.message);
  }
}

window.submitFinance = submitFinance;


// =============== Optimicer ===============
function viewOpSetup(){
  const root = $app();
  root.innerHTML = '';
  // Form mini de setup (global)
  window.renderOptimicerSetup(root, store.inputs, (inputs)=>{
    Object.assign(store.inputs, inputs);
    submitOptimicer(true);
  });
}
window.viewOpSetup = viewOpSetup;

async function submitOptimicer(fromSetup=false){
  try{
    showLoading("Optimizando taller…");
    const payload = { ...store.inputs, ...store.derived };
    const resp = await fetch('/api/optimicer/calc', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(!resp.ok) throw new Error('Error en /api/optimicer/calc');

    const data = await resp.json();
    store.results.optimicer = data;
    store.ui.stage = 'opt_done';
    hideLoading();

    const root = $app();
    root.innerHTML = '';
    if (window.renderOptimicerResults) window.renderOptimicerResults(root, data); // opcional
    if (window.renderDashboardLayout) {
    window.renderDashboardLayout(root, store);
    } else {
    window.renderDashboardCards(root, store);
    if (window.renderPEBlock) window.renderPEBlock(root, store);
    if (window.renderScenarioButtons) window.renderScenarioButtons(root, store);
  }

  }catch(e){
    hideLoading(); alert("Error Optimicer: "+e.message);
  }
}
window.submitOptimicer = submitOptimicer;

function goPaintPro(){
  if(!store.results.optimicer){
    alert("Primero ejecuta 'Optimizar el taller'.");
    return;
  }
  setScenario('pp');
}
window.goPaintPro = goPaintPro;

// =============== Arranque opcional ===============
// window.onload = () => { /* inicia wizard Analytics si procede */ };
// === BOOTSTRAP de la SPA ===
window.addEventListener('DOMContentLoaded', function(){
  const root = document.getElementById('app');
  if(!root){ console.error('No existe #app'); return; }

  // Señal de vida
  console.log('PaintPro UI cargada');

 // Al final de frontend/static/js/app.js
window.onload = function(){
  const root = document.getElementById('app');
  if (!root) { console.error('No existe #app'); return; }

  // Si el wizard está cargado, lánzalo
  if (typeof window.renderAnalyticsForm === 'function') {
    window.renderAnalyticsForm(root);
    return;
  }

  // Fallback: si por cualquier motivo no se cargó la vista (para depurar)
  console.warn('analytics_form.js no cargado; mostrando dashboard base');
  root.innerHTML = '';
  if (window.renderDashboardCards) window.renderDashboardCards(root, window.store || {ui:{scenario:'actual'},results:{},inputs:{}});
  if (window.renderPEBlock)        window.renderPEBlock(root, window.store || {});
  if (window.renderScenarioButtons) window.renderScenarioButtons(root, window.store || {});
};

});

// === Formateo numérico global (helper) ===
window.N = function (v) {
  if (v === null || v === undefined || isNaN(v)) return 0;
  return Number(v).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};
