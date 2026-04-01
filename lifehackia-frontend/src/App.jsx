import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Trophy,
  Activity,
  Radar,
  RefreshCw,
  Globe,
  BarChart3,
  ShieldCheck,
  Goal,
  Zap,
} from "lucide-react";

const API_BASE_DEFAULT = "https://lifehackia-futbol-production.up.railway.app"

const demoMatches = [
  { id: 1, league: "LaLiga", home: "Real Madrid", away: "Sevilla", date: "2026-04-02 19:00", status: "Programado" },
  { id: 2, league: "Premier League", home: "Arsenal", away: "Chelsea", date: "2026-04-03 14:30", status: "Programado" },
  { id: 3, league: "Serie A", home: "Inter", away: "Napoli", date: "2026-04-03 16:00", status: "Programado" },
  { id: 4, league: "Liga BetPlay", home: "América de Cali", away: "Millonarios", date: "2026-04-04 18:10", status: "Programado" },
  { id: 5, league: "Champions", home: "Bayern", away: "PSG", date: "2026-04-05 20:00", status: "Programado" },
  { id: 6, league: "LaLiga", home: "Barcelona", away: "Atlético", date: "2026-04-06 20:00", status: "Programado" },
];

const styles = {
  page: {
    minHeight: "100vh",
    color: "#fff",
    background:
      "radial-gradient(circle at top, rgba(56,189,248,0.18), transparent 25%), radial-gradient(circle at right, rgba(168,85,247,0.15), transparent 25%), linear-gradient(135deg, #020617, #0f172a, #111827)",
    fontFamily: "Inter, Arial, sans-serif",
  },
  container: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: 24,
  },
  gridHero: {
    display: "grid",
    gridTemplateColumns: "1.3fr 0.7fr",
    gap: 20,
    marginBottom: 32,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 32,
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 28,
    backdropFilter: "blur(12px)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  },
  inner: { padding: 24 },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.1)",
    fontSize: 13,
    color: "#e2e8f0",
  },
  muted: { color: "#94a3b8" },
  smallMuted: { color: "#94a3b8", fontSize: 14 },
  button: {
    border: "none",
    borderRadius: 16,
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  },
  buttonPrimary: {
    background: "#ffffff",
    color: "#0f172a",
  },
  buttonSecondary: {
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.15)",
  },
  input: {
    width: "100%",
    background: "rgba(2,6,23,0.6)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: 16,
    padding: "12px 14px",
    outline: "none",
    boxSizing: "border-box",
  },
  tabsRow: {
    display: "flex",
    gap: 8,
    marginBottom: 24,
    background: "rgba(255,255,255,0.05)",
    padding: 6,
    borderRadius: 18,
    width: "fit-content",
  },
  tab: {
    border: "none",
    borderRadius: 12,
    padding: "12px 22px",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    fontWeight: 700,
  },
  tabActive: {
    background: "#ffffff",
    color: "#0f172a",
  },
  twoCols: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 24,
  },
  matchCard: {
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(2,6,23,0.35)",
    padding: 20,
    marginBottom: 16,
  },
  selectedCard: {
    border: "1px solid rgba(255,255,255,0.24)",
    background: "rgba(255,255,255,0.08)",
  },
  progressWrap: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressBar: (value) => ({
    width: `${Math.max(0, Math.min(100, value))}%`,
    height: "100%",
    background: "linear-gradient(90deg, #38bdf8, #a855f7)",
  }),
};

function Card({ children, style }) {
  return <div style={{ ...styles.card, ...style }}>{children}</div>;
}

function StatCard({ title, value, icon: Icon, subtitle }) {
  return (
    <Card>
      <div style={styles.inner}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, color: "#cbd5e1" }}>{title}</div>
            <div style={{ fontSize: 36, fontWeight: 800, marginTop: 8 }}>{value}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{subtitle}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 18, padding: 12, height: "fit-content" }}>
            <Icon size={20} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function PredictionBar({ label, value }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
        <span style={{ color: "#cbd5e1" }}>{label}</span>
        <span style={{ fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={styles.progressWrap}>
        <div style={styles.progressBar(value)} />
      </div>
    </div>
  );
}

function normalizeProbabilityValue(value) {
  if (value === undefined || value === null) return 0;
  const number = Number(value);
  if (Number.isNaN(number)) return 0;
  return Math.round(number * (number <= 1 ? 100 : 1));
}

function normalizePrediction(data, selectedMatch) {
  if (!data) return null;

  const extractProb = (probs, name) => {
    if (!probs || typeof probs !== "object") return 0;
    const normalized = {};
    Object.entries(probs).forEach(([key, value]) => {
      normalized[key.toString().toLowerCase()] = value;
    });
    return normalizeProbabilityValue(normalized[name.toLowerCase()]);
  };

  const local = extractProb(data.probabilidades, "local");
  const empate = extractProb(data.probabilidades, "empate");
  const visitante = extractProb(data.probabilidades, "visitante");
  const confidence = normalizeProbabilityValue(data.confianza ?? Math.max(local, empate, visitante));

  return {
    winner: data.prediccion || data.resultado || data.partido || data.mensaje || `${selectedMatch.home} vs ${selectedMatch.away}`,
    confidence,
    local,
    empate,
    visitante,
    explanation: data.explicacion || data.justificacion || data.advertencia || data.recomendacion || "Predicción calculada correctamente desde la API.",
  };
}

export default function App() {
  const [apiBase, setApiBase] = useState(API_BASE_DEFAULT);
  const [search, setSearch] = useState("");
  const [leagueFilter, setLeagueFilter] = useState("Todas");
  const [matches, setMatches] = useState(demoMatches);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(demoMatches[0]);
  const [activeTab, setActiveTab] = useState("partidos");
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [apiStatus, setApiStatus] = useState({ ok: true, message: "API conectada y lista" });
  const [prediction, setPrediction] = useState({
    winner: "Real Madrid",
    confidence: 61,
    local: 61,
    empate: 21,
    visitante: 18,
    explanation: "Predicción inicial de demostración. Puedes conectarla al endpoint real de tu API.",
  });
  const [lastResponse, setLastResponse] = useState(null);
  const [error, setError] = useState("");

  const leagues = useMemo(() => ["Todas", ...Array.from(new Set([...matches, ...upcomingMatches].map((m) => m.league || "")))], [matches, upcomingMatches]);

  const filteredUpcomingMatches = useMemo(() => {
    return upcomingMatches.filter((match) => {
      const byLeague = leagueFilter === "Todas" || match.league === leagueFilter;
      const bySearch = `${match.home} ${match.away} ${match.league}`.toLowerCase().includes(search.toLowerCase());
      return byLeague && bySearch;
    });
  }, [upcomingMatches, leagueFilter, search]);

  useEffect(() => {
    async function loadMatches() {
      setLoadingMatches(true);
      try {
        const res = await fetch(`${apiBase}/partidos`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const loaded = Array.isArray(data.partidos) ? data.partidos.map(normalizeMatch) : [];
        if (loaded.length > 0) {
          setMatches(loaded);
          setSelectedMatch(loaded[0]);
        }
      } catch (err) {
        console.warn("No se pudieron cargar partidos reales:", err);
      } finally {
        setLoadingMatches(false);
      }
    }

    loadMatches();
    loadUpcomingMatches();
  }, [apiBase]);

  async function loadUpcomingMatches() {
    setLoadingUpcoming(true);
    try {
      const res = await fetch(`${apiBase}/partidos/upcoming`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const loaded = Array.isArray(data.partidos) ? data.partidos.map(normalizeMatch) : [];
      setUpcomingMatches(loaded);
    } catch (err) {
      console.warn("No se pudieron cargar los próximos partidos:", err);
      setUpcomingMatches([]);
    } finally {
      setLoadingUpcoming(false);
    }
  }

  function normalizeMatch(match) {
    return {
      id: match.id ?? match.partido_id ?? `${match.home || match.equipo_local}-${match.away || match.equipo_visitante}-${match.date || match.fecha}`,
      league: match.league || match.liga || "Real",
      home: match.home || match.equipo_local || "",
      away: match.away || match.equipo_visitante || "",
      date: match.date || match.fecha || "",
      status: match.status || "Finalizado",
      stats_local: match.stats_local || null,
      stats_visitante: match.stats_visitante || null,
      h2h_victorias_local: match.h2h_victorias_local || 0,
      h2h_total_partidos: match.h2h_total_partidos || 0,
    };
  }

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const byLeague = leagueFilter === "Todas" || match.league === leagueFilter;
      const bySearch = `${match.home} ${match.away} ${match.league}`.toLowerCase().includes(search.toLowerCase());
      return byLeague && bySearch;
    });
  }, [matches, leagueFilter, search]);

  async function checkApi() {
    setLoadingHealth(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLastResponse(data);
      setApiStatus({ ok: true, message: data.mensaje || "API activa" });
    } catch (err) {
      setApiStatus({ ok: false, message: "No se pudo conectar con la API" });
      setError(err.message || "Error de conexión");
    } finally {
      setLoadingHealth(false);
    }
  }

  function buildDemoStats(match, isLocal) {
    const base = (match.id || 1) % 4;
    const offset = isLocal ? 0.18 : -0.12;

    return {
      goles_favor_prom: Number(Math.max(0.7, Math.min(3.5, 1.4 + base * 0.08 + offset)).toFixed(1)),
      goles_contra_prom: Number(Math.max(0.5, Math.min(2.5, 1.2 + base * 0.05 - offset)).toFixed(1)),
      puntos_prom: Number(Math.max(0.7, Math.min(3.0, 1.5 + base * 0.1 + offset)).toFixed(1)),
      partidos_historial: 5 + base,
    };
  }

  function buildPronosticoPayload(match) {
    const payload = {
      equipo_local: match.home,
      equipo_visitante: match.away,
      stats_local: match.stats_local || buildDemoStats(match, true),
      stats_visitante: match.stats_visitante || buildDemoStats(match, false),
      h2h_victorias_local: match.h2h_victorias_local || 0,
      h2h_total_partidos: match.h2h_total_partidos || 0,
    };

    if (payload.h2h_total_partidos <= 0) {
      payload.h2h_total_partidos = 5;
      payload.h2h_victorias_local = Math.min(2, payload.h2h_victorias_local);
    }

    return payload;
  }

  async function analyzeMatch(match) {
    setSelectedMatch(match);
    setLoadingPrediction(true);
    setError("");

    try {
      const payload = buildPronosticoPayload(match);
      const res = await fetch(`${apiBase}/pronostico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLastResponse(data);
      setPrediction(normalizePrediction(data, match));
      setActiveTab("prediccion");
    } catch (err) {
      setPrediction({
        winner: match.home,
        confidence: 58,
        local: 58,
        empate: 24,
        visitante: 18,
        explanation: "No fue posible leer la respuesta real del endpoint. Revisa la URL o los datos enviados al backend.",
      });
      setError(err.message || "No fue posible analizar el partido");
      setActiveTab("prediccion");
    } finally {
      setLoadingPrediction(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.gridHero}>
          <Card>
            <div style={{ ...styles.inner, padding: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
                <div style={{ maxWidth: 760 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 18, padding: 12 }}>
                      <Trophy size={28} />
                    </div>
                    <span style={styles.badge}>Producto vendible · listo para Vercel</span>
                  </div>
                  <h1 style={{ fontSize: 48, lineHeight: 1.05, margin: 0, fontWeight: 900 }}>LifeHackIA Fútbol</h1>
                  <p style={{ ...styles.smallMuted, marginTop: 14, maxWidth: 720, lineHeight: 1.7 }}>
                    Plataforma visual de pronósticos deportivos con estilo futurista. Esta versión quedó preparada para copiar en un proyecto React con Vite y publicar en Vercel.
                  </p>
                </div>
                <div style={{ display: "grid", gap: 12, minWidth: 220 }}>
                  <button onClick={checkApi} style={{ ...styles.button, ...styles.buttonPrimary }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      {loadingHealth ? <RefreshCw size={16} className="spin" /> : <ShieldCheck size={16} />}
                      Verificar API
                    </span>
                  </button>
                  <button style={{ ...styles.button, ...styles.buttonSecondary }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Globe size={16} />
                      Publicar versión premium
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div style={styles.inner}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24, fontWeight: 700 }}>
                <Activity size={20} /> Estado del sistema
              </div>
              <div style={{ ...styles.smallMuted, marginTop: 8 }}>Conexión actual con tu API de Railway</div>
              <div
                style={{
                  marginTop: 18,
                  padding: 16,
                  borderRadius: 18,
                  border: apiStatus.ok ? "1px solid rgba(16,185,129,0.28)" : "1px solid rgba(239,68,68,0.28)",
                  background: apiStatus.ok ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                }}
              >
                <div style={{ fontWeight: 700 }}>{apiStatus.ok ? "Sistema operativo" : "Conexión con fallos"}</div>
                <div style={{ marginTop: 6, color: "#e2e8f0" }}>{apiStatus.message}</div>
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 14, color: "#cbd5e1", marginBottom: 8 }}>Base URL</div>
                <input value={apiBase} onChange={(e) => setApiBase(e.target.value)} style={styles.input} />
              </div>
              {error && <div style={{ marginTop: 12, color: "#fcd34d", fontSize: 14 }}>Aviso técnico: {error}</div>}
            </div>
          </Card>
        </div>

        <div style={styles.statsGrid}>
          <StatCard title="Partidos visibles" value={filteredMatches.length} subtitle="Catálogo actual de análisis" icon={Goal} />
          <StatCard title="API" value={apiStatus.ok ? "Online" : "Error"} subtitle="Infraestructura Railway" icon={Radar} />
          <StatCard title="Precisión demo" value="61%" subtitle="Modelo base del panel" icon={BarChart3} />
          <StatCard title="Modo" value="Premium" subtitle="Listo para monetización" icon={Zap} />
        </div>

        <div style={styles.tabsRow}>
          {[
            ["partidos", "Partidos"],
            ["prediccion", "Predicción"],
            ["api", "Respuesta API"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{ ...styles.tab, ...(activeTab === key ? styles.tabActive : {}) }}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "partidos" && (
          <div style={styles.twoCols}>
            <Card>
              <div style={styles.inner}>
                <div style={{ fontSize: 32, fontWeight: 800 }}>Panel de partidos</div>
                <div style={{ ...styles.smallMuted, marginTop: 6, marginBottom: 18 }}>Busca encuentros y lanza análisis con un clic.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, marginBottom: 20 }}>
                  <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: 14, top: 14, color: "#94a3b8" }} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar equipo o liga..."
                      style={{ ...styles.input, paddingLeft: 40 }}
                    />
                  </div>
                  <select value={leagueFilter} onChange={(e) => setLeagueFilter(e.target.value)} style={styles.input}>
                    {leagues.map((league) => (
                      <option key={league} value={league} style={{ color: "#000" }}>
                        {league}
                      </option>
                    ))}
                  </select>
                </div>

                {filteredUpcomingMatches.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>Próximos partidos</div>
                      {loadingUpcoming && <span style={{ color: "#94a3b8" }}>Cargando próximos...</span>}
                    </div>
                    {filteredUpcomingMatches.map((match) => {
                      const isSelected = selectedMatch?.id === match.id;
                      return (
                        <div key={match.id} style={{ ...styles.matchCard, ...(isSelected ? styles.selectedCard : {}) }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                            <div>
                              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                                <span style={styles.badge}>{match.league}</span>
                                <span style={{ ...styles.badge, background: "transparent", border: "1px solid rgba(255,255,255,0.15)" }}>{match.status}</span>
                              </div>
                              <div style={{ fontSize: 24, fontWeight: 800 }}>
                                {match.home} <span style={{ color: "#64748b" }}>vs</span> {match.away}
                              </div>
                              <div style={{ ...styles.smallMuted, marginTop: 8 }}>{match.date}</div>
                            </div>
                            <div style={{ display: "flex", gap: 12 }}>
                              <button onClick={() => setSelectedMatch(match)} style={{ ...styles.button, ...styles.buttonSecondary }}>Ver</button>
                              <button onClick={() => analyzeMatch(match)} style={{ ...styles.button, ...styles.buttonPrimary }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                  {loadingPrediction && selectedMatch?.id === match.id ? <RefreshCw size={16} className="spin" /> : null}
                                  Analizar partido
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {filteredMatches.map((match) => {
                  const isSelected = selectedMatch?.id === match.id;
                  return (
                    <div key={match.id} style={{ ...styles.matchCard, ...(isSelected ? styles.selectedCard : {}) }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                        <div>
                          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                            <span style={styles.badge}>{match.league}</span>
                            <span style={{ ...styles.badge, background: "transparent", border: "1px solid rgba(255,255,255,0.15)" }}>{match.status}</span>
                          </div>
                          <div style={{ fontSize: 24, fontWeight: 800 }}>
                            {match.home} <span style={{ color: "#64748b" }}>vs</span> {match.away}
                          </div>
                          <div style={{ ...styles.smallMuted, marginTop: 8 }}>{match.date}</div>
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                          <button onClick={() => setSelectedMatch(match)} style={{ ...styles.button, ...styles.buttonSecondary }}>Ver</button>
                          <button onClick={() => analyzeMatch(match)} style={{ ...styles.button, ...styles.buttonPrimary }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                              {loadingPrediction && selectedMatch?.id === match.id ? <RefreshCw size={16} className="spin" /> : null}
                              Analizar partido
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <div style={styles.inner}>
                <div style={{ fontSize: 32, fontWeight: 800 }}>Partido seleccionado</div>
                <div style={{ ...styles.smallMuted, marginTop: 6, marginBottom: 18 }}>Vista rápida del encuentro a analizar.</div>
                <div style={{ borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(2,6,23,0.4)", padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={styles.badge}>{selectedMatch.league}</span>
                    <span style={styles.smallMuted}>{selectedMatch.date}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12, textAlign: "center" }}>
                    <div>
                      <div style={{ color: "#94a3b8", fontSize: 18 }}>Local</div>
                      <div style={{ fontWeight: 900, fontSize: 34, marginTop: 8 }}>{selectedMatch.home}</div>
                    </div>
                    <div style={{ borderRadius: 18, background: "rgba(255,255,255,0.1)", padding: "12px 18px", fontWeight: 800, fontSize: 24 }}>VS</div>
                    <div>
                      <div style={{ color: "#94a3b8", fontSize: 18 }}>Visitante</div>
                      <div style={{ fontWeight: 900, fontSize: 34, marginTop: 8 }}>{selectedMatch.away}</div>
                    </div>
                  </div>
                </div>
                <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "24px 0" }} />
                <div style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.7 }}>
                  <p>Usa este panel para vender análisis puntuales, membresías premium o reportes diarios automatizados.</p>
                  <p>La interfaz ya quedó preparada para mostrar probabilidades, confianza del modelo y la respuesta cruda de la API.</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "prediccion" && (
          <div style={{ display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 24 }}>
            <Card>
              <div style={styles.inner}>
                <div style={{ fontSize: 32, fontWeight: 800 }}>Resultado del análisis</div>
                <div style={{ ...styles.smallMuted, marginTop: 6, marginBottom: 18 }}>Predicción estimada por el modelo para el partido actual.</div>
                <div style={{ borderRadius: 24, border: "1px solid rgba(16,185,129,0.24)", background: "rgba(16,185,129,0.12)", padding: 24, marginBottom: 20 }}>
                  <div style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#a7f3d0" }}>Predicción principal</div>
                  <div style={{ fontSize: 44, fontWeight: 900, marginTop: 8 }}>{prediction.winner}</div>
                  <div style={{ marginTop: 10, color: "#e2e8f0" }}>
                    Confianza estimada: <strong>{prediction.confidence}%</strong>
                  </div>
                </div>
                <PredictionBar label="Victoria local" value={prediction.local} />
                <PredictionBar label="Empate" value={prediction.empate} />
                <PredictionBar label="Victoria visitante" value={prediction.visitante} />
              </div>
            </Card>

            <Card>
              <div style={styles.inner}>
                <div style={{ fontSize: 32, fontWeight: 800 }}>Explicación estratégica</div>
                <div style={{ ...styles.smallMuted, marginTop: 6, marginBottom: 18 }}>Texto útil para mostrar valor al usuario final.</div>
                <div style={{ borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(2,6,23,0.4)", padding: 24, lineHeight: 1.8, color: "#e2e8f0" }}>
                  {prediction.explanation}
                </div>
                <div style={{ borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", padding: 20, marginTop: 18, fontSize: 14, color: "#cbd5e1", lineHeight: 1.7 }}>
                  <strong style={{ color: "#fff" }}>Idea de negocio:</strong> ofrece una versión gratuita con 3 análisis por día y una membresía premium con análisis ilimitados, alertas automáticas y recomendaciones avanzadas.
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "api" && (
          <Card>
            <div style={styles.inner}>
              <div style={{ fontSize: 32, fontWeight: 800 }}>Respuesta cruda de la API</div>
              <div style={{ ...styles.smallMuted, marginTop: 6, marginBottom: 18 }}>Útil para depuración y conexión futura con otros módulos.</div>
              <pre
                style={{
                  overflowX: "auto",
                  borderRadius: 24,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(2,6,23,0.7)",
                  padding: 24,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#e2e8f0",
                }}
              >
{JSON.stringify(
  lastResponse || {
    mensaje: "⚽ LifeHackIA - API de Pronósticos de Fútbol",
    version: "1.0.0",
    estado: "activa",
    docs: "/docs",
  },
  null,
  2
)}
              </pre>
            </div>
          </Card>
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 1100px) {
          .responsive-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 980px) {
          div[style*="grid-template-columns: 1.3fr 0.7fr"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
          div[style*="grid-template-columns: 1.1fr 0.9fr"],
          div[style*="grid-template-columns: 0.95fr 1.05fr"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          div[style*="grid-template-columns: repeat(4, 1fr)"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1fr 220px"] { grid-template-columns: 1fr !important; }
          h1 { font-size: 36px !important; }
        }
      `}</style>
    </div>
  );
}
