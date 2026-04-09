/* /frontend/static/js/views/optimicer_results.js */
/* global Chart, store */

// ===== Helpers =====
const fmt0 = v => Number(v || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 });
const fmt1 = v => Number(v || 0).toLocaleString('es-ES', { maximumFractionDigits: 1 });
const euro0 = v => Number(v || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 });
const pct0  = v => `${Math.round(Number(v || 0))}%`;

function _num(x, d = 0){ const n = Number(x); return Number.isFinite(n) ? n : d; }
function _ceilNice(x){ return Math.ceil((_num(x, 0) + 1e-6)); }

// Horas por coche del mix (preferimos las que ya calculó Analytics)
function getHorasPorCoche(){
  const dbg = store?.results?.analytics?.debug || {};
  const hp = _num(dbg.hp_bill, 0); // horas pintura/coche
  const hc = _num(dbg.hc_bill, 0); // horas chapa/coche
  return {
    hp: hp > 0 ? hp : 5.6,  // fallback prudente
    hc: hc > 0 ? hc : 3.0
  };
}

// Piezas/día ≈ (coches/día * horas_pintura_coche) / 1.4
function cochesDiaToPiezasDia(cpd, hp){
  return (cpd * hp) / 1.4;
}

// Facturación y beneficio incremental con Δhoras
// Necesitamos €/h total (fact_h) y margen contribución/h (margen_h)
function getFinanceRatios(){
  const fin = store?.results?.finance || {};
  const b1  = fin?.bloque1 || {};
  const fact_h = _num(b1?.facturacion_hora, 0); // €/h total real

  // Variables/h ≈ compras + energía + otros_var (si vienen en desglose)
  const dch = b1?.desglose_coste_h || {};
  const variables_h = _num(dch?.compras_h, 0) + _num(dch?.energia_h, 0) + _num(dch?.otros_var_h, 0);
  const margen_h = Math.max(0, fact_h - variables_h);
  return { fact_h, margen_h };
}

function getDiasMes(){
  const d = _num(store?.inputs?.dias_semana, 5);
  const sem = 4;
  return Math.max(1, d * sem);
}

// Capacidad real (dato cliente) en coches/día
function getRealCochesDia(){
  const k = store?.results?.analytics?.kpis || {};
  let vsem = _num(k?.veh_sem_real, 0);
  if(!vsem){
    vsem = _num(store?.inputs?.coches_semana, 0);
  }
  const diasSemana = _num(store?.inputs?.dias_semana, 5);
  return diasSemana > 0 ? (vsem / diasSemana) : 0; // robusto
}

// Capacidad ideal (Analytics) en coches/día
function getIdealCochesDia(){
  const k = store?.results?.analytics?.kpis || {};
  const vsem = _num(k?.veh_sem_pot, 0);
  const diasSemana = _num(store?.inputs?.dias_semana, 5);
  return diasSemana > 0 ? (vsem / diasSemana) : 0;
}

// Capacidad por áreas desde Optimicer (teórica)
function getAreasCaps(){
  const r = store?.results?.optimicer || {};
  const cap = r?.capacidades || {};
  return {
    cabina:  _num(cap?.cabina_dia, 0),
    pintura: _num(cap?.pintura_dia, 0),
    chapa:   _num(cap?.chapa_dia, 0)
  };
}

// Objetivo “organización en equipo”
function getEquipoCochesDia(){
  // usamos el KPI central de Optimicer (capacidad práctica con organización)
  return _num(store?.results?.optimicer?.kpi_central, 0);
}

// Objetivo “+1 ciclo completo”
function getPlusOneCicloObjetivo(cpd_equipo){
  return Math.max(_ceilNice(cpd_equipo), cpd_equipo); // siguiente entero visible
}

// ====== RENDER PRINCIPAL ======
window.renderOptimicerResults=function(){
  const app = document.getElementById('app');

  // Datos base
  const real_cpd   = getRealCochesDia();
  const ideal_cpd  = Math.max(real_cpd, getIdealCochesDia()); // guardarraíl
  const { hp, hc } = getHorasPorCoche();

  const piezas_real  = cochesDiaToPiezasDia(real_cpd,  hp);
  const piezas_ideal = cochesDiaToPiezasDia(ideal_cpd, hp);

  const { cabina, pintura, chapa } = getAreasCaps();
  const equipo_cpd   = getEquipoCochesDia() || real_cpd; // tras “Optimizar”
  const objetivo_cpd = getPlusOneCicloObjetivo(equipo_cpd);

  const piezas_equipo   = cochesDiaToPiezasDia(equipo_cpd,   hp);
  const piezas_objetivo = cochesDiaToPiezasDia(objetivo_cpd, hp);

  // % comparativas
  const diffIdeal  = real_cpd > 0 ? ((ideal_cpd   - real_cpd) / real_cpd) * 100 : 0;
  const diffEquipo = real_cpd > 0 ? ((equipo_cpd  - real_cpd) / real_cpd) * 100 : 0;
  const diffObj    = real_cpd > 0 ? ((objetivo_cpd - real_cpd) / real_cpd) * 100 : 0;

  // Cálculo económico incremental del “último esfuerzo”
  const { fact_h, margen_h } = getFinanceRatios();
  const diasMes = getDiasMes();
  const horasPorCoche = hp + hc;
  const delta_cpd_last        = Math.max(0, objetivo_cpd - equipo_cpd); // cerrar el entero
  const delta_horas_mes_last  = delta_cpd_last * diasMes * horasPorCoche;
  const delta_fact_last       = delta_horas_mes_last * fact_h;
  const delta_benef_last      = delta_horas_mes_last * margen_h;

  app.innerHTML = `
    <div class="pp-card">
      <div class="pp-title">Producción actual vs potencial</div>
      <div class="pp-grid2">
        <div class="pp-card-big">
          <div class="pp-label">Actual (dato de tu taller)</div>
          <div class="pp-kpi-xl">${fmt1(real_cpd)} coches/día</div>
          <div class="pp-subrow">
            <div>≈ ${fmt0(piezas_real)} piezas/día</div>
          </div>
        </div>
        <div class="pp-card-big">
          <div class="pp-label">Potencial (máxima eficiencia)</div>
          <div class="pp-kpi-xl">${fmt1(ideal_cpd)} coches/día</div>
          <div class="pp-subrow">
            <div>≈ ${fmt0(piezas_ideal)} piezas/día</div>
            <div>${ideal_cpd > real_cpd ? 'Mejora: ' + pct0(diffIdeal) : 'Ya estás en tu máximo actual'}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="pp-card">
      <div class="pp-title">Capacidades por área</div>
      <div class="pp-grid-3">
        <div class="pp-card-big">
          <div class="pp-label">Cabina</div>
          <div class="pp-kpi-xl">${fmt1(cabina)} coches/día</div>
        </div>
        <div class="pp-card-big">
          <div class="pp-label">Pintura</div>
          <div class="pp-kpi-xl">${fmt1(pintura)} coches/día</div>
        </div>
        <div class="pp-card-big">
          <div class="pp-label">Chapa</div>
          <div class="pp-kpi-xl">${fmt1(chapa)} coches/día</div>
        </div>
      </div>
      <div class="pp-note" style="margin-top:8px">
        La capacidad total la marca el área más exigida. Si hoy produces menos, hay margen organizativo (esperas, solapes, tareas).
      </div>
    </div>

    <div class="pp-card">
      <div class="pp-title">¿Quieres mejorar tu organización?</div>
      <div class="pp-cta">
        <button class="pp-btn" id="pp-optimize">Optimizar mi taller</button>
      </div>
    </div>

    <div class="pp-card" id="pp-equipo" style="display:none">
      <div class="pp-title">Organización en equipo (si aplica)</div>
      <div class="pp-grid2">
        <div class="pp-card-big">
          <div class="pp-label">Nuevo objetivo de producción</div>
          <div class="pp-kpi-xl">${fmt1(equipo_cpd)} coches/día</div>
          <div class="pp-subrow">
            <div>≈ ${fmt0(piezas_equipo)} piezas/día</div>
            <div>vs real: ${pct0(diffEquipo)}</div>
          </div>
        </div>
        <div class="pp-card-big">
          <div class="pp-label">Siguiente meta (cerrar el próximo ciclo)</div>
          <div class="pp-kpi-xl">${fmt1(objetivo_cpd)} coches/día</div>
          <div class="pp-subrow">
            <div>≈ ${fmt0(piezas_objetivo)} piezas/día</div>
            <div>vs real: ${pct0(diffObj)}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="pp-card" id="pp-last" style="display:none">
      <div class="pp-title">Último esfuerzo: terminar 1 ciclo más al día</div>
      <div class="pp-grid2">
        <div class="pp-card-big">
          <canvas id="pp-evo" height="520"></canvas>
        </div>
        <div class="pp-card-big">
          <div class="pp-label">Impacto estimado del ciclo adicional</div>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
            <div><b>+ Facturación/mes:</b> € ${euro0(delta_fact_last)}</div>
            <div><b>+ Beneficio/mes:</b> € ${euro0(delta_benef_last)}</div>
            <div class="pp-note">Cálculo incremental a partir de tu margen por hora y días de trabajo/mes.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // CTA: mostrar bloques 4 y 5 con mini “animación”
  const btn = document.getElementById('pp-optimize');
  btn.onclick = () => {
    btn.disabled = true;
    btn.textContent = "Reorganizando recursos…";
    setTimeout(() => {
      document.getElementById('pp-equipo').style.display = '';
      document.getElementById('pp-last').style.display = '';
      btn.closest('.pp-card').style.display = 'none';
      drawEvolChart('pp-evo', {
        real: real_cpd,
        equipo: equipo_cpd,
        objetivo: objetivo_cpd,
        hp
      });
    }, 900);
  };
}

// ====== Chart: Evolución producción ======
function drawEvolChart(canvasId, data){
  const el = document.getElementById(canvasId);
  if(!el || !window.Chart) return;
  const piezas = (v) => Math.round(cochesDiaToPiezasDia(v, data.hp));

  const labels = ['Hoy', 'Equipo', 'Ciclo +1'];
  const values = [data.real, data.equipo, data.objetivo];

  // Limpiar instancia previa
  if(el._chart){ el._chart.destroy(); }

  el._chart = new Chart(el.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Coches/día',
        data: values,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed.y;
              return ` ${v.toFixed(1)} coches/día  •  ≈ ${piezas(v)} piezas/día`;
            }
          }
        }
      },
      scales: {
        x: { ticks: { font: { size: 13 } } },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 0.5, font: { size: 13 } },
          title: { display: true, text: 'Coches/día' }
        }
      }
    }
  });

store.ui.stage = 'opt_done';
const root = $app();
root.innerHTML = '';
renderDashboardCards(root, store);       // ahora con datos de O si los usas
renderPEBlock(root, store);
renderScenarioButtons(root);





}

// Exponer global para app.js
window.renderOptimicerResults = renderOptimicerResults;

