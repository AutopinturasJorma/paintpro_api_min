// frontend/static/js/views/finance_form.js
// Wizard Finance (1 paso). Calcula salud financiera tras Analytics.
// Requiere: window.store (con .inputs y .derived) y window.submitFinance().

(function(){
  function $(sel, root=document){ return root.querySelector(sel); }
  function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
  function ensureStore(){
    if(!window.store) window.store = { ui:{}, inputs:{}, results:{}, derived:{} };
    if(!window.store.inputs) window.store.inputs = {};
  }
  function getInput(k, def=null){ ensureStore(); return (k in window.store.inputs) ? window.store.inputs[k] : def; }
  function setInput(k,v){ ensureStore(); window.store.inputs[k] = v; }
  function num(v){ const n = Number(v); return isNaN(n)?0:n; }
  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
  function valOrEmpty(v){ if(v==null||v==='null'||v===undefined)return''; const n=Number(v); return Number.isFinite(n)?String(n):''; }
  function haptic(){ try{ navigator.vibrate && navigator.vibrate(6); }catch(_){ } }

  // ---------- Form principal ----------
  window.renderFinanceForm = function(root){
    ensureStore();
    if(!root) root = document.getElementById('app');
    const i = window.store.inputs;
    const pintores  = num(getInput('pintores',2));
    const chapistas = num(getInput('chapistas',2));
    const coches_semana = num(getInput('coches_semana',18));

    // --- valores por defecto automáticos ---
    const defaults = {
      fijos_alquiler: 1500,
      fijos_personal_productivo: 2000 * (pintores + chapistas),
      fijos_personal_indirecto: 2500,
      fijos_otros: 500,
      prod_gas: coches_semana * 4 * 10,
      prod_luz: 300,
      prod_otros: 100
    };

    // set default si no hay valor previo
    for(const [k,v] of Object.entries(defaults)){
      if(getInput(k)==null || getInput(k)==='') setInput(k,v);
    }

    root.innerHTML = `
      <section class="section" id="pp-finance-form">
        <h2 style="margin-bottom:16px">Costes y gastos mensuales del taller</h2>

        <div class="cards" style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">

          <div class="card">
            <div class="label">Alquiler / instalaciones (€ / mes)</div>
            <input id="in-fijos-alquiler" type="number" value="${valOrEmpty(getInput('fijos_alquiler'))}" style="width:160px;font:600 16px/1.2 system-ui;padding:6px 8px">
          </div>

          <div class="card">
            <div class="label">Personal productivo (€ / mes)</div>
            <input id="in-fijos-prod" type="number" value="${valOrEmpty(getInput('fijos_personal_productivo'))}" style="width:160px;font:600 16px/1.2 system-ui;padding:6px 8px">
            <div class="label-mini">≈ 2000 × (${pintores}+${chapistas})</div>
          </div>

          <div class="card">
            <div class="label">Personal indirecto (€ / mes)</div>
            <input id="in-fijos-indir" type="number" value="${valOrEmpty(getInput('fijos_personal_indirecto'))}" style="width:160px;font:600 16px/1.2 system-ui;padding:6px 8px">
          </div>

          <div class="card">
            <div class="label">Otros fijos (€ / mes)</div>
            <input id="in-fijos-otros" type="number" value="${valOrEmpty(getInput('fijos_otros'))}" style="width:160px;font:600 16px/1.2 system-ui;padding:6px 8px">
          </div>

          <div class="card">
            <div class="label">Gas / energía térmica (€ / mes)</div>
            <input id="in-prod-gas" type="number" value="${valOrEmpty(getInput('prod_gas'))}" style="width:160px;font:600 16px/1.2 system-ui;padding:6px 8px">
            <div class="label-mini">≈ ${coches_semana} coches/sem × 4 × 10€</div>
          </div>

          <div class="card">
            <div class="label">Electricidad (€ / mes)</div>
            <input id="in-prod-luz" type="number" value="${valOrEmpty(getInput('prod_luz'))}" style="width:160px;font:600 16px/1.2 system-ui;padding:6px 8px">
          </div>

          <div class="card">
            <div class="label">Otros variables (€ / mes)</div>
            <input id="in-prod-otros" type="number" value="${valOrEmpty(getInput('prod_otros'))}" style="width:160px;font:600 16px/1.2 system-ui;padding:6px 8px">
          </div>

        </div>

        <div style="margin-top:20px;display:flex;justify-content:space-between;gap:12px">
          <button class="pp-btn pp-ghost" id="pp-back-analytics">Atrás</button>
          <button class="pp-btn" id="pp-finance-submit">Calcular salud financiera</button>
        </div>
      </section>
    `;

    // listeners de inputs
    $('#in-fijos-alquiler',root).addEventListener('input', e=> setInput('fijos_alquiler', num(e.target.value)) );
    $('#in-fijos-prod',root).addEventListener('input', e=> setInput('fijos_personal_productivo', num(e.target.value)) );
    $('#in-fijos-indir',root).addEventListener('input', e=> setInput('fijos_personal_indirecto', num(e.target.value)) );
    $('#in-fijos-otros',root).addEventListener('input', e=> setInput('fijos_otros', num(e.target.value)) );
    $('#in-prod-gas',root).addEventListener('input', e=> setInput('prod_gas', num(e.target.value)) );
    $('#in-prod-luz',root).addEventListener('input', e=> setInput('prod_luz', num(e.target.value)) );
    $('#in-prod-otros',root).addEventListener('input', e=> setInput('prod_otros', num(e.target.value)) );

    // Botones
    $('#pp-back-analytics',root)?.addEventListener('click', ()=>{
      if(typeof window.renderAnalyticsForm==='function') window.renderAnalyticsForm(root);
    });

    $('#pp-finance-submit',root)?.addEventListener('click', ()=>{
      if(typeof window.submitFinance==='function'){
        window.submitFinance(window.store.inputs);
      }else{
        alert('Función submitFinance no encontrada.');
      }
    });
  };
})();
