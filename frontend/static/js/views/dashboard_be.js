// views/dashboard_be.js
// Resumen numérico del Punto de Equilibrio (sin gráficos)

export function renderBreakEvenBlock(rootEl, store){
  const fx = store.results?.finance || {};
  const k  = fx.kpis || {};

  const euro0 = v => Number(v||0).toLocaleString('es-ES',{maximumFractionDigits:0});
  const euro2 = v => Number(v||0).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
  const one1  = v => Number(v||0).toLocaleString('es-ES',{maximumFractionDigits:1});

  const peHoras   = n(fx.pe_horas, 0);
  const horasMesR = n(store.derived?.horas_reales_mes, 0);
  const cobertura = horasMesR>0 ? (peHoras/horasMesR) : 0;   // <1 ok, ~1 límite, >1 peligro
  const tagClass  = cobertura < 0.9 ? 'green' : (cobertura <= 1.1 ? 'gray' : 'red');
  const tagText   = cobertura < 0.9 ? 'Por encima del PE' : (cobertura <= 1.1 ? 'Cerca del PE' : 'Por debajo del PE');

  rootEl.innerHTML += `
    <section class="section">
      <h2>Punto de equilibrio</h2>
      <div class="cards two">
        <div class="card">
          <div class="kpi">${one1(peHoras)} h</div>
          <div class="label">Horas necesarias para cubrir costes</div>
          <div class="sub">Con tus costes actuales</div>
        </div>
        <div class="card">
          <div class="kpi">${one1(horasMesR)} h</div>
          <div class="label">Horas reales / mes</div>
          <div class="sub">Generadas con tu producción actual</div>
        </div>
      </div>
      <div class="note" style="margin-top:8px">
        Estado: <span class="tag ${tagClass}">${tagText}</span>
      </div>
    </section>
  `;

  function n(...vals){ for(const v of vals){ if(v!==undefined && v!==null && !isNaN(v)) return Number(v); } return 0; }
}
