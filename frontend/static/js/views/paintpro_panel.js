/ views/paintpro_panel.js
// Panel PaintPro: Tecnologías + Delta + Recomendaciones (+ modo consultor)

export function renderPaintProPanel(rootEl, store){
  const O = store?.results?.optimicer || {};
  const T = O?.tecnologias || {};
  const D = O?.optimizacion || {};
  const R = O?.recomendaciones || {};

  // helpers
  const N = (v,d=0)=> (v==null || v==='' || isNaN(Number(v))) ? d : Number(v);
  const one1 = v => Number(v||0).toLocaleString('es-ES',{maximumFractionDigits:1});
  const euro0= v => Number(v||0).toLocaleString('es-ES',{maximumFractionDigits:0});

  // no muestres si no estamos en modo 'pp'
  const mode = store?.ui?.mode || store?.ui?.scenario || 'actual';
  if (mode !== 'pp') return;

  const badges = [
    T?.usa_visualid ? '<span class="pp-badge pp-badge-green">VisualID</span>' : '<span class="pp-badge pp-badge-gray">VisualID</span>',
    T?.usa_moonwalk ? '<span class="pp-badge pp-badge-green">MoonWalk</span>' : '<span class="pp-badge pp-badge-gray">MoonWalk</span>',
    T?.usa_ova      ? '<span class="pp-badge pp-badge-green">OVA</span>'      : '<span class="pp-badge pp-badge-gray">OVA</span>'
  ].join(' ');

  const cuello = D?.cuello_mejor || '—';
  const delta  = N(D?.delta_coches);
  const obj    = N(D?.objetivo_entero_dia);
  const best   = N(D?.salida_mejor_dia);

  const cab_h  = N(D?.necesidades?.cabina_horas_extra_dia);
  const pint_h = N(D?.necesidades?.pintura_horas_extra_dia);

  const recs = Array.isArray(R?.lista) ? R.lista : [];
  const guards = Array.isArray(R?.guardarrailes) ? R.guardarrailes : [];

  rootEl.insertAdjacentHTML('beforeend', `
    <section class="section">
      <h2>Escenario PaintPro</h2>

      <div class="cards kpi-triple">

        <!-- Tecnologías -->
        <div class="card big">
          <div class="label">Tecnologías aplicadas</div>
          <div style="margin:8px 0 6px">${badges}</div>
          <div class="grid section soft">
            <div class="card center">
              <div class="kpi">${one1(T?.ciclo_cabina_min_pp || 0)}'</div>
              <div class="label">Ciclo de cabina (PP)</div>
            </div>
            <div class="card center">
              <div class="kpi">${one1(T?.pistola_min_pp || 0)}'</div>
              <div class="label">Min. pistola (PP)</div>
            </div>
            <div class="card center">
              <div class="kpi">${one1(T?.extra_color_h || 0)} h</div>
              <div class="label">Color/maniobras</div>
            </div>
          </div>
          <div class="pp-note">Salida diaria con PP: <b>${one1(T?.salida_pp_dia || 0)}</b> (cabina: ${one1(T?.cab_out_pp_dia || 0)})</div>
        </div>

        <!-- Objetivo +1 ciclo (delta) -->
        <div class="card big">
          <div class="label">Objetivo “+1 ciclo/día”</div>
          <div class="grid section soft" style="margin-top:8px">
            <div class="card center">
              <div class="kpi">${one1(best)}</div>
              <div class="label">Salida actual (mejor)</div>
            </div>
            <div class="card center">
              <div class="kpi">${one1(obj)}</div>
              <div class="label">Objetivo entero</div>
            </div>
            <div class="card center">
              <div class="kpi">${one1(delta)}</div>
              <div class="label">Delta coches</div>
            </div>
          </div>

          <div class="grid section soft">
            <div class="card center">
              <div class="kpi">${one1(cab_h)} h</div>
              <div class="label">Cabina extra / día</div>
            </div>
            <div class="card center">
              <div class="kpi">${one1(pint_h)} h</div>
              <div class="label">Pintura extra / día</div>
            </div>
            <div class="card center">
              <div class="pp-badge ${cuello==='cabina' ? 'pp-badge-amber' : (cuello==='pintura'?'pp-badge-amber': 'pp-badge-gray')}">${cuello.toUpperCase()}</div>
              <div class="label">Cuello de botella</div>
            </div>
          </div>

          <div class="pp-note">Bloques operativos: cabina 1h, pintura 2h.</div>
        </div>

        <!-- Recomendaciones -->
        <div class="card big">
          <div class="label">Recomendaciones</div>
          <ul class="pp-list" style="margin:8px 0 0 14px">
            ${recs.length ? recs.map(s=>`<li>${s}</li>`).join('') : '<li>—</li>'}
          </ul>
          ${guards.length ? `
            <div class="pp-divider"></div>
            <div class="pp-title-sm">Guardarraíles</div>
            <ul class="pp-list" style="margin:6px 0 0 14px">
              ${guards.map(s=>`<li>${s}</li>`).join('')}
            </ul>
          `:``}
        </div>

      </div>

      ${store?.ui?.consultant ? renderConsultantBlockHTML(O) : ''}
    </section>
  `);
}

function renderConsultantBlockHTML(O){
  const B = O?.baseline || {};
  const L = O?.organizado || {};
  const T = O?.tecnologias || {};
  const D = O?.optimizacion || {};

  const one1 = v => Number(v||0).toLocaleString('es-ES',{maximumFractionDigits:1});

  return `
    <div class="pp-hr"></div>
    <div class="pp-card" style="border:1px dashed #bdbdbd">
      <div class="pp-title-sm">🔒 Modo consultor — Explicación de cálculo</div>
      <div class="pp-sub">Resumen técnico (baseline → organización → tecnologías → delta):</div>

      <div class="pp-grid2">
        <div>
          <div class="pp-sub"><b>Baseline (push)</b></div>
          <div class="pp-note">Cabina: ${one1(B?.cabina_dia)} · Pintura: ${one1(B?.pintura_dia)} · Chapa: ${one1(B?.chapa_dia)} · Total: <b>${one1(B?.total_dia)}</b> (cuello: ${B?.cuello||'—'})</div>

          <div class="pp-sub" style="margin-top:8px"><b>Organizado</b></div>
          <div class="pp-note">Modo: ${L?.plan?.org_mode||'—'} · Estrategia: ${L?.plan?.estrategia||'—'} · Asignación: ${JSON.stringify(L?.plan?.asignacion||{})}</div>
          <div class="pp-note">Salida línea (cab): ${one1(L?.salida?.cab_out_dia)} · Total: <b>${one1(L?.salida?.total_out_dia)}</b></div>
        </div>

        <div>
          <div class="pp-sub"><b>Tecnologías</b></div>
          <div class="pp-note">VisualID: ${T?.usa_visualid?'Sí':'No'} · MoonWalk: ${T?.usa_moonwalk?'Sí':'No'} · OVA: ${T?.usa_ova?'Sí':'No'}</div>
          <div class="pp-note">Ciclo cabina (PP): ${one1(T?.ciclo_cabina_min_pp)}' · Pistola (PP): ${one1(T?.pistola_min_pp)}' · Color/maniobras: ${one1(T?.extra_color_h)} h</div>

          <div class="pp-sub" style="margin-top:8px"><b>Delta a entero superior</b></div>
          <div class="pp-note">Best: ${one1(D?.salida_mejor_dia)} → Objetivo: ${one1(D?.objetivo_entero_dia)} · Δ coches: ${one1(D?.delta_coches)}</div>
          <div class="pp-note">Necesidades: cabina ${one1(D?.necesidades?.cabina_horas_extra_dia)} h/d · pintura ${one1(D?.necesidades?.pintura_horas_extra_dia)} h/d</div>
        </div>
      </div>
    </div>
  `;
}
