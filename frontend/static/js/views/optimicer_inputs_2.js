// frontend/static/js/views/optimicer_inputs_2.js
export function renderOptimicerInputs2(defaults, onSubmit) {
  const el = document.createElement("div");
  el.className = "pp-screen";
  el.innerHTML = `
    <h3>Proceso de pintura</h3>
    <label>Barniz cabina:
      <select id="bcab">
        <option value="rapido" ${defaults.barniz_cabina!=="convencional"?"selected":""}>Rápido</option>
        <option value="convencional" ${defaults.barniz_cabina==="convencional"?"selected":""}>Convencional</option>
      </select>
    </label>
    <label>Barniz plenum:
      <select id="bple">
        <option value="aire" ${defaults.barniz_plenum!=="rapido"?"selected":""}>Secado al aire</option>
        <option value="rapido" ${defaults.barniz_plenum==="rapido"?"selected":""}>Rápido</option>
      </select>
    </label>
    <label>Sistema:
      <select id="sist">
        <option value="tradicional" ${defaults.sistema!=="onevisit"?"selected":""}>Tradicional</option>
        <option value="onevisit" ${defaults.sistema==="onevisit"?"selected":""}>OneVisit</option>
      </select>
    </label>
    <button class="pp-btn-primary" id="pp-submit">Analizar</button>
  `;
  el.querySelector("#pp-submit").onclick = ()=> {
    onSubmit({
      barniz_cabina: el.querySelector("#bcab").value,
      barniz_plenum: el.querySelector("#bple").value,
      sistema: el.querySelector("#sist").value
    });
  };
  return el;
}
