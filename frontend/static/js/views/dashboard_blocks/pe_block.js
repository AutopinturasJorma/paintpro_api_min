function renderPEBlock(root, store) {
const peDia = store.results?.finance?.kpis?.pe_dia || '—';
const peHoras = N(store.results?.finance?.kpis?.pe_horas_mes || 0);


  root.innerHTML = `
    <h2>Punto de equilibrio</h2>
    <div class="card big center" style="padding:24px">
      <canvas id="pe-canvas" width="600" height="200" style="background:#fafafa;border:1px dashed #ccc"></canvas>
      <div class="label" style="margin-top:8px">Simulación gráfica pendiente</div>
    </div>
  `;
}
window.renderPEBlock = renderPEBlock;
