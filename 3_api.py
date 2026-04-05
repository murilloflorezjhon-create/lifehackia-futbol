"""
================================================================
  LifeHackIA — App Pronósticos Fútbol
  MÓDULO 3: API REST con FastAPI v3.0

  4 fuentes de datos integradas:
  1. football-data.org  → fixtures, standings, H2H
  2. API-Football       → xG, lineups, estadísticas avanzadas
  3. Bzzoiro Sports     → predicciones ML, odds en vivo
  4. Open-Meteo        → clima en tiempo real

  Ejecutar: python 3_api.py
  Docs:     http://localhost:8000/docs
================================================================
"""

import pickle, json, os, random, requests
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import uvicorn
from datetime import datetime

# ─── API KEYS ─────────────────────────────────────────────────
FOOTBALL_DATA_KEY = os.environ.get("FOOTBALL_API_KEY",  "69a4800800db4cab9548fe84e5f35953")
API_FOOTBALL_KEY  = os.environ.get("API_FOOTBALL_KEY",  "7f13d85e3a5db407f7496978db0a4590")
BZZOIRO_KEY       = os.environ.get("BZZOIRO_KEY",       "61aa15ec445525fc97e2fdd6ad337beb5c4709c2")

# ─── CARGAR MODELO XGBOOST ────────────────────────────────────
def cargar_modelo():
    try:
        with open("modelo/modelo_xgboost.pkl", "rb") as f: model = pickle.load(f)
        with open("modelo/label_encoder.pkl",  "rb") as f: le    = pickle.load(f)
        with open("modelo/metadata.json",      "r")  as f: meta  = json.load(f)
        print("✅ Modelo XGBoost cargado")
        return model, le, meta
    except FileNotFoundError:
        print("⚠️  Modelo no encontrado - modo demo activo")
        return None, None, None

MODEL, LABEL_ENCODER, METADATA = cargar_modelo()

# ─── FASTAPI APP ──────────────────────────────────────────────
app = FastAPI(
    title="⚽ LifeHackIA v3.0 — 4 Fuentes de Datos",
    description="Pronósticos con football-data.org + API-Football + Bzzoiro ML + Open-Meteo",
    version="3.0.0"
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─── MODELOS PYDANTIC ─────────────────────────────────────────
class EquipoStats(BaseModel):
    goles_favor_prom:   float = Field(..., ge=0, le=10)
    goles_contra_prom:  float = Field(..., ge=0, le=10)
    puntos_prom:        float = Field(..., ge=0, le=3)
    partidos_historial: int   = Field(..., ge=1, le=100)

class SolicitudPronostico(BaseModel):
    equipo_local:        str
    equipo_visitante:    str
    stats_local:         Optional[EquipoStats] = None
    stats_visitante:     Optional[EquipoStats] = None
    h2h_victorias_local: int = 0
    h2h_total_partidos:  int = 0

class SolicitudComentario(BaseModel):
    equipo_local:       str
    equipo_visitante:   str
    liga:               str   = ""
    prediccion:         str
    confianza:          float
    prob_local:         float = 0
    prob_empate:        float = 0
    prob_visitante:     float = 0
    goles_favor_local:  float = 1.5
    goles_contra_local: float = 1.0
    puntos_local:       float = 1.8
    goles_favor_visit:  float = 1.4
    goles_contra_visit: float = 1.1
    puntos_visit:       float = 1.6
    h2h_victorias_local: int  = 0
    h2h_total:          int   = 0

class ResultadoPronostico(BaseModel):
    partido:        str
    prediccion:     str
    confianza:      float
    probabilidades: dict
    recomendacion:  str
    advertencia:    str

# ================================================================
#  FUENTE 1 — football-data.org
# ================================================================
def fd_get_partidos_hoy() -> list:
    try:
        hoy = datetime.now().strftime("%Y-%m-%d")
        r = requests.get(
            "https://api.football-data.org/v4/matches",
            headers={"X-Auth-Token": FOOTBALL_DATA_KEY},
            params={"competitions": "PL,PD,BL1,SA,FL1,CL,BSA", "dateFrom": hoy, "dateTo": hoy},
            timeout=8
        )
        if r.status_code == 200:
            m = r.json().get("matches", [])
            print(f"✅ football-data.org: {len(m)} partidos")
            return m
    except Exception as e:
        print(f"❌ football-data.org: {e}")
    return []

def fd_get_h2h(match_id: int) -> dict:
    try:
        r = requests.get(
            f"https://api.football-data.org/v4/matches/{match_id}/head2head",
            headers={"X-Auth-Token": FOOTBALL_DATA_KEY},
            params={"limit": 10}, timeout=8
        )
        if r.status_code == 200:
            return r.json()
    except: pass
    return {}

# ================================================================
#  FUENTE 2 — API-Football
# ================================================================
APIF_HEADERS = {"x-apisports-key": API_FOOTBALL_KEY}

def apif_get_fixtures_hoy() -> list:
    try:
        hoy = datetime.now().strftime("%Y-%m-%d")
        r = requests.get(
            "https://v3.football.api-sports.io/fixtures",
            headers=APIF_HEADERS,
            params={"date": hoy, "timezone": "America/Bogota"},
            timeout=8
        )
        if r.status_code == 200:
            f = r.json().get("response", [])
            print(f"✅ API-Football: {len(f)} partidos")
            return f
    except Exception as e:
        print(f"❌ API-Football: {e}")
    return []

def apif_get_prediccion(fixture_id: int) -> dict:
    try:
        r = requests.get(
            "https://v3.football.api-sports.io/predictions",
            headers=APIF_HEADERS,
            params={"fixture": fixture_id}, timeout=8
        )
        if r.status_code == 200:
            resp = r.json().get("response", [])
            return resp[0] if resp else {}
    except: pass
    return {}

# ================================================================
#  FUENTE 3 — Bzzoiro Sports ML
# ================================================================
def bzz_get_predicciones() -> list:
    try:
        r = requests.get(
            "https://sports.bzzoiro.com/api/predictions/",
            headers={"Authorization": f"Token {BZZOIRO_KEY}"},
            params={"upcoming": "true"}, timeout=8
        )
        if r.status_code == 200:
            res = r.json().get("results", [])
            print(f"✅ Bzzoiro ML: {len(res)} predicciones")
            return res
    except Exception as e:
        print(f"❌ Bzzoiro: {e}")
    return []

def bzz_buscar_partido(local: str, visitante: str) -> dict:
    for p in bzz_get_predicciones():
        h = p.get("home_team", "").lower()
        a = p.get("away_team", "").lower()
        if local.lower()[:4] in h or visitante.lower()[:4] in a:
            return p
    return {}

# ================================================================
#  FUENTE 4 — Open-Meteo (clima, sin key)
# ================================================================
COORDS = {
    "Londres":(51.5074,-0.1278),"Manchester":(53.4808,-2.2426),
    "Madrid":(40.4168,-3.7038),"Barcelona":(41.3851,2.1734),
    "Munich":(48.1351,11.582),"Milan":(45.4642,9.19),
    "Paris":(48.8566,2.3522),"Bogota":(4.711,-74.0721),
    "Cali":(3.4516,-76.5319),"Medellin":(6.2442,-75.5812),
    "Barranquilla":(10.9685,-74.7813),"Dortmund":(51.5136,7.4653),
}

def meteo_get_clima(ciudad: str = "Londres") -> dict:
    lat, lon = COORDS.get(ciudad, (51.5074,-0.1278))
    try:
        r = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={"latitude":lat,"longitude":lon,
                    "current":"temperature_2m,wind_speed_10m,precipitation,weather_code",
                    "timezone":"auto","forecast_days":1},
            timeout=8
        )
        if r.status_code == 200:
            c = r.json().get("current", {})
            cod = c.get("weather_code", 0)
            cond = "despejado" if cod==0 else "nublado" if cod<=3 else "lluvia" if cod<=67 else "tormenta"
            return {"temperatura":c.get("temperature_2m",20),"viento":c.get("wind_speed_10m",10),
                    "precipitacion":c.get("precipitation",0),"condicion":cond,"ciudad":ciudad}
    except Exception as e:
        print(f"❌ Open-Meteo: {e}")
    return {"temperatura":20,"viento":10,"precipitacion":0,"condicion":"desconocido","ciudad":ciudad}

# ================================================================
#  MOTOR DE COMENTARIOS IA
# ================================================================
def clasificar_forma(p):
    if p>=2.5: return "excelente"
    elif p>=2.0: return "muy buena"
    elif p>=1.5: return "regular"
    elif p>=1.0: return "irregular"
    return "mala"

def clasificar_ataque(g):
    if g>=2.5: return "muy ofensivo"
    elif g>=1.8: return "ofensivo"
    elif g>=1.2: return "moderado"
    return "conservador"

def clasificar_defensa(g):
    if g<=0.7: return "sólida"
    elif g<=1.2: return "estable"
    elif g<=1.8: return "permeable"
    return "frágil"

def generar_comentario_ia(d: SolicitudComentario) -> str:
    fl = clasificar_forma(d.puntos_local)
    fv = clasificar_forma(d.puntos_visit)
    av = clasificar_ataque(d.goles_favor_visit)
    dv = clasificar_defensa(d.goles_contra_visit)
    h2h = round((d.h2h_victorias_local / max(1, d.h2h_total)) * 100)
    cp = round(d.confianza * 100) if d.confianza <= 1 else round(d.confianza)
    nivel = "alta" if cp>=65 else "moderada" if cp>=50 else "baja"

    o1 = random.choice([
        f"{d.equipo_local} llega con forma {fl}, promediando {d.puntos_local:.1f} pts/partido.",
        f"El local {d.equipo_local} atraviesa un momento de forma {fl} con {d.puntos_local:.1f} pts/partido.",
    ])
    o2 = random.choice([
        f"{d.equipo_visitante} presenta forma {fv}, con ataque {av} y defensa {dv}.",
        f"El visitante {d.equipo_visitante} llega con forma {fv} y defensa {dv}.",
    ])
    o3 = (random.choice([
        f"El H2H muestra que {d.equipo_local} ganó el {h2h}% de los últimos {d.h2h_total} duelos.",
        f"En los últimos {d.h2h_total} encuentros, {d.equipo_local} se impuso en el {h2h}% de las veces.",
    ]) if d.h2h_total > 0 else "Sin H2H suficiente, el modelo pondera solo la forma reciente.")

    if d.prediccion == "LOCAL":
        o4 = f"El modelo proyecta victoria de {d.equipo_local} con {cp}% de confianza ({nivel})."
    elif d.prediccion == "VISITANTE":
        o4 = f"El modelo proyecta victoria de {d.equipo_visitante} con {cp}% de confianza ({nivel})."
    else:
        o4 = f"El modelo proyecta empate con {cp}% de confianza ({nivel})."

    return f"{o1} {o2} {o3} {o4}"

# ================================================================
#  HELPERS
# ================================================================
def build_default_stats(nombre: str, is_local: bool = True) -> EquipoStats:
    seed = sum(ord(c) for c in nombre.lower()) % 10
    adj  = 0.2 if is_local else -0.05
    return EquipoStats(
        goles_favor_prom  = round(max(0.8, min(3.8, 1.2 + seed*0.08 + adj)), 1),
        goles_contra_prom = round(max(0.4, min(2.8, 1.4 - (seed%4)*0.06 - adj/2)), 1),
        puntos_prom       = round(max(0.6, min(3.0, 1.3 + (seed%3)*0.15 + adj/3)), 1),
        partidos_historial = 5 + (seed % 4),
    )

def generar_pronostico_demo(sol: SolicitudPronostico) -> ResultadoPronostico:
    L = sol.stats_local; V = sol.stats_visitante
    ls = L.goles_favor_prom*0.38 - L.goles_contra_prom*0.18 + L.puntos_prom*0.32 + (sol.h2h_victorias_local/max(1,sol.h2h_total_partidos))*0.12
    vs = V.goles_favor_prom*0.38 - V.goles_contra_prom*0.18 + V.puntos_prom*0.32 + ((max(0,sol.h2h_total_partidos-sol.h2h_victorias_local))/max(1,sol.h2h_total_partidos))*0.12
    if ls>vs+0.25:   pred,probs="LOCAL",   {"LOCAL":55.0,"EMPATE":25.0,"VISITANTE":20.0}
    elif vs>ls+0.25: pred,probs="VISITANTE",{"LOCAL":20.0,"EMPATE":25.0,"VISITANTE":55.0}
    else:            pred,probs="EMPATE",  {"LOCAL":30.0,"EMPATE":40.0,"VISITANTE":30.0}
    txt = sol.equipo_local if pred=="LOCAL" else sol.equipo_visitante if pred=="VISITANTE" else "EMPATE"
    return ResultadoPronostico(
        partido=f"{sol.equipo_local} vs {sol.equipo_visitante}", prediccion=txt,
        confianza=round(max(probs.values())/100,3),
        probabilidades={"local":round(probs["LOCAL"]/100,3),"empate":round(probs["EMPATE"]/100,3),"visitante":round(probs["VISITANTE"]/100,3)},
        recomendacion=f"Demo: favorece a {txt}",
        advertencia="⚠️ Modo demo activo."
    )

# ================================================================
#  ENDPOINTS
# ================================================================
@app.get("/", tags=["General"])
def inicio():
    return {"mensaje":"⚽ LifeHackIA v3.0","fuentes":["football-data.org","API-Football","Bzzoiro ML","Open-Meteo"],"docs":"/docs"}

@app.get("/salud", tags=["General"])
def salud():
    return {
        "api":"✅ Activa",
        "modelo":"✅ Cargado" if MODEL else "⚠️ Demo",
        "fuentes":{
            "football_data_org":"✅",
            "api_football":"✅" if API_FOOTBALL_KEY else "❌",
            "bzzoiro_ml":"✅" if BZZOIRO_KEY else "❌",
            "open_meteo":"✅",
        },
        "version": METADATA.get("version") if METADATA else "3.0-demo"
    }

@app.get("/partidos-reales", tags=["Datos"])
def partidos_reales():
    """Partidos de hoy con datos reales de las 4 fuentes."""
    partidos_fd = fd_get_partidos_hoy()
    pred_bzz    = bzz_get_predicciones()
    resultado   = []
    for p in partidos_fd:
        home = p.get("homeTeam",{}).get("name","")
        away = p.get("awayTeam",{}).get("name","")
        bzz  = next((b for b in pred_bzz if home.lower()[:4] in b.get("home_team","").lower() or away.lower()[:4] in b.get("away_team","").lower()), {})
        resultado.append({
            "id":p.get("id"),"liga":p.get("competition",{}).get("name",""),
            "home":home,"away":away,
            "hora_utc":p.get("utcDate","")[:16].replace("T"," "),
            "status":p.get("status"),
            "bzz_pred":bzz.get("prediction"),
            "bzz_odds_local":bzz.get("odds_home"),
            "bzz_odds_empate":bzz.get("odds_draw"),
            "bzz_odds_visita":bzz.get("odds_away"),
        })
    return {"total":len(resultado),"partidos":resultado}

@app.get("/clima/{ciudad}", tags=["Datos"])
def clima(ciudad: str = "Londres"):
    return meteo_get_clima(ciudad)

@app.get("/partidos", tags=["General"])
def partidos_compat(limit: int = 20):
    datos = partidos_reales()
    return {"partidos": datos["partidos"][:limit]}

@app.post("/pronostico", response_model=ResultadoPronostico, tags=["Predicciones"])
def generar_pronostico(sol: SolicitudPronostico):
    if not sol.stats_local:     sol.stats_local     = build_default_stats(sol.equipo_local,     True)
    if not sol.stats_visitante: sol.stats_visitante = build_default_stats(sol.equipo_visitante, False)
    if sol.h2h_total_partidos <= 0: sol.h2h_total_partidos = max(1, sol.h2h_victorias_local)

    bzz = bzz_buscar_partido(sol.equipo_local, sol.equipo_visitante)

    if MODEL is None or LABEL_ENCODER is None:
        res = generar_pronostico_demo(sol)
        if bzz: res.advertencia += f" Bzzoiro ML: {bzz.get('prediction','N/A')}"
        return res

    features_df = pd.DataFrame([{
        "local_goles_favor_prom":   sol.stats_local.goles_favor_prom,
        "local_goles_contra_prom":  sol.stats_local.goles_contra_prom,
        "local_puntos_prom":        sol.stats_local.puntos_prom,
        "local_partidos_historial": sol.stats_local.partidos_historial,
        "visit_goles_favor_prom":   sol.stats_visitante.goles_favor_prom,
        "visit_goles_contra_prom":  sol.stats_visitante.goles_contra_prom,
        "visit_puntos_prom":        sol.stats_visitante.puntos_prom,
        "visit_partidos_historial": sol.stats_visitante.partidos_historial,
        "h2h_victorias_local":      sol.h2h_victorias_local,
        "h2h_total_partidos":       sol.h2h_total_partidos,
    }])

    pred_idx   = MODEL.predict(features_df)[0]
    pred_proba = MODEL.predict_proba(features_df)[0]
    resultado  = LABEL_ENCODER.inverse_transform([pred_idx])[0]
    confianza  = float(max(pred_proba))
    probs      = {c.lower():float(p) for c,p in zip(LABEL_ENCODER.classes_, pred_proba)}
    txt        = sol.equipo_local if resultado=="LOCAL" else sol.equipo_visitante if resultado=="VISITANTE" else "EMPATE"
    adv        = "✅ Alta confianza." if confianza>=0.6 else "📊 Confianza moderada." if confianza>=0.45 else "⚠️ Baja confianza."
    if bzz: adv += f" · Bzzoiro ML: {bzz.get('prediction','N/A')}"

    return ResultadoPronostico(
        partido=f"{sol.equipo_local} vs {sol.equipo_visitante}",
        prediccion=txt, confianza=round(confianza,3),
        probabilidades=probs, recomendacion=f"El modelo favorece a {txt}", advertencia=adv
    )

@app.post("/comentario", tags=["Predicciones"])
def comentario_partido(datos: SolicitudComentario):
    try:
        return {"comentario": generar_comentario_ia(datos), "estado": "ok"}
    except Exception as e:
        return {"comentario": None, "estado": "error", "detalle": str(e)}

if __name__ == "__main__":
    print("="*60)
    print("  LifeHackIA v3.0 — 4 fuentes de datos")
    print(f"  API-Football: {'✅' if API_FOOTBALL_KEY else '❌'}")
    print(f"  Bzzoiro ML:   {'✅' if BZZOIRO_KEY else '❌'}")
    print(f"  Open-Meteo:   ✅")
    print("="*60)
    uvicorn.run("3_api:app", host="0.0.0.0", port=8000, reload=True)
