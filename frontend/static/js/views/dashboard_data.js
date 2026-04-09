// Panel de DATOS (sin gráficos) para validar cifras de Finance + Optimicer
// Escenarios: 'real' | 'opt' | 'pp'
// - Mapea bloque1..bloque4 (con fallback b1..b4)
// - Calcula Día PE (28 días/mes) si no llega del backend
// - En 'real' muestra coches/día con decimales; en 'opt' y 'pp' muestra ENTERO SUPERIOR
// - Añade piezas/día (hp/1.4)
// - En 'pp' resta coste mensual de palanca al beneficio
// - Si existe store.ui.prev, pinta Δ (flecha) vs escenario anterior

export function renderDashboardData(rootEl, store, scenario = 'real') {
  const A = store?.results?.analytics || {};
  const F = store?.results?.finance   || {};
  const O = store?.results?.optimicer || {};

  const n = (v, d = 0) => (v == null || v === '' || Number.isNaN(Number(v)) ? d : Number(v));
  const euro0 = v => Number(v || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 });
  const euro2 = v => Number(v || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const one1  = v => Number(v || 0).toLocaleString('es-ES', { maximumFractionDigits: 1 });

  const SEMANAS_MES = 4;
  const dias_sem = n(store?.inputs?.dias_semana) || 5;
  const dias_mes = dias_sem * SEMANAS_MES; // 28 días

  // Δ vs escenario anterior
  const prev = store?.ui?.prev || null;
  const fmtDelta = (curr, prevVal, goodUp = true, isCurrency = false) => {
    const a = n(prevVal, 0), b = n(curr, 0);
    if (a === 0 && b === 0) return '';
    if (a === 0) {
      const abs = isCurrency ? `€ ${euro0(b)}` : `${one1(b)}`;
      return `<span class="pp-delta pp-delta-green">▲ ${abs}</span>`;
    }
    const diff = b - a;
    const pct  = (diff / Math.abs(a)) * 100;
    const good = goodUp ? diff > 0 : diff < 0;
    const cls  = diff === 0 ? 'pp-delta-flat' : (good ? 'pp-delta-green' : 'pp-delta-red');
    const sign = diff > 0 ? '▲' : (diff < 0 ? '▼' : '■');
    const pctTxt = Math.abs(pct) >= 1 ? Math.round(Math.abs(pct)) : Math.abs(pct).toFixed(1);
    return `<span class="pp-delta ${cls}">${sign} ${pctTxt}%</span>`;
  };

  // -------- Finance --------
  const b1 = F?.bloque1 || F?.b1 || {};
  const b2 = F?.bloque2 || F?.b2 || {};
  const b3 = F?.bloque3 || F?.b3 || {};
  const b4 = F?.bloque4 || F?.b4 || {};

  const fact_h  = n(b1.facturacion_hora);
  const coste_h = n(b1.coste_hora);
  const mc_h    = n(b1.margen_contribucion_hora ?? b1.margen_contribucion_h);

  const pe_horas = n(b2.break_even_horas_mes);
  const horas_mes_real_fin = n(b3?.real?.horas_mes);
  const horas_dia_fact = horas_mes_real_fin > 0 ? (horas_mes_real_fin / dias_mes) : 0;
  const pe_dia_calc = (pe_horas > 0 && horas_dia_fact > 0) ? Math.ceil(pe_horas / horas_dia_fact) : 0;
  const pe_dia = n(b2.break_even_dia_mes) || pe_dia_calc;

  const finReal  = b3?.real  || {};
  const finIdeal = b3?.ideal || {};
  const fact_mes_real = n(finReal.facturacion_mes);
  const bene_mes_real = n(finReal.beneficio_mes);
  const fact_mes_opt  = n(finIdeal.facturacion_mes) || fact_mes_real;
  const bene_mes_opt  = n(finIdeal.beneficio_mes)   || bene_mes_real;

  // -------- Analytics --------
  const k = A?.kpis || {};
  const veh_sem_real = n(k.veh_sem_real);
  const veh_dia_real = veh_sem_real > 0 ? (veh_sem_real / dias_sem) : 0;

  // -------- Optimicer --------
  const base   = O?.baseline || {};
  const org    = O?.organizado || {};
  const caps   = org?.capacidades_linea || {};
  const salida = org?.salida || {};
  const hp_h   = n(O?.parametros?.hp_h);
  const pzs_veh = hp_h > 0 ? (hp_h / 1.4) : 0;

  const veh_dia_opt_src = n(salida.total_out_dia || O?.kpi_central); // coches/día optimizado

  // PaintPro (si viene separado; si no, fallback a opt)
  const OPP = O?.paintpro || {};
  const veh_dia_pp_src = n(OPP?.organizado?.salida?.total_out_dia || OPP?.kpi_central || veh_dia_opt_src);
  const coste_pp = n(OPP?.recomendaciones?.coste_mensual
                 ?? O?.recomendaciones?.coste_mensual
                 ?? OPP?.coste_mensual
                 ?? 0);
  const fact_mes_pp = n(OPP?.finance?.facturacion_mes) || fact_mes_opt;
  const bene_mes_pp_bruto = n(OPP?.finance?.beneficio_mes) || bene_mes_opt;
  const bene_mes_pp_neto  = Math.max(0, bene_mes_pp_bruto - coste_pp);

  // -------- Elección del escenario --------
  const scen = scenario || store?.ui?.scenario || 'real';

  // Regla: en REAL mostramos decimales; en OPT/PP mostramos ENTERO SUPERIOR (objetivo)
  const veh_dia_raw =
    scen === 'opt' ? veh_dia_opt_src :
    scen === 'pp'  ? veh_dia_pp_src  :
                     veh_dia_real;

  const veh_dia_show =
    scen === 'real'
      ? veh_dia_raw
      : (veh_dia_raw > 0 ? Math.ceil(veh_dia_raw) : 0);

  const piezas_dia = veh_dia_raw * pzs_veh;

  const escenario = (()=>{
    if (scen === 'opt') return {
      id: 'opt',
      titulo: 'Taller optimizado',
      veh_dia_raw, veh_dia_show, piezas_dia,
      fact_mes: fact_mes_opt,
      bene_mes: bene_mes_opt,
      coste_pp: 0
    };
    if (scen === 'pp') return {
      id: 'pp',
      titulo: 'Escenario PaintPro',
      veh_dia_raw, veh_dia_show, piezas_dia,
      fact_mes: fact_mes_pp,
      bene_mes: bene_mes_pp_neto,
      coste_pp
    };
    return {
      id: 'real',
      titulo: 'Escenario actual',
      veh_dia_raw, veh_dia_show, piezas_dia,
      fact_mes: fact_mes_real,
      bene_mes: bene_mes_real,
      coste_pp: 0
    };
  })();

  // -------- Bottleneck y capacidades --------
  const bottleneck_str = (base?.cuello || O?.bottleneck?.recurso || '—');
  const capacidades = {
    cabina:  n(caps?.cabina_dia  ?? base?.cabina_dia),
    pintura: n(caps?.pintura_dia ?? base?.pintura_dia),
    chapa:   n(caps?.chapa_dia   ?? base?.chapa_dia)
  };
  const uso_rel = O?.uso_pct || {};
  const colorUso = v => (n(v) >= 100) ? 'pp-badge-red' : (n(v) >= 95 ? 'pp-badge-amber' : 'pp-badge-green');

  // -------- UI --------
  rootEl.innerHTML = `
    <div class="pp-card">
      <div class="pp-title">Tu taller: Finanzas + Producción (datos sin gráficos)</div>

      <div class="pp-grid2">
        <!-- Finanzas por hora -->
        <div class="pp-card-big">
          <div class="pp-label">Finanzas (por hora)</div>
          <div class="pp-kpi-list">
            <div><span class="pp-kpi-name">Facturación/h</span><span class="pp-kpi-val">€ ${euro2(fact_h)}</span></div>
            <div><span class="pp-kpi-name">Coste/h</span><span class="pp-kpi-val">€ ${euro2(coste_h)}</span></div>
            <div><span class="pp-kpi-name">Margen contrib./h</span><span class="pp-kpi-val">€ ${euro2(mc_h)}</span></div>
          </div>
          <div class="pp-divider"></div>
          <div class="pp-subrow">
            <div>PE (horas/mes): <b>${one1(pe_horas)} h</b></div>
            <div>PE (día del mes): <b>${pe_dia > 0 ? pe_dia : '-'}</b></div>
          </div>
        </div>

        <!-- Producción -->
        <div class="pp-card-big">
          <div class="pp-label">Producción</div>
          <div class="pp-kpi-list">
            <div>
              <span class="pp-kpi-name">Coches/día (real)</span>
              <span class="pp-kpi-val">${one1(veh_dia_real)}</span>
            </div>
            <div>
              <span class="pp-kpi-name">Coches/día (Optimicer)</span>
              <span class="pp-kpi-val">${one1(veh_dia_opt_src)}</span>
            </div>
            <div>
              <span class="pp-kpi-name">Coches/día (escenario activo)</span>
              <span class="pp-kpi-val">
                ${scen==='real' ? one1(escenario.veh_dia_show) : escenario.veh_dia_show}
                ${prev ? fmtDelta(escenario.veh_dia_raw, prev.veh_dia, true, false) : ''}
              </span>
            </div>
            <div>
              <span class="pp-kpi-name">Piezas/día (estim.)</span>
              <span class="pp-kpi-val">${one1(escenario.piezas_dia)}</span>
            </div>
          </div>
          <div class="pp-divider"></div>
          <div class="pp-subrow">
            <div>Cuello: <b>${bottleneck_str}</b></div>
            <div>Capacidad cuello (ciclos/día): <b>${one1(veh_dia_opt_src)}</b></div>
          </div>
        </div>
      </div>

      <div class="pp-hr"></div>

      <!-- Capacidades por área -->
      <div class="pp-title-sm">Capacidades por área (coches/día) y equilibrio vs cuello</div>
      <div class="pp-cap-grid">
        ${['cabina','pintura','chapa'].map(key=>{
          const capDia = capacidades[key] ?? 0;
          const uso    = n(uso_rel[key] ?? 0);
          return `
            <div class="pp-cap-card">
              <div class="pp-cap-head">
                <div class="pp-cap-title">${key.toUpperCase()}</div>
                <div class="pp-badge ${colorUso(uso)}">${uso}%</div>
              </div>
              <div class="pp-cap-body">
                <div class="pp-cap-kpi">${one1(capDia)} <span>c/día</span></div>
                <div class="pp-cap-sub">Equilibrio frente al cuello (no utilización)</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="pp-hr"></div>

      <!-- Resumen mensual del escenario activo -->
      <div class="pp-title-sm">${escenario.titulo}</div>
      <div class="pp-grid2">
        <div class="pp-card">
          <div class="pp-sub">Facturación mensual</div>
          <div class="pp-kpi-xl">
            € ${euro0(escenario.fact_mes)}
            ${prev ? fmtDelta(escenario.fact_mes, prev.fact_mes, true, true) : ''}
          </div>
        </div>
        <div class="pp-card">
          <div class="pp-sub">
            Beneficio mensual
            ${escenario.id==='pp' && escenario.coste_pp>0 ? '<span class="pp-note">(neto de coste herramienta)</span>' : ''}
          </div>
          <div class="pp-kpi-xl">
            € ${euro0(escenario.bene_mes)}
            ${prev ? fmtDelta(escenario.bene_mes, prev.bene_mes, true, true) : ''}
          </div>
          ${escenario.id==='pp' && escenario.coste_pp>0 ? `<div class="pp-note">Coste herramienta PaintPro: € ${euro0(escenario.coste_pp)}/mes</div>` : ''}
        </div>
      </div>

      <div class="pp-cta" style="margin-top:14px">
        <button class="pp-btn pp-ghost" onclick="window.renderFinanceResultsBridge?.()">Volver</button>
        <button class="pp-btn" onclick="window.renderDashboard?.()">Ver Dashboard (gráficos)</button>
      </div>
    </div>
  `;
}
