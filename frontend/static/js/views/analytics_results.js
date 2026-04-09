// frontend/static/js/views/analytics_results.js
// Muestra REAL vs IDEAL + CTA a Finance
// Acepta (rootEl, data) o (rootEl, store)

window.renderAnalyticsResults = function(rootEl, arg){
  // 1) Normaliza origen: 'data' o 'store'
  const res = (arg && arg.results && arg.results.analytics) ? arg.results.analytics : (arg || {});
  const k   = res.kpis    || {};
  const d   = res.display || {};
  const msg = res.messages || {};
  const flags = res.flags || {};
  const bridge = res.finance_bridge || {}; // horas/fact_hora puente hacia Finance

  // Helpers
  const N = v => (v==null || v==="" || isNaN(Number(v))) ? 0 : Number(v);
  const eur0 = v => N(v).toLocaleString('es-ES',{maximumFractionDigits:0});
  const one1 = v => N(v).toLocaleString('es-ES',{maximumFractionDigits:1});

  // Real
  const veh_sem_real  = N(k.veh_sem_real);
  const veh_mes_real  = N(k.veh_mes_real);
  // Ideal
  const veh_sem_pot   = (d.veh_sem_pot !== undefined) ? N(d.veh_sem_pot) : N(k.veh_sem_pot);
  const veh_mes_pot   = (d.veh_mes_pot !== undefined) ? N(d.veh_mes_pot) : N(k.veh_mes_pot);

  // Facturación mensual real / potencial
  let fact_mes_real  = N(k.fact_mes_real);
  let fact_mes_pot   = (d.fact_mes_pot !== undefined) ? N(d.fact_mes_pot) : N(k.fact_mes_pot);

  // Fallback con el puente (no inventa cálculos: horas * facturacion_hora)
  if (!fact_mes_real) {
    const hR = N(bridge.horas_reales_mes), fH = N(bridge.facturacion_hora);
    if (hR && fH) fact_mes_real = hR * fH;
  }
  if (!fact_mes_pot) {
    const hI = N(bridge.horas_ideales_mes), fH = N(bridge.facturacion_hora);
    if (hI && fH) fact_mes_pot = hI * fH;
  }

  // 3) UI: no mostrar ideal por debajo del real
  const veh_sem_pot_UI  = Math.max(veh_sem_pot, veh_sem_real);
  const veh_mes_pot_UI  = Math.max(veh_mes_pot, veh_mes_real);
  const fact_mes_pot_UI = Math.max(fact_mes_pot, fact_mes_real);

  // Copy
  let pctMejora = 0;
  if (fact_mes_real > 0) pctMejora = Math.max(0, Math.round(((fact_mes_pot_UI - fact_mes_real)/fact_mes_real)*100));
  const primaryText = msg.primary
    || (flags.nivel_optimo
        ? "Ya estás en un nivel óptimo de producción. Ahora mejoraremos la rentabilidad."
        : `Con PaintPro puedes aumentar tu facturación aproximadamente un ${pctMejora}% / mes.`);

  // Render
  rootEl.innerHTML = `
    <div class="pp-card">
      <div class="pp-title">Diagnóstico de producción y facturación</div>

      <div class="pp-stack">
        <div class="pp-card-big">
          <div class="pp-label">Real (estimado)</div>
          <div class="pp-kpi-xl">€ ${eur0(fact_mes_real)}</div>
          <div class="pp-subrow">
            <div>Coches/semana: <b>${one1(veh_sem_real)}</b></div>
            <div>Coches/mes: <b>${one1(veh_mes_real)}</b></div>
          </div>
          <div class="pp-divider"></div>
        </div>

        <div class="pp-card-big">
          <div class="pp-label">Ideal (alta eficiencia)</div>
          <div class="pp-kpi-xl">€ ${eur0(fact_mes_pot_UI)}</div>
          <div class="pp-subrow">
            <div>Coches/semana: <b>${one1(veh_sem_pot_UI)}</b></div>
            <div>Coches/mes: <b>${one1(veh_mes_pot_UI)}</b></div>
          </div>
          <div class="pp-divider"></div>
        </div>

        <div class="pp-delta-note">${primaryText}</div>
      </div>

      <div class="pp-hr"></div>
      <div class="pp-title-sm">Ahora vamos a por lo que importa: tu beneficio</div>
      <div class="pp-cta">
        <button class="pp-btn" id="pp-go-fin">Ver salud financiera</button>
      </div>
    </div>
  `;

  // CTA robusto
  document.getElementById('pp-go-fin')?.addEventListener('click', ()=>{
    // Nueva llamada directa al wizard de gastos
    if (typeof window.renderFinanceForm === 'function') {
      const root = document.getElementById('app');
      root.innerHTML = '';
      window.renderFinanceForm(root);
      return;
    }
    console.warn('No se encontró renderFinanceForm()');
  });
};
