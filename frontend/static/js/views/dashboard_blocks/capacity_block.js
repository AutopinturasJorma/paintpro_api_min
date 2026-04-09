function renderCapacityBlock(root, store) {
  root.innerHTML = `
    <h2>Análisis de capacidad</h2>
    <p>Relación entre las áreas de trabajo del taller y su capacidad productiva.</p>
    <table class="pp-capacity-table" style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead style="background:#f5f8fb">
        <tr>
          <th>Área</th><th>Capacidad (h/sem)</th><th>Productiva (veh/día)</th>
          <th>Uso</th><th>Desperdicio</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>🛠️ Chapa</td><td>48</td><td>14,3</td><td><div style="background:#36c16e;width:96%;height:10px"></div></td><td><div style="background:#e24b4b;width:4%;height:10px"></div></td></tr>
        <tr><td>🎨 Pintura</td><td>80</td><td>13,8</td><td><div style="background:#36c16e;width:100%;height:10px"></div></td><td><div style="background:#e24b4b;width:0%;height:10px"></div></td></tr>
        <tr><td>🚪 Cabina</td><td>32</td><td>23,8</td><td><div style="background:#36c16e;width:58%;height:10px"></div></td><td><div style="background:#e24b4b;width:42%;height:10px"></div></td></tr>
      </tbody>
    </table>
  `;
}
window.renderCapacityBlock = renderCapacityBlock;
