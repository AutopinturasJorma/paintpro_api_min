/*************************************************
 * PaintPro - Dashboard: Bloque Rentabilidad por Hora
 * Muestra facturación, coste y margen por hora + desglose
 *************************************************/

function renderProfitabilityBlock(root, store) {
  const F = store.results?.finance || {};
  const K = F.kpis || {};
  const D = F.display || {};
  const N = v => Number(v || 0).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  const factHora = N(K.facturacion_hora);
  const costeHora = N(K.coste_hora);
  const margenHora = N(K.margen_contribucion_hora);

  const ing = D.ingresos_hora || {};
  const gto = D.gastos_hora || {};

  root.innerHTML += `
    <section class="section">
      <h2>Rentabilidad por hora</h2>
      <div class="cards" style="grid-template-columns:repeat(3,1fr)">
        <div class="card big center">
          <div class="kpi">€ ${factHora}</div>
          <div class="label">FACTURACIÓN / HORA</div>
        </div>
        <div class="card big center">
          <div class="kpi">€ ${costeHora}</div>
          <div class="label">COSTE / HORA</div>
        </div>
        <div class="card big center">
          <div class="kpi">€ ${margenHora}</div>
          <div class="label">MARGEN DE CONTRIBUCIÓN / HORA</div>
        </div>
      </div>

      <div class="grid section soft" style="grid-template-columns:repeat(2,1fr);margin-top:16px">
        <div>
          <div class="label">Desglose de ingresos / hora</div>
          <ul>
            <li>Mano de obra: € ${N(ing.mo || 0)}</li>
            <li>Pintura: € ${N(ing.pintura || 0)}</li>
            <li>Recambios: € ${N(ing.recambios || 0)}</li>
          </ul>
        </div>
        <div>
          <div class="label">Gastos variables / hora</div>
          <ul>
            <li>Materiales: € ${N(gto.materiales || 0)}</li>
            <li>Energía: € ${N(gto.energia || 0)}</li>
            <li>Otros variables: € ${N(gto.otros || 0)}</li>
          </ul>
        </div>
      </div>
    </section>
  `;
}

window.renderProfitabilityBlock = renderProfitabilityBlock;
