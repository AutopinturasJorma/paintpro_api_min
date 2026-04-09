/*************************************************
 * PaintPro - Dashboard Layout modular (sin imports)
 *************************************************/

function renderDashboardLayout(root, store) {
  if (!root) return;

  root.innerHTML = `
    <section id="pp-finance-block" class="pp-section"></section>
    <section id="pp-production-block" class="pp-section"></section>
    <section id="pp-capacity-block" class="pp-section"></section>
    <section id="pp-profitability-block" class="pp-section"></section>
    <section id="pp-efficiency-block" class="pp-section"></section>
    <section id="pp-pe-block" class="pp-section"></section>
    <section id="pp-health-block" class="pp-section"></section>
  `;

  // Render secuencial
  if (window.renderFinanceBlock)
    window.renderFinanceBlock(document.getElementById('pp-finance-block'), store);

  if (window.renderProductionBlock)
    window.renderProductionBlock(document.getElementById('pp-production-block'), store);

  if (store.ui.stage === 'opt_done' && window.renderCapacityBlock)
    window.renderCapacityBlock(document.getElementById('pp-capacity-block'), store);

  if (window.renderEfficiencyBlock)
    window.renderEfficiencyBlock(document.getElementById('pp-efficiency-block'), store);

  if (window.renderprofitabilityBlock)
    window.renderEfficiencyBlock(document.getElementById('pp-profitability-block'), store);

  if (window.renderPEBlock)
    window.renderPEBlock(document.getElementById('pp-pe-block'), store);

  if (window.renderHealthBlock)
    window.renderHealthBlock(document.getElementById('pp-health-block'), store);
}

window.renderDashboardLayout = renderDashboardLayout;
