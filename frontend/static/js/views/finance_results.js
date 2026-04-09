// frontend/static/js/views/finance_results.js
// Render de Resultados de FINANCE (charts grandes, BE correcto con zona roja/verde)

window.renderFinanceResults = function (rootEl, finRes, onNext = () => {}) {
  const N = (v, d = 0) => (v == null || v === '' || Number.isNaN(Number(v)) ? d : Number(v));
  const euro0 = v => N(v).toLocaleString('es-ES', { maximumFractionDigits: 0 });
  const euro2 = v => N(v).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const h1 = v => N(v).toLocaleString('es-ES', { maximumFractionDigits: 1 });

  const r = finRes || {};
  const b1 = r.bloque1 || {};
  const b2 = r.bloque2 || {};
  const b3 = r.bloque3 || {};
  const dbg = r.debug || {};

  const mano_h = N(b1?.desglose_fact_h?.mano_obra_h, 0);
  const pint_h = N(b1?.desglose_fact_h?.pintura_h, 0);
  const rec_h = N(b1?.desglose_fact_h?.recambios_h, 0);
  const fact_h = N(b1?.facturacion_hora, mano_h + pint_h + rec_h);

  const materiales_h = N(b1?.desglose_coste_h?.materiales_h, 0);
  const energia_h = N(b1?.desglose_coste_h?.energia_h, 0);
  const otros_h = N(b1?.desglose_coste_h?.otros_var_h, 0);
  const variables_h = materiales_h + energia_h + otros_h;

  const margen_h = Math.max(0, fact_h - variables_h);

  const fijos_mes = N(b2?.detalles?.fijos_mes, N(b1?.desglose_coste_h?.fijos_h, 0) * N(b3?.real?.horas_mes, 1));
  const horas_mes_real = N(b3?.real?.horas_mes, 0);
  const horas_mes_ideal = N(b3?.ideal?.horas_mes, 0);

  const dias_semana = N(dbg?.dias_semana, 5);
  const semanas_mes = N(dbg?.semanas_mes, 4);
  const dias_mes = Math.max(1, dias_semana * semanas_mes);
  const horas_dia_real = horas_mes_real > 0 ? horas_mes_real / dias_mes : 0;

  const be_horas = fijos_mes > 0 && margen_h > 0 ? fijos_mes / margen_h : 0;
  const dia_pe = horas_dia_real > 0 ? Math.min(dias_mes, Math.max(1, Math.ceil(be_horas / horas_dia_real))) : 1;

  const benef_mes_real = margen_h * horas_mes_real - fijos_mes;

  // -------- UI --------
  rootEl.innerHTML = `
    <section class="section">
      <h2>Ingresos y costes por hora</h2>
      <p class="muted">Por cada hora que facturas, estás vendiendo tu <b>mano de obra</b>, <b>recambios</b> y <b>materiales de pintura</b>.</p>
      <div class="pp-grid2">
        <div class="pp-card-big center">
          <div class="pp-kpi-xl">€ ${euro2(fact_h)}</div>
          <div class="pp-sub">INGRESOS POR HORA</div>
        </div>
        <div class="pp-card-big center">
          <div class="pp-kpi-xl">€ ${euro2(margen_h)}</div>
          <div class="pp-sub">MARGEN DE CONTRIBUCIÓN POR HORA</div>
        </div>
      </div>

      <div class="pp-grid2">
        <div class="pp-card-big">
          <h4>Desglose ingreso/hora</h4>
          <ul class="pp-sub">
            <li>Mano de obra: € ${euro2(mano_h)}/h</li>
            <li>Pintura: € ${euro2(pint_h)}/h</li>
            <li>Recambios: € ${euro2(rec_h)}/h</li>
          </ul>
        </div>
        <div class="pp-card-big">
          <h4>Gastos variables/hora</h4>
          <ul class="pp-sub">
            <li>Materiales: € ${euro2(materiales_h)}/h</li>
            <li>Energía: € ${euro2(energia_h)}/h</li>
            ${otros_h ? `<li>Otros variables: € ${euro2(otros_h)}/h</li>` : ``}
          </ul>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Punto de equilibrio</h2>
      <p class="muted">Antes del PE (zona roja) hay <b>pérdida</b>. A partir del PE (zona verde) cada hora facturada genera <b>beneficio</b>.</p>
      <div class="pp-card" style="padding:14px">
        <canvas id="pe-canvas" class="pp-chart pp-chart-tall" height="460"></canvas>
      </div>
      <div class="pp-kpi-tiles" id="ppBeLegend"></div>
    </section>
  `;


};
