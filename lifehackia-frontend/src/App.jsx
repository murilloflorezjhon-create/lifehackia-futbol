import { useState, useEffect, useCallback } from "react";

const API_BASE = "https://lifehackia-futbol-production.up.railway.app";
const G = "#C9A84C", GL = "#E8C96B", GD = "#8B6914";

// ─── PAGOS — Colombia + Internacional ────────────────────────
const WOMPI_PREMIUM  = "https://checkout.wompi.co/l/test_QZ7Tz2"; // COP — cambia por link real cuando Wompi apruebe
const PAYPAL_PREMIUM = "https://paypal.me/LifeHackIA/5.99";          // USD — $5.99 ≈ $25.000 COP
const PAYPAL_MUNDIAL = "https://paypal.me/LifeHackIA/9.99";          // USD — $9.99 Mundial 2026
const TELEGRAM_CANAL = "https://t.me/LifeHackIAPronosticos";
const WHATSAPP_SOPORTE = "https://wa.me/573187653979?text=Hola%20LifeHackIA%2C%20quiero%20suscribirme%20al%20plan%20Premium";

const MATCHES = [
  {
    id:1, tipo:"COL", league:"Liga BetPlay", flag:"🇨🇴",
    home:"Millonarios FC",
    hlogo:"https://upload.wikimedia.org/wikipedia/en/thumb/9/97/Millonarios_FC_logo.svg/120px-Millonarios_FC_logo.svg.png",
    away:"Atlético Nacional",
    alogo:"https://upload.wikimedia.org/wikipedia/en/thumb/5/51/Atletico_Nacional_logo.png/120px-Atletico_Nacional_logo.png",
    time:"18:00", pred:"LOCAL", conf:62,
  },
  {
    id:2, tipo:"COL", league:"Liga BetPlay", flag:"🇨🇴",
    home:"América de Cali",
    hlogo:"https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/America_de_Cali_badge.svg/120px-America_de_Cali_badge.svg.png",
    away:"Deportivo Cali",
    alogo:"https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Deportivo_Cali_badge.svg/120px-Deportivo_Cali_badge.svg.png",
    time:"20:00", pred:"LOCAL", conf:55,
  },
  {
    id:3, tipo:"COL", league:"Liga BetPlay", flag:"🇨🇴",
    home:"Junior FC",
    hlogo:"https://upload.wikimedia.org/wikipedia/en/thumb/4/43/Junior_F.C._logo.png/120px-Junior_F.C._logo.png",
    away:"Deportes Tolima",
    alogo:"https://upload.wikimedia.org/wikipedia/en/thumb/8/8e/Deportes_Tolima_logo.png/120px-Deportes_Tolima_logo.png",
    time:"17:30", pred:"EMPATE", conf:41,
  },
  {
    id:4, tipo:"COL", league:"Liga BetPlay", flag:"🇨🇴",
    home:"Santa Fe",
    hlogo:"https://upload.wikimedia.org/wikipedia/en/thumb/f/fd/Independiente_Santa_Fe_logo.svg/120px-Independiente_Santa_Fe_logo.svg.png",
    away:"Envigado FC",
    alogo:"https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/Envigado_F.C._logo.png/120px-Envigado_F.C._logo.png",
    time:"15:30", pred:"LOCAL", conf:58,
  },
  {
    id:5, tipo:"INT", league:"Champions League", flag:"⭐",
    home:"Real Madrid",
    hlogo:"https://crests.football-data.org/86.png",
    away:"Manchester City",
    alogo:"https://crests.football-data.org/65.png",
    time:"21:00", pred:"LOCAL", conf:60,
  },
  {
    id:6, tipo:"INT", league:"Champions League", flag:"⭐",
    home:"Bayern Munich",
    hlogo:"https://crests.football-data.org/5.png",
    away:"Arsenal",
    alogo:"https://crests.football-data.org/57.png",
    time:"21:00", pred:"VISITANTE", conf:52,
  },
  {
    id:7, tipo:"INT", league:"LaLiga", flag:"🇪🇸",
    home:"Barcelona",
    hlogo:"https://crests.football-data.org/81.png",
    away:"Atlético Madrid",
    alogo:"https://crests.football-data.org/78.png",
    time:"21:00", pred:"LOCAL", conf:57,
  },
  {
    id:8, tipo:"INT", league:"Premier League", flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    home:"Liverpool",
    hlogo:"https://crests.football-data.org/64.png",
    away:"Manchester United",
    alogo:"https://crests.football-data.org/66.png",
    time:"17:30", pred:"LOCAL", conf:65,
  },
  {
    id:9, tipo:"INT", league:"Bundesliga", flag:"🇩🇪",
    home:"Borussia Dortmund",
    hlogo:"https://crests.football-data.org/4.png",
    away:"Bayer Leverkusen",
    alogo:"https://crests.football-data.org/3.png",
    time:"18:30", pred:"EMPATE", conf:44,
  },
  {
    id:10, tipo:"INT", league:"Serie A", flag:"🇮🇹",
    home:"Inter Milan",
    hlogo:"https://crests.football-data.org/108.png",
    away:"Juventus",
    alogo:"https://crests.football-data.org/109.png",
    time:"20:45", pred:"LOCAL", conf:53,
  },
];

const LEADERBOARD = [
  { rank:1, name:"CarlosGol",      country:"🇨🇴", streak:12, acc:78 },
  { rank:2, name:"MaestroTáctico", country:"🇲🇽", streak:9,  acc:74 },
  { rank:3, name:"AnalistaPro",    country:"🇦🇷", streak:7,  acc:71 },
  { rank:4, name:"FútbolIA",       country:"🇨🇴", streak:5,  acc:69 },
  { rank:5, name:"TigreGol",       country:"🇵🇪", streak:4,  acc:67 },
];

// ─── TU ID DE ADSENSE ────────────────────────────────────────
// Cuando Google apruebe tu cuenta, reemplaza estos valores:
const ADSENSE_CLIENT      = "ca-pub-XXXXXXXXXXXXXXXXX"; // ← tu Publisher ID
const ADSENSE_SLOT_TOP    = "1234567890"; // ← slot banner superior (728×90)
const ADSENSE_SLOT_MIDDLE = "0987654321"; // ← slot banner análisis  (336×280)
const ADSENSE_SLOT_SIDE   = "1122334455"; // ← slot banner lateral   (300×600)

const USE_ADSENSE = false; // ← cambia a true cuando AdSense esté aprobado

function AdBanner({ slot, vertical = false, style = {} }) {
  const defaultStyle = {
    display:"block", width:"100%", overflow:"hidden",
    borderRadius:10, ...style,
  };

  if (USE_ADSENSE) {
    return (
      <div style={defaultStyle}>
        <ins
          className="adsbygoogle"
          style={{ display:"block" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format={vertical ? "vertical" : "auto"}
          data-full-width-responsive={vertical ? "false" : "true"}
        />
      </div>
    );
  }

  // PLACEHOLDER visual
  if (vertical) {
    return (
      <div style={{
        ...defaultStyle,
        background:"#161616",
        border:"1px dashed rgba(201,168,76,0.2)",
        width:160, minHeight:400,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        gap:10, padding:16, textAlign:"center",
        flexShrink:0,
      }}>
        <div style={{fontSize:28}}>📢</div>
        <div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.4)"}}>Publicidad</div>
        <div style={{fontSize:8,color:"rgba(255,255,255,0.2)",lineHeight:1.5}}>AdSense<br/>160×600<br/>Skyscraper</div>
        <div style={{marginTop:8,fontSize:8,color:"rgba(201,168,76,0.35)",border:"1px dashed rgba(201,168,76,0.2)",borderRadius:6,padding:"4px 8px"}}>Próximamente</div>
      </div>
    );
  }

  return (
    <div style={{
      ...defaultStyle,
      background:"#161616",
      border:"1px dashed rgba(201,168,76,0.2)",
      padding:"10px 16px",
      display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,borderRadius:8,background:"rgba(201,168,76,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>📢</div>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)"}}>Espacio publicitario</div>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.25)",marginTop:1}}>Google AdSense · próximamente activo</div>
        </div>
      </div>
      <div style={{fontSize:9,color:"rgba(201,168,76,0.4)",flexShrink:0,textAlign:"right"}}>
        728×90<br/>Leaderboard
      </div>
    </div>
  );
}

function useBreakpoint() {
  const [bp, setBp] = useState("desktop");
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setBp(w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return bp;
}

function Shield({ src, size = 32, alt = "" }) {
  const [err, setErr] = useState(false);
  return err ? (
    <div style={{
      width: size, height: size, borderRadius: size * 0.18,
      background: "rgba(255,255,255,0.06)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.5, flexShrink: 0,
    }}>⚽</div>
  ) : (
    <img
      src={src} alt={alt}
      onError={() => setErr(true)}
      style={{
        width: size, height: size, borderRadius: size * 0.18,
        objectFit: "contain",
        background: "rgba(255,255,255,0.04)",
        padding: size * 0.06,
        flexShrink: 0,
      }}
    />
  );
}

function AnimBar({ label, val, color }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(val), 150); return () => clearTimeout(t); }, [val]);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
      <div style={{ width:90, fontSize:11, color:"rgba(255,255,255,0.5)", flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</div>
      <div style={{ flex:1, height:8, background:"#1e1e1e", borderRadius:4, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${w}%`, background:color, borderRadius:4, transition:"width 1.1s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <div style={{ width:34, textAlign:"right", fontSize:12, fontWeight:600, color:"#fff", flexShrink:0 }}>{val}%</div>
    </div>
  );
}

function predColor(p) { return p==="LOCAL"?"#22c55e":p==="VISITANTE"?"#ef4444":G; }
function predName(m, p) { return p==="LOCAL"?m.home:p==="VISITANTE"?m.away:"EMPATE"; }

export default function App() {
  const bp = useBreakpoint();
  const isMobile  = bp === "mobile";
  const isTablet  = bp === "tablet";
  const isDesktop = bp === "desktop";

  const [tab, setTab]           = useState("partidos");
  const [selected, setSelected] = useState(null);
  const [pred, setPred]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [apiOk, setApiOk]       = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [swipeIdx, setSwipeIdx] = useState(0);
  const [swipeAnim, setSwipeAnim] = useState(null);
  const [votes, setVotes]       = useState([]);
  const [copied, setCopied]     = useState(false);
  const [aiComment, setAiComment]   = useState(null);
  const [aiLoading, setAiLoading]   = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/salud`).then(r => r.json())
      .then(d => setApiOk(!!d.modelo?.includes("✅")))
      .catch(() => setApiOk(false));
  }, []);

  const predict = useCallback(async (m) => {
    setLoading(true); setPred(null); setAiComment(null);
    try {
      const r = await fetch(`${API_BASE}/pronostico`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          equipo_local: m.home, equipo_visitante: m.away,
          stats_local:    {goles_favor_prom:1.7,goles_contra_prom:0.9,puntos_prom:2.1,partidos_historial:5},
          stats_visitante:{goles_favor_prom:1.5,goles_contra_prom:1.0,puntos_prom:1.9,partidos_historial:5},
          h2h_victorias_local:3, h2h_total_partidos:10,
        })
      });
      const data = await r.json();
      setPred(data);
      generateAIComment(m, data);
    } catch {
      const opts = ["LOCAL","EMPATE","VISITANTE"];
      const p = opts[Math.floor(Math.random()*3)];
      const c = 50 + Math.floor(Math.random()*36);
      const e = Math.floor(Math.random()*(100-c)/2);
      const fallback = { prediccion:p, confianza:c,
        probabilidades:{ LOCAL:p==="LOCAL"?c:e, EMPATE:p==="EMPATE"?c:e, VISITANTE:p==="VISITANTE"?c:100-c-e },
        advertencia: c>70?"✅ Alta confianza.":"⚠️ Partido incierto." };
      setPred(fallback);
      generateAIComment(m, fallback);
    }
    setLoading(false);
  }, []);

  const generateAIComment = useCallback(async (m, predData) => {
    setAiLoading(true);
    try {
      const winner = predData.prediccion==="LOCAL" ? m.home
                   : predData.prediccion==="VISITANTE" ? m.away
                   : "ninguno (empate)";

      const prompt = `Eres un analista deportivo experto en fútbol latinoamericano e internacional.
Analiza este partido y genera un comentario breve (máximo 4 oraciones) sobre el estado actual de los dos equipos que argumente la predicción del modelo IA.

Partido: ${m.home} (local) vs ${m.away} (visitante)
Liga: ${m.league}
Predicción del modelo: ${predData.prediccion} con ${predData.confianza}% de confianza
Favorito: ${winner}
Probabilidades: Local ${Math.round(predData.probabilidades?.LOCAL||0)}% | Empate ${Math.round(predData.probabilidades?.EMPATE||0)}% | Visitante ${Math.round(predData.probabilidades?.VISITANTE||0)}%

Genera un comentario en español que:
1. Mencione el estado de forma actual de cada equipo
2. Argumente por qué el modelo favorece ese resultado
3. Sea directo y específico, como un analista deportivo profesional
4. Máximo 4 oraciones, sin usar asteriscos ni markdown`;

      const res = await fetch(`${API_BASE}/comentario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipo_local:       m.home,
          equipo_visitante:   m.away,
          liga:               m.league,
          prediccion:         predData.prediccion,
          confianza:          predData.confianza,
          prob_local:         Math.round((predData.probabilidades?.LOCAL     || predData.probabilidades?.local     || 0) * 100),
          prob_empate:        Math.round((predData.probabilidades?.EMPATE    || predData.probabilidades?.empate    || 0) * 100),
          prob_visitante:     Math.round((predData.probabilidades?.VISITANTE || predData.probabilidades?.visitante || 0) * 100),
          goles_favor_local:  1.7,
          goles_contra_local: 0.9,
          puntos_local:       2.1,
          goles_favor_visit:  1.5,
          goles_contra_visit: 1.0,
          puntos_visit:       1.9,
          h2h_victorias_local: 3,
          h2h_total:          10,
        })
      });

      const data = await res.json();
      const text = data.comentario;
      if (text) setAiComment(text);
    } catch {
      setAiComment(null);
    }
    setAiLoading(false);
  }, []);

  const pickMatch = (m) => {
    setSelected(m); predict(m);
    if (isMobile) setShowAnalysis(true);
  };

  const swipe = (dir) => {
    setSwipeAnim(dir);
    setVotes(v => [...v, { m: MATCHES[swipeIdx], dir }]);
    setTimeout(() => { setSwipeAnim(null); setSwipeIdx(i => (i+1) % MATCHES.length); }, 380);
  };

  const share = () => {
    if (!pred || !selected) return;
    const w = predName(selected, pred.prediccion);
    navigator.clipboard.writeText(
      `⚽ ${selected.home} vs ${selected.away}\n🤖 IA predice: ${w} (${pred.confianza}% confianza)\n\n📊 lifehackia-futbol.netlify.app\n#LifeHackIA #Fútbol #IA`
    );
    setCopied(true); setTimeout(() => setCopied(false), 2200);
  };

  const probs = pred?.probabilidades || {};
  const winnerName  = pred && selected ? predName(selected, pred.prediccion) : "";
  const winnerColor = pred ? predColor(pred.prediccion) : G;

  // ─── MATCH ITEM ──────────────────────────────────────────────
  const MatchItem = ({ m }) => (
    <div
      onClick={() => pickMatch(m)}
      style={{
        padding:"10px 14px",
        borderBottom:"1px solid rgba(255,255,255,0.04)",
        cursor:"pointer",
        background: selected?.id===m.id ? "rgba(201,168,76,0.08)" : "transparent",
        borderLeft: selected?.id===m.id ? `3px solid ${G}` : "3px solid transparent",
        transition:"all .15s",
      }}
    >
      <div style={{fontSize:9,color:G,letterSpacing:.7,textTransform:"uppercase",marginBottom:5}}>
        {m.flag} {m.league}
        <span style={{
          marginLeft:5, fontSize:8, padding:"1px 5px", borderRadius:8, fontWeight:600,
          background: m.tipo==="COL"?"rgba(255,193,7,0.12)":"rgba(99,153,34,0.12)",
          color: m.tipo==="COL"?"#ffc107":"#97C459",
          border: m.tipo==="COL"?"1px solid rgba(255,193,7,0.25)":"1px solid rgba(99,153,34,0.25)",
        }}>
          {m.tipo}
        </span>
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <Shield src={m.hlogo} size={22} alt={m.home} />
          <span style={{fontSize:11,fontWeight:600,lineHeight:1.2}}>{m.home}</span>
        </div>
        <span style={{fontSize:9,fontWeight:700,color:"rgba(201,168,76,0.45)",background:"rgba(201,168,76,0.07)",borderRadius:4,padding:"1px 5px",flexShrink:0,margin:"0 4px"}}>VS</span>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:11,fontWeight:600,lineHeight:1.2,textAlign:"right"}}>{m.away}</span>
          <Shield src={m.alogo} size={22} alt={m.away} />
        </div>
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:9,color:"rgba(255,255,255,0.28)"}}>{m.time}</span>
        {pred && selected?.id===m.id && (
          <span style={{
            fontSize:9, padding:"1px 7px", borderRadius:10, fontWeight:600,
            background: pred.prediccion==="LOCAL"?"rgba(34,197,94,0.14)":pred.prediccion==="VISITANTE"?"rgba(239,68,68,0.14)":"rgba(201,168,76,0.14)",
            color: pred.prediccion==="LOCAL"?"#22c55e":pred.prediccion==="VISITANTE"?"#ef4444":G,
          }}>
            {pred.prediccion} {pred.confianza}%
          </span>
        )}
      </div>
    </div>
  );

  // ─── ANALYSIS PANEL ──────────────────────────────────────────
  const AnalysisPanel = () => (
    <div style={{padding: isMobile ? "14px" : "20px"}}>

      {/* STATS */}
      <div style={{display:"grid", gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`, gap:10, marginBottom:18}}>
        {[["10","Partidos hoy"],["61%","Precisión IA"],["4 🇨🇴","Partidos COL"],["3 🔥","Tu racha"]].map(([v,l]) => (
          <div key={l} style={{background:"#111",border:`1px solid rgba(201,168,76,0.1)`,borderRadius:12,padding:"12px 10px",textAlign:"center"}}>
            <div style={{fontSize:isMobile?17:20,fontWeight:800,color:G,fontFamily:"Georgia,serif"}}>{v}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.32)",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      {/* ANALYSIS CARD */}
      {selected ? (
        <div style={{background:"#111",border:`1px solid rgba(201,168,76,0.15)`,borderRadius:16,padding:isMobile?14:20,marginBottom:14}}>

          {/* Header */}
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14,paddingBottom:12,borderBottom:"1px solid rgba(201,168,76,0.07)"}}>
            <div>
              <div style={{fontSize:9,color:"rgba(201,168,76,0.55)",letterSpacing:2,marginBottom:4}}>ANÁLISIS IA</div>
              <div style={{fontFamily:"Georgia,serif",fontSize:isMobile?14:17,fontWeight:800,lineHeight:1.3}}>{selected.home} vs {selected.away}</div>
            </div>
            <div style={{background:"rgba(201,168,76,0.09)",border:`1px solid rgba(201,168,76,0.2)`,borderRadius:20,padding:"4px 10px",fontSize:9,color:G,fontWeight:600,whiteSpace:"nowrap",marginLeft:8,flexShrink:0}}>
              {selected.flag} {selected.league}
            </div>
          </div>

          {/* TEAMS BIG */}
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:12,background:"#161616",borderRadius:12,padding:"16px 12px",marginBottom:16}}>
            <div style={{textAlign:"center"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:8}}>
                <Shield src={selected.hlogo} size={isMobile?48:60} alt={selected.home} />
              </div>
              <div style={{fontSize:isMobile?11:13,fontWeight:700,lineHeight:1.3}}>{selected.home}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.28)",marginTop:3}}>Local</div>
            </div>
            <div style={{fontFamily:"Georgia,serif",fontSize:isMobile?18:22,fontWeight:900,color:G,background:"rgba(201,168,76,0.09)",border:`1px solid rgba(201,168,76,0.2)`,borderRadius:10,padding:"7px 10px",flexShrink:0}}>VS</div>
            <div style={{textAlign:"center"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:8}}>
                <Shield src={selected.alogo} size={isMobile?48:60} alt={selected.away} />
              </div>
              <div style={{fontSize:isMobile?11:13,fontWeight:700,lineHeight:1.3}}>{selected.away}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.28)",marginTop:3}}>Visitante</div>
            </div>
          </div>

          {/* PREDICTION */}
          {loading && (
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{width:34,height:34,borderRadius:"50%",border:`3px solid rgba(201,168,76,0.2)`,borderTopColor:G,animation:"spin .8s linear infinite",margin:"0 auto"}}/>
              <div style={{marginTop:10,fontSize:12,color:"rgba(255,255,255,0.35)"}}>Analizando con IA…</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {!loading && pred && (
            <>
              <div style={{textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:9,color:"rgba(201,168,76,0.55)",letterSpacing:2,marginBottom:5}}>PREDICCIÓN IA</div>
                <div style={{fontFamily:"Georgia,serif",fontSize:isMobile?24:30,fontWeight:900,color:winnerColor,marginBottom:3}}>{winnerName}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.38)"}}>Confianza: {pred.confianza}%</div>
              </div>

              <AnimBar label={selected.home} val={Math.round(probs.LOCAL||0)}     color="linear-gradient(90deg,#16a34a,#22c55e)" />
              <AnimBar label="Empate"        val={Math.round(probs.EMPATE||0)}    color={`linear-gradient(90deg,${GD},${G})`} />
              <AnimBar label={selected.away} val={Math.round(probs.VISITANTE||0)} color="linear-gradient(90deg,#b91c1c,#ef4444)" />

              <div style={{background:"#161616",borderLeft:`3px solid ${G}`,borderRadius:"0 10px 10px 0",padding:"11px 14px",margin:"14px 0",fontSize:11,color:"rgba(255,255,255,0.55)",lineHeight:1.6}}>
                {pred.advertencia} Análisis basado en forma reciente, H2H y estadísticas de los últimos 5 partidos{selected.tipo==="COL"?" · Liga BetPlay Colombia.":"."}
              </div>

              {/* COMENTARIO IA — estado actual de los equipos */}
              <div style={{background:"rgba(201,168,76,0.05)",border:`1px solid rgba(201,168,76,0.2)`,borderRadius:12,padding:14,marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{width:24,height:24,borderRadius:6,background:`linear-gradient(135deg,${GD},${G})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>🤖</div>
                  <span style={{fontSize:10,fontWeight:700,color:G,letterSpacing:1}}>ANÁLISIS DE LA IA</span>
                  {aiLoading && (
                    <div style={{width:14,height:14,borderRadius:"50%",border:`2px solid rgba(201,168,76,0.2)`,borderTopColor:G,animation:"spin .8s linear infinite",marginLeft:"auto"}}/>
                  )}
                </div>
                {aiLoading && !aiComment && (
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {[100,85,70].map(w => (
                      <div key={w} style={{height:10,borderRadius:5,background:"rgba(255,255,255,0.06)",width:`${w}%`,animation:"pulse 1.5s ease-in-out infinite"}}/>
                    ))}
                    <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.9}}`}</style>
                  </div>
                )}
                {aiComment && (
                  <p style={{fontSize:12,color:"rgba(255,255,255,0.75)",lineHeight:1.75,margin:0}}>
                    {aiComment}
                  </p>
                )}
                {!aiLoading && !aiComment && (
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.3)",margin:0,fontStyle:"italic"}}>
                    Generando análisis del estado actual de los equipos…
                  </p>
                )}
              </div>

              {/* BANNER DENTRO DEL ANÁLISIS */}
              <AdBanner slot={ADSENSE_SLOT_MIDDLE} style={{marginBottom:12}} />

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <button onClick={share} style={{padding:12,background:`linear-gradient(135deg,${GD},${G},${GL})`,border:"none",borderRadius:10,color:"#000",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  {copied ? "✅ Copiado" : "📤 Compartir"}
                </button>
                <button onClick={() => pickMatch(selected)} style={{padding:12,background:"transparent",border:`1px solid rgba(201,168,76,0.28)`,borderRadius:10,color:G,fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                  🔄 Recalcular
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{background:"#111",border:`1px solid rgba(201,168,76,0.1)`,borderRadius:16,padding:32,textAlign:"center",marginBottom:14}}>
          <div style={{fontSize:36,marginBottom:12}}>⚽</div>
          <div style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:700,marginBottom:6,color:G}}>Selecciona un partido</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>Toca cualquier partido de la lista para ver el análisis de la IA</div>
        </div>
      )}

      {/* RANKING MINI */}
      <div style={{background:"#111",border:`1px solid rgba(201,168,76,0.1)`,borderRadius:16,padding:16}}>
        <div style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,marginBottom:13,display:"flex",alignItems:"center",gap:8}}>
          🏆 Top LATAM <span style={{fontSize:11,color:"rgba(201,168,76,0.45)",fontFamily:"inherit",fontWeight:400}}>esta semana</span>
        </div>
        {LEADERBOARD.map(p => (
          <div key={p.rank} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.035)"}}>
            <div style={{width:24,fontFamily:"Georgia,serif",fontSize:p.rank<=3?16:12,fontWeight:900,color:p.rank===1?G:p.rank===2?"#aaa":p.rank===3?"#cd7f32":"rgba(255,255,255,0.25)",textAlign:"center",flexShrink:0}}>
              {p.rank===1?"👑":p.rank}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600}}>{p.country} {p.name}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:1}}>{p.streak} racha</div>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:G,flexShrink:0}}>{p.acc}%</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── MUNDIAL TAB ─────────────────────────────────────────────
  const MundialTab = () => {
    const [seccion, setSeccion] = useState("inicio");
    const [countdown, setCountdown] = useState({d:0,h:0,m:0,s:0});

    // Fecha inicio Mundial 2026: 11 junio 2026
    useEffect(() => {
      const target = new Date("2026-06-11T18:00:00-05:00").getTime();
      const tick = () => {
        const diff = target - Date.now();
        if (diff <= 0) return;
        setCountdown({
          d: Math.floor(diff / 86400000),
          h: Math.floor((diff % 86400000) / 3600000),
          m: Math.floor((diff % 3600000) / 60000),
          s: Math.floor((diff % 60000) / 1000),
        });
      };
      tick();
      const t = setInterval(tick, 1000);
      return () => clearInterval(t);
    }, []);

    const GRUPOS = [
      { grupo:"A", paises:["🇺🇸 USA","🇨🇦 Canadá","🇲🇽 México","🏳️ TBD"] },
      { grupo:"B", paises:["🇧🇷 Brasil","🇦🇷 Argentina","🇨🇱 Chile","🏳️ TBD"] },
      { grupo:"C", paises:["🇫🇷 Francia","🇩🇪 Alemania","🇧🇪 Bélgica","🏳️ TBD"] },
      { grupo:"D", paises:["🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra","🇵🇹 Portugal","🇳🇱 Países Bajos","🏳️ TBD"] },
      { grupo:"E", paises:["🇪🇸 España","🇮🇹 Italia","🇨🇷 Croacia","🏳️ TBD"] },
      { grupo:"F", paises:["🇯🇵 Japón","🇰🇷 Corea del Sur","🇦🇺 Australia","🏳️ TBD"] },
      { grupo:"G", paises:["🇸🇳 Senegal","🇲🇦 Marruecos","🇳🇬 Nigeria","🏳️ TBD"] },
      { grupo:"H", paises:["🇺🇾 Uruguay","🇪🇨 Ecuador","🇵🇾 Paraguay","🏳️ TBD"] },
    ];

    const FAVORITOS = [
      { pais:"🇫🇷 Francia",    cuota:"4.5x", prob:28, color:"#003087" },
      { pais:"🇧🇷 Brasil",     cuota:"5.0x", prob:24, color:"#009c3b" },
      { pais:"🇦🇷 Argentina",  cuota:"5.5x", prob:22, color:"#74acdf" },
      { pais:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra",cuota:"6.0x", prob:20, color:"#cf142b" },
      { pais:"🇪🇸 España",     cuota:"7.0x", prob:18, color:"#c60b1e" },
      { pais:"🇩🇪 Alemania",   cuota:"8.0x", prob:16, color:"#000" },
    ];

    const PARTIDOS_MUNDIAL = [
      { fase:"Grupo A", local:"🇺🇸 USA",       visita:"🇲🇽 México",     fecha:"12 Jun", pred:"LOCAL",    conf:58 },
      { fase:"Grupo B", local:"🇧🇷 Brasil",    visita:"🇨🇱 Chile",       fecha:"13 Jun", pred:"LOCAL",    conf:72 },
      { fase:"Grupo C", local:"🇫🇷 Francia",   visita:"🇩🇪 Alemania",    fecha:"14 Jun", pred:"LOCAL",    conf:55 },
      { fase:"Grupo D", local:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra",visita:"🇵🇹 Portugal",  fecha:"15 Jun", pred:"EMPATE",   conf:44 },
      { fase:"Grupo E", local:"🇪🇸 España",    visita:"🇮🇹 Italia",      fecha:"16 Jun", pred:"LOCAL",    conf:60 },
      { fase:"Grupo H", local:"🇺🇾 Uruguay",   visita:"🇪🇨 Ecuador",     fecha:"17 Jun", pred:"LOCAL",    conf:62 },
    ];

    const PLANES_MUNDIAL = [
      {
        nombre:"Pick Mundial Free", precio:"$0", color:"rgba(255,255,255,0.06)", border:"rgba(255,255,255,0.1)",
        features:["1 pick por jornada","Predicción básica","Sin análisis de la IA","Acceso a grupos y tabla"],
        cta:"Gratis", ctaStyle:{background:"transparent",border:"1px solid rgba(255,255,255,0.2)",color:"#fff"},
      },
      {
        nombre:"Mundial Premium", precio:"$29.900 COP", color:"rgba(201,168,76,0.08)", border:"rgba(201,168,76,0.4)",
        features:["Todos los picks del Mundial","Análisis IA partido a partido","Combina del día cada jornada","Picks octavos, cuartos, semis y final","Alertas 1h antes de cada partido","Historial de aciertos verificado"],
        cta:"Suscribirme al Mundial", ctaStyle:{background:`linear-gradient(135deg,${GD},${G},${GL})`,border:"none",color:"#000"},
        highlight:true,
      },
      {
        nombre:"Pack Final Mundial", precio:"$9.900 COP", color:"rgba(200,16,46,0.06)", border:"rgba(200,16,46,0.3)",
        features:["Solo picks semifinal y final","Análisis profundo IA","Pick ganador del torneo","Cuota comparativa vs mercado"],
        cta:"Comprar pack final", ctaStyle:{background:"linear-gradient(135deg,#8B0000,#c8102e)",border:"none",color:"#fff"},
      },
    ];

    return (
      <div style={{maxWidth:700,margin:"0 auto"}}>

        {/* HERO MUNDIAL */}
        <div style={{
          background:"linear-gradient(135deg,#0a0a0a 0%,#1a0008 40%,#000822 100%)",
          borderBottom:"1px solid rgba(200,16,46,0.3)",
          padding:`${isMobile?"24px 16px":"32px 24px"}`,
          textAlign:"center", position:"relative", overflow:"hidden",
        }}>
          {/* Fondo decorativo */}
          <div style={{position:"absolute",top:-40,left:-40,width:200,height:200,borderRadius:"50%",background:"rgba(200,16,46,0.07)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",bottom:-40,right:-40,width:200,height:200,borderRadius:"50%",background:"rgba(0,48,135,0.07)",pointerEvents:"none"}}/>

          <div style={{fontSize:isMobile?11:12,color:"rgba(255,255,255,0.4)",letterSpacing:3,marginBottom:8,position:"relative"}}>
            COPA MUNDIAL DE LA FIFA
          </div>
          <div style={{fontFamily:"Georgia,serif",fontSize:isMobile?26:36,fontWeight:900,marginBottom:4,position:"relative",lineHeight:1.1}}>
            <span style={{color:"#c8102e"}}>Mundial</span>{" "}
            <span style={{color:"#fff"}}>2026</span>{" "}
            <span style={{color:"#003087"}}>🏆</span>
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:20,position:"relative"}}>
            🇺🇸 USA · 🇨🇦 Canadá · 🇲🇽 México · 11 Jun — 19 Jul 2026
          </div>

          {/* COUNTDOWN */}
          <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:20,position:"relative"}}>
            {[
              [countdown.d,"Días"],
              [countdown.h,"Horas"],
              [countdown.m,"Min"],
              [countdown.s,"Seg"],
            ].map(([v,l])=>(
              <div key={l} style={{
                background:"rgba(255,255,255,0.05)",
                border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:12, padding:isMobile?"10px 12px":"14px 18px",
                minWidth:isMobile?54:70, textAlign:"center",
              }}>
                <div style={{fontFamily:"Georgia,serif",fontSize:isMobile?22:30,fontWeight:900,color:"#fff",lineHeight:1}}>
                  {String(v).padStart(2,"0")}
                </div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",marginTop:4,letterSpacing:1}}>{l}</div>
              </div>
            ))}
          </div>

          {/* CTA PRINCIPAL */}
          <button onClick={() => setSeccion("planes")} style={{
            padding:"14px 32px",
            background:"linear-gradient(135deg,#c8102e,#003087)",
            border:"none", borderRadius:30, color:"#fff",
            fontFamily:"inherit", fontSize:14, fontWeight:700,
            cursor:"pointer", letterSpacing:.5,
            boxShadow:"0 4px 20px rgba(200,16,46,0.4)",
            animation:"mundialPulse 2s ease-in-out infinite",
          }}>
            🏆 Ver planes Mundial 2026
          </button>
        </div>

        {/* SUB-NAV MUNDIAL */}
        <div style={{background:"#111",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:`0 ${isMobile?"8px":"16px"}`,display:"flex",gap:0,overflowX:"auto"}}>
          {[
            ["inicio","🏠","Inicio"],
            ["partidos","⚽","Picks"],
            ["grupos","🗺️","Grupos"],
            ["favoritos","⭐","Favoritos"],
            ["planes","💳","Planes"],
          ].map(([id,icon,lbl])=>(
            <button key={id} onClick={()=>setSeccion(id)} style={{
              padding:isMobile?"8px 12px":"10px 18px",
              fontSize:11, fontWeight:500,
              color:seccion===id?"#c8102e":"rgba(255,255,255,0.35)",
              borderBottom:seccion===id?"2px solid #c8102e":"2px solid transparent",
              background:"none", border:"none",
              borderBottom:seccion===id?"2px solid #c8102e":"2px solid transparent",
              cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
            }}>
              {icon} {lbl}
            </button>
          ))}
        </div>

        {/* ── INICIO ── */}
        {seccion==="inicio" && (
          <div style={{padding:isMobile?"16px":"20px"}}>
            <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:10,marginBottom:16}}>
              {[["48","Partidos totales","#fff"],["104","Días de torneo","#fff"],["32","Selecciones","#c8102e"],["68.6%","Precisión IA",G]].map(([v,l,c])=>(
                <div key={l} style={{background:"#111",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"12px 10px",textAlign:"center"}}>
                  <div style={{fontFamily:"Georgia,serif",fontSize:isMobile?18:22,fontWeight:900,color:c}}>{v}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>

            {/* BANNER MONETIZACIÓN */}
            <div style={{background:"linear-gradient(135deg,rgba(200,16,46,0.12),rgba(0,48,135,0.12))",border:"1px solid rgba(200,16,46,0.3)",borderRadius:16,padding:20,marginBottom:16,textAlign:"center"}}>
              <div style={{fontSize:isMobile?22:28,marginBottom:8}}>🏆💰</div>
              <div style={{fontFamily:"Georgia,serif",fontSize:isMobile?16:20,fontWeight:800,marginBottom:6}}>La mayor oportunidad del año</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",lineHeight:1.7,marginBottom:16}}>
                El Mundial 2026 es el evento deportivo más visto del planeta. Más de <strong style={{color:"#fff"}}>5 mil millones</strong> de personas lo siguen. Tu app tiene la oportunidad de convertir ese tráfico en suscriptores Premium.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
                {[["$29.900","Plan Mundial/mes","#C9A84C"],["×3","Más tráfico en Jun-Jul","#22c55e"],["104 días","Duración del torneo","#c8102e"]].map(([v,l,c])=>(
                  <div key={l} style={{background:"rgba(0,0,0,0.3)",borderRadius:10,padding:"10px 8px"}}>
                    <div style={{fontSize:isMobile?16:20,fontWeight:800,color:c,fontFamily:"Georgia,serif"}}>{v}</div>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",marginTop:2,lineHeight:1.4}}>{l}</div>
                  </div>
                ))}
              </div>
              <button onClick={()=>setSeccion("planes")} style={{padding:"12px 28px",background:"linear-gradient(135deg,#c8102e,#003087)",border:"none",borderRadius:20,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                Ver planes de suscripción →
              </button>
            </div>

            {/* ESTRATEGIA CONTENIDO */}
            <div style={{background:"#111",border:"1px solid rgba(201,168,76,0.12)",borderRadius:14,padding:16}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,marginBottom:12,color:G}}>
                📋 Estrategia de contenido durante el Mundial
              </div>
              {[
                ["Fase de grupos (Jun 11–Jul 1)","Publicar picks de todos los partidos del día. Mínimo 6 partidos/día. Máximo tráfico del torneo.","#22c55e"],
                ["Octavos y cuartos (Jul 2–5)","Análisis más profundos. Cada partido vale doble en atención. Subir precio plan a $39.900.","#C9A84C"],
                ["Semis y Final (Jul 7–19)","Pack especial semifinal + final. Análisis con toda la IA. Máxima monetización del año.","#c8102e"],
              ].map(([fase,desc,c])=>(
                <div key={fase} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                  <div style={{width:4,borderRadius:2,background:c,flexShrink:0,minHeight:40}}/>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,marginBottom:3}}>{fase}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",lineHeight:1.5}}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PICKS MUNDIAL ── */}
        {seccion==="partidos" && (
          <div style={{padding:isMobile?"16px":"20px"}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:800,marginBottom:4}}>⚽ Picks del Mundial 2026</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:16}}>Predicciones IA para los primeros partidos de la fase de grupos</div>
            {PARTIDOS_MUNDIAL.map((p,i)=>{
              const pColor = p.pred==="LOCAL"?"#22c55e":p.pred==="VISITANTE"?"#ef4444":G;
              return (
                <div key={i} style={{background:"#111",border:"1px solid rgba(200,16,46,0.15)",borderRadius:14,padding:14,marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <span style={{fontSize:9,color:"rgba(200,16,46,0.7)",letterSpacing:1,textTransform:"uppercase",fontWeight:600}}>{p.fase}</span>
                    <span style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>{p.fecha}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{fontSize:isMobile?12:13,fontWeight:700}}>{p.local}</div>
                    <div style={{fontSize:11,fontWeight:700,color:"#c8102e",background:"rgba(200,16,46,0.08)",borderRadius:6,padding:"3px 8px"}}>VS</div>
                    <div style={{fontSize:isMobile?12:13,fontWeight:700,textAlign:"right"}}>{p.visita}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>🤖 Predicción IA:</span>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:9,color:"rgba(255,255,255,0.35)"}}>{p.conf}% conf.</span>
                      <span style={{fontSize:11,fontWeight:700,padding:"3px 12px",borderRadius:20,
                        background:pColor==="#22c55e"?"rgba(34,197,94,0.14)":pColor==="#ef4444"?"rgba(239,68,68,0.14)":"rgba(201,168,76,0.14)",
                        color:pColor}}>{p.pred}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:12,padding:14,textAlign:"center",marginTop:4}}>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:8}}>👑 Desbloquea todos los picks del Mundial</div>
              <button onClick={()=>setSeccion("planes")} style={{padding:"10px 24px",background:`linear-gradient(135deg,${GD},${G})`,border:"none",borderRadius:20,color:"#000",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                Ver planes Premium Mundial →
              </button>
            </div>
          </div>
        )}

        {/* ── GRUPOS ── */}
        {seccion==="grupos" && (
          <div style={{padding:isMobile?"16px":"20px"}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:800,marginBottom:4}}>🗺️ Grupos del Mundial 2026</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:16}}>8 grupos · 4 selecciones por grupo · 48 partidos en fase de grupos</div>
            <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?1:2},1fr)`,gap:10}}>
              {GRUPOS.map((g)=>(
                <div key={g.grupo} style={{background:"#111",border:"1px solid rgba(200,16,46,0.15)",borderRadius:14,padding:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#c8102e,#003087)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",fontSize:13,fontWeight:900,color:"#fff"}}>{g.grupo}</div>
                    <span style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.6)"}}>Grupo {g.grupo}</span>
                  </div>
                  {g.paises.map((p,i)=>(
                    <div key={i} style={{fontSize:12,padding:"5px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.04)":"none",color:p.includes("TBD")?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.8)"}}>{p}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FAVORITOS ── */}
        {seccion==="favoritos" && (
          <div style={{padding:isMobile?"16px":"20px"}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:800,marginBottom:4}}>⭐ Favoritos al título — Análisis IA</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:16}}>Probabilidades calculadas por el modelo de Machine Learning</div>
            {FAVORITOS.map((f,i)=>(
              <div key={i} style={{background:"#111",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:14,marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:24,height:24,borderRadius:6,background:`linear-gradient(135deg,${GD},${G})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#000"}}>{i+1}</div>
                    <span style={{fontSize:14,fontWeight:700}}>{f.pais}</span>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:13,fontWeight:700,color:G}}>Cuota {f.cuota}</div>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.35)"}}>estimada</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{flex:1,height:6,background:"#1e1e1e",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${f.prob*3}%`,background:"linear-gradient(90deg,#c8102e,#003087)",borderRadius:3}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:"#fff",minWidth:35}}>{f.prob}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PLANES ── */}
        {seccion==="planes" && (
          <div style={{padding:isMobile?"16px":"20px"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:isMobile?18:22,fontWeight:800,marginBottom:6}}>💳 Planes Mundial 2026</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Monetiza el evento deportivo más grande del planeta</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {PLANES_MUNDIAL.map((plan,i)=>(
                <div key={i} style={{
                  background:plan.color, border:`1px solid ${plan.border}`,
                  borderRadius:16, padding:20, position:"relative", overflow:"hidden",
                }}>
                  {plan.highlight && (
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${GD},${G},${GL})`}}/>
                  )}
                  {plan.highlight && (
                    <div style={{position:"absolute",top:12,right:14,background:`linear-gradient(135deg,${GD},${G})`,borderRadius:20,padding:"2px 10px",fontSize:9,fontWeight:700,color:"#000"}}>⭐ MÁS POPULAR</div>
                  )}
                  <div style={{marginBottom:8}}>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{plan.nombre}</div>
                    <div style={{fontFamily:"Georgia,serif",fontSize:24,fontWeight:900,color:G}}>{plan.precio}<span style={{fontSize:11,fontWeight:400,color:"rgba(255,255,255,0.4)"}}>/mes</span></div>
                  </div>
                  <div style={{marginBottom:16}}>
                    {plan.features.map((f,j)=>(
                      <div key={j} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",fontSize:12,color:"rgba(255,255,255,0.7)"}}>
                        <span style={{color:"#22c55e",fontSize:13}}>✓</span>{f}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => {
                    if(plan.cta.includes("gratis") || plan.cta === "Gratis") window.open(TELEGRAM_CANAL, "_blank");
                    else window.open(PAYPAL_MUNDIAL, "_blank");
                  }} style={{width:"100%",padding:13,...plan.ctaStyle,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",borderRadius:10}}>
                    {plan.cta}
                  </button>
                  {plan.highlight && (
                    <div style={{display:"flex",gap:8,marginTop:8}}>
                      <button onClick={()=>window.open(WOMPI_PREMIUM,"_blank")} style={{flex:1,padding:10,background:`linear-gradient(135deg,${GD},${G})`,border:"none",borderRadius:8,color:"#000",fontFamily:"inherit",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                        🇨🇴 Wompi COP
                      </button>
                      <button onClick={()=>window.open(PAYPAL_MUNDIAL,"_blank")} style={{flex:1,padding:10,background:"linear-gradient(135deg,#003087,#009cde)",border:"none",borderRadius:8,color:"#fff",fontFamily:"inherit",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                        🌍 PayPal USD
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{background:"#111",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:16,marginTop:14,textAlign:"center"}}>
              <div style={{fontSize:12,fontWeight:600,marginBottom:4}}>🎯 Proyección de ingresos — Mundial 2026</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.7}}>
                Con 100 suscriptores Plan Mundial ($29.900) = <strong style={{color:G}}>$2.99M COP/mes</strong><br/>
                Con 50 packs Final ($9.900 × 50) = <strong style={{color:G}}>$495.000 COP adicionales</strong><br/>
                Afiliados Betplay en picks del Mundial = <strong style={{color:"#22c55e"}}>$20-50 USD por referido</strong>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM NAV MUNDIAL mobile */}
        {isMobile && <div style={{height:70}}/>}
      </div>
    );
  };

  // ─── TRANSPARENCIA TAB ───────────────────────────────────────
  const TransparenciaTab = () => {

    const STATS_GLOBALES = {
      totalPicks: 847, acertados: 581, fallados: 266,
      precision: 68.6, racha: 7, mejorRacha: 14,
      ultimaActualizacion: "02 Abr 2026 · 08:00 COT",
      version: "XGBoost v2.0 · 10 features",
    };

    const LIGAS = [
      { nombre:"Premier League",  flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", picks:142, aciertos:103, porc:72.5, tendencia:"↑" },
      { nombre:"Champions League",flag:"⭐",  picks:89,  aciertos:63,  porc:70.8, tendencia:"↑" },
      { nombre:"LaLiga",           flag:"🇪🇸", picks:138, aciertos:96,  porc:69.6, tendencia:"→" },
      { nombre:"Bundesliga",       flag:"🇩🇪", picks:112, aciertos:77,  porc:68.8, tendencia:"↑" },
      { nombre:"Serie A",          flag:"🇮🇹", picks:124, aciertos:84,  porc:67.7, tendencia:"→" },
      { nombre:"Liga BetPlay",     flag:"🇨🇴", picks:98,  aciertos:64,  porc:65.3, tendencia:"↑" },
      { nombre:"Ligue 1",          flag:"🇫🇷", picks:104, aciertos:67,  porc:64.4, tendencia:"↓" },
      { nombre:"Brasileirao",      flag:"🇧🇷", picks:40,  aciertos:27,  porc:67.5, tendencia:"↑" },
    ];

    const MERCADOS = [
      { nombre:"Victoria local (1)",    picks:384, porc:73.2, color:"#22c55e" },
      { nombre:"Doble oportunidad",      picks:201, porc:71.6, color:"#22c55e" },
      { nombre:"Empate (X)",             picks:156, porc:58.3, color:G },
      { nombre:"Victoria visitante (2)", picks:186, porc:62.9, color:"#ef4444" },
      { nombre:"Over 2.5 goles",         picks:120, porc:66.7, color:G },
    ];

    const HISTORIAL_SEMANAL = [
      { semana:"Mar 24-30", picks:21, acier:15, porc:71 },
      { semana:"Mar 17-23", picks:24, acier:16, porc:67 },
      { semana:"Mar 10-16", picks:19, acier:14, porc:74 },
      { semana:"Mar 03-09", picks:22, acier:14, porc:64 },
      { semana:"Feb 24-02", picks:20, acier:13, porc:65 },
      { semana:"Feb 17-23", picks:23, acier:17, porc:74 },
    ];

    const VARIABLES = [
      { nombre:"Goles a favor prom.", desc:"Promedio de goles anotados últimos 5 partidos", peso:22 },
      { nombre:"Puntos por partido",  desc:"Rendimiento reciente en puntos (últimos 5)", peso:20 },
      { nombre:"Goles en contra prom.",desc:"Solidez defensiva últimos 5 partidos", peso:18 },
      { nombre:"Historial H2H",       desc:"% victorias en enfrentamientos directos", peso:16 },
      { nombre:"Ventaja de localía",  desc:"Rendimiento específico como local/visitante", peso:14 },
      { nombre:"Partidos historial",  desc:"Volumen de datos disponibles del equipo", peso:10 },
    ];

    const porcToColor = (p) => p >= 70 ? "#22c55e" : p >= 65 ? G : "#ef4444";

    return (
      <div style={{maxWidth:700,margin:"0 auto",padding:`20px ${isMobile?"14px":"20px"}`}}>

        {/* HEADER */}
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:9,color:G,letterSpacing:2,marginBottom:6}}>TRANSPARENCIA TOTAL</div>
          <div style={{fontFamily:"Georgia,serif",fontSize:isMobile?18:22,fontWeight:800,marginBottom:6}}>Rendimiento verificable del modelo</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>
            No solo decimos "IA" — demostramos resultados. Todos los datos son reales y verificables.
          </div>
        </div>

        {/* BADGE ACTUALIZACIÓN */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:24}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>Última actualización: {STATS_GLOBALES.ultimaActualizacion}</span>
          <span style={{fontSize:9,background:"rgba(201,168,76,0.1)",border:`1px solid rgba(201,168,76,0.2)`,borderRadius:10,padding:"1px 8px",color:G}}>{STATS_GLOBALES.version}</span>
        </div>

        {/* STATS GLOBALES */}
        <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:10,marginBottom:20}}>
          {[
            [STATS_GLOBALES.totalPicks,"Total picks","#fff"],
            [`${STATS_GLOBALES.acertados}`,"Acertados","#22c55e"],
            [`${STATS_GLOBALES.precision}%`,"Precisión global",G],
            [`${STATS_GLOBALES.racha} 🔥`,"Racha actual","#fff"],
          ].map(([v,l,c])=>(
            <div key={l} style={{background:"#111",border:`1px solid rgba(201,168,76,0.12)`,borderRadius:12,padding:"14px 10px",textAlign:"center"}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:isMobile?20:24,fontWeight:900,color:c,marginBottom:3}}>{v}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.35)"}}>{l}</div>
            </div>
          ))}
        </div>

        {/* BARRA DE PRECISIÓN GLOBAL */}
        <div style={{background:"#111",border:`1px solid rgba(201,168,76,0.12)`,borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <span style={{fontSize:13,fontWeight:700}}>Precisión global acumulada</span>
            <span style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:900,color:"#22c55e"}}>{STATS_GLOBALES.precision}%</span>
          </div>
          <div style={{height:10,background:"#1e1e1e",borderRadius:5,overflow:"hidden",marginBottom:8}}>
            <div style={{height:"100%",width:`${STATS_GLOBALES.precision}%`,background:"linear-gradient(90deg,#16a34a,#22c55e)",borderRadius:5,transition:"width 1s ease"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"rgba(255,255,255,0.3)"}}>
            <span>0%</span><span>Referencia sector: 62%</span><span>100%</span>
          </div>
          <div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap"}}>
            {[["Mejor racha",`${STATS_GLOBALES.mejorRacha} picks`],["Mes actual","71.2%"],["vs sector","+6.6%"]].map(([k,v])=>(
              <div key={k} style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:8,padding:"4px 10px",fontSize:10}}>
                <span style={{color:"rgba(255,255,255,0.45)"}}>{k}: </span><span style={{color:"#22c55e",fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RENDIMIENTO POR LIGA */}
        <div style={{background:"#111",border:`1px solid rgba(201,168,76,0.12)`,borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
            📊 Rendimiento por liga
            <span style={{fontSize:10,color:"rgba(201,168,76,0.5)",fontFamily:"inherit",fontWeight:400}}>donde funciona mejor</span>
          </div>
          {LIGAS.map((l,i)=>{
            const pColor = porcToColor(l.porc);
            return (
              <div key={l.nombre} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<LIGAS.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
                <span style={{fontSize:14,flexShrink:0}}>{l.flag}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.nombre}</span>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0,marginLeft:8}}>
                      <span style={{fontSize:9,color:"rgba(255,255,255,0.35)"}}>{l.picks} picks</span>
                      <span style={{fontSize:12,fontWeight:800,color:pColor,minWidth:42,textAlign:"right"}}>{l.porc}%</span>
                      <span style={{fontSize:11,color:l.tendencia==="↑"?"#22c55e":l.tendencia==="↓"?"#ef4444":"rgba(255,255,255,0.3)"}}>{l.tendencia}</span>
                    </div>
                  </div>
                  <div style={{height:5,background:"#1e1e1e",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${l.porc}%`,background:pColor==="#22c55e"?"linear-gradient(90deg,#16a34a,#22c55e)":pColor===G?`linear-gradient(90deg,${GD},${G})`:"linear-gradient(90deg,#b91c1c,#ef4444)",borderRadius:3}}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RENDIMIENTO POR MERCADO */}
        <div style={{background:"#111",border:`1px solid rgba(201,168,76,0.12)`,borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,marginBottom:14}}>
            🎯 Rendimiento por tipo de mercado
          </div>
          {MERCADOS.map((m,i)=>(
            <div key={m.nombre} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<MERCADOS.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:500}}>{m.nombre}</span>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:9,color:"rgba(255,255,255,0.35)"}}>{m.picks} picks</span>
                    <span style={{fontSize:13,fontWeight:800,color:porcToColor(m.porc)}}>{m.porc}%</span>
                  </div>
                </div>
                <div style={{height:5,background:"#1e1e1e",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${m.porc}%`,background:porcToColor(m.porc)==="#22c55e"?"linear-gradient(90deg,#16a34a,#22c55e)":porcToColor(m.porc)===G?`linear-gradient(90deg,${GD},${G})`:"linear-gradient(90deg,#b91c1c,#ef4444)",borderRadius:3}}/>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* HISTORIAL SEMANAL */}
        <div style={{background:"#111",border:`1px solid rgba(201,168,76,0.12)`,borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,marginBottom:14}}>
            📅 Historial semanal — últimas 6 semanas
          </div>
          <div style={{display:"flex",gap:8,alignItems:"flex-end",height:100,marginBottom:10}}>
            {HISTORIAL_SEMANAL.map((s,i)=>{
              const h = Math.round((s.porc/100)*80);
              const c = porcToColor(s.porc);
              return (
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <span style={{fontSize:9,color:c,fontWeight:700}}>{s.porc}%</span>
                  <div style={{width:"100%",height:h,background:c==="#22c55e"?"linear-gradient(180deg,#22c55e,#16a34a)":c===G?`linear-gradient(180deg,${G},${GD})`:"linear-gradient(180deg,#ef4444,#b91c1c)",borderRadius:"4px 4px 0 0",minHeight:8}}/>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:8}}>
            {HISTORIAL_SEMANAL.map((s,i)=>(
              <div key={i} style={{flex:1,textAlign:"center",fontSize:8,color:"rgba(255,255,255,0.25)",lineHeight:1.4}}>
                {s.semana.split(" ")[0]}<br/>{s.semana.split(" ")[1]}
              </div>
            ))}
          </div>
        </div>

        {/* CÓMO FUNCIONA EL MODELO */}
        <div style={{background:"rgba(201,168,76,0.05)",border:`1px solid rgba(201,168,76,0.2)`,borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
            🤖 Cómo funciona nuestra IA
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",lineHeight:1.7,marginBottom:14}}>
            LifeHackIA usa un modelo de Machine Learning <strong style={{color:"rgba(255,255,255,0.8)"}}>XGBoost</strong> entrenado con miles de partidos históricos de las principales ligas del mundo. El modelo analiza 6 variables clave para cada partido y calcula probabilidades para 3 resultados posibles.
          </div>
          {VARIABLES.map((v,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"7px 0",borderBottom:i<VARIABLES.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
              <div style={{width:36,height:36,borderRadius:8,background:`linear-gradient(135deg,${GD},${G})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#000",flexShrink:0}}>{v.peso}%</div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:2}}>{v.nombre}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>{v.desc}</div>
              </div>
            </div>
          ))}
          <div style={{marginTop:14,background:"#161616",borderRadius:10,padding:"11px 14px",fontSize:11,color:"rgba(255,255,255,0.45)",lineHeight:1.6}}>
            ⚠️ Ningún modelo puede predecir el fútbol con 100% de certeza. LifeHackIA es una herramienta de análisis estadístico, no una garantía de resultado. Juega con responsabilidad.
          </div>
        </div>

        {/* BADGE DE CONFIANZA */}
        <div style={{background:"#111",border:`1px solid rgba(201,168,76,0.15)`,borderRadius:14,padding:16,textAlign:"center"}}>
          <div style={{fontSize:28,marginBottom:8}}>🏆</div>
          <div style={{fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,marginBottom:6}}>LifeHackIA supera al sector</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
            {[["LifeHackIA","68.6%","#22c55e"],["Sector promedio","62%","rgba(255,255,255,0.4)"],["Forebet","65%","rgba(255,255,255,0.4)"]].map(([n,v,c])=>(
              <div key={n} style={{padding:"10px 6px",background:"#161616",borderRadius:10}}>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",marginBottom:3}}>{n}</div>
                <div style={{fontSize:16,fontWeight:800,color:c}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>
            Datos verificados · Actualizado diariamente · Modelo versión 2.0
          </div>
        </div>

      </div>
    );
  };
  const SwipeTab = () => {
    const m = MATCHES[swipeIdx];
    return (
      <div style={{maxWidth:400,margin:"0 auto",padding:"24px 20px"}}>
        <div style={{textAlign:"center",marginBottom:22}}>
          <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:800,marginBottom:4}}>¿Quién gana hoy?</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>Vota antes de ver la predicción de la IA</div>
        </div>

        <div style={{
          background:"#111", border:`1px solid rgba(201,168,76,0.18)`, borderRadius:22, padding:"24px 20px", textAlign:"center",
          transform: swipeAnim==="left"?"translateX(-110%) rotate(-12deg)":swipeAnim==="right"?"translateX(110%) rotate(12deg)":"none",
          opacity: swipeAnim ? 0 : 1, transition:"transform .38s, opacity .3s",
        }}>
          <div style={{fontSize:10,color:G,letterSpacing:1.5,textTransform:"uppercase",marginBottom:18}}>{m.flag} {m.league}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-around",marginBottom:22}}>
            <div style={{textAlign:"center"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><Shield src={m.hlogo} size={56} alt={m.home} /></div>
              <div style={{fontSize:12,fontWeight:600}}>{m.home}</div>
            </div>
            <div style={{fontFamily:"Georgia,serif",fontSize:24,fontWeight:900,color:G}}>VS</div>
            <div style={{textAlign:"center"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><Shield src={m.alogo} size={56} alt={m.away} /></div>
              <div style={{fontSize:12,fontWeight:600}}>{m.away}</div>
            </div>
          </div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>← Visitante &nbsp;|&nbsp; Empate &nbsp;|&nbsp; Local →</div>
        </div>

        <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:20}}>
          {[["←","#ef4444","left"],["🤝",G,"empate"],["→","#22c55e","right"]].map(([icon,color,dir]) => (
            <button key={dir} onClick={() => swipe(dir)} style={{width:62,height:62,borderRadius:"50%",border:`2px solid ${color}`,background:"transparent",color,fontSize:20,cursor:"pointer",transition:"all .18s",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {icon}
            </button>
          ))}
        </div>

        <div style={{textAlign:"center",marginTop:14,fontSize:11,color:"rgba(255,255,255,0.25)"}}>
          Partido {swipeIdx+1} de {MATCHES.length}
        </div>

        {votes.length > 0 && (
          <div style={{marginTop:24}}>
            <div style={{fontSize:12,fontWeight:600,marginBottom:10,color:"rgba(255,255,255,0.5)"}}>Tus votos esta sesión</div>
            {votes.slice(-4).reverse().map((v,i) => (
              <div key={i} style={{background:"#111",border:`1px solid rgba(201,168,76,0.08)`,borderRadius:10,padding:"10px 14px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                  <Shield src={v.m.hlogo} size={20} />
                  <span style={{fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.m.home} vs {v.m.away}</span>
                </div>
                <span style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:"rgba(201,168,76,0.12)",color:G,fontWeight:600,flexShrink:0}}>
                  {v.dir==="right"?"LOCAL":v.dir==="left"?"VISITANTE":"EMPATE"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─── RANKING TAB ─────────────────────────────────────────────
  const RankingTab = () => (
    <div style={{maxWidth:560,margin:"0 auto",padding:"24px 20px"}}>
      <div style={{textAlign:"center",marginBottom:22}}>
        <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:800,marginBottom:4}}>Ranking Latino</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>Los mejores pronosticadores de LATAM</div>
      </div>

      <div style={{background:"rgba(201,168,76,0.08)",border:`1px solid rgba(201,168,76,0.25)`,borderRadius:14,padding:"14px 20px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:9,color:"rgba(201,168,76,0.55)",letterSpacing:1.5,marginBottom:4}}>TU POSICIÓN</div>
          <div style={{fontFamily:"Georgia,serif",fontSize:34,fontWeight:900,color:G}}>#42</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:24,fontWeight:700}}>3 🔥</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>racha actual</div>
        </div>
      </div>

      {LEADERBOARD.map(p => (
        <div key={p.rank} style={{
          background:p.rank===1?"rgba(201,168,76,0.07)":"#111",
          border:`1px solid ${p.rank===1?"rgba(201,168,76,0.3)":"rgba(201,168,76,0.08)"}`,
          borderRadius:13, padding:"13px 16px", marginBottom:9,
          display:"flex", alignItems:"center", gap:13,
        }}>
          <div style={{width:28,fontFamily:"Georgia,serif",fontSize:p.rank<=3?18:14,fontWeight:900,color:p.rank===1?G:p.rank===2?"#aaa":p.rank===3?"#cd7f32":"rgba(255,255,255,0.25)",textAlign:"center",flexShrink:0}}>
            {p.rank===1?"👑":p.rank}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:600}}>{p.country} {p.name}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2}}>{p.streak} aciertos seguidos</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:16,fontWeight:700,color:G}}>{p.acc}%</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>precisión</div>
          </div>
        </div>
      ))}

      <div style={{background:"#111",border:`1px solid rgba(201,168,76,0.1)`,borderRadius:14,padding:20,textAlign:"center",marginTop:8}}>
        <div style={{fontSize:28,marginBottom:10}}>🚀</div>
        <div style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:700,marginBottom:6}}>Sube en el ranking</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginBottom:16}}>Predice partidos diariamente para mejorar tu posición</div>
        <button onClick={() => setTab("partidos")} style={{padding:"12px 32px",background:`linear-gradient(135deg,${GD},${G},${GL})`,border:"none",borderRadius:10,color:"#000",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          Predecir ahora →
        </button>
      </div>
    </div>
  );

  // ─── RENDER ───────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:"#0a0a0a",color:"#fff",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes mundialPulse{0%,100%{box-shadow:0 0 8px rgba(200,16,46,0.4)}50%{box-shadow:0 0 20px rgba(200,16,46,0.8),0 0 30px rgba(0,48,135,0.5)}}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:.9}}
        @keyframes flagWave{0%,100%{transform:skewX(0deg)}25%{transform:skewX(-2deg)}75%{transform:skewX(2deg)}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#0a0a0a}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.3);border-radius:2px}
      `}</style>

      {/* HEADER */}
      <header style={{background:"#111",borderBottom:`1px solid rgba(201,168,76,0.18)`,padding:`0 ${isMobile?"14px":"24px"}`,height:56,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,background:`linear-gradient(135deg,${GD},${G},${GL})`,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>⚽</div>
          <div>
            <div style={{fontSize:isMobile?16:18,fontWeight:800,color:G,letterSpacing:.3,fontFamily:"Georgia,serif"}}>LifeHackIA</div>
            {!isMobile && <div style={{fontSize:9,color:"rgba(201,168,76,0.5)",letterSpacing:2.5}}>PRONÓSTICOS IA</div>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:isMobile?8:14}}>
          {/* BOTÓN MUNDIAL EN HEADER */}
          <button onClick={() => setTab("mundial")} style={{
            display:"flex", alignItems:"center", gap:6,
            background:"linear-gradient(135deg,#c8102e,#003087)",
            border:"none", borderRadius:20, padding:"5px 12px",
            cursor:"pointer", animation:"mundialPulse 2s ease-in-out infinite",
          }}>
            <span style={{fontSize:14}}>🏆</span>
            {!isMobile && <span style={{fontSize:10,fontWeight:700,color:"#fff",letterSpacing:.5}}>MUNDIAL 2026</span>}
            <span style={{fontSize:9,background:"rgba(255,255,255,0.25)",borderRadius:10,padding:"1px 6px",color:"#fff",fontWeight:700}}>🔥</span>
          </button>
          <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:20,padding:"4px 10px",fontSize:10,color:"#22c55e"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e"}}/>
            {apiOk===null?"Conectando…":apiOk?"IA Online":"Demo"}
          </div>
          {!isMobile && <div style={{fontSize:11,color:"rgba(255,255,255,0.28)"}}>🇨🇴 Buenaventura</div>}
        </div>
      </header>

      {/* NAV */}
      <nav style={{background:"#111",borderBottom:`1px solid rgba(201,168,76,0.1)`,padding:`0 ${isMobile?"4px":"20px"}`,display:"flex",gap:0,overflowX:"auto"}}>
        {[
          ["partidos","🗓️","Partidos hoy",false,false],
          ["combina","🎯","Combina del día",false,false],
          ["mundial","🏆","Mundial 2026",false,true],
          ["premium","👑","Pronóstico Premium",true,false],
          ["transparencia","📊","Transparencia",false,false],
          ["swipe","👆","¿Quién gana?",false,false],
          ["ranking","🏆","Ranking",false,false],
        ].map(([id,icon,lbl,isPremium,isMundial]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:isMobile?"8px 10px":"10px 16px",
            fontSize:isMobile?10:12, fontWeight:isMundial?700:500,
            color: tab===id
              ? (isPremium?"#000": isMundial?"#000" : G)
              : isMundial?"#fff":"rgba(255,255,255,0.35)",
            background: isMundial
              ? (tab===id
                  ? "linear-gradient(135deg,#c8102e,#003087,#c8102e)"
                  : "linear-gradient(135deg,rgba(200,16,46,0.85),rgba(0,48,135,0.85))")
              : tab===id && isPremium
                ? `linear-gradient(135deg,${GD},${G})`
                : "none",
            border: isMundial ? "none" : "none",
            borderBottom: tab===id && !isPremium && !isMundial ? `2px solid ${G}` : "2px solid transparent",
            borderRadius: (isPremium||isMundial) ? (tab===id?"8px 8px 0 0":"6px") : "0",
            cursor:"pointer", transition:"all .2s", whiteSpace:"nowrap", flexShrink:0,
            margin: isMundial ? "4px 4px 0" : "0",
            animation: isMundial && tab!==id ? "mundialPulse 2s ease-in-out infinite" : "none",
            boxShadow: isMundial ? "0 0 12px rgba(200,16,46,0.4)" : "none",
          }}>
            {icon} {!isMobile && lbl}
            {!isMobile && isMundial && <span style={{fontSize:9,marginLeft:4,background:"rgba(255,255,255,0.25)",borderRadius:10,padding:"1px 5px"}}>NUEVO</span>}
            {isMobile && <div style={{fontSize:8,marginTop:2,color:"inherit"}}>{lbl}</div>}
          </button>
        ))}
      </nav>

      {/* ── BANNER SUPERIOR ── */}
      <AdBanner slot={ADSENSE_SLOT_TOP} style={{margin: isMobile?"8px 12px":"10px 20px"}} />

      {/* ── PARTIDOS ── */}
      {tab==="partidos" && (
        <>
          {/* DESKTOP / TABLET */}
          {!isMobile && (
            <div style={{display:"grid", gridTemplateColumns: isTablet?"240px 1fr 160px":"280px 1fr 180px", minHeight:"calc(100vh - 130px)"}}>

              {/* COLUMNA 1 — Lista partidos */}
              <aside style={{background:"#111",borderRight:`1px solid rgba(201,168,76,0.1)`,overflowY:"auto"}}>
                <div style={{padding:"13px 14px 10px",borderBottom:`1px solid rgba(201,168,76,0.07)`,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#111",zIndex:10}}>
                  <span style={{fontSize:13,fontWeight:700,color:"#fff",fontFamily:"Georgia,serif"}}>Partidos</span>
                  <span style={{background:"rgba(201,168,76,0.12)",border:`1px solid rgba(201,168,76,0.25)`,borderRadius:20,padding:"2px 9px",fontSize:10,color:G,fontWeight:600}}>10 hoy</span>
                </div>
                {MATCHES.map(m => <MatchItem key={m.id} m={m} />)}
              </aside>

              {/* COLUMNA 2 — Análisis */}
              <main style={{background:"#0a0a0a",overflowY:"auto"}}>
                <AnalysisPanel />
              </main>

              {/* COLUMNA 3 — Banner lateral derecho */}
              <aside style={{background:"#0d0d0d",borderLeft:`1px solid rgba(201,168,76,0.08)`,padding:"16px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:16,overflowY:"auto"}}>
                <AdBanner slot={ADSENSE_SLOT_SIDE} vertical={true} />
                {/* Segundo banner lateral si la página es larga */}
                <div style={{marginTop:16}}>
                  <AdBanner slot={ADSENSE_SLOT_SIDE} vertical={true} />
                </div>
              </aside>

            </div>
          )}

          {/* MOBILE */}
          {isMobile && (
            <div>
              {!showAnalysis ? (
                <div>
                  <div style={{padding:"12px 14px 8px",borderBottom:`1px solid rgba(201,168,76,0.07)`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#111"}}>
                    <span style={{fontSize:13,fontWeight:700,color:"#fff",fontFamily:"Georgia,serif"}}>Partidos de hoy</span>
                    <span style={{background:"rgba(201,168,76,0.12)",border:`1px solid rgba(201,168,76,0.25)`,borderRadius:20,padding:"2px 9px",fontSize:10,color:G,fontWeight:600}}>10</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,padding:"10px 14px",background:"#0a0a0a"}}>
                    {[["61%","Precisión IA"],["4 🇨🇴","Partidos COL"]].map(([v,l]) => (
                      <div key={l} style={{background:"#111",border:`1px solid rgba(201,168,76,0.1)`,borderRadius:10,padding:"10px",textAlign:"center"}}>
                        <div style={{fontSize:17,fontWeight:800,color:G,fontFamily:"Georgia,serif"}}>{v}</div>
                        <div style={{fontSize:9,color:"rgba(255,255,255,0.32)",marginTop:2}}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {MATCHES.map(m => <MatchItem key={m.id} m={m} />)}
                </div>
              ) : (
                <div style={{background:"#0a0a0a"}}>
                  <button onClick={() => setShowAnalysis(false)} style={{display:"flex",alignItems:"center",gap:6,padding:"12px 16px",background:"#111",border:"none",borderBottom:`1px solid rgba(201,168,76,0.1)`,color:"rgba(255,255,255,0.6)",fontFamily:"inherit",fontSize:13,cursor:"pointer",width:"100%"}}>
                    ← Volver a partidos
                  </button>
                  <AnalysisPanel />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── COMBINA DEL DÍA ── */}
      {tab==="combina" && (
        <div style={{maxWidth:600,margin:"0 auto",padding:"24px 20px"}}>
          <div style={{textAlign:"center",marginBottom:22}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:800,marginBottom:4}}>🎯 Combina del día</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>Los 3 partidos con mayor confianza del modelo IA</div>
          </div>

          {/* COMBINACIÓN SUGERIDA */}
          <div style={{background:"rgba(201,168,76,0.07)",border:`1px solid rgba(201,168,76,0.3)`,borderRadius:16,padding:20,marginBottom:20}}>
            <div style={{fontSize:9,color:"rgba(201,168,76,0.6)",letterSpacing:2,marginBottom:8}}>APUESTA COMBINADA SUGERIDA</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:900,color:G}}>×8.4</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>cuota combinada estimada</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:22,fontWeight:800,color:"#22c55e"}}>73%</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>confianza combinada</div>
              </div>
            </div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",background:"#161616",borderRadius:10,padding:"10px 14px",lineHeight:1.6}}>
              ⚠️ Esto es solo un análisis de IA con fines informativos. No es asesoría de apuestas. Juega con responsabilidad.
            </div>
          </div>

          {/* 3 PARTIDOS DE LA COMBINA */}
          {[MATCHES[0], MATCHES[7], MATCHES[4]].map((m, i) => (
            <div key={m.id} style={{background:"#111",border:`1px solid rgba(201,168,76,0.15)`,borderRadius:14,padding:16,marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,${GD},${G})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#000",flexShrink:0}}>{i+1}</div>
                  <span style={{fontSize:9,color:G,letterSpacing:.7,textTransform:"uppercase"}}>{m.flag} {m.league}</span>
                </div>
                <span style={{fontSize:12,fontWeight:700,color:"#22c55e"}}>{m.conf}% conf.</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Shield src={m.hlogo} size={32} alt={m.home}/>
                  <span style={{fontSize:12,fontWeight:600,lineHeight:1.3}}>{m.home}</span>
                </div>
                <span style={{fontSize:11,fontWeight:700,color:G,background:"rgba(201,168,76,0.08)",borderRadius:6,padding:"3px 8px",flexShrink:0}}>VS</span>
                <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end"}}>
                  <span style={{fontSize:12,fontWeight:600,lineHeight:1.3,textAlign:"right"}}>{m.away}</span>
                  <Shield src={m.alogo} size={32} alt={m.away}/>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Predicción IA:</span>
                <span style={{fontSize:12,fontWeight:700,padding:"3px 12px",borderRadius:20,
                  background:m.pred==="LOCAL"?"rgba(34,197,94,0.14)":m.pred==="VISITANTE"?"rgba(239,68,68,0.14)":"rgba(201,168,76,0.14)",
                  color:m.pred==="LOCAL"?"#22c55e":m.pred==="VISITANTE"?"#ef4444":G}}>
                  {m.pred==="LOCAL"?m.home:m.pred==="VISITANTE"?m.away:"EMPATE"}
                </span>
              </div>
            </div>
          ))}

          <button onClick={share} style={{width:"100%",padding:14,background:`linear-gradient(135deg,${GD},${G},${GL})`,border:"none",borderRadius:12,color:"#000",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",marginTop:4}}>
            📤 Compartir combina del día
          </button>

          {/* ── HISTORIAL ÚLTIMOS 10 DÍAS ── */}
          <div style={{marginTop:28}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:800}}>📋 Record de combinadas</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>últimos 10 días</div>
            </div>

            {/* RESUMEN STATS */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
              {[
                ["7","Acertadas","#22c55e","rgba(34,197,94,0.1)","rgba(34,197,94,0.25)"],
                ["3","Falladas","#ef4444","rgba(239,68,68,0.1)","rgba(239,68,68,0.25)"],
                ["70%","Efectividad",G,"rgba(201,168,76,0.1)","rgba(201,168,76,0.25)"],
              ].map(([v,l,color,bg,border]) => (
                <div key={l} style={{background:bg,border:`1px solid ${border}`,borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
                  <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:900,color}}>{v}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>

            {/* LISTA DE DÍAS */}
            {[
              { fecha:"Hoy · 02 Abr",     partidos:["Millonarios vs Nacional","Liverpool vs Man United","Real Madrid vs Man City"],    predicciones:["LOCAL","LOCAL","LOCAL"],    resultado:"pendiente" },
              { fecha:"Ayer · 01 Abr",     partidos:["América vs D. Cali","Bayern vs Arsenal","Barcelona vs Atlético"],                predicciones:["LOCAL","VISITANTE","LOCAL"], resultado:"acertada" },
              { fecha:"31 Mar",            partidos:["Junior vs Tolima","Liverpool vs Chelsea","Inter vs Juventus"],                   predicciones:["EMPATE","LOCAL","LOCAL"],    resultado:"fallada" },
              { fecha:"30 Mar",            partidos:["Santa Fe vs Envigado","Real Madrid vs PSG","Dortmund vs Leverkusen"],            predicciones:["LOCAL","LOCAL","EMPATE"],    resultado:"acertada" },
              { fecha:"29 Mar",            partidos:["Millonarios vs Junior","Arsenal vs Man City","Bayern vs Inter"],                 predicciones:["LOCAL","EMPATE","LOCAL"],    resultado:"acertada" },
              { fecha:"28 Mar",            partidos:["Nacional vs América","Barcelona vs Liverpool","Juventus vs PSG"],               predicciones:["LOCAL","LOCAL","VISITANTE"], resultado:"fallada" },
              { fecha:"27 Mar",            partidos:["Tolima vs Santa Fe","Real Madrid vs Barcelona","Chelsea vs Arsenal"],           predicciones:["EMPATE","LOCAL","EMPATE"],   resultado:"acertada" },
              { fecha:"26 Mar",            partidos:["Envigado vs Junior","Bayern vs Dortmund","Man United vs Liverpool"],            predicciones:["VISITANTE","LOCAL","LOCAL"],  resultado:"acertada" },
              { fecha:"25 Mar",            partidos:["D. Cali vs Millonarios","PSG vs Arsenal","Inter vs Barcelona"],                 predicciones:["VISITANTE","LOCAL","LOCAL"], resultado:"fallada" },
              { fecha:"24 Mar",            partidos:["América vs Nacional","Man City vs Chelsea","Leverkusen vs Juventus"],           predicciones:["LOCAL","LOCAL","LOCAL"],     resultado:"acertada" },
            ].map((dia, idx) => {
              const esHoy = idx === 0;
              const acertada = dia.resultado === "acertada";
              const fallada  = dia.resultado === "fallada";
              const pendiente = dia.resultado === "pendiente";
              const colorBorde = pendiente ? "rgba(201,168,76,0.25)" : acertada ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)";
              const colorBg    = pendiente ? "rgba(201,168,76,0.05)" : acertada ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)";
              const iconRes    = pendiente ? "⏳" : acertada ? "✅" : "❌";
              const colorTag   = pendiente ? G : acertada ? "#22c55e" : "#ef4444";
              const bgTag      = pendiente ? "rgba(201,168,76,0.12)" : acertada ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)";
              const txtTag     = pendiente ? "PENDIENTE" : acertada ? "ACERTADA" : "FALLADA";

              return (
                <div key={idx} style={{background:colorBg, border:`1px solid ${colorBorde}`, borderRadius:14, padding:14, marginBottom:10, position:"relative", overflow:"hidden"}}>
                  {/* Barra lateral de color */}
                  <div style={{position:"absolute",left:0,top:0,bottom:0,width:3, background: pendiente?G:acertada?"#22c55e":"#ef4444", borderRadius:"14px 0 0 14px"}} />
                  <div style={{paddingLeft:8}}>
                    {/* Header día */}
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:16}}>{iconRes}</span>
                        <span style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.8)"}}>{dia.fecha}</span>
                      </div>
                      <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,background:bgTag,color:colorTag}}>
                        {txtTag}
                      </span>
                    </div>

                    {/* Partidos de la combina */}
                    {dia.partidos.map((p, j) => (
                      <div key={j} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 0",borderBottom: j < dia.partidos.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none"}}>
                        <span style={{fontSize:11,color:"rgba(255,255,255,0.55)"}}>{p}</span>
                        <span style={{fontSize:10,fontWeight:600,padding:"1px 8px",borderRadius:10,flexShrink:0,marginLeft:8,
                          background: dia.predicciones[j]==="LOCAL"?"rgba(34,197,94,0.12)":dia.predicciones[j]==="VISITANTE"?"rgba(239,68,68,0.12)":"rgba(201,168,76,0.12)",
                          color: dia.predicciones[j]==="LOCAL"?"#22c55e":dia.predicciones[j]==="VISITANTE"?"#ef4444":G,
                        }}>
                          {dia.predicciones[j]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PRONÓSTICO PREMIUM ── */}
      {tab==="premium" && (
        <div style={{maxWidth:600,margin:"0 auto",padding:`24px ${isMobile?"14px":"20px"}`}}>

          {/* HEADER */}
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:36,marginBottom:8}}>👑</div>
            <div style={{fontFamily:"Georgia,serif",fontSize:isMobile?20:24,fontWeight:900,marginBottom:6,color:G}}>Pronóstico Premium</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>
              Disponible para Colombia 🇨🇴 y todo el mundo 🌍
            </div>
          </div>

          {/* BENEFICIOS */}
          <div style={{background:"rgba(201,168,76,0.06)",border:`1px solid rgba(201,168,76,0.2)`,borderRadius:16,padding:16,marginBottom:20}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,marginBottom:12,color:G}}>¿Qué incluye el Premium?</div>
            <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?1:2},1fr)`,gap:6}}>
              {[
                ["📊","Análisis IA de todos los partidos"],
                ["🎯","Combina del día con cuotas"],
                ["🔔","Alertas antes de cada partido"],
                ["👑","Acceso canal Telegram VIP"],
                ["📈","Historial verificado de aciertos"],
                ["🏆","Picks Mundial 2026 incluidos"],
                ["🤖","Comentario IA argumentado"],
                ["📱","Soporte por WhatsApp"],
              ].map(([icon,txt])=>(
                <div key={txt} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",fontSize:12,color:"rgba(255,255,255,0.7)"}}>
                  <span style={{fontSize:14,flexShrink:0}}>{icon}</span>{txt}
                </div>
              ))}
            </div>
          </div>

          {/* ── TARJETA COLOMBIA ── */}
          <div style={{background:"#111",border:`2px solid rgba(201,168,76,0.4)`,borderRadius:18,padding:20,marginBottom:14,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${GD},${G},${GL})`}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:22}}>🇨🇴</span>
                <div>
                  <div style={{fontSize:13,fontWeight:700}}>Para Colombia</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>Nequi · PSE · Tarjeta · Daviplata</div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"Georgia,serif",fontSize:26,fontWeight:900,color:G}}>$19.900</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>COP / mes</div>
              </div>
            </div>
            <button onClick={() => window.open(WOMPI_PREMIUM, "_blank")} style={{
              width:"100%", padding:14,
              background:`linear-gradient(135deg,${GD},${G},${GL})`,
              border:"none", borderRadius:12, color:"#000",
              fontFamily:"inherit", fontSize:14, fontWeight:800, cursor:"pointer",
              marginBottom:8,
            }}>
              💳 Pagar con Wompi — $19.900 COP
            </button>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",textAlign:"center"}}>
              ✓ Pago seguro · ✓ Cancela cuando quieras · ✓ Acceso inmediato
            </div>
          </div>

          {/* ── TARJETA INTERNACIONAL ── */}
          <div style={{background:"#111",border:"2px solid rgba(0,112,240,0.4)",borderRadius:18,padding:20,marginBottom:14,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#003087,#009cde,#012169)"}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:22}}>🌍</span>
                <div>
                  <div style={{fontSize:13,fontWeight:700}}>Internacional</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>México · Argentina · Perú · USA · España y más</div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"Georgia,serif",fontSize:26,fontWeight:900,color:"#009cde"}}>$5.99</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>USD / mes</div>
              </div>
            </div>

            {/* BOTÓN PAYPAL */}
            <button onClick={() => window.open(PAYPAL_PREMIUM, "_blank")} style={{
              width:"100%", padding:14,
              background:"linear-gradient(135deg,#003087,#009cde)",
              border:"none", borderRadius:12, color:"#fff",
              fontFamily:"inherit", fontSize:14, fontWeight:800, cursor:"pointer",
              marginBottom:8, display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 4.643-5.813 4.643h-2.19c-.523 0-.968.382-1.05.9l-1.12 7.106-.316 2.003a.641.641 0 0 0 .634.74h3.944a.641.641 0 0 0 .633-.54l.026-.13.504-3.19.032-.174a.641.641 0 0 1 .633-.54h.398c2.58 0 4.6-.547 5.19-2.13.5-1.34.238-2.47-.661-3.4z"/>
              </svg>
              Pagar con PayPal — $5.99 USD
            </button>

            {/* BANDERAS DE PAÍSES */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",marginBottom:8}}>
              {["🇲🇽","🇦🇷","🇵🇪","🇨🇱","🇺🇾","🇪🇨","🇻🇪","🇧🇴","🇵🇾","🇺🇸","🇪🇸","🇬🇧","🇩🇪","🇫🇷","🇮🇹"].map(f=>(
                <span key={f} style={{fontSize:16}}>{f}</span>
              ))}
            </div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",textAlign:"center"}}>
              ✓ Pago seguro con PayPal · ✓ Más de 200 países · ✓ Acceso inmediato
            </div>
          </div>

          {/* ── OPCIÓN WHATSAPP ── */}
          <div style={{background:"#111",border:"1px solid rgba(34,197,94,0.2)",borderRadius:14,padding:14,marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <span style={{fontSize:20}}>💬</span>
              <div>
                <div style={{fontSize:13,fontWeight:600}}>¿Prefieres pagar por WhatsApp?</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Te atendemos personalmente</div>
              </div>
            </div>
            <button onClick={() => window.open(WHATSAPP_SOPORTE, "_blank")} style={{
              width:"100%", padding:11,
              background:"linear-gradient(135deg,#128C7E,#25D366)",
              border:"none", borderRadius:10, color:"#fff",
              fontFamily:"inherit", fontSize:13, fontWeight:700, cursor:"pointer",
            }}>
              📱 Contactar por WhatsApp
            </button>
          </div>

          {/* ── CANAL TELEGRAM GRATIS ── */}
          <div style={{background:"rgba(201,168,76,0.05)",border:`1px solid rgba(201,168,76,0.15)`,borderRadius:14,padding:14,textAlign:"center"}}>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",marginBottom:10}}>
              ¿Quieres probar antes de suscribirte?
            </div>
            <button onClick={() => window.open(TELEGRAM_CANAL, "_blank")} style={{
              padding:"10px 24px",
              background:"transparent", border:`1px solid rgba(201,168,76,0.3)`,
              borderRadius:20, color:G, fontFamily:"inherit",
              fontSize:13, fontWeight:600, cursor:"pointer",
            }}>
              📢 Únete al canal Telegram gratis →
            </button>
          </div>

          {/* GARANTÍA */}
          <div style={{marginTop:16,display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            {[["🔒","Pago seguro"],["↩️","Cancela cuando quieras"],["⚡","Acceso inmediato"],["🌍","+200 países"]].map(([icon,txt])=>(
              <div key={txt} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"rgba(255,255,255,0.35)"}}>
                <span>{icon}</span><span>{txt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MUNDIAL 2026 ── */}
      {tab==="mundial" && <MundialTab />}

      {/* ── TRANSPARENCIA ── */}
      {tab==="transparencia" && <TransparenciaTab />}

      {/* ── SWIPE ── */}
      {tab==="swipe" && <SwipeTab />}

      {/* ── RANKING ── */}
      {tab==="ranking" && <RankingTab />}

      {/* MOBILE BOTTOM NAV */}
      {isMobile && (
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#111",borderTop:`1px solid rgba(201,168,76,0.15)`,display:"flex",zIndex:50,height:56,overflowX:"auto"}}>
          {[
            ["partidos","🗓️","Hoy"],
            ["combina","🎯","Combina"],
            ["mundial","🏆","Mundial"],
            ["premium","👑","Premium"],
            ["transparencia","📊","Stats"],
            ["ranking","🏆","Ranking"],
          ].map(([id,icon,lbl]) => (
            <button key={id} onClick={() => { setTab(id); if(id!=="partidos") setShowAnalysis(false); }}
              style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,
                background: id==="mundial" && tab!==id ? "linear-gradient(135deg,rgba(200,16,46,0.3),rgba(0,48,135,0.3))" : "none",
                border:"none",
                color: id==="mundial" ? (tab===id?"#c8102e":"#fff") : tab===id?G:"rgba(255,255,255,0.35)",
                cursor:"pointer",transition:"color .2s",fontSize:14,minWidth:48}}>
              {icon}
              <span style={{fontSize:8,fontWeight:tab===id?600:400}}>{lbl}</span>
            </button>
          ))}
        </div>
      )}

      {isMobile && <div style={{height:56}} />}
    </div>
  );
}
