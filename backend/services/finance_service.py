# backend/services/finance_service.py
from math import isfinite

# ---------- Constantes ----------
MARGEN_PINTURA   = 0.30
MARGEN_RECAMBIOS = 0.06


# ---------- Helpers ----------
def _n(v, d=0.0):
    """Convierte a float seguro, con default."""
    try:
        x = float(v)
        return x if isfinite(x) else d
    except Exception:
        return d


def _beneficio_acumulado(dias, horas_mes, margen_h, fijos_mes):
    """Beneficio acumulado día a día."""
    if dias <= 0:
        return []
    horas_dia = horas_mes / dias
    serie = []
    acum = -fijos_mes
    for _ in range(dias):
        acum += horas_dia * margen_h
        serie.append(round(float(acum), 2))
    return serie


def _dia_pe_desde_serie(serie):
    """Primer día (1-indexed) donde el acumulado >= 0. Si no existe, None."""
    for i, v in enumerate(serie):
        if v >= 0:
            return i + 1
    return None


# ---------- Cálculo Finance ----------
def calcular_finance(p: dict) -> dict:
    p = p or {}

    # ---------- Inputs ----------
    tarifa_mo_h   = _n(p.get("tarifa_mo_h"), 0.0)
    comp_pint_mes = _n(p.get("compras_pintura_mes"), 0.0)
    comp_rec_mes  = _n(p.get("compras_recambios_mes"), 0.0)

    h_real  = max(1e-9, _n(p.get("horas_reales_mes"), 0.0))   # evita /0
    h_ideal = max(0.0,   _n(p.get("horas_ideales_mes"), 0.0))

    prod_gas   = _n(p.get("prod_gas"), 0.0)
    prod_luz   = _n(p.get("prod_luz"), 0.0)
    prod_otros = _n(p.get("prod_otros"), 0.0)

    fijos_alquiler   = _n(p.get("fijos_alquiler"), 0.0)
    fijos_indirecto  = _n(p.get("fijos_personal_indirecto"), 0.0)
    fijos_productivo = _n(p.get("fijos_personal_productivo"), 0.0)
    fijos_otros      = _n(p.get("fijos_otros"), 0.0)

    dias_sem    = int(_n(p.get("dias_semana"), 5))
    semanas_mes = int(_n(p.get("semanas_mes"), 4))
    dias_mes    = max(1, dias_sem * semanas_mes)

    # ---------- Producción (del Analytics) ----------
    horas_chapa_mes   = _n(p.get("horas_chapa_mes"), 0.0)
    horas_pintura_mes = _n(p.get("horas_pintura_mes"), 0.0)
    horas_cabina_mes  = _n(p.get("horas_cabina_mes"), 0.0)
    piezas_mes        = _n(p.get("pzs_mes"), 0.0)
    veh_mes_real      = _n(p.get("veh_mes_real"), 0.0)
    veh_mes_pot       = _n(p.get("veh_mes_pot"), 0.0)

    # ---------- Ingresos por hora ----------
    ventas_pint_h = (comp_pint_mes / h_real) / (1.0 - MARGEN_PINTURA)   if h_real > 0 else 0.0
    ventas_rec_h  = (comp_rec_mes  / h_real) / (1.0 - MARGEN_RECAMBIOS) if h_real > 0 else 0.0
    ingresos_h    = tarifa_mo_h + ventas_pint_h + ventas_rec_h

    # ---------- Variables por hora ----------
    materiales_h = (comp_pint_mes + comp_rec_mes) / h_real
    energia_h    = (prod_gas + prod_luz) / h_real
    otros_var_h  = prod_otros / h_real
    variables_h  = materiales_h + energia_h + otros_var_h

    # ---------- Margen y fijos ----------
    margen_h = ingresos_h - variables_h
    fijos_mes = fijos_alquiler + fijos_indirecto + fijos_productivo + fijos_otros
    fijos_h   = fijos_mes / h_real

    # ---------- Facturación y beneficio ----------
    fact_mes_real    = ingresos_h * h_real
    coste_var_mes    = variables_h * h_real
    coste_total_mes  = coste_var_mes + fijos_mes
    benef_mes_real   = fact_mes_real - coste_total_mes

    # ---------- IDEAL ----------
    benef_mes_ideal_teor = margen_h * h_ideal - fijos_mes
    mostrar_ideal = (h_ideal >= h_real) and (benef_mes_ideal_teor >= benef_mes_real)
    fact_mes_ideal  = ingresos_h * h_ideal if mostrar_ideal else None
    benef_mes_ideal = benef_mes_ideal_teor if mostrar_ideal else None

    # ---------- Serie diaria ----------
    serie_real  = _beneficio_acumulado(dias_mes, h_real, margen_h, fijos_mes)
    serie_ideal = _beneficio_acumulado(dias_mes, h_ideal, margen_h, fijos_mes) if mostrar_ideal else None
    be_horas    = fijos_mes / margen_h if margen_h > 0 else None
    dia_pe      = _dia_pe_desde_serie(serie_real)
    labels = [f"Día {i}" for i in range(1, dias_mes + 1)]

    # ---------- Desgloses ----------
    ventas_mo_mes   = tarifa_mo_h  * h_real
    ventas_pint_mes = ventas_pint_h * h_real
    ventas_rec_mes  = ventas_rec_h  * h_real

    ingresos = {
        "mano_obra": float(ventas_mo_mes),
        "pintura":   float(ventas_pint_mes),
        "recambios": float(ventas_rec_mes),
        "total":     float(fact_mes_real)
    }

    costes = {
        "variables":        float(coste_var_mes),
        "fijos":            float(fijos_mes),
        "total":            float(coste_total_mes),
        "materiales":       float(materiales_h * h_real),
        "energia":          float(energia_h * h_real),
        "otros_variables":  float(prod_otros),
    }

    # ---------- KPIs completos ----------
    kpis = {
        # Producción
        "veh_mes_real": veh_mes_real,
        "veh_mes_pot": veh_mes_pot,
        "piezas_mes": piezas_mes,
        "horas_chapa_mes": horas_chapa_mes,
        "horas_pintura_mes": horas_pintura_mes,
        "horas_cabina_mes": horas_cabina_mes,
        "horas_reales_mes": h_real,
        "horas_ideales_mes": h_ideal,

        # Económicos
        "fact_mes_real": fact_mes_real,
        "benef_mes_real": benef_mes_real,
        "coste_total_mes": coste_total_mes,
        "margen_contribucion_hora": margen_h,
        "facturacion_hora": ingresos_h,
        "coste_hora": variables_h + fijos_h,

        # Break-even
        "break_even_horas_mes": be_horas,
        "break_even_dia_mes": dia_pe,

        # Energía y materiales
        "materiales_h": materiales_h,
        "energia_h": energia_h,
        "otros_var_h": otros_var_h,

        # Tarifa e info técnica
        "tarifa_mo_h": tarifa_mo_h,
    }

    # ---------- Salida ----------
    salida = {
        "ingresos": ingresos,
        "costes":   costes,
        "bloque1": { "facturacion_hora": ingresos_h, "margen_contribucion_hora": margen_h, "coste_hora": variables_h + fijos_h },
        "bloque2": { "benef_mes_real": benef_mes_real, "fact_mes_real": fact_mes_real },
        "bloque3": { "real": {"horas_mes": h_real, "beneficio": benef_mes_real}, "ideal": {"horas_mes": h_ideal, "beneficio": benef_mes_ideal} },
        "series":  { "labels": labels, "real": serie_real, "ideal": serie_ideal },
        "resumen": { "dias_mes": dias_mes, "fijos_mes": fijos_mes },
        "kpis":    kpis
    }

    return salida
