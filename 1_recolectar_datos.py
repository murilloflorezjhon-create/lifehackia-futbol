"""
===============================================================
  LifeHackIA — App Pronósticos Fútbol
  MÓDULO 1: Recolección y preparación de datos
  
  Usa la API gratuita de football-data.org
  Regístrate gratis en: https://www.football-data.org/
  y obtén tu API_KEY gratuita
===============================================================
"""

import requests
import pandas as pd
import json
import time
import os
from datetime import datetime

# ─── CONFIGURACIÓN ────────────────────────────────────────────
API_KEY = "TU_API_KEY_AQUI"  # Regístrate gratis en football-data.org
BASE_URL = "https://api.football-data.org/v4"

HEADERS = {
    "X-Auth-Token": API_KEY
}

# Ligas disponibles en el plan gratuito
LIGAS = {
    "PL":  "Premier League (Inglaterra)",
    "PD":  "La Liga (España)",
    "BL1": "Bundesliga (Alemania)",
    "SA":  "Serie A (Italia)",
    "FL1": "Ligue 1 (Francia)",
    "CL":  "Champions League",
    "BSA": "Brasileirao (Brasil)",  # Cercano a Colombia
}

# ─── FUNCIONES DE RECOLECCIÓN ─────────────────────────────────

def obtener_partidos(liga_code: str, temporada: int = 2023) -> list:
    """
    Descarga todos los partidos finalizados de una liga y temporada.
    """
    url = f"{BASE_URL}/competitions/{liga_code}/matches"
    params = {
        "season": temporada,
        "status": "FINISHED"
    }
    
    print(f"📡 Descargando partidos de {LIGAS.get(liga_code, liga_code)} {temporada}...")
    
    try:
        response = requests.get(url, headers=HEADERS, params=params)
        
        if response.status_code == 200:
            data = response.json()
            partidos = data.get("matches", [])
            print(f"   ✅ {len(partidos)} partidos encontrados")
            return partidos
        elif response.status_code == 429:
            print("   ⚠️  Límite de solicitudes alcanzado. Esperando 60 segundos...")
            time.sleep(60)
            return obtener_partidos(liga_code, temporada)
        else:
            print(f"   ❌ Error {response.status_code}: {response.text}")
            return []
            
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return []


def procesar_partidos(partidos_raw: list) -> pd.DataFrame:
    """
    Convierte los datos crudos de la API en un DataFrame limpio.
    """
    registros = []
    
    for p in partidos_raw:
        try:
            registro = {
                "partido_id":      p["id"],
                "fecha":           p["utcDate"][:10],
                "liga":            p["competition"]["code"],
                "jornada":         p.get("matchday", 0),
                "equipo_local":    p["homeTeam"]["name"],
                "equipo_visitante":p["awayTeam"]["name"],
                "goles_local":     p["score"]["fullTime"]["home"],
                "goles_visitante": p["score"]["fullTime"]["away"],
            }
            
            # Calcular resultado
            if registro["goles_local"] > registro["goles_visitante"]:
                registro["resultado"] = "LOCAL"
            elif registro["goles_local"] < registro["goles_visitante"]:
                registro["resultado"] = "VISITANTE"
            else:
                registro["resultado"] = "EMPATE"
                
            registros.append(registro)
            
        except (KeyError, TypeError):
            continue
    
    df = pd.DataFrame(registros)
    print(f"   📊 DataFrame creado: {len(df)} filas, {len(df.columns)} columnas")
    return df


def calcular_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calcula las variables predictoras (features) para el modelo ML.
    Basado en los últimos 5 partidos de cada equipo.
    """
    print("\n⚙️  Calculando features de los equipos...")
    
    df = df.sort_values("fecha").reset_index(drop=True)
    features_lista = []
    
    for idx, partido in df.iterrows():
        fecha        = partido["fecha"]
        local        = partido["equipo_local"]
        visitante    = partido["equipo_visitante"]
        
        # Partidos anteriores del equipo local
        hist_local = df[
            ((df["equipo_local"] == local) | (df["equipo_visitante"] == local)) &
            (df["fecha"] < fecha)
        ].tail(5)
        
        # Partidos anteriores del equipo visitante
        hist_visit = df[
            ((df["equipo_local"] == visitante) | (df["equipo_visitante"] == visitante)) &
            (df["fecha"] < fecha)
        ].tail(5)
        
        # Head to head
        h2h = df[
            ((df["equipo_local"] == local) & (df["equipo_visitante"] == visitante)) |
            ((df["equipo_local"] == visitante) & (df["equipo_visitante"] == local))
        ]
        
        def stats_equipo(hist, nombre_equipo):
            """Calcula estadísticas de un equipo en sus últimos partidos."""
            if len(hist) == 0:
                return {"goles_favor": 1.0, "goles_contra": 1.0, "puntos": 1.0, "partidos": 0}
            
            goles_favor  = []
            goles_contra = []
            puntos       = []
            
            for _, h in hist.iterrows():
                if h["equipo_local"] == nombre_equipo:
                    gf = h["goles_local"]
                    gc = h["goles_visitante"]
                    pts = 3 if h["resultado"] == "LOCAL" else (1 if h["resultado"] == "EMPATE" else 0)
                else:
                    gf = h["goles_visitante"]
                    gc = h["goles_local"]
                    pts = 3 if h["resultado"] == "VISITANTE" else (1 if h["resultado"] == "EMPATE" else 0)
                
                goles_favor.append(gf)
                goles_contra.append(gc)
                puntos.append(pts)
            
            return {
                "goles_favor":  sum(goles_favor) / len(goles_favor),
                "goles_contra": sum(goles_contra) / len(goles_contra),
                "puntos":       sum(puntos) / len(puntos),
                "partidos":     len(hist)
            }
        
        stats_l = stats_equipo(hist_local, local)
        stats_v = stats_equipo(hist_visit, visitante)
        
        # H2H victorias del local
        h2h_local_wins = len(h2h[h2h["equipo_local"] == local][h2h["resultado"] == "LOCAL"]) if len(h2h) > 0 else 0
        
        feature = {
            "partido_id":                 partido["partido_id"],
            "fecha":                      fecha,
            "equipo_local":               local,
            "equipo_visitante":           visitante,
            
            # Features del local
            "local_goles_favor_prom":     round(stats_l["goles_favor"], 2),
            "local_goles_contra_prom":    round(stats_l["goles_contra"], 2),
            "local_puntos_prom":          round(stats_l["puntos"], 2),
            "local_partidos_historial":   stats_l["partidos"],
            
            # Features del visitante
            "visit_goles_favor_prom":     round(stats_v["goles_favor"], 2),
            "visit_goles_contra_prom":    round(stats_v["goles_contra"], 2),
            "visit_puntos_prom":          round(stats_v["puntos"], 2),
            "visit_partidos_historial":   stats_v["partidos"],
            
            # Head to head
            "h2h_victorias_local":        h2h_local_wins,
            "h2h_total_partidos":         len(h2h),
            
            # Target (lo que queremos predecir)
            "resultado":                  partido["resultado"]
        }
        
        features_lista.append(feature)
    
    df_features = pd.DataFrame(features_lista)
    print(f"   ✅ Features calculadas: {len(df_features)} partidos listos para ML")
    return df_features


def guardar_datos(df: pd.DataFrame, nombre: str):
    """Guarda el DataFrame en CSV."""
    os.makedirs("datos", exist_ok=True)
    ruta = f"datos/{nombre}.csv"
    df.to_csv(ruta, index=False)
    print(f"   💾 Guardado en: {ruta}")


# ─── DATOS DE DEMO (sin API Key) ──────────────────────────────

def generar_datos_demo() -> pd.DataFrame:
    """
    Genera datos ficticios para probar el sistema sin API Key.
    Útil para desarrollo local.
    """
    print("\n🎮 Generando datos de DEMO (sin API Key)...")
    
    import random
    random.seed(42)
    
    equipos = [
        "Real Madrid", "Barcelona", "Atlético Madrid", "Sevilla",
        "Valencia", "Villarreal", "Athletic Club", "Real Sociedad",
        "Betis", "Osasuna", "Celta Vigo", "Getafe"
    ]
    
    registros = []
    fecha_base = datetime(2023, 8, 1)
    
    for jornada in range(1, 35):
        random.shuffle(equipos)
        for i in range(0, len(equipos) - 1, 2):
            local     = equipos[i]
            visitante = equipos[i + 1]
            
            goles_l = random.choices([0, 1, 2, 3, 4], weights=[15, 30, 30, 15, 10])[0]
            goles_v = random.choices([0, 1, 2, 3, 4], weights=[20, 35, 25, 15, 5])[0]
            
            if goles_l > goles_v:
                resultado = "LOCAL"
            elif goles_l < goles_v:
                resultado = "VISITANTE"
            else:
                resultado = "EMPATE"
            
            registros.append({
                "partido_id":       jornada * 100 + i,
                "fecha":            (fecha_base + pd.Timedelta(days=jornada * 7)).strftime("%Y-%m-%d"),
                "liga":             "PD",
                "jornada":          jornada,
                "equipo_local":     local,
                "equipo_visitante": visitante,
                "goles_local":      goles_l,
                "goles_visitante":  goles_v,
                "resultado":        resultado
            })
    
    df = pd.DataFrame(registros)
    print(f"   ✅ {len(df)} partidos de demo generados")
    return df


# ─── MAIN ─────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  LifeHackIA — Recolector de Datos de Fútbol")
    print("=" * 60)
    
    # Opción 1: Con API Key real
    if API_KEY != "TU_API_KEY_AQUI":
        todos_partidos = []
        
        for codigo_liga in ["PD", "PL", "BL1"]:
            partidos_raw = obtener_partidos(codigo_liga, temporada=2023)
            if partidos_raw:
                df_liga = procesar_partidos(partidos_raw)
                todos_partidos.append(df_liga)
            time.sleep(6)  # Respetar límite de API gratuita
        
        if todos_partidos:
            df_total = pd.concat(todos_partidos, ignore_index=True)
            guardar_datos(df_total, "partidos_raw")
            
            df_features = calcular_features(df_total)
            guardar_datos(df_features, "partidos_features")
    
    # Opción 2: Datos de demo (sin API Key)
    else:
        print("\n⚠️  No hay API Key. Usando datos de DEMO.")
        print("   Regístrate gratis en: https://www.football-data.org/\n")
        
        df_demo = generar_datos_demo()
        guardar_datos(df_demo, "partidos_raw")
        
        df_features = calcular_features(df_demo)
        guardar_datos(df_features, "partidos_features")
    
    print("\n✅ Datos listos. Ahora ejecuta: python 2_entrenar_modelo.py")
