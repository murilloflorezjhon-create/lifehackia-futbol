"""
===============================================================
  LifeHackIA — App Pronósticos Fútbol
  MÓDULO 3: API REST con FastAPI
  
  Ejecutar con:
    pip install fastapi uvicorn
    python 3_api.py
  
  Documentación automática en:
    http://localhost:8000/docs
===============================================================
"""

import pickle
import json
import os
import random
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import uvicorn

# ─── CARGAR MODELO ────────────────────────────────────────────

def cargar_modelo():
    try:
        with open("modelo/modelo_xgboost.pkl", "rb") as f:
            model = pickle.load(f)
        with open("modelo/label_encoder.pkl", "rb") as f:
            le = pickle.load(f)
        with open("modelo/metadata.json", "r") as f:
            metadata = json.load(f)
        print("✅ Modelo cargado correctamente")
        return model, le, metadata
    except FileNotFoundError:
        print("⚠️  Modelo no encontrado. Ejecuta: python 2_entrenar_modelo.py")
        return None, None, None

MODEL, LABEL_ENCODER, METADATA = cargar_modelo()

# ─── FASTAPI APP ──────────────────────────────────────────────

app = FastAPI(
    title="⚽ LifeHackIA — Pronósticos de Fútbol",
    description="""
    API de predicción de resultados de fútbol usando Machine Learning.
    
    ## Endpoints principales
    - **POST /pronostico** — Predice el resultado de un partido
    - **POST /comentario** — Genera comentario IA del estado de los equipos
    - **GET /salud** — Estado de la API
    
    Desarrollado con ❤️ por @LifeHackIA desde Buenaventura, Colombia
    """,
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── MODELOS DE DATOS ─────────────────────────────────────────

class EquipoStats(BaseModel):
    goles_favor_prom:   float = Field(..., ge=0, le=10, example=1.8)
    goles_contra_prom:  float = Field(..., ge=0, le=10, example=0.9)
    puntos_prom:        float = Field(..., ge=0, le=3,  example=2.2)
    partidos_historial: int   = Field(..., ge=1, le=100, example=5)


class SolicitudPronostico(BaseModel):
    equipo_local:         str = Field(..., example="Real Madrid")
    equipo_visitante:     str = Field(..., example="Barcelona")
    stats_local:          Optional[EquipoStats] = None
    stats_visitante:      Optional[EquipoStats] = None
    h2h_victorias_local:  int = Field(0, ge=0)
    h2h_total_partidos:   int = Field(0, ge=0)


class SolicitudComentario(BaseModel):
    equipo_local:      str
    equipo_visitante:  str
    liga:              str = ""
    prediccion:        str
    confianza:         float
    prob_local:        float = 0
    prob_empate:       float = 0
    prob_visitante:    float = 0
    goles_favor_local: float = 1.5
    goles_contra_local: float = 1.0
    puntos_local:      float = 1.8
    goles_favor_visit: float = 1.4
    goles_contra_visit: float = 1.1
    puntos_visit:      float = 1.6
    h2h_victorias_local: int = 0
    h2h_total:         int  = 0


class ResultadoPronostico(BaseModel):
    partido:        str
    prediccion:     str
    confianza:      float
    probabilidades: dict
    recomendacion:  str
    advertencia:    str


# ─── MOTOR DE COMENTARIOS INTELIGENTES ───────────────────────

def clasificar_forma(puntos_prom: float) -> str:
    if puntos_prom >= 2.5:   return "excelente"
    elif puntos_prom >= 2.0: return "muy buena"
    elif puntos_prom >= 1.5: return "regular"
    elif puntos_prom >= 1.0: return "irregular"
    else:                    return "mala"

def clasificar_ataque(goles_favor: float) -> str:
    if goles_favor >= 2.5:   return "muy ofensivo"
    elif goles_favor >= 1.8: return "ofensivo"
    elif goles_favor >= 1.2: return "moderado"
    else:                    return "conservador"

def clasificar_defensa(goles_contra: float) -> str:
    if goles_contra <= 0.7:  return "sólida"
    elif goles_contra <= 1.2: return "estable"
    elif goles_contra <= 1.8: return "permeable"
    else:                    return "frágil"

def generar_comentario_ia(datos: SolicitudComentario) -> str:
    local    = datos.equipo_local
    visita   = datos.equipo_visitante
    pred     = datos.prediccion
    conf     = datos.confianza
    liga     = datos.liga

    forma_l  = clasificar_forma(datos.puntos_local)
    forma_v  = clasificar_forma(datos.puntos_visit)
    ataque_l = clasificar_ataque(datos.goles_favor_local)
    ataque_v = clasificar_ataque(datos.goles_favor_visit)
    defensa_l = clasificar_defensa(datos.goles_contra_local)
    defensa_v = clasificar_defensa(datos.goles_contra_visit)

    h2h_porc = round((datos.h2h_victorias_local / max(1, datos.h2h_total)) * 100)

    # ── ORACION 1: Estado del local ──────────────────────────
    frases_local_buena = [
        f"{local} atraviesa un momento de {forma_l} forma con un promedio de {datos.puntos_local:.1f} puntos por partido en sus últimos encuentros.",
        f"El equipo local, {local}, llega con una forma {forma_l} acumulando {datos.puntos_local:.1f} puntos por partido en su racha reciente.",
        f"{local} muestra una forma {forma_l}, promediando {datos.puntos_local:.1f} puntos por partido en los últimos compromisos.",
    ]
    oracion1 = random.choice(frases_local_buena)

    # ── ORACION 2: Estado del visitante ──────────────────────
    frases_visita = [
        f"Por su parte, {visita} presenta una forma {forma_v} como visitante con {datos.goles_favor_visit:.1f} goles a favor y una defensa {defensa_v} ({datos.goles_contra_visit:.1f} en contra por partido).",
        f"{visita} llega al encuentro con forma {forma_v}, mostrando un ataque {ataque_v} y una línea defensiva {defensa_v} en sus recientes actuaciones.",
        f"El visitante {visita} exhibe rendimiento {forma_v}, anotando un promedio de {datos.goles_favor_visit:.1f} goles por partido con una defensa catalogada como {defensa_v}.",
    ]
    oracion2 = random.choice(frases_visita)

    # ── ORACION 3: H2H y argumento ────────────────────────────
    if datos.h2h_total > 0:
        if h2h_porc >= 60:
            frases_h2h = [
                f"El historial directo favorece ampliamente a {local}, quien ha ganado el {h2h_porc}% de los últimos {datos.h2h_total} enfrentamientos entre estos rivales.",
                f"En el historial H2H, {local} domina con {h2h_porc}% de victorias en los últimos {datos.h2h_total} duelos, lo que refuerza la proyección del modelo.",
            ]
        elif h2h_porc <= 40:
            frases_h2h = [
                f"El historial directo es ajustado, con {visita} mostrando ventaja en el {100-h2h_porc}% de los últimos {datos.h2h_total} enfrentamientos.",
                f"Los últimos {datos.h2h_total} encuentros entre ambos equipos muestran equilibrio, aunque {visita} ha salido victorioso en el {100-h2h_porc}% de las veces.",
            ]
        else:
            frases_h2h = [
                f"El historial entre estos equipos está muy igualado en los últimos {datos.h2h_total} partidos, lo que añade incertidumbre al pronóstico.",
                f"Los {datos.h2h_total} precedentes directos reflejan paridad entre ambos, con {local} ganando el {h2h_porc}% de los duelos.",
            ]
        oracion3 = random.choice(frases_h2h)
    else:
        frases_sin_h2h = [
            f"Sin precedentes directos recientes, el modelo analiza exclusivamente la forma actual y las estadísticas de ambos equipos.",
            f"Al no contar con historial H2H suficiente, el modelo pondera la forma reciente y el rendimiento estadístico de cada conjunto.",
        ]
        oracion3 = random.choice(frases_sin_h2h)

    # ── ORACION 4: Conclusión según predicción ────────────────
    nivel_conf = "alta" if conf >= 0.65 else "moderada" if conf >= 0.50 else "baja"

    if pred == "LOCAL":
        frases_concl = [
            f"Con base en estos factores, el modelo proyecta victoria de {local} con {conf*100:.0f}% de confianza ({nivel_conf}), apoyado en su ventaja de local y mejor forma reciente.",
            f"El modelo IA favorece a {local} con {conf*100:.0f}% de confianza ({nivel_conf}), respaldado por su rendimiento en casa y sus estadísticas ofensivas superiores.",
            f"Considerando su ventaja de localía y forma {forma_l}, {local} es el favorito del modelo con {conf*100:.0f}% de confianza.",
        ]
    elif pred == "VISITANTE":
        frases_concl = [
            f"A pesar de jugar fuera, {visita} es favorecido por el modelo con {conf*100:.0f}% de confianza ({nivel_conf}), respaldado por su sólida forma reciente.",
            f"El modelo proyecta sorpresa visitante: {visita} con {conf*100:.0f}% de confianza ({nivel_conf}), dado su mejor rendimiento estadístico frente al local.",
            f"Con {conf*100:.0f}% de confianza ({nivel_conf}), el modelo estima que {visita} superará la localía de {local} basándose en sus estadísticas recientes.",
        ]
    else:
        frases_concl = [
            f"El modelo prevé un partido muy equilibrado y proyecta empate con {conf*100:.0f}% de confianza ({nivel_conf}), reflejo del parejo nivel de ambos equipos.",
            f"Dado el equilibrio estadístico entre ambos conjuntos, el modelo apunta al empate como resultado más probable con {conf*100:.0f}% de confianza ({nivel_conf}).",
            f"Con estadísticas muy parejas y forma similar, el modelo estima que el empate es el desenlace más probable con {conf*100:.0f}% de confianza.",
        ]
    oracion4 = random.choice(frases_concl)

    return f"{oracion1} {oracion2} {oracion3} {oracion4}"


# ─── HELPERS ──────────────────────────────────────────────────

def build_default_stats(nombre: str, is_local: bool = True) -> EquipoStats:
    seed = sum(ord(c) for c in nombre.lower()) % 10
    ajuste = 0.2 if is_local else -0.05
    return EquipoStats(
        goles_favor_prom=round(max(0.8, min(3.8, 1.2 + (seed * 0.08) + ajuste)), 1),
        goles_contra_prom=round(max(0.4, min(2.8, 1.4 - (seed % 4) * 0.06 - ajuste / 2)), 1),
        puntos_prom=round(max(0.6, min(3.0, 1.3 + (seed % 3) * 0.15 + ajuste / 3)), 1),
        partidos_historial=5 + (seed % 4),
    )

def cargar_equipos() -> List[str]:
    ruta = "datos/partidos_features.csv"
    if os.path.exists(ruta):
        try:
            df = pd.read_csv(ruta)
            equipos = pd.unique(df[["equipo_local", "equipo_visitante"]].values.ravel("K"))
            return sorted([str(e) for e in equipos if pd.notna(e)])
        except Exception:
            pass
    return ["Real Madrid","Barcelona","Sevilla","Arsenal","Chelsea",
            "Napoli","Inter","Bayern","PSG","América de Cali","Millonarios","Atlético"]

def cargar_partidos_reales(limit: int = 50) -> List[dict]:
    ruta_features = "datos/partidos_features.csv"
    ruta_raw      = "datos/partidos_raw.csv"
    if not os.path.exists(ruta_features):
        return []
    try:
        df = pd.read_csv(ruta_features)
        if os.path.exists(ruta_raw):
            df_raw = pd.read_csv(ruta_raw, usecols=["partido_id", "liga"])
            df = df.merge(df_raw, on="partido_id", how="left")
    except Exception:
        return []
    partidos = []
    for _, row in df.sort_values("fecha", ascending=False).head(limit).iterrows():
        partidos.append({
            "id":     int(row.get("partido_id", 0) or 0),
            "league": str(row.get("liga", "") or "").strip(),
            "home":   row.get("equipo_local", ""),
            "away":   row.get("equipo_visitante", ""),
            "date":   row.get("fecha", ""),
            "status": "Finalizado",
            "stats_local": {
                "goles_favor_prom":   float(row.get("local_goles_favor_prom", 1.0) or 1.0),
                "goles_contra_prom":  float(row.get("local_goles_contra_prom", 1.0) or 1.0),
                "puntos_prom":        float(row.get("local_puntos_prom", 1.0) or 1.0),
                "partidos_historial": int(row.get("local_partidos_historial", 0) or 0),
            },
            "stats_visitante": {
                "goles_favor_prom":   float(row.get("visit_goles_favor_prom", 1.0) or 1.0),
                "goles_contra_prom":  float(row.get("visit_goles_contra_prom", 1.0) or 1.0),
                "puntos_prom":        float(row.get("visit_puntos_prom", 1.0) or 1.0),
                "partidos_historial": int(row.get("visit_partidos_historial", 0) or 0),
            },
            "h2h_victorias_local": int(row.get("h2h_victorias_local", 0) or 0),
            "h2h_total_partidos":  int(row.get("h2h_total_partidos", 0) or 0),
        })
    return partidos

def cargar_partidos_proximos(limit: int = 50) -> List[dict]:
    ruta = "datos/partidos_upcoming.csv"
    if not os.path.exists(ruta):
        return []
    try:
        df = pd.read_csv(ruta)
    except Exception:
        return []
    partidos = []
    for _, row in df.head(limit).iterrows():
        partidos.append({
            "id":     int(row.get("partido_id", 0) or 0),
            "league": str(row.get("liga", "") or "").strip(),
            "home":   row.get("equipo_local", ""),
            "away":   row.get("equipo_visitante", ""),
            "date":   f"{row.get('fecha', '')} {row.get('hora', '')}".strip(),
            "status": str(row.get("estado", "Programado") or "Programado"),
        })
    return partidos

def generar_pronostico_demo(solicitud: SolicitudPronostico) -> ResultadoPronostico:
    local = solicitud.stats_local
    visit = solicitud.stats_visitante
    local_score = (local.goles_favor_prom * 0.38 - local.goles_contra_prom * 0.18
                   + local.puntos_prom * 0.32
                   + (solicitud.h2h_victorias_local / max(1, solicitud.h2h_total_partidos)) * 0.12)
    visit_score = (visit.goles_favor_prom * 0.38 - visit.goles_contra_prom * 0.18
                   + visit.puntos_prom * 0.32
                   + ((max(0, solicitud.h2h_total_partidos - solicitud.h2h_victorias_local)) / max(1, solicitud.h2h_total_partidos)) * 0.12)
    if local_score > visit_score + 0.25:
        prediccion = "LOCAL"; probs = {"LOCAL": 55.0, "EMPATE": 25.0, "VISITANTE": 20.0}
    elif visit_score > local_score + 0.25:
        prediccion = "VISITANTE"; probs = {"LOCAL": 20.0, "EMPATE": 25.0, "VISITANTE": 55.0}
    else:
        prediccion = "EMPATE"; probs = {"LOCAL": 30.0, "EMPATE": 40.0, "VISITANTE": 30.0}
    confianza = max(probs.values())
    return ResultadoPronostico(
        partido=f"{solicitud.equipo_local} vs {solicitud.equipo_visitante}",
        prediccion=solicitud.equipo_local if prediccion=="LOCAL" else solicitud.equipo_visitante if prediccion=="VISITANTE" else "EMPATE",
        confianza=round(confianza/100, 3),
        probabilidades={"local": round(probs["LOCAL"]/100,3), "empate": round(probs["EMPATE"]/100,3), "visitante": round(probs["VISITANTE"]/100,3)},
        recomendacion=f"El modelo favorece a {solicitud.equipo_local if prediccion=='LOCAL' else solicitud.equipo_visitante if prediccion=='VISITANTE' else 'ninguno'}",
        advertencia="⚠️ Modelo local no disponible. Pronóstico demo.",
    )

EQUIPOS_DISPONIBLES = cargar_equipos()
PARTIDOS_REALES     = cargar_partidos_reales()
PARTIDOS_PROXIMOS   = cargar_partidos_proximos()

# ─── ENDPOINTS ────────────────────────────────────────────────

@app.get("/", tags=["General"])
def inicio():
    return {"mensaje": "⚽ LifeHackIA — API de Pronósticos de Fútbol",
            "version": "2.0.0", "estado": "activa", "docs": "/docs"}

@app.get("/salud", tags=["General"])
def salud():
    return {"api": "✅ Activa",
            "modelo": "✅ Cargado" if MODEL is not None else "❌ No cargado",
            "version_modelo": METADATA.get("version") if METADATA else None}

@app.get("/equipos", tags=["General"])
def equipos():
    return {"equipos": EQUIPOS_DISPONIBLES}

@app.get("/partidos", tags=["General"])
def partidos(limit: int = 20):
    return {"partidos": PARTIDOS_REALES[:max(1, min(limit, 100))]}

@app.get("/partidos/upcoming", tags=["General"])
def partidos_upcoming(limit: int = 20):
    return {"partidos": PARTIDOS_PROXIMOS[:max(1, min(limit, 100))]}

@app.get("/ejemplo", tags=["Predicciones"])
def ejemplo_pronostico():
    return {"descripcion": "Ejemplo de solicitud para POST /pronostico",
            "solicitud": {"equipo_local": "Real Madrid","equipo_visitante": "Barcelona",
                          "stats_local": {"goles_favor_prom":1.8,"goles_contra_prom":0.9,"puntos_prom":2.2,"partidos_historial":5},
                          "stats_visitante": {"goles_favor_prom":1.6,"goles_contra_prom":1.0,"puntos_prom":2.0,"partidos_historial":5},
                          "h2h_victorias_local":3,"h2h_total_partidos":10}}

@app.post("/pronostico", response_model=ResultadoPronostico, tags=["Predicciones"])
def generar_pronostico(solicitud: SolicitudPronostico):
    """Genera el pronóstico de un partido usando el modelo XGBoost."""
    if solicitud.stats_local is None:
        solicitud.stats_local = build_default_stats(solicitud.equipo_local, is_local=True)
    if solicitud.stats_visitante is None:
        solicitud.stats_visitante = build_default_stats(solicitud.equipo_visitante, is_local=False)
    if solicitud.h2h_total_partidos <= 0:
        solicitud.h2h_total_partidos = max(1, solicitud.h2h_victorias_local)

    if MODEL is None or LABEL_ENCODER is None:
        return generar_pronostico_demo(solicitud)

    features_df = pd.DataFrame([{
        "local_goles_favor_prom":   solicitud.stats_local.goles_favor_prom,
        "local_goles_contra_prom":  solicitud.stats_local.goles_contra_prom,
        "local_puntos_prom":        solicitud.stats_local.puntos_prom,
        "local_partidos_historial": solicitud.stats_local.partidos_historial,
        "visit_goles_favor_prom":   solicitud.stats_visitante.goles_favor_prom,
        "visit_goles_contra_prom":  solicitud.stats_visitante.goles_contra_prom,
        "visit_puntos_prom":        solicitud.stats_visitante.puntos_prom,
        "visit_partidos_historial": solicitud.stats_visitante.partidos_historial,
        "h2h_victorias_local":      solicitud.h2h_victorias_local,
        "h2h_total_partidos":       solicitud.h2h_total_partidos,
    }])

    pred_idx   = MODEL.predict(features_df)[0]
    pred_proba = MODEL.predict_proba(features_df)[0]
    resultado  = LABEL_ENCODER.inverse_transform([pred_idx])[0]
    confianza  = float(max(pred_proba))

    probabilidades = {
        clase.lower(): float(prob)
        for clase, prob in zip(LABEL_ENCODER.classes_, pred_proba)
    }

    prediccion_texto = (solicitud.equipo_local if resultado == "LOCAL"
                        else solicitud.equipo_visitante if resultado == "VISITANTE"
                        else "EMPATE")

    if confianza < 0.45:   advertencia = "⚠️ Partido muy incierto. Baja confianza."
    elif confianza < 0.60: advertencia = "📊 Confianza moderada. El partido puede ir a cualquier lado."
    else:                  advertencia = "✅ Alta confianza en esta predicción."

    return ResultadoPronostico(
        partido=f"{solicitud.equipo_local} vs {solicitud.equipo_visitante}",
        prediccion=prediccion_texto,
        confianza=round(confianza, 3),
        probabilidades=probabilidades,
        recomendacion=f"El modelo favorece a {prediccion_texto}",
        advertencia=advertencia
    )


@app.post("/comentario", tags=["Predicciones"])
def comentario_partido(datos: SolicitudComentario):
    """
    Genera un comentario inteligente sobre el estado actual de los dos equipos
    usando las estadísticas del modelo XGBoost. Sin APIs externas.
    """
    try:
        comentario = generar_comentario_ia(datos)
        return {"comentario": comentario, "estado": "ok"}
    except Exception as e:
        return {"comentario": None, "estado": "error", "detalle": str(e)}


# ─── MAIN ─────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  LifeHackIA — API de Pronósticos en ejecución")
    print("=" * 60)
    print("  📡 URL:  http://localhost:8000")
    print("  📚 Docs: http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run("3_api:app", host="0.0.0.0", port=8000, reload=True)
