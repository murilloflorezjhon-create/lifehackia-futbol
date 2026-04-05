"""
================================================================
  LifeHackIA — Recolector de Datos Multi-API
  
  Integra 5 fuentes de datos gratuitas para enriquecer
  el modelo XGBoost y mejorar la precisión de pronósticos.
  
  APIs integradas:
  1. football-data.org    → fixtures, standings, H2H
  2. API-Football         → xG, lineups, estadísticas avanzadas
  3. Bzzoiro Sports       → predicciones ML, odds en vivo
  4. TheSportsDB          → logos, fotos, datos históricos
  5. Open-Meteo           → clima (afecta rendimiento en campo)
  
  Instalar:
    pip install requests pandas python-dotenv
  
  Uso:
    python data_collector.py
================================================================
"""

import os
import time
import json
import requests
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional

# ── CONFIGURACIÓN DE API KEYS ──────────────────────────────────
# Agrega estas variables en Railway → Variables de entorno

FOOTBALL_DATA_KEY  = os.environ.get("FOOTBALL_API_KEY", "69a4800800db4cab9548fe84e5f35953")
API_FOOTBALL_KEY   = os.environ.get("API_FOOTBALL_KEY", "7f13d85e3a5db407f7496978db0a4590")    # Registrar en api-sports.io
BZZOIRO_KEY        = os.environ.get("BZZOIRO_KEY", "61aa15ec445525fc97e2fdd6ad337beb5c4709c2")         # Registrar en sports.bzzoiro.com
# TheSportsDB y Open-Meteo son gratuitas sin key

HOY = datetime.now().strftime("%Y-%m-%d")
MANANA = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

# ================================================================
#  FUENTE 1 — football-data.org (ya tienes la key)
#  Datos: fixtures, standings, H2H, resultados
# ================================================================

class FootballDataOrg:
    BASE = "https://api.football-data.org/v4"
    # Ligas gratuitas disponibles
    LIGAS = {
        "PL":  "Premier League",
        "PD":  "LaLiga",
        "BL1": "Bundesliga",
        "SA":  "Serie A",
        "FL1": "Ligue 1",
        "CL":  "Champions League",
        "BSA": "Brasileirao",
        "ELC": "Championship",
        "PPL": "Primeira Liga",
    }

    def __init__(self, api_key: str):
        self.headers = {"X-Auth-Token": api_key}

    def get_partidos_hoy(self) -> list:
        """Obtiene partidos de hoy en todas las ligas gratuitas."""
        try:
            ligas = ",".join(self.LIGAS.keys())
            r = requests.get(
                f"{self.BASE}/matches",
                headers=self.headers,
                params={"competitions": ligas, "dateFrom": HOY, "dateTo": HOY},
                timeout=10
            )
            if r.status_code == 200:
                matches = r.json().get("matches", [])
                print(f"✅ football-data.org: {len(matches)} partidos hoy")
                return matches
        except Exception as e:
            print(f"❌ football-data.org error: {e}")
        return []

    def get_standings(self, competition: str = "PL") -> dict:
        """Obtiene tabla de posiciones de una liga."""
        try:
            r = requests.get(
                f"{self.BASE}/competitions/{competition}/standings",
                headers=self.headers,
                timeout=10
            )
            if r.status_code == 200:
                return r.json()
        except Exception as e:
            print(f"❌ Standings error: {e}")
        return {}

    def get_h2h(self, match_id: int) -> dict:
        """Obtiene historial H2H de un partido específico."""
        try:
            r = requests.get(
                f"{self.BASE}/matches/{match_id}/head2head",
                headers=self.headers,
                params={"limit": 10},
                timeout=10
            )
            if r.status_code == 200:
                return r.json()
        except Exception as e:
            print(f"❌ H2H error: {e}")
        return {}

    def get_team_matches(self, team_id: int, limit: int = 5) -> list:
        """Obtiene últimos N partidos de un equipo."""
        try:
            r = requests.get(
                f"{self.BASE}/teams/{team_id}/matches",
                headers=self.headers,
                params={"limit": limit, "status": "FINISHED"},
                timeout=10
            )
            if r.status_code == 200:
                return r.json().get("matches", [])
        except Exception as e:
            print(f"❌ Team matches error: {e}")
        return []


# ================================================================
#  FUENTE 2 — API-Football / api-sports.io
#  100 requests/día GRATIS · Sin tarjeta · Para siempre
#  Datos: xG, lineups, estadísticas avanzadas, odds pre-partido
#  Registro: https://dashboard.api-football.com/register
# ================================================================

class APIFootball:
    BASE = "https://v3.football.api-sports.io"

    def __init__(self, api_key: str):
        self.headers = {
            "x-rapidapi-host": "v3.football.api-sports.io",
            "x-rapidapi-key": api_key
        }
        self.disponible = bool(api_key)

    def get_fixtures_hoy(self) -> list:
        """Obtiene partidos de hoy con estadísticas detalladas."""
        if not self.disponible:
            print("⚠️  API-Football: sin key configurada")
            return []
        try:
            r = requests.get(
                f"{self.BASE}/fixtures",
                headers=self.headers,
                params={"date": HOY, "timezone": "America/Bogota"},
                timeout=10
            )
            if r.status_code == 200:
                fixtures = r.json().get("response", [])
                print(f"✅ API-Football: {len(fixtures)} partidos hoy")
                return fixtures
        except Exception as e:
            print(f"❌ API-Football error: {e}")
        return []

    def get_estadisticas_equipo(self, team_id: int, league_id: int, season: int = 2025) -> dict:
        """Obtiene estadísticas completas de un equipo en la temporada."""
        if not self.disponible:
            return {}
        try:
            r = requests.get(
                f"{self.BASE}/teams/statistics",
                headers=self.headers,
                params={"team": team_id, "league": league_id, "season": season},
                timeout=10
            )
            if r.status_code == 200:
                return r.json().get("response", {})
        except Exception as e:
            print(f"❌ Estadísticas error: {e}")
        return {}

    def get_lesiones(self, fixture_id: int) -> list:
        """Obtiene jugadores lesionados para un partido."""
        if not self.disponible:
            return []
        try:
            r = requests.get(
                f"{self.BASE}/injuries",
                headers=self.headers,
                params={"fixture": fixture_id},
                timeout=10
            )
            if r.status_code == 200:
                return r.json().get("response", [])
        except Exception as e:
            print(f"❌ Lesiones error: {e}")
        return []

    def get_prediccion(self, fixture_id: int) -> dict:
        """Obtiene predicción nativa de API-Football para comparar con XGBoost."""
        if not self.disponible:
            return {}
        try:
            r = requests.get(
                f"{self.BASE}/predictions",
                headers=self.headers,
                params={"fixture": fixture_id},
                timeout=10
            )
            if r.status_code == 200:
                response = r.json().get("response", [])
                return response[0] if response else {}
        except Exception as e:
            print(f"❌ Predicción error: {e}")
        return {}


# ================================================================
#  FUENTE 3 — Bzzoiro Sports API
#  ILIMITADO y GRATIS · Predicciones ML incluidas · Sin tarjeta
#  Datos: scores live, odds, predicciones CatBoost ML
#  Registro: https://sports.bzzoiro.com
# ================================================================

class BzzoiroSports:
    BASE = "https://sports.bzzoiro.com/api"

    def __init__(self, api_key: str = ""):
        self.headers = {"Authorization": f"Token {api_key}"} if api_key else {}
        self.disponible = bool(api_key)

    def get_predicciones(self, upcoming: bool = True) -> list:
        """Obtiene predicciones ML de partidos próximos."""
        if not self.disponible:
            print("⚠️  Bzzoiro: sin key configurada")
            return []
        try:
            r = requests.get(
                f"{self.BASE}/predictions/",
                headers=self.headers,
                params={"upcoming": "true" if upcoming else "false"},
                timeout=10
            )
            if r.status_code == 200:
                results = r.json().get("results", [])
                print(f"✅ Bzzoiro: {len(results)} predicciones ML")
                return results
        except Exception as e:
            print(f"❌ Bzzoiro error: {e}")
        return []

    def get_odds(self, event_id: int) -> dict:
        """Obtiene cuotas en tiempo real de bookmakers."""
        if not self.disponible:
            return {}
        try:
            r = requests.get(
                f"{self.BASE}/odds/{event_id}/",
                headers=self.headers,
                timeout=10
            )
            if r.status_code == 200:
                return r.json()
        except Exception as e:
            print(f"❌ Odds error: {e}")
        return {}


# ================================================================
#  FUENTE 4 — TheSportsDB
#  GRATUITA sin registro · 100 req/min · Logos y fotos HD
#  Datos: logos equipos, fotos, estadios, resultados históricos
#  URL: https://www.thesportsdb.com/api.php
# ================================================================

class TheSportsDB:
    BASE = "https://www.thesportsdb.com/api/v1/json/3"  # key pública gratuita

    def get_team_info(self, nombre_equipo: str) -> dict:
        """Busca información y logo de un equipo por nombre."""
        try:
            r = requests.get(
                f"{self.BASE}/searchteams.php",
                params={"t": nombre_equipo},
                timeout=10
            )
            if r.status_code == 200:
                teams = r.json().get("teams", [])
                return teams[0] if teams else {}
        except Exception as e:
            print(f"❌ TheSportsDB error: {e}")
        return {}

    def get_ultimos_partidos(self, team_id: str, limite: int = 5) -> list:
        """Obtiene últimos partidos de un equipo."""
        try:
            r = requests.get(
                f"{self.BASE}/eventslast.php",
                params={"id": team_id},
                timeout=10
            )
            if r.status_code == 200:
                events = r.json().get("results", [])
                return events[:limite] if events else []
        except Exception as e:
            print(f"❌ TheSportsDB partidos error: {e}")
        return []

    def get_logo_equipo(self, nombre_equipo: str) -> Optional[str]:
        """Retorna URL del logo en HD de un equipo."""
        info = self.get_team_info(nombre_equipo)
        return info.get("strTeamBadge") or info.get("strTeamLogo")


# ================================================================
#  FUENTE 5 — Open-Meteo (clima)
#  GRATUITA y sin registro · Clima en tiempo real y pronóstico
#  Datos: temperatura, viento, lluvia, visibilidad
#  El clima afecta el rendimiento, especialmente para equipos
#  acostumbrados a climas específicos
# ================================================================

class OpenMeteo:
    BASE = "https://api.open-meteo.com/v1/forecast"

    # Coordenadas de ciudades con equipos en tus ligas
    CIUDADES = {
        "Londres":      (51.5074, -0.1278),
        "Manchester":   (53.4808, -2.2426),
        "Madrid":       (40.4168, -3.7038),
        "Barcelona":    (41.3851, 2.1734),
        "Munich":       (48.1351, 11.5820),
        "Milan":        (45.4642, 9.1900),
        "Paris":        (48.8566, 2.3522),
        "Bogota":       (4.7110, -74.0721),
        "Cali":         (3.4516, -76.5319),
        "Medellin":     (6.2442, -75.5812),
        "Barranquilla": (10.9685, -74.7813),
        "Buenaventura": (3.8801, -77.0314),
    }

    def get_clima(self, ciudad: str = "Londres") -> dict:
        """Obtiene pronóstico del clima para la ciudad del partido."""
        coords = self.CIUDADES.get(ciudad, (51.5074, -0.1278))
        try:
            r = requests.get(
                self.BASE,
                params={
                    "latitude": coords[0],
                    "longitude": coords[1],
                    "current": "temperature_2m,wind_speed_10m,precipitation,weather_code",
                    "timezone": "auto",
                    "forecast_days": 1
                },
                timeout=10
            )
            if r.status_code == 200:
                data = r.json()
                current = data.get("current", {})
                clima = {
                    "temperatura":  current.get("temperature_2m", 20),
                    "viento":       current.get("wind_speed_10m", 10),
                    "precipitacion": current.get("precipitation", 0),
                    "codigo_clima": current.get("weather_code", 0),
                    "condicion":    _interpretar_clima(current.get("weather_code", 0)),
                }
                print(f"✅ Open-Meteo {ciudad}: {clima['temperatura']}°C, {clima['condicion']}")
                return clima
        except Exception as e:
            print(f"❌ Open-Meteo error: {e}")
        return {"temperatura": 20, "viento": 10, "precipitacion": 0, "condicion": "despejado"}


def _interpretar_clima(codigo: int) -> str:
    """Interpreta el código WMO de clima."""
    if codigo == 0:   return "despejado"
    elif codigo <= 3: return "parcialmente nublado"
    elif codigo <= 48: return "niebla"
    elif codigo <= 67: return "lluvia"
    elif codigo <= 77: return "nieve"
    elif codigo <= 82: return "lluvia intensa"
    elif codigo <= 99: return "tormenta"
    return "desconocido"


# ================================================================
#  AGREGADOR PRINCIPAL — Combina las 5 fuentes
# ================================================================

class DataAggregator:
    """
    Combina datos de las 5 APIs para enriquecer cada partido
    con features adicionales que mejoran el modelo XGBoost.
    """

    def __init__(self):
        self.fd   = FootballDataOrg(FOOTBALL_DATA_KEY)
        self.apif = APIFootball(API_FOOTBALL_KEY)
        self.bzz  = BzzoiroSports(BZZOIRO_KEY)
        self.tsdb = TheSportsDB()
        self.meteo = OpenMeteo()

    def get_datos_partido(self, equipo_local: str, equipo_visitante: str,
                          ciudad: str = "Londres") -> dict:
        """
        Obtiene datos enriquecidos de un partido combinando las 5 fuentes.
        Retorna un diccionario con todas las features para el modelo XGBoost.
        """
        print(f"\n🔍 Recolectando datos: {equipo_local} vs {equipo_visitante}")
        print("=" * 60)

        datos = {
            "partido": f"{equipo_local} vs {equipo_visitante}",
            "fecha": HOY,
            "fuentes_activas": [],
        }

        # ── FUENTE 1: football-data.org ──────────────────────────
        try:
            partidos_hoy = self.fd.get_partidos_hoy()
            partido_match = None
            for p in partidos_hoy:
                h = p.get("homeTeam", {}).get("name", "").lower()
                a = p.get("awayTeam", {}).get("name", "").lower()
                if equipo_local.lower() in h or equipo_visitante.lower() in a:
                    partido_match = p
                    break

            if partido_match:
                datos["fd_match_id"]  = partido_match.get("id")
                datos["fd_status"]    = partido_match.get("status")
                datos["fd_home_id"]   = partido_match.get("homeTeam", {}).get("id")
                datos["fd_away_id"]   = partido_match.get("awayTeam", {}).get("id")
                datos["fd_liga"]      = partido_match.get("competition", {}).get("name")
                datos["fuentes_activas"].append("football-data.org")
                print(f"  ✅ football-data.org: partido encontrado ID={datos['fd_match_id']}")

                # H2H si tenemos el match_id
                if datos.get("fd_match_id"):
                    h2h = self.fd.get_h2h(datos["fd_match_id"])
                    matches_h2h = h2h.get("matches", [])
                    if matches_h2h:
                        victorias_local = sum(
                            1 for m in matches_h2h
                            if m.get("score", {}).get("winner") == "HOME_TEAM"
                        )
                        datos["h2h_victorias_local"] = victorias_local
                        datos["h2h_total"] = len(matches_h2h)
                        print(f"  ✅ H2H: {victorias_local}/{len(matches_h2h)} victorias local")
        except Exception as e:
            print(f"  ❌ football-data.org: {e}")

        # ── FUENTE 2: API-Football (si tiene key) ────────────────
        if API_FOOTBALL_KEY:
            try:
                fixtures = self.apif.get_fixtures_hoy()
                for f in fixtures:
                    teams = f.get("teams", {})
                    h = teams.get("home", {}).get("name", "").lower()
                    a = teams.get("away", {}).get("name", "").lower()
                    if equipo_local.lower() in h or equipo_visitante.lower() in a:
                        stats = f.get("statistics", [])
                        pred  = self.apif.get_prediccion(f.get("fixture", {}).get("id"))

                        datos["apif_fixture_id"] = f.get("fixture", {}).get("id")
                        datos["apif_forma_local"]    = teams.get("home", {}).get("winner")
                        datos["apif_forma_visitante"] = teams.get("away", {}).get("winner")

                        if pred:
                            predictions = pred.get("predictions", {})
                            datos["apif_pred_winner"]   = predictions.get("winner", {}).get("name")
                            datos["apif_pred_advice"]   = predictions.get("advice")
                            datos["apif_pred_local_pct"]    = predictions.get("percent", {}).get("home", "0%")
                            datos["apif_pred_empate_pct"]   = predictions.get("percent", {}).get("draw", "0%")
                            datos["apif_pred_visita_pct"]   = predictions.get("percent", {}).get("away", "0%")

                        datos["fuentes_activas"].append("API-Football")
                        print(f"  ✅ API-Football: fixture encontrado")
                        break
            except Exception as e:
                print(f"  ❌ API-Football: {e}")

        # ── FUENTE 3: Bzzoiro ML Predictions ────────────────────
        if BZZOIRO_KEY:
            try:
                preds = self.bzz.get_predicciones()
                for p in preds:
                    h = p.get("home_team", "").lower()
                    a = p.get("away_team", "").lower()
                    if equipo_local.lower() in h or equipo_visitante.lower() in a:
                        datos["bzz_pred_resultado"] = p.get("prediction")
                        datos["bzz_odds_local"]     = p.get("odds_home")
                        datos["bzz_odds_empate"]    = p.get("odds_draw")
                        datos["bzz_odds_visita"]    = p.get("odds_away")
                        datos["fuentes_activas"].append("Bzzoiro ML")
                        print(f"  ✅ Bzzoiro ML: predicción encontrada → {p.get('prediction')}")
                        break
            except Exception as e:
                print(f"  ❌ Bzzoiro: {e}")

        # ── FUENTE 4: TheSportsDB (logos y datos históricos) ─────
        try:
            info_local   = self.tsdb.get_team_info(equipo_local)
            info_visita  = self.tsdb.get_team_info(equipo_visitante)

            datos["logo_local"]   = info_local.get("strTeamBadge") or info_local.get("strTeamLogo")
            datos["logo_visita"]  = info_visita.get("strTeamBadge") or info_visita.get("strTeamLogo")
            datos["estadio"]      = info_local.get("strStadium")
            datos["capacidad"]    = info_local.get("intStadiumCapacity")
            datos["pais_local"]   = info_local.get("strCountry")

            if info_local:
                datos["fuentes_activas"].append("TheSportsDB")
                print(f"  ✅ TheSportsDB: info equipo encontrada")
        except Exception as e:
            print(f"  ❌ TheSportsDB: {e}")

        # ── FUENTE 5: Open-Meteo (clima) ─────────────────────────
        try:
            clima = self.meteo.get_clima(ciudad)
            datos["clima_temperatura"]   = clima.get("temperatura", 20)
            datos["clima_viento"]        = clima.get("viento", 10)
            datos["clima_precipitacion"] = clima.get("precipitacion", 0)
            datos["clima_condicion"]     = clima.get("condicion", "despejado")
            datos["fuentes_activas"].append("Open-Meteo")
        except Exception as e:
            print(f"  ❌ Open-Meteo: {e}")

        print(f"\n  📊 Fuentes activas: {', '.join(datos['fuentes_activas'])}")
        print(f"  📊 Total features recolectados: {len(datos)} variables")
        return datos

    def construir_features_xgboost(self, datos: dict,
                                    stats_local: dict, stats_visitante: dict) -> dict:
        """
        Construye el vector de features enriquecido para XGBoost
        combinando los datos de las 5 APIs con las estadísticas base.
        """
        # Features base (ya existentes en tu modelo)
        features = {
            "local_goles_favor_prom":   stats_local.get("goles_favor_prom", 1.5),
            "local_goles_contra_prom":  stats_local.get("goles_contra_prom", 1.0),
            "local_puntos_prom":        stats_local.get("puntos_prom", 1.8),
            "local_partidos_historial": stats_local.get("partidos_historial", 5),
            "visit_goles_favor_prom":   stats_visitante.get("goles_favor_prom", 1.4),
            "visit_goles_contra_prom":  stats_visitante.get("goles_contra_prom", 1.1),
            "visit_puntos_prom":        stats_visitante.get("puntos_prom", 1.6),
            "visit_partidos_historial": stats_visitante.get("partidos_historial", 5),
            "h2h_victorias_local":      datos.get("h2h_victorias_local", 3),
            "h2h_total_partidos":       datos.get("h2h_total", 10),
        }

        # Features adicionales de las 5 APIs (mejoran la precisión)
        features_adicionales = {
            # Clima — afecta rendimiento (factor 1-5%)
            "clima_temperatura":    datos.get("clima_temperatura", 20),
            "clima_lluvia":         1 if datos.get("clima_precipitacion", 0) > 2 else 0,
            "clima_viento_fuerte":  1 if datos.get("clima_viento", 0) > 40 else 0,

            # Odds de mercado — el mercado tiene información implícita
            "odds_local":   float(str(datos.get("bzz_odds_local", "2.0")).replace("%","") or 2.0),
            "odds_empate":  float(str(datos.get("bzz_odds_empate", "3.2")).replace("%","") or 3.2),
            "odds_visita":  float(str(datos.get("bzz_odds_visita", "3.5")).replace("%","") or 3.5),

            # Consenso de predicciones externas (votos)
            "pred_externas_local":  1 if datos.get("apif_pred_winner") and
                                    "home" in str(datos.get("apif_pred_winner","")).lower() else 0,
            "pred_bzz_local":       1 if "home" in str(datos.get("bzz_pred_resultado","")).lower() else 0,
        }

        features.update(features_adicionales)
        return features


# ================================================================
#  ENDPOINT FASTAPI — integrar en 3_api.py
# ================================================================

def get_datos_enriquecidos_endpoint(equipo_local: str,
                                     equipo_visitante: str,
                                     ciudad: str = "Londres") -> dict:
    """
    Función lista para usar en el endpoint /datos-enriquecidos de FastAPI.
    Llama desde 3_api.py:

    from data_collector import get_datos_enriquecidos_endpoint

    @app.get("/datos/{local}/{visitante}")
    def datos_partido(local: str, visitante: str):
        return get_datos_enriquecidos_endpoint(local, visitante)
    """
    agregador = DataAggregator()
    return agregador.get_datos_partido(equipo_local, equipo_visitante, ciudad)


# ================================================================
#  MAIN — prueba las 5 APIs
# ================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("  LifeHackIA — Prueba de las 5 APIs de datos")
    print("=" * 60)

    agregador = DataAggregator()

    # Prueba con un partido real
    datos = agregador.get_datos_partido(
        equipo_local="Liverpool",
        equipo_visitante="Manchester United",
        ciudad="Manchester"
    )

    print("\n" + "=" * 60)
    print("  DATOS RECOLECTADOS:")
    print("=" * 60)
    for k, v in datos.items():
        if v and k != "fuentes_activas":
            print(f"  {k}: {v}")

    print(f"\n  Fuentes activas: {datos.get('fuentes_activas', [])}")
    print("\n✅ Prueba completada")
