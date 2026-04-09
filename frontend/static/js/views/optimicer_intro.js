// frontend/static/js/views/optimicer_intro.js
export function renderOptimicerIntro(onNext) {
  const el = document.createElement("div");
  el.className = "pp-screen";
  el.innerHTML = `
    <h2>Optimicer</h2>
    <p>Vamos a ajustar tu diagnóstico detectando el recurso que limita tu producción.</p>
    <button class="pp-btn-primary" id="pp-next">Continuar</button>
  `;
  el.querySelector("#pp-next").onclick = onNext;
  return el;
}
