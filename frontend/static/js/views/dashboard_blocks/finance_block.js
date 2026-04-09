/*************************************************
 * PaintPro - Dashboard Block 1: Finanzas
 * Muestra la facturación y beneficio mensual/anual.
 *************************************************/

function renderFinanceBlock(root, store) {
  if (!root) return;
  const f = store.results?.finance?.bloque3?.real || {};

  const factMes = N(store.results?.finance?.kpis?.fact_mes_real || store.results?.analytics?.finance_bridge?.fact_mes_real);
  const beneMes = N(store.results?.finance?.kpis?.beneficio_mes || 0);

  root.innerHTML = `
    <h2>Resumen financiero</h2>
    <div class="cards" style="grid-template-columns:repeat(2,1fr)">
      <div class="card big center">
        <div class="kpi">€ ${(f.facturacion_mes || 0).toLocaleString('es-ES')}</div>
        <div class="label">FACTURACIÓN / MES</div>
      </div>
      <div class="card big center">
        <div class="kpi">€ ${(f.beneficio_mes || 0).toLocaleString('es-ES')}</div>
        <div class="label">BENEFICIO / MES</div>
      </div>
    </div>
  `;
}
window.renderFinanceBlock = renderFinanceBlock;
