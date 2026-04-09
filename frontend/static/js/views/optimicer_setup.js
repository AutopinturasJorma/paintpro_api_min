// NO export aquí: script clásico
window.renderOptimicerSetup = function(root, inputs={}, onSubmit){
  const html = `
    <div class="section">
      <h2>Configura Optimicer</h2>
      <label>Cabinas <input id="in-cabinas" type="number" value="${inputs.cabinas ?? 1}"></label>
      <label>Plenums <input id="in-plenums" type="number" value="${inputs.plenums ?? 0}"></label>
      <label>Barniz
        <select id="in-barniz">
          <option value="rapido" ${inputs.barniz==='rapido'?'selected':''}>Rápido</option>
          <option value="convencional" ${inputs.barniz==='convencional'?'selected':''}>Convencional</option>
          <option value="aire" ${inputs.barniz==='aire'?'selected':''}>Secado al aire</option>
        </select>
      </label>
      <label><input id="in-ova" type="checkbox" ${inputs.ova?'checked':''}> OVA</label>
      <label><input id="in-visualid" type="checkbox" ${inputs.visualid?'checked':''}> VisualID</label>
      <label><input id="in-moonwalk" type="checkbox" ${inputs.moonwalk?'checked':''}> MoonWalk</label>
      <div style="margin-top:12px">
        <button class="pp-btn" id="btn-optimizar">Optimizar ahora</button>
      </div>
    </div>`;
  root.innerHTML = html;

  document.getElementById('btn-optimizar').onclick = function(){
    onSubmit({
      cabinas:  parseInt(document.getElementById('in-cabinas').value||0),
      plenums:  parseInt(document.getElementById('in-plenums').value||0),
      barniz:   document.getElementById('in-barniz').value,
      ova:      document.getElementById('in-ova').checked,
      visualid: document.getElementById('in-visualid').checked,
      moonwalk: document.getElementById('in-moonwalk').checked
    });
  };
};
