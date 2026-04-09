// PaintPro - scenario_buttons.js
// Controla los botones para alternar escenarios (Actual / Optimizado / PaintPro)

(function(){
  function $(sel, root=document){ return root.querySelector(sel); }

  window.renderScenarioButtons = function(root, store){
    if(!root) root = document.getElementById('app');
    if(!store || !store.results) return;

    const div = document.createElement('div');
    div.className = 'pp-scenario-buttons';
    div.style = `
      display:flex;
      gap:10px;
      justify-content:center;
      margin-top:20px;
    `;

    div.innerHTML = `
      <button id="btn-situacion" class="pp-btn pp-ghost">Situación actual</button>
      <button id="btn-optimizar" class="pp-btn pp-ghost">Optimizar el taller</button>
      <button id="btn-paintpro" class="pp-btn pp-primary">PaintPro</button>
    `;

    root.appendChild(div);

    // Interacciones
    const btnActual = $('#btn-situacion', div);
    const btnOptim  = $('#btn-optimizar', div);
    const btnPro    = $('#btn-paintpro', div);

    btnActual.addEventListener('click', ()=>{
      console.log('Escenario: situación actual');
      if(window.renderFinanceResults) window.renderFinanceResults(root, store);
    });

    btnOptim.addEventListener('click', ()=>{
      console.log('Escenario: optimizado');
      if(window.renderOptimicerResults) window.renderOptimicerResults(root, store);
    });

    btnPro.addEventListener('click', ()=>{
      console.log('Escenario: paintpro');
      if(window.renderTeamResults) window.renderTeamResults(root, store);
    });
  };
})();
