// Estado global compartido (exportado como módulo)
export const store = {
  inputs: {
    // ... deja aquí los mismos campos que ya tenías ...
  },
  derived: {
    horas_reales_mes: null,
    horas_ideales_mes: null,
    tarifa_mo_h: null,
    facturacion_hora: null
  },
  results: {
    analytics: null,
    finance: null,
    optimicer: null
  }
};
