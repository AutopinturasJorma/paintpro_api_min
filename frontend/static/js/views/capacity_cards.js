// frontend/static/js/views/capacity_cards.js
// Bloque de capacidades por área (stub para validación de wiring)

export function renderCapacityBlock(rootEl, store) {
  const d  = store?.derived || {};
  const an = store?.results?.analytics?.kpis || {};
  const op = store?.results?.optimicer?.kpis || {};

  // Helpers
  const pct = v => (v == null ? '—' : `${Math.round(Number(v) || 0)}%`);
  const num = v => (v == null ? '—' : Number(v).toLocaleString('es-ES', { maximumFractionDigits: 1 }));

  // Fallbacks (pon aquí las claves reales cuando las tengas)
  const capChapa    = op.capacidad_chapa_pct    ?? an.cap_chapa_pct;
  const capPintura  = op.capacidad_pintura_pct  ?? an.cap_pintura_pct;
  const capCabina   = op.capacidad_cabina_pct   ?? an.cap_cabina_pct;

  const effChapa    = op.eficiencia_chapa_pct   ?? an.ef_chapa_pct;
  const effPintura  = op.eficiencia_pintura_pct ?? an.ef_pintura_pct;
  const effCabina   = op.eficiencia_cabina_pct  ?? an.ef_cabina_pct;

  const badge = v => {
    const n = Number(v || 0);
    if (isNaN(n)) return 'pp-badge pp-badge-amber';
    if (n >= 90)  return 'pp-badge pp-badge-green';
    if (n >= 70)  return 'pp-badge pp-badge-amber';
    return 'pp-badge pp-badge-red';
  };

  rootEl.insertAdjacentHTML('beforeend', `
    <section class="pp-section">
      <h2 class="pp-h2">Capacidad productiva por área</h2>
      <div class="pp-cap-grid">

        <div class="pp-cap-card">
          <div class="pp-cap-head">
            <div class="pp-cap-title">Chapa / Prep</div>
            <span class="${badge(capChapa)}">${pct(capChapa)}</span>
          </div>
          <div class="pp-cap-kpi">${pct(effChapa)} <span>eficiencia</span></div>
          <div class="pp-cap-sub">Uso de capacidad y eficiencia estimada en el área de chapa/preparación.</div>
        </div>

        <div class="pp-cap-card">
          <div class="pp-cap-head">
            <div class="pp-cap-title">Pintura</div>
            <span class="${badge(capPintura)}">${pct(capPintura)}</span>
          </div>
          <div class="pp-cap-kpi">${pct(effPintura)} <span>eficiencia</span></div>
          <div class="pp-cap-sub">Indicadores de carga y rendimiento del equipo de pintura.</div>
        </div>

        <div class="pp-cap-card">
          <div class="pp-cap-head">
            <div class="pp-cap-title">Cabina</div>
            <span class="${badge(capCabina)}">${pct(capCabina)}</span>
          </div>
          <div class="pp-cap-kpi">${pct(effCabina)} <span>eficiencia</span></div>
          <div class="pp-cap-sub">Ciclos de cabina y eficiencia del recurso crítico.</div>
        </div>

      </div>
    </section>
  `);
}
