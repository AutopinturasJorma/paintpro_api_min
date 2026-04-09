// frontend/static/js/views/dashboard_cards.js
// Actualiza los KPIs de la Dashboard con datos reales del backend Finance

export function renderDashboardCards(root, store) {
  const F = store.results?.finance || {};
  const bridge = F.finance_bridge || {};
  const kpis = F.kpis || {};

  // --- Helpers ---
  const N = (v, d = 0) => (v == null || isNaN(v) ? d : Number(v));
  const euro0 = v => N(v).toLocaleString('es-ES', { maximumFractionDigits: 0 });
  const euro2 = v => N(v).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = v => `${N(v, 0).toFixed(1)} %`;

  // --- Datos clave ---
  const factMes = N(kpis.fact_mes_real || bridge.fact_mes_real);
  const benefMes = N(kpis.benef_mes_real || bridge.benef_mes_real);
  const factHora = N(bridge.facturacion_hora);
  const costeHora = N(bridge.coste_hora);
  const margenHora = N(bridge.margen_contribucion_hora);
  const vehMes = N(kpis.veh_mes_pot || bridge.veh_mes_pot);
  const horasMes = N(bridge.horas_reales_mes);
  const horasChapa = N(bridge.horas_chapa_mes);
  const horasPintura = N(bridge.horas_pintura_mes);
  const piezasMes = N(bridge.piezas_mes);

  // --- Render UI ---
  root.innerHTML = `
    <section class="section">
      <h2>Resumen financiero</h2>
      <div class="cards" style="grid-template-columns:repeat(2,1fr)">
        <div class="card big center">
          <div class="kpi">€ ${euro0(factMes)}</div>
          <div class="label">FACTURACIÓN / MES</div>
        </div>
        <div class="card big center">
          <div class="kpi">€ ${euro0(benefMes)}</div>
          <div class="label">BENEFICIO / MES</div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Producción</h2>
      <div class="cards" style="grid-template-columns:repeat(4,1fr)">
        <div class="card big center">
          <div class="kpi">${vehMes}</div>
          <div class="label">COCHES / MES</div>
        </div>
        <div class="card big center">
          <div class="kpi">${piezasMes}</div>
          <div class="label">PIEZAS / MES</div>
        </div>
        <div class="card big center">
          <div class="kpi">${horasChapa}</div>
          <div class="label">HORAS CHAPA / MES</div>
        </div>
        <div class="card big center">
          <div class="kpi">${horasPintura}</div>
          <div class="label">HORAS PINTURA / MES</div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Ingresos y costes por hora</h2>
      <div class="cards" style="grid-template-columns:repeat(3,1fr)">
        <div class="card big center">
          <div class="kpi">€ ${euro2(factHora)}</div>
          <div class="label">FACTURACIÓN / HORA</div>
        </div>
        <div class="card big center">
          <div class="kpi">€ ${euro2(costeHora)}</div>
          <div class="label">COSTE / HORA</div>
        </div>
        <div class="card big center">
          <div class="kpi">€ ${euro2(margenHora)}</div>
          <div class="label">MARGEN CONTRIBUCIÓN / HORA</div>
        </div>
      </div>
    </section>
  `;
}

window.renderDashboardCards = renderDashboardCards;
