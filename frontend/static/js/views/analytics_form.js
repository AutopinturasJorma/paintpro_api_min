// frontend/static/js/views/analytics_form.js
// Wizard Analytics (4 pasos). Solo UI. Guarda en store.inputs y llama a submitAnalytics.
// Requiere: window.store (con .inputs), window.submitAnalytics, window.showLoading/window.hideLoading (opcional).

(function(){
  // ---------- helpers ----------
  function $(sel, root=document){ return root.querySelector(sel); }
  function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
  function ensureStore(){
    if(!window.store) window.store = { ui:{}, inputs:{}, results:{} };
    if(!window.store.inputs) window.store.inputs = {};
  }
  function setInput(k, v){ ensureStore(); window.store.inputs[k] = v; }
  function getInput(k, def=null){ ensureStore(); return (k in window.store.inputs) ? window.store.inputs[k] : def; }
  function num(el){ const v = Number(el.value); return isNaN(v) ? 0 : v; }
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
  function haptic(){ try{ navigator.vibrate && navigator.vibrate(6); }catch(_){ /*noop*/ } }
  function valOrEmpty(v){ if(v==null || v==='null' || v==='undefined') return ''; const n=Number(v); return Number.isFinite(n)?String(n):''; }

  // ---------- Paso 1: tipo de vehículo + perfil ----------
  function viewStep1(root){
    const veh = getInput('tipo_vehiculo','turismo');
    const perfil = getInput('perfil','express');

    root.innerHTML = `
      <section class="section" id="pp-analytics-step1">
        <h2 style="margin-bottom:16px">
          ¿Qué tipo de vehículos reparas y cuál es el perfil de reparaciones en tu taller?
        </h2>

        <!-- Tipo de vehículo -->
        <div class="cards veh-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:16px">
          <button class="card big pp-veh-card ${veh==='turismo'?'is-active':''}" data-veh="turismo" type="button"
                  style="text-align:left; display:flex; gap:12px; align-items:center; background:#eef6ff; border:1px solid #d6e9ff;">
            <span style="font-size:28px">🚗</span>
            <div>
              <div class="label">Tipo de vehículo</div>
              <div class="kpi" style="font-size:16px; font-weight:600">Turismo</div>
            </div>
          </button>

          <button class="card big pp-veh-card ${veh==='industrial'?'is-active':''}" data-veh="industrial" type="button"
                  style="text-align:left; display:flex; gap:12px; align-items:center; background:#eef6ff; border:1px solid #d6e9ff;">
            <span style="font-size:28px">🚛</span>
            <div>
              <div class="label">Tipo de vehículo</div>
              <div class="kpi" style="font-size:16px; font-weight:600">Vehículo industrial</div>
            </div>
          </button>
        </div>

        <!-- Mix de reparaciones -->
        <div class="label" style="margin:8px 0 6px">Perfil de reparaciones</div>
        <div class="cards" style="grid-template-columns:repeat(2,1fr);">
          ${renderMixCard('express','Express',[45,40,10,5],'Predominan reparaciones leves y medias.',perfil==='express')}
          ${renderMixCard('media','Media',[30,50,15,5],'Predominan daños medios.',perfil==='media')}
          ${renderMixCard('fuerte','Fuerte',[15,35,35,15],'Predominan daños fuertes.',perfil==='fuerte')}
          ${renderMixCard('gran','Gran siniestro',[10,25,35,30],'Predominan grandes siniestros.',perfil==='gran')}
        </div>

        <!-- Personalizar mezcla (opcional) -->
        <div style="margin-top:12px">
          <button type="button" class="pp-btn pp-ghost" id="pp-mix-toggle">Ajustar mezcla manualmente</button>
        </div>
        <div id="pp-mix-custom" hidden style="margin-top:12px">
          <div class="cards" style="grid-template-columns:repeat(2,1fr)">
            ${renderSlider('Leve','leve',getInput('mix_leve',40))}
            ${renderSlider('Medio','medio',getInput('mix_medio',45))}
            ${renderSlider('Fuerte','fuerte',getInput('mix_fuerte',10))}
            ${renderSlider('Gran siniestro','gran',getInput('mix_gran',5))}
          </div>
          <div class="label" style="margin-top:8px">Los cuatro porcentajes deben sumar 100%.</div>
        </div>

        <!-- CTA -->
        <div style="margin-top:16px; display:flex; gap:8px; justify-content:flex-end">
          <button class="pp-btn" id="pp-analytics-next">Siguiente</button>
        </div>
      </section>
    `;

    // Interacción vehículo y perfil
    $all('.pp-veh-card', root).forEach(btn=>{
      btn.addEventListener('click',()=>{
        $all('.pp-veh-card',root).forEach(b=>b.classList.remove('is-active'));
        btn.classList.add('is-active');
        setInput('tipo_vehiculo',btn.dataset.veh);
      });
    });
    $all('.pp-mix-card', root).forEach(btn=>{
      btn.addEventListener('click',()=>{
        $all('.pp-mix-card',root).forEach(b=>b.classList.remove('is-active'));
        btn.classList.add('is-active');
        setInput('perfil',btn.dataset.mix);
      });
    });

    // Toggle sliders
    const tgl=$('#pp-mix-toggle',root),box=$('#pp-mix-custom',root);
    if(tgl&&box){
      tgl.addEventListener('click',()=>{
        const open=!box.hasAttribute('hidden');
        if(open){box.setAttribute('hidden','');tgl.textContent='Ajustar mezcla manualmente';}
        else{box.removeAttribute('hidden');tgl.textContent='Ocultar mezcla manual';}
      });
    }

    autoBalanceSliders(root);
    $('#pp-analytics-next',root)?.addEventListener('click',()=>viewStep2(root));
  }

  function renderMixCard(key,title,arrPerc,subtitle,active){
    const[leve,medio,fuerte,gran]=arrPerc;
    return `
      <button class="card pp-mix-card ${active?'is-active':''}" data-mix="${key}" type="button" style="text-align:left;background:#eef6ff;border:1px solid #d6e9ff;">
        <div class="kpi" style="font-size:16px;font-weight:600">${title}</div>
        <div class="mini-bars" style="margin-top:8px">
          <div class="label">Leve / Medio / Fuerte / Gran</div>
          <div class="bar" style="display:flex;height:8px;overflow:hidden;border-radius:4px;background:#eee">
            <span style="width:${leve}%;background:#4aa3ff"></span>
            <span style="width:${medio}%;background:#ff9f43"></span>
            <span style="width:${fuerte}%;background:#ff4d4f"></span>
            <span style="width:${gran}%;background:#111"></span>
          </div>
        </div>
        <div class="label" style="margin-top:6px">${subtitle}</div>
      </button>`;
  }

  function renderSlider(label,key,val){
    const safe=valOrEmpty(val)===''?'0':valOrEmpty(val);
    return `
      <div class="card">
        <div class="label">${label} (%)</div>
        <input id="mix-${key}" type="range" min="0" max="100" value="${safe}">
        <div class="kpi"><span id="mix-${key}-val">${safe}</span>%</div>
      </div>`;
  }

  function autoBalanceSliders(root){
    const ids=['leve','medio','fuerte','gran'];
    const el=k=>$('#mix-'+k,root);
    const out=k=>$('#mix-'+k+'-val',root);
    const val=k=>Number(el(k).value);
    const pairs={leve:'gran',gran:'leve',medio:'fuerte',fuerte:'medio'};

    function setVal(k,v){
      const vv=Math.round(clamp(v,0,100));
      el(k).value=vv; if(out(k)) out(k).textContent=vv; setInput('mix_'+k,vv);
    }

    function rebalance(changed){
      const opposite=pairs[changed];
      const others=ids.filter(k=>k!==changed && k!==opposite);
      const c=val(changed);
      let a=val(others[0]),b=val(others[1]);
      let targetOpp=100-c-a-b;
      if(targetOpp<0){
        let overflow=-targetOpp;
        if(a>=b){a-=overflow; if(a<0)a=0;} else {b-=overflow;if(b<0)b=0;}
        setVal(others[0],a); setVal(others[1],b);
        targetOpp=100-c-a-b;
      }
      setVal(opposite,clamp(targetOpp,0,100));
    }

    ids.forEach(k=>{
      const input=el(k); if(!input) return;
      input.addEventListener('input',()=>{rebalance(k);haptic();});
      setVal(k,val(k));
    });
  }

  // ---------- Paso 2 ----------
  function viewStep2(root){
    root.innerHTML=`
      <section class="section" id="pp-analytics-step2">
        <h2 style="margin-bottom:16px">¿Cómo es la zona de chapa y pintura?</h2>
        <div class="cards" style="grid-template-columns:repeat(2,1fr);gap:12px">
          ${numCard('Pintores','pintores',getInput('pintores',3))}
          ${numCard('Chapistas','chapistas',getInput('chapistas',2))}
          ${numCard('Puestos de pintura','puestos_pintura',getInput('puestos_pintura',2))}
          ${numCard('Puestos de chapa','puestos_chapa',getInput('puestos_chapa',2))}
        </div>
        <div class="label" style="margin-top:8px">Cuenta solo los puestos donde se puede trabajar a la vez.</div>
        <div style="margin-top:16px;display:flex;gap:8px;justify-content:space-between">
          <button class="pp-btn pp-ghost" id="pp-back-1">Atrás</button>
          <button class="pp-btn" id="pp-analytics-next-2">Siguiente</button>
        </div>
      </section>`;
    $all('.pp-num-card',root).forEach(card=>{
      const key=card.dataset.key; const input=$('input',card);
      $('.minus',card).addEventListener('click',()=>{input.value=clamp(num(input)-1,0,999);setInput(key,Number(input.value));haptic();});
      $('.plus',card).addEventListener('click',()=>{input.value=clamp(num(input)+1,0,999);setInput(key,Number(input.value));haptic();});
      input.addEventListener('input',()=>setInput(key,Number(input.value||0)));
    });
    $('#pp-back-1',root)?.addEventListener('click',()=>viewStep1(root));
    $('#pp-analytics-next-2',root)?.addEventListener('click',()=>viewStep3(root));
  }

  function numCard(label,key,value){
    return `
      <div class="card pp-num-card" data-key="${key}" style="display:flex;align-items:center;justify-content:space-between;gap:12px">
        <div>
          <div class="label">${label}</div>
          <input type="number" inputmode="numeric" value="${valOrEmpty(value)}" style="width:120px;font:600 16px/1.2 system-ui;padding:6px 8px">
        </div>
        <div style="display:flex;gap:6px">
          <button class="pp-btn pp-ghost minus" type="button">−</button>
          <button class="pp-btn plus" type="button">+</button>
        </div>
      </div>`;
  }

  // ---------- Paso 3 ----------
  function viewStep3(root){
    const j=getInput('jornada','continua');
    const pintores=Number(getInput('pintores',3));
    const cochesDefault=pintores*5;
    if(!getInput('coches_semana')||getInput('coches_semana')===0)setInput('coches_semana',cochesDefault);

    root.innerHTML=`
      <section class="section" id="pp-analytics-step3">
        <h2 style="margin-bottom:16px">¿Cuál es vuestra jornada habitual?</h2>
        <div class="cards" style="grid-template-columns:repeat(2,1fr);gap:12px">
          <div class="card">
            <div class="label">Jornada</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
              <button type="button" class="pp-btn ${j==='continua'?'is-active':'pp-ghost'}" id="j-cont">Continua</button>
              <button type="button" class="pp-btn ${j==='partida'?'is-active':'pp-ghost'}" id="j-part">Partida</button>
            </div>
          </div>
          <div class="card">
            <div class="label">Horas por día</div>
            <input id="in-horas-dia" type="number" value="${getInput('horas_dia',8)}">
          </div>
          <div class="card">
            <div class="label">Días por semana</div>
            <input id="in-dias-semana" type="number" value="${getInput('dias_semana',5)}">
          </div>
          <div class="card">
            <div class="label">Producción actual (coches/semana)</div>
            <input id="in-coches-semana" type="number" value="${getInput('coches_semana',cochesDefault)}">
          </div>
        </div>
        <div style="margin-top:16px;display:flex;gap:8px;justify-content:space-between">
          <button class="pp-btn pp-ghost" id="pp-back-2">Atrás</button>
          <button class="pp-btn" id="pp-analytics-next-3">Siguiente</button>
        </div>
      </section>`;
    $('#j-cont',root).addEventListener('click',()=>{setInput('jornada','continua');viewStep3(root);});
    $('#j-part',root).addEventListener('click',()=>{setInput('jornada','partida');viewStep3(root);});
    $('#in-horas-dia',root).addEventListener('input',e=>setInput('horas_dia',Number(e.target.value||0)));
    $('#in-dias-semana',root).addEventListener('input',e=>setInput('dias_semana',Number(e.target.value||0)));
    $('#in-coches-semana',root).addEventListener('input',e=>setInput('coches_semana',Number(e.target.value||0)));
    $('#pp-back-2',root)?.addEventListener('click',()=>viewStep2(root));
    $('#pp-analytics-next-3',root)?.addEventListener('click',()=>viewStep4(root));
  }

  // ---------- Paso 4 ----------
  function viewStep4(root){
    const pintores=Number(getInput('pintores',3));
    const pinturaDefault=pintores*1750;
    const recambiosDefault=pinturaDefault*5;
    if(!getInput('compras_pintura_mes')||getInput('compras_pintura_mes')===0)setInput('compras_pintura_mes',pinturaDefault);
    if(!getInput('compras_recambios_mes')||getInput('compras_recambios_mes')===0)setInput('compras_recambios_mes',recambiosDefault);

    root.innerHTML=`
      <section class="section" id="pp-analytics-step4">
        <h2 style="margin-bottom:16px">Compras y precio por hora</h2>
        <div class="cards" style="grid-template-columns:repeat(2,1fr);gap:12px">
          <div class="card">
            <div class="label">Compras de pintura (€/mes)</div>
            <input id="in-comp-pint" type="number" value="${getInput('compras_pintura_mes',pinturaDefault)}">
          </div>
          <div class="card">
            <div class="label">Compras de recambios (€/mes)</div>
            <input id="in-comp-rec" type="number" value="${getInput('compras_recambios_mes',recambiosDefault)}">
          </div>
          <div class="card">
            <div class="label">Precio MO (€/hora facturada)</div>
            <input id="in-precio-h" type="number" value="${getInput('precio_mo_h',28)}">
          </div>
        </div>
        <div style="margin-top:16px;display:flex;gap:8px;justify-content:space-between">
          <button class="pp-btn pp-ghost" id="pp-back-3">Atrás</button>
          <button class="pp-btn" id="pp-analytics-submit">Calcular producción</button>
        </div>
      </section>`;
    $('#in-comp-pint',root).addEventListener('input',e=>setInput('compras_pintura_mes',Number(e.target.value||0)));
    $('#in-comp-rec',root).addEventListener('input',e=>setInput('compras_recambios_mes',Number(e.target.value||0)));
    $('#in-precio-h',root).addEventListener('input',e=>{
      const v=Number(e.target.value||0);setInput('precio_mo_h',v);setInput('tarifa_mo_h',v);
    });
    $('#pp-back-3',root)?.addEventListener('click',()=>viewStep3(root));
    $('#pp-analytics-submit',root)?.addEventListener('click',()=>{
      window.showLoading&&window.showLoading('Analizando tu taller…');
      try{
        if(typeof window.submitAnalytics==='function')window.submitAnalytics(window.store.inputs);
        else{console.warn('submitAnalytics no está disponible.');window.hideLoading&&window.hideLoading();}
      }catch(e){console.error(e);window.hideLoading&&window.hideLoading();}
    });
  }

  // ---------- API global ----------
  window.renderAnalyticsForm=function(root){
    if(!root)root=document.getElementById('app');
    if(!getInput('tipo_vehiculo'))setInput('tipo_vehiculo','turismo');
    if(!getInput('perfil'))setInput('perfil','express');
    if(getInput('horas_dia')==null)setInput('horas_dia',8);
    if(getInput('dias_semana')==null)setInput('dias_semana',5);
    viewStep1(root);
  };
})();
