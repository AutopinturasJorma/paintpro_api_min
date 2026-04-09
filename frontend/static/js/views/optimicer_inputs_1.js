// frontend/static/js/views/optimicer_inputs_1.js
export function renderOptimicerInputs1(defaults, onNext) {
  const el = document.createElement("div");
  el.className = "pp-screen";
  el.innerHTML = `
    <h3>Instalaciones y puestos</h3>
    <label>Cabinas: <input id="cabinas" type="number" min="0" value="${defaults.cabinas||1}"></label>
    <label>¿Plenum? 
      <select id="plenum">
        <option value="true" ${defaults.plenum?"selected":""}>Sí</option>
        <option value="false" ${!defaults.plenum?"selected":""}>No</option>
      </select>
    </label>
    <label>Puestos de pintura (totales): <input id="pp" type="number" step="0.1" value="${defaults.puestos_pintura||1.5}"></label>
    <label>Puestos de chapa (totales): <input id="pc" type="number" step="0.1" value="${defaults.puestos_chapa||1.5}"></label>
    <button class="pp-btn-primary" id="pp-next">Continuar</button>
  `;
  el.querySelector("#pp-next").onclick = ()=> {
    const data = {
      cabinas: parseInt(el.querySelector("#cabinas").value,10),
      plenum: el.querySelector("#plenum").value==="true",
      puestos_pintura: parseFloat(el.querySelector("#pp").value),
      puestos_chapa: parseFloat(el.querySelector("#pc").value)
    };
    onNext(data);
  };
  return el;
}
