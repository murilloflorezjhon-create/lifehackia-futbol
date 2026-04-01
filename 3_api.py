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
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import uvicorn

# ─── CARGAR MODELO ────────────────────────────────────────────

def cargar_modelo():
    """Carga el modelo entrenado y sus metadatos."""
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
    - **GET /equipos** — Lista equipos disponibles
    - **GET /salud** — Estado de la API
    
    Desarrollado con ❤️ por @LifeHackIA desde Buenaventura, Colombia
    """,
    version="1.0.0"
)

# Permitir peticiones desde el frontend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── MODELOS DE DATOS ─────────────────────────────────────────

class EquipoStats(BaseModel):
    """Estadísticas de un equipo en sus últimos partidos."""
    
    goles_favor_prom:  float = Field(
        ..., ge=0, le=10,
        description="Promedio de goles a favor (últimos 5 partidos)",
        example=1.8
    )
    goles_contra_prom: float = Field(
        ..., ge=0, le=10,
        description="Promedio de goles en contra (últimos 5 partidos)",
        example=0.9
    )
    puntos_prom:       float = Field(
        ..., ge=0, le=3,
        description="Promedio de puntos obtenidos (últimos 5 partidos)",
        example=2.2
    )
    partidos_historial: int = Field(
        ..., ge=1, le=100,
        description="Número de partidos en el historial",
        example=5
    )


class SolicitudPronostico(BaseModel):
    """Datos necesarios para generar un pronóstico."""
    
    equipo_local:    str = Field(..., example="Real Madrid")
    equipo_visitante: str = Field(..., example="Barcelona")
    stats_local:     Optional[EquipoStats] = None
    stats_visitante: Optional[EquipoStats] = None
    h2h_victorias_local:  int = Field(0, ge=0, description="Victorias del local en enfrentamientos directos")
    h2h_total_partidos:   int = Field(0, ge=0, description="Total partidos directos entre ambos")


class ResultadoPronostico(BaseModel):
    """Resultado de la predicción."""
    
    partido:       str
    prediccion:    str
    confianza:     float
    probabilidades: dict
    recomendacion: str
    advertencia:   str


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
    return [
        "Real Madrid",
        "Barcelona",
        "Sevilla",
        "Arsenal",
        "Chelsea",
        "Napoli",
        "Inter",
        "Bayern",
        "PSG",
        "América de Cali",
        "Millonarios",
        "Atlético",
    ]


EQUIPOS_DISPONIBLES = cargar_equipos()


def cargar_partidos_reales(limit: int = 50) -> List[dict]:
    ruta_features = "datos/partidos_features.csv"
    ruta_raw = "datos/partidos_raw.csv"
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
            "id": int(row.get("partido_id", 0) or 0),
            "league": str(row.get("liga", "") or "").strip(),
            "home": row.get("equipo_local", ""),
            "away": row.get("equipo_visitante", ""),
            "date": row.get("fecha", ""),
            "status": "Finalizado",
            "stats_local": {
                "goles_favor_prom": float(row.get("local_goles_favor_prom", 1.0) or 1.0),
                "goles_contra_prom": float(row.get("local_goles_contra_prom", 1.0) or 1.0),
                "puntos_prom": float(row.get("local_puntos_prom", 1.0) or 1.0),
                "partidos_historial": int(row.get("local_partidos_historial", 0) or 0),
            },
            "stats_visitante": {
                "goles_favor_prom": float(row.get("visit_goles_favor_prom", 1.0) or 1.0),
                "goles_contra_prom": float(row.get("visit_goles_contra_prom", 1.0) or 1.0),
                "puntos_prom": float(row.get("visit_puntos_prom", 1.0) or 1.0),
                "partidos_historial": int(row.get("visit_partidos_historial", 0) or 0),
            },
            "h2h_victorias_local": int(row.get("h2h_victorias_local", 0) or 0),
            "h2h_total_partidos": int(row.get("h2h_total_partidos", 0) or 0),
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
            "id": int(row.get("partido_id", 0) or 0),
            "league": str(row.get("liga", "") or "").strip(),
            "home": row.get("equipo_local", ""),
            "away": row.get("equipo_visitante", ""),
            "date": f"{row.get('fecha', '')} {row.get('hora', '')}".strip(),
            "status": str(row.get("estado", "Programado") or "Programado"),
            "h2h_victorias_local": int(row.get("h2h_victorias_local", 0) or 0),
            "h2h_total_partidos": int(row.get("h2h_total_partidos", 0) or 0),
        })
    return partidos


PARTIDOS_REALES = cargar_partidos_reales()
PARTIDOS_PROXIMOS = cargar_partidos_proximos()


def generar_pronostico_demo(solicitud: SolicitudPronostico) -> ResultadoPronostico:
    local = solicitud.stats_local
    visit = solicitud.stats_visitante

    local_score = (
        local.goles_favor_prom * 0.38
        - local.goles_contra_prom * 0.18
        + local.puntos_prom * 0.32
        + (solicitud.h2h_victorias_local / max(1, solicitud.h2h_total_partidos)) * 0.12
    )
    visit_score = (
        visit.goles_favor_prom * 0.38
        - visit.goles_contra_prom * 0.18
        + visit.puntos_prom * 0.32
        + ((max(0, solicitud.h2h_total_partidos - solicitud.h2h_victorias_local)) / max(1, solicitud.h2h_total_partidos)) * 0.12
    )

    if local_score > visit_score + 0.25:
        prediccion = "LOCAL"
        probabilidades = {"LOCAL": 55.0, "EMPATE": 25.0, "VISITANTE": 20.0}
    elif visit_score > local_score + 0.25:
        prediccion = "VISITANTE"
        probabilidades = {"LOCAL": 20.0, "EMPATE": 25.0, "VISITANTE": 55.0}
    else:
        prediccion = "EMPATE"
        probabilidades = {"LOCAL": 30.0, "EMPATE": 40.0, "VISITANTE": 30.0}

    confianza = max(probabilidades.values())
    recomendaciones = {
        "LOCAL": f"El modelo demo favorece a {solicitud.equipo_local}",
        "VISITANTE": f"El modelo demo favorece a {solicitud.equipo_visitante}",
        "EMPATE": "El modelo demo prevé un partido muy equilibrado",
    }

    return ResultadoPronostico(
        partido=f"{solicitud.equipo_local} vs {solicitud.equipo_visitante}",
        prediccion=solicitud.equipo_local if prediccion == "LOCAL" else solicitud.equipo_visitante if prediccion == "VISITANTE" else "EMPATE",
        confianza=round(confianza, 3),
        probabilidades={"local": round(probabilidades["LOCAL"], 3), "empate": round(probabilidades["EMPATE"], 3), "visitante": round(probabilidades["VISITANTE"], 3)},
        recomendacion=recomendaciones[prediccion],
        advertencia="⚠️ Modelo local no disponible. Se devuelve un pronóstico demo con valores promedio.",
    )


# ─── ENDPOINTS ────────────────────────────────────────────────

@app.get("/", tags=["General"])
def inicio():
    """Bienvenida a la API."""
    return {
        "mensaje": "⚽ LifeHackIA — API de Pronósticos de Fútbol",
        "version": "1.0.0",
        "estado":  "activa",
        "docs":    "/docs"
    }


@app.get("/salud", tags=["General"])
def salud():
    """Verifica el estado de la API y el modelo."""
    modelo_cargado = MODEL is not None
    return {
        "api":    "✅ Activa",
        "modelo": "✅ Cargado" if modelo_cargado else "❌ No cargado",
        "version_modelo": METADATA.get("version") if METADATA else None
    }


@app.get("/equipos", tags=["General"])
def equipos():
    """Devuelve la lista de equipos disponibles."""
    return {"equipos": EQUIPOS_DISPONIBLES}


@app.get("/partidos", tags=["General"])
def partidos(limit: int = 20):
    """Devuelve la lista de partidos reales cargados desde los datos."""
    limit = max(1, min(limit, 100))
    return {"partidos": PARTIDOS_REALES[:limit]}


@app.get("/partidos/upcoming", tags=["General"])
def partidos_upcoming(limit: int = 20):
    """Devuelve los próximos partidos programados."""
    limit = max(1, min(limit, 100))
    return {"partidos": PARTIDOS_PROXIMOS[:limit]}


@app.post("/pronostico", response_model=ResultadoPronostico, tags=["Predicciones"])
def generar_pronostico(solicitud: SolicitudPronostico):
    """
    Genera el pronóstico de un partido de fútbol.
    
    Devuelve:
    - **prediccion**: LOCAL / EMPATE / VISITANTE
    - **confianza**: Porcentaje de seguridad del modelo
    - **probabilidades**: Probabilidad de cada resultado
    - **recomendacion**: Interpretación del pronóstico
    """
    if solicitud.stats_local is None:
        solicitud.stats_local = build_default_stats(solicitud.equipo_local, is_local=True)
    if solicitud.stats_visitante is None:
        solicitud.stats_visitante = build_default_stats(solicitud.equipo_visitante, is_local=False)
    if solicitud.h2h_total_partidos <= 0:
        solicitud.h2h_total_partidos = max(1, solicitud.h2h_victorias_local)

    if MODEL is None or LABEL_ENCODER is None:
        return generar_pronostico_demo(solicitud)

    # Construir el vector de features
    features_df = pd.DataFrame([{
        "local_goles_favor_prom":    solicitud.stats_local.goles_favor_prom,
        "local_goles_contra_prom":   solicitud.stats_local.goles_contra_prom,
        "local_puntos_prom":         solicitud.stats_local.puntos_prom,
        "local_partidos_historial":  solicitud.stats_local.partidos_historial,
        "visit_goles_favor_prom":    solicitud.stats_visitante.goles_favor_prom,
        "visit_goles_contra_prom":   solicitud.stats_visitante.goles_contra_prom,
        "visit_puntos_prom":         solicitud.stats_visitante.puntos_prom,
        "visit_partidos_historial":  solicitud.stats_visitante.partidos_historial,
        "h2h_victorias_local":       solicitud.h2h_victorias_local,
        "h2h_total_partidos":        solicitud.h2h_total_partidos,
    }])
    
    # Predicción
    pred_idx   = MODEL.predict(features_df)[0]
    pred_proba = MODEL.predict_proba(features_df)[0]
    resultado  = LABEL_ENCODER.inverse_transform([pred_idx])[0]
    confianza  = float(max(pred_proba))
    
    # Probabilidades por clase en formato decimal 0-1 y claves normalizadas
    probabilidades = {
        clase.lower(): float(prob)
        for clase, prob in zip(LABEL_ENCODER.classes_, pred_proba)
    }
    
    # Recomendación interpretada
    recomendaciones = {
        "LOCAL":     f"El modelo favorece a {solicitud.equipo_local}",
        "VISITANTE": f"El modelo favorece a {solicitud.equipo_visitante}",
        "EMPATE":    "El modelo prevé un partido muy equilibrado"
    }
    
    prediccion_texto = (
        solicitud.equipo_local if resultado == "LOCAL"
        else solicitud.equipo_visitante if resultado == "VISITANTE"
        else "EMPATE"
    )
    
    # Advertencia según confianza
    if confianza < 0.45:
        advertencia = "⚠️ Partido muy incierto. Baja confianza en la predicción."
    elif confianza < 0.60:
        advertencia = "📊 Confianza moderada. El partido puede ir a cualquier lado."
    else:
        advertencia = "✅ Alta confianza en esta predicción."
    
    return ResultadoPronostico(
        partido=f"{solicitud.equipo_local} vs {solicitud.equipo_visitante}",
        prediccion=prediccion_texto,
        confianza=round(confianza, 3),
        probabilidades=probabilidades,
        recomendacion=recomendaciones[resultado],
        advertencia=advertencia
    )


@app.get("/ejemplo", tags=["Predicciones"])
def ejemplo_pronostico():
    """
    Devuelve un ejemplo de solicitud para /pronostico.
    Útil para integrar el frontend.
    """
    return {
        "descripcion": "Ejemplo de solicitud para POST /pronostico",
        "solicitud": {
            "equipo_local": "Real Madrid",
            "equipo_visitante": "Barcelona",
            "stats_local": {
                "goles_favor_prom": 1.8,
                "goles_contra_prom": 0.9,
                "puntos_prom": 2.2,
                "partidos_historial": 5
            },
            "stats_visitante": {
                "goles_favor_prom": 1.6,
                "goles_contra_prom": 1.0,
                "puntos_prom": 2.0,
                "partidos_historial": 5
            },
            "h2h_victorias_local": 3,
            "h2h_total_partidos": 10
        }
    }


# ─── MAIN ─────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  LifeHackIA — API de Pronósticos en ejecución")
    print("=" * 60)
    print("  📡 URL:  http://localhost:8000")
    print("  📚 Docs: http://localhost:8000/docs")
    print("=" * 60)
    
    uvicorn.run(
        "3_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # Recarga automática al guardar cambios
    )
