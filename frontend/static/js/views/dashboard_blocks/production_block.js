/*************************************************
 * PaintPro - Dashboard: Bloque Producción
 * Muestra volumen de trabajo, horas y ocupación por área
 *************************************************/

function renderProductionBlock(root, store) {
  const A = store.results?.analytics || {};
  const k = A.kpis || {};

  // Helpers
  const N = v => Number(v || 0).toLocaleString('es-ES', { maximumFractionDigits: 1 });


  const vehSem = N(k.veh_sem_real);
  const vehMes = N(k.veh_mes_real);
  const pzsMes = N(k.pzs_mes || 320);

  const hChapa = N(k.horas_chapa_mes);
  const hPint  = N(k.horas_pintura_mes);
  const hTot   = N(k.horas_reales_mes);

  const occChapa = N(k.ocupacion_chapa || 82);
  const occPint  = N(k.ocupacion_pintura || 76);
  const occCab   = N(k.ocupacion_cabina || 95);

  root.innerHTML = `
    <section class="section">
      <h2>Producción</h2>

      <!-- Fila 1: Volumen de trabajo -->
      <div class="cards" style="grid-template-columns:repeat(3,1fr)">
        <div class="card big center">
          <div class="kpi">${vehSem}</div>
          <div class="label">COCHES / SEMANA</div>
        </div>
        <div class="card big center">
          <div class="kpi">${vehMes}</div>
          <div class="label">COCHES / MES</div>
        </div>
        <div class="card big center">
          <div class="kpi">${pzsMes}</div>
          <div class="label">PIEZAS / MES</div>
        </div>
      </div>

      <!-- Fila 2: Horas productivas -->
      <div class="cards" style="grid-template-columns:repeat(3,1fr);margin-top:16px">
        <div class="card big center">
          <div class="kpi">${hChapa}</div>
          <div class="label">HORAS CHAPA / MES</div>
        </div>
        <div class="card big center">
          <div class="kpi">${hPint}</div>
          <div class="label">HORAS PINTURA / MES</div>
        </div>
        <div class="card big center">
          <div class="kpi">${hTot}</div>
          <div class="label">HORAS TOTALES / MES</div>
        </div>
      </div>

      <!-- Fila 3: Ocupación por área -->
      <div class="cards soft" style="grid-template-columns:repeat(3,1fr);margin-top:16px">
        <div class="card center">
          <div class="kpi">${occChapa}%</div>
          <div class="label">OCUPACIÓN CHAPA</div>
        </div>
        <div class="card center">
          <div class="kpi">${occPint}%</div>
          <div class="label">OCUPACIÓN PINTURA</div>
        </div>
        <div class="card center">
          <div class="kpi">${occCab}%</div>
          <div class="label">OCUPACIÓN CABINA</div>
        </div>
      </div>
    </section>
  `;
}

window.renderProductionBlock = renderProductionBlock;
