function renderEfficiencyBlock(root, store) {
  const eff = N(store.results?.optimicer?.eff_global || 0);
  const cuello = store.results?.optimicer?.cuello_bottleneck || '–';
  const mejora = N(store.results?.optimicer?.mejora_potencial || 0);

  
  
  root.innerHTML = `
    <h2>Eficiencia y Cuellos de Botella</h2>
    <div class="cards" style="grid-template-columns:repeat(3,1fr)">
      <div class="card big center"><div class="kpi pp-skel">0%</div><div class="label">EFICIENCIA GLOBAL</div></div>
      <div class="card big center"><div class="kpi pp-skel">Cabina</div><div class="label">CUELLO DE BOTELLA</div></div>
      <div class="card big center"><div class="kpi pp-skel">+0%</div><div class="label">MEJORA POTENCIAL</div></div>
    </div>
  `;
}
window.renderEfficiencyBlock = renderEfficiencyBlock;
