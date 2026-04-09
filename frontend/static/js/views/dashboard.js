// Orquestador de la Dashboard (sin gráficos). Controla escenarios y botones.
// Escenarios: 'real' → 'opt' → 'pp'
// - En 'real' solo aparece el botón "Optimizar taller".
// - Tras optimizar: "Situación actual" / "Optimizar taller" / "PaintPro".
// - Tras PaintPro: + botón "Así será tu taller →" (routing A/B).
//
// Requiere: renderDashboardData(rootEl, store, scenario)
// Usa: window.submitOptimicer (expuesta en app.js), store.results.finance/optimicer

import { renderDashboardData } from './dashboard_data.js';

const SCENARIOS = { REAL: 'real', OPT: 'opt', PP: 'pp' };

function snapshotKPIs(store, scenario) {
  const F  = store?.results?.finance || {};
  const b3 = F?.bloque3 || F?.b3 || {};
  const real  = b3?.real  || {};
  const ideal = b3?.ideal || {};

  const O    = store?.results?.optimicer || {};
  const org  = O?.organizado || {};
  const out  = org?.salida || {};
  const vehOpt = Number(out?.total_out_dia || O?.kpi_central || 0);

  const A   = store?.results?.analytics || {};
  const k   = A?.kpis || {};
  const dias_sem = Number(store?.inputs?.dias_semana || 5);
  const vehReal  = Number(k?.veh_sem_real || 0) / (dias_sem || 1);

  const veh = scenario === SCENARIOS.OPT
    ? vehOpt
    : scenario === SCENARIOS.PP
      ? Number(O?.paintpro?.organizado?.salida?.total_out_dia || O?.paintpro?.kpi_central || vehOpt)
      : vehReal;

  const fact =
    scenario === SCENARIOS.OPT ? Number(ideal?.facturacion_mes || real?.facturacion_mes || 0)
      : scenario === SCENARIOS.PP ? Number(O?.paintpro?.finance?.facturacion_mes || ideal?.facturacion_mes || real?.facturacion_mes || 0)
      : Number(real?.facturacion_mes || 0);

  const beneBase =
    scenario === SCENARIOS.OPT ? Number(ideal?.beneficio_mes || real?.beneficio_mes || 0)
      : scenario === SCENARIOS.PP ? Number(O?.paintpro?.finance?.beneficio_mes || ideal?.beneficio_mes || real?.beneficio_mes || 0)
      : Number(real?.beneficio_mes || 0);

  const costePP = Number(
    O?.paintpro?.recomendaciones?.coste_mensual ??
    O?.recomendaciones?.coste_mensual ??
    O?.paintpro?.coste_mensual ?? 0
  );
  const bene = scenario === SCENARIOS.PP ? Math.max(0, beneBase - costePP) : beneBase;

  return { scenario, veh_dia: veh, fact_mes: fact, bene_mes: bene };
}

function ensureUIStore(store){
  store.ui = store.ui || {};
  if(!store.ui.scenario) store.ui.scenario = SCENARIOS.REAL;
  if(!store.ui.prev) store.ui.prev = null;
  if(!store.ui._baselineRequested) store.ui._baselineRequested = false;
}

function renderButtons(barEl, store){
  const scen = store.ui.scenario;

  const btn = (id, label, primary=false, disabled=false) =>
    `<button id="${id}" class="pp-btn ${primary?'':'pp-ghost'}" ${disabled?'disabled':''}>${label}</button>`;

  let html = '';
  if (scen === SCENARIOS.REAL) {
    html = btn('pp-opt', 'Optimizar taller', true);
  } else if (scen === SCENARIOS.OPT) {
    html = [
      btn('pp-real', 'Situación actual'),
      btn('pp-opt',  'Optimizar taller', true),
      btn('pp-pp',   'PaintPro')
    ].join('');
  } else { // PP
    html = [
      btn('pp-real', 'Situación actual'),
      btn('pp-opt',  'Optimizar taller'),
      btn('pp-pp',   'PaintPro', true),
      btn('pp-future','Así será tu taller →')
    ].join('');
  }

  barEl.innerHTML = html;

  const $ = id => document.getElementById(id);

  if ($('pp-real')) $('pp-real').onclick = () => {
    store.ui.prev = snapshotKPIs(store, store.ui.scenario);
    store.ui.scenario = SCENARIOS.REAL;
    renderDashboard(document.getElementById('app'), store);
  };

  if ($('pp-opt')) $('pp-opt').onclick = async () => {
    store.ui.prev = snapshotKPIs(store, store.ui.scenario);
    try {
      // ya tienes submitOptimicer en app.js; aquí sí queremos overlay (llamada visible)
      await window.submitOptimicer?.(false);
    } catch(e){ console.warn('Optimizar falló:', e); }
    store.ui.scenario = SCENARIOS.OPT;
    renderDashboard(document.getElementById('app'), store);
  };

  if ($('pp-pp')) $('pp-pp').onclick = async () => {
    store.ui.prev = snapshotKPIs(store, store.ui.scenario);
    try {
      // Sugerencia: podrías enviar un flag de escenario al backend si lo soporta
      await window.submitOptimicer?.(false);
    } catch(e){ console.warn('PaintPro calc falló:', e); }
    store.ui.scenario = SCENARIOS.PP;
    renderDashboard(document.getElementById('app'), store);
  };

  if ($('pp-future')) $('pp-future').onclick = () => {
    const snap = snapshotKPIs(store, SCENARIOS.PP);
    const vehDia = Math.ceil(Number(snap.veh_dia || 0));
    const segment = vehDia >= 4 ? 'B' : 'A';
    // TODO: routing real de tu SPA
    alert(`(Demo) Ir a "Así será tu taller" — Segmento ${segment}`);
  };
}

export function renderDashboard(rootEl, store){
  const el = rootEl || document.getElementById('app');
  ensureUIStore(store);

  el.innerHTML = `
    <div class="pp-card">
      <div class="pp-title">Dashboard</div>
      <div id="pp-dash-data"></div>
      <div class="pp-hr"></div>
      <div id="pp-dash-buttons" class="pp-cta"></div>
    </div>
  `;

  // 1) baseline silencioso de Optimicer (para capacidades/piezas/cuello)
  //    Solo la 1ª vez y sin cambiar escenario ni mostrar overlay.
  if (!store.ui._baselineRequested) {
    store.ui._baselineRequested = true;
    // submitOptimicer(true) en tu app.js NO muestra overlay → perfecto para baseline silencioso
    window.submitOptimicer?.(true).finally(()=>{
      // Re-render para que ya aparezcan capacidades y piezas
      const dataRootSilent = document.getElementById('pp-dash-data');
      renderDashboardData(dataRootSilent, store, store.ui.scenario);
    });
  }

  // 2) contenido de datos del escenario activo
  const dataRoot = document.getElementById('pp-dash-data');
  renderDashboardData(dataRoot, store, store.ui.scenario);

  // 3) barra de botones
  const bar = document.getElementById('pp-dash-buttons');
  renderButtons(bar, store);
}

// Exponer para navegación externa
window.renderDashboard = (root, st) => renderDashboard(root || document.getElementById('app'), st || window.store);
