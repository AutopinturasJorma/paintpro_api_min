from typing import Dict

def calcular_team(analytics:Dict, optimicer:Dict)->Dict:
    coches_sem_real = max(1, int(analytics.get("coches_semana_real", 5)))
    coches_dia_actual = round(coches_sem_real / 5.0, 2)

    cap_pint = float(optimicer["capacidad"]["pintura"]["coches_dia"])
    cap_cab  = float(optimicer["capacidad"]["cabina"]["coches_dia"])
    cap_chap = float(optimicer["capacidad"]["chapa"]["coches_dia"])
    techo = round(min(cap_pint, cap_cab, cap_chap),2)

    # Mejora conservadora: +1 coche/día sin pasar el techo
    coches_dia_team = min(techo, coches_dia_actual + 1.0)
    delta = round(coches_dia_team - coches_dia_actual,2)

    if coches_dia_actual > techo + 0.2:
        escenario = "irreal"
        coches_dia_team = coches_dia_actual
        delta = 0.0
    else:
        if delta < 0.4: escenario = "bajo"
        elif delta <= 1.2: escenario = "medio"
        else: escenario = "alto"

    coches_mes_actual = int(round(coches_dia_actual * 20))
    coches_mes_team   = int(round(coches_dia_team   * 20))
    delta_mes = coches_mes_team - coches_mes_actual

    eur_coche = analytics.get("peritacion_media_eur") or (analytics.get("euros_por_hora", 30) * 40)
    impacto = int(delta_mes * float(eur_coche))

    return {
        "coches_dia_actual": float(coches_dia_actual),
        "coches_dia_team": float(coches_dia_team),
        "coches_mes_actual": coches_mes_actual,
        "coches_mes_team": coches_mes_team,
        "delta_coches_dia": float(delta),
        "delta_coches_mes": int(delta_mes),
        "impacto_eur_mes": int(impacto),
        "escenario": escenario
    }
