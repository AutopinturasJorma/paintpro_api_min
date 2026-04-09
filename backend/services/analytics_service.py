# backend/services/analytics_service.py
# (versión alineada con Finance y con eficiencia por puestos corregida)

from math import isfinite

FACTOR_CONTINUO = 0.93
FACTOR_PARTIDO  = 0.85
SEMANAS_MES     = 4
MARGEN_PINTURA   = 0.30
MARGEN_RECAMBIOS = 0.06
EXTRA_MINUTOS_POR_VEH = 20
EXTRA_HORAS_POR_VEH   = EXTRA_MINUTOS_POR_VEH / 60.0

# “Biblia” de horas MO por tipo de daño
H_PINT = { 'leve': 2.67,  'media': 5.62,  'fuerte': 9.90, 'gran': 14.34 }
H_CHAP = { 'leve': 1.075, 'media': 2.97,  'fuerte': 5.61, 'gran': 8.14 }

def _n(v, d=0.0):
    try:
        x = float(v)
        return x if isfinite(x) else d
    except Exception:
        return d

def _factor_jornada(j):
    return FACTOR_CONTINUO if (j or '').lower() == 'continua' else FACTOR_PARTIDO

def _mix_or_default(mix, perfil_ui):
    if isinstance(mix, dict):
        L=_n(mix.get('leve')); M=_n(mix.get('media')); F=_n(mix.get('fuerte')); G=_n(mix.get('gran'))
        s=L+M+F+G
        if s>0:
            return {'leve':L/s,'media':M/s,'fuerte':F/s,'gran':G/s}
    presets = {
        'leve':  {'leve':0.70,'media':0.25,'fuerte':0.04,'gran':0.01},
        'media': {'leve':0.30,'media':0.50,'fuerte':0.15,'gran':0.05},
        'fuerte':{'leve':0.10,'media':0.30,'fuerte':0.40,'gran':0.20},
        'gran':  {'leve':0.05,'media':0.20,'fuerte':0.35,'gran':0.40},
    }
    return presets.get((perfil_ui or '').lower(), {'leve':0.62,'media':0.30,'fuerte':0.06,'gran':0.02})

def _hp_hc_prom(mix):
    hp = mix['leve']*H_PINT['leve'] + mix['media']*H_PINT['media'] + mix['fuerte']*H_PINT['fuerte'] + mix['gran']*H_PINT['gran']
    hc = mix['leve']*H_CHAP['leve'] + mix['media']*H_CHAP['media'] + mix['fuerte']*H_CHAP['fuerte'] + mix['gran']*H_CHAP['gran']
    return max(0.1,hp), max(0.1,hc)

def _eff_por_area(puestos: float, personas: int) -> float:
    """
    Eficiencia visible por área en función del ratio puestos/persona.
    Regla simple y didáctica:
      - ratio < 1.0   → penaliza lineal hasta 0.8–1.0
      - 1.0–1.5       → bonifica lineal 1.0 → 1.20
      - ratio > 1.5   → tope en 1.20 (no premiamos más)
    """
    personas = int(max(0, personas))
    puestos  = max(0.0, float(puestos))
    if personas <= 0:
        return 1.00
    ratio = puestos / personas

    if ratio < 1.0:
        # 0.5 puestos/operario ≈ 0.90 ; 1.0 → 1.00
        # tramo lineal entre 0.8 y 1.0 (más prudente para no castigar en exceso)
        # mapeamos [0.0..1.0] → [0.8..1.0]
        ratio_clamped = max(0.0, ratio)
        return 0.8 + 0.2 * ratio_clamped
    elif ratio <= 1.5:
        # 1.0 → 1.00 ; 1.5 → 1.20
        return 1.0 + 0.2 * ((ratio - 1.0) / 0.5)
    else:
        return 1.20

def calc_analytics(p: dict):
    # ---- Inputs básicos ----
    pintores      = int(_n(p.get('pintores'), 0))
    chapistas     = int(_n(p.get('chapistas'), 0))
    # por defecto, 1.0 puesto/operario si no viene el dato
    puestos_pint  = _n(p.get('puestos_pintura'), pintores * 1.0)
    puestos_chap  = _n(p.get('puestos_chapa'),   chapistas * 1.0)

    horas_dia   = max(1.0, _n(p.get('horas_dia'), 8))
    dias_sem    = int(_n(p.get('dias_semana'), 5))
    semanas_mes = int(_n(p.get('semanas_mes'), SEMANAS_MES))
    jornada     = p.get('jornada') or 'continua'
    factor_j    = _factor_jornada(jornada)

    veh_sem_real = max(0.0, _n(p.get('coches_semana') or p.get('vehiculos_semana'), 0))

    # ---- Precio/hora y compras mensuales (realidad) ----
    tarifa_mo_h   = _n(p.get('tarifa_mo_h') or p.get('tarifa_override') or p.get('tarifa_mo_h_override'), 0.0)
    comp_pint_mes = max(0.0, _n(p.get('compras_pintura_mes'), 0.0))
    comp_rec_mes  = max(0.0, _n(p.get('compras_recambios_mes'), 0.0))

    # ---- Mix de daños ----
    mix = _mix_or_default(p.get('mix') or {}, p.get('perfil'))
    hp_bill, hc_bill = _hp_hc_prom(mix)
    # capacidad: añadimos 20 min operativos a pintura
    hp_cap = hp_bill + EXTRA_HORAS_POR_VEH
    hc_cap = hc_bill

    # ---- Horas disponibles ----
    horas_sem = horas_dia * dias_sem * factor_j
    horas_mes = horas_sem * semanas_mes

    # ---- Eficiencias por puestos/persona (REGLA NUEVA) ----
    eff_pint = _eff_por_area(puestos_pint, pintores)
    eff_chap = _eff_por_area(puestos_chap, chapistas)

    # ---- Horas equivalentes por semana (HEp/HEc) y vehículos/semana por área ----
    HEp_sem = pintores  * horas_sem * eff_pint
    HEc_sem = chapistas * horas_sem * eff_chap

    veh_sem_pint = HEp_sem / hp_cap if hp_cap > 0 else 0.0
    veh_sem_chap = HEc_sem / hc_cap if hc_cap > 0 else 0.0

    veh_sem_pot  = max(0.0, min(veh_sem_pint, veh_sem_chap))
    veh_mes_pot  = veh_sem_pot * semanas_mes
    veh_mes_real = veh_sem_real * semanas_mes

    # ---- Horas facturables/mes (para facturación) ----
    horas_por_veh_para_fact = hp_bill + hc_bill  # MO total por coche (sin los 20 min operativos)
    horas_reales_mes  = veh_mes_real * horas_por_veh_para_fact
    horas_ideales_mes = veh_mes_pot  * horas_por_veh_para_fact

    # ---- Ventas por hora (igual que Finance/Analytics coherente) ----
    if horas_reales_mes > 0:
        ventas_pint_h = (comp_pint_mes / horas_reales_mes) / max(1e-9, (1.0 - MARGEN_PINTURA))
        ventas_rec_h  = (comp_rec_mes  / horas_reales_mes) / max(1e-9, (1.0 - MARGEN_RECAMBIOS))
    else:
        ventas_pint_h = 0.0
        ventas_rec_h  = 0.0

    fact_hora_real = tarifa_mo_h + ventas_pint_h + ventas_rec_h

    fact_mes_real = horas_reales_mes * fact_hora_real
    # Para “ideal”, mantenemos la misma estructura €/h real y escalamos por horas ideales
    fact_mes_pot  = horas_ideales_mes * fact_hora_real

    # ---- Flags ----
    flags = { 'nivel_optimo': veh_sem_pot <= veh_sem_real + 1e-6 }

    # ---- Bridge hacia Finance ----
    finance_bridge = {
        'horas_reales_mes':   horas_reales_mes,
        'horas_ideales_mes':  horas_ideales_mes,
        'tarifa_mo_h':        tarifa_mo_h,
        'facturacion_hora':   fact_hora_real,
        'compras_pintura_mes':   comp_pint_mes,
        'compras_recambios_mes': comp_rec_mes,
        'dias_semana': dias_sem,
        'semanas_mes': semanas_mes
    }

    return {
        'kpis': {
            'veh_sem_real':  veh_sem_real,
            'veh_mes_real':  veh_mes_real,
            'veh_sem_pot':   veh_sem_pot,
            'veh_mes_pot':   veh_mes_pot,
            'fact_mes_real': fact_mes_real,
            'fact_mes_pot':  max(fact_mes_real, fact_mes_pot)  # guardarraíl visual
        },
        'display': {},
        'flags': flags,
        'messages': {},
        'finance_bridge': finance_bridge,
        'debug': {
            'tarifa_mo_h': tarifa_mo_h,
            'compras_pintura_mes': comp_pint_mes,
            'compras_recambios_mes': comp_rec_mes,
            'hp_bill': hp_bill, 'hc_bill': hc_bill,
            'hp_cap': hp_cap,   'hc_cap': hc_cap,
            'horas_semana': horas_sem, 'horas_mes': horas_mes,
            'eff_pint': eff_pint, 'eff_chap': eff_chap,
            'puestos_pint': puestos_pint, 'puestos_chap': puestos_chap,
            'fact_hora_real': fact_hora_real
        }
    }
