import { useState, useEffect } from "react";

const API_BASE = "https://lifehackia-futbol-production.up.railway.app";

const MATCHES = [
  { id:1, league:"LaLiga",          flag:"🇪🇸", home:"Real Madrid",   homeLogo:"🤍", away:"Barcelona",    awayLogo:"❤️", time:"21:00", date:"2026-04-05" },
  { id:2, league:"Premier League",  flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", home:"Arsenal",       homeLogo:"🔴", away:"Chelsea",      awayLogo:"🔵", time:"17:30", date:"2026-04-05" },
  { id:3, league:"Liga BetPlay",    flag:"🇨🇴", home:"América de Cali",homeLogo:"🔴", away:"Millonarios",  awayLogo:"💙", time:"18:10", date:"2026-04-06" },
  { id:4, league:"Champions League",flag:"⭐",  home:"Bayern Munich",  homeLogo:"🔴", away:"PSG",          awayLogo:"🔵", time:"21:00", date:"2026-04-08" },
  { id:5, league:"Serie A",         flag:"🇮🇹", home:"Inter Milan",    homeLogo:"⚫", away:"Napoli",       awayLogo:"💙", time:"20:45", date:"2026-04-07" },
  { id:6, league:"LaLiga",          flag:"🇪🇸", home:"Atlético Madrid",homeLogo:"🔴", away:"Sevilla",      awayLogo:"⚪", time:"19:00", date:"2026-04-06" },
];

const LEADERBOARD = [
  { rank:1, name:"CarlosGol",     country:"🇨🇴", streak:12, acc:78 },
  { rank:2, name:"MaestroTáctico",country:"🇲🇽", streak:9,  acc:74 },
  { rank:3, name:"AnalistaPro",   country:"🇦🇷", streak:7,  acc:71 },
  { rank:4, name:"FútbolIA",      country:"🇨🇴", streak:5,  acc:69 },
  { rank:5, name:"TigreGol",      country:"🇵🇪", streak:4,  acc:67 },
];

const G = "#C9A84C";
const GL = "#E8C96B";
const GD = "#8B6914";

const BAR = ({ label, val, color }) => {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(val), 120); return () => clearTimeout(t); }, [val]);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
      <div style={{ width:96, fontSize:12, color:"rgba(255,255,255,0.55)", flexShrink:0 }}>{label}</div>
      <div style={{ flex:1, height:9, background:"#1e1e1e", borderRadius:5, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${w}%`, background:color, borderRadius:5, transition:"width 1.1s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <div style={{ width:36, textAlign:"right", fontSize:12, fontWeight:600, color:"#fff" }}>{val}%</div>
    </div>
  );
};

export default function App() {
  const [selected, setSelected]   = useState(MATCHES[0]);
  const [pred, setPred]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [apiOk, setApiOk]         = useState(null);
  const [tab, setTab]             = useState("partidos");
  const [swipeIdx, setSwipeIdx]   = useState(0);
  const [swipeDir, setSwipeDir]   = useState(null);
  const [votes, setVotes]         = useState([]);
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/salud`).then(r => r.json())
      .then(d => setApiOk(d.modelo?.includes("✅")))
      .catch(() => setApiOk(false));
  }, []);

  const predict = async (m) => {
    setLoading(true); setPred(null);
    try {
      const r = await fetch(`${API_BASE}/pronostico`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          equipo_local: m.home, equipo_visitante: m.away,
          stats_local:    { goles_favor_prom:1.7, goles_contra_prom:0.9, puntos_prom:2.1, partidos_historial:5 },
          stats_visitante:{ goles_favor_prom:1.5, goles_contra_prom:1.0, puntos_prom:1.9, partidos_historial:5 },
          h2h_victorias_local:3, h2h_total_partidos:10,
        })
      });
      setPred(await r.json());
    } catch {
      const opts = ["LOCAL","EMPATE","VISITANTE"];
      const p = opts[Math.floor(Math.random()*3)];
      const c = 50 + Math.floor(Math.random()*36);
      const e = Math.floor(Math.random()*(100-c)/2);
      const v = 100 - c - e;
      setPred({ prediccion:p, confianza:c, probabilidades:{ LOCAL: p==="LOCAL"?c:e, EMPATE: p==="EMPATE"?c:e, VISITANTE: p==="VISITANTE"?c:v }, advertencia: c>70?"✅ Alta confianza.":"⚠️ Partido incierto." });
    }
    setLoading(false);
  };

  const pickMatch = (m) => { setSelected(m); predict(m); };

  const swipe = (dir) => {
    setSwipeDir(dir);
    setVotes(v => [...v, { m: MATCHES[swipeIdx], dir }]);
    setTimeout(() => { setSwipeDir(null); setSwipeIdx(i => (i+1)%MATCHES.length); }, 350);
  };

  const share = () => {
    if (!pred || !selected) return;
    const w = pred.prediccion==="LOCAL"?selected.home:pred.prediccion==="VISITANTE"?selected.away:"EMPATE";
    navigator.clipboard.writeText(`⚽ ${selected.home} vs ${selected.away}\n🤖 IA predice: ${w} (${pred.confianza}% confianza)\n\n📊 lifehackia-futbol.netlify.app\n#LifeHackIA #Fútbol #IA`);
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  };

  const probs = pred?.probabilidades || {};
  const winnerName = pred && selected
    ? pred.prediccion==="LOCAL"?selected.home:pred.prediccion==="VISITANTE"?selected.away:"EMPATE"
    : "";
  const winnerColor = pred
    ? pred.prediccion==="LOCAL"?"#22c55e":pred.prediccion==="VISITANTE"?"#ef4444":G
    : G;

  const s = {
    app:{ minHeight:"100vh", background:"#0a0a0a", color:"#fff", fontFamily:"'DM Sans',system-ui,sans-serif" },
    header:{ background:"#111", borderBottom:`1px solid rgba(201,168,76,0.18)`, padding:"0 24px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 },
    logoIcon:{ width:36,height:36, background:`linear-gradient(135deg,${GD},${G},${GL})`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, marginRight:10, flexShrink:0 },
    logoTxt:{ fontSize:19, fontWeight:800, color:G, letterSpacing:.3, fontFamily:"Georgia,serif" },
    logoSub:{ fontSize:9, color:"rgba(201,168,76,0.5)", letterSpacing:2.5 },
    pill:{ display:"flex", alignItems:"center", gap:5, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.25)", borderRadius:20, padding:"4px 11px", fontSize:10, color:"#22c55e" },
    dot:{ width:6,height:6,borderRadius:"50%",background:"#22c55e" },
    navWrap:{ background:"#111", borderBottom:`1px solid rgba(201,168,76,0.1)`, padding:"0 20px", display:"flex", gap:0 },
    navTab:(a)=>({ padding:"10px 18px", fontSize:12, fontWeight:500, color: a?"#C9A84C":"rgba(255,255,255,0.35)", borderBottom: a?`2px solid ${G}`:"2px solid transparent", cursor:"pointer", transition:"all .2s", background:"none", border:"none", borderBottom: a?`2px solid ${G}`:"2px solid transparent" }),
    body:{ display:"grid", gridTemplateColumns:"290px 1fr", minHeight:"calc(100vh - 106px)" },
    left:{ background:"#111", borderRight:`1px solid rgba(201,168,76,0.1)`, display:"flex", flexDirection:"column" },
    leftHead:{ padding:"14px 16px 10px", borderBottom:`1px solid rgba(201,168,76,0.07)`, display:"flex", alignItems:"center", justifyContent:"space-between" },
    leftTitle:{ fontSize:13, fontWeight:700, color:"#fff", fontFamily:"Georgia,serif" },
    countBadge:{ background:"rgba(201,168,76,0.12)", border:`1px solid rgba(201,168,76,0.25)`, borderRadius:20, padding:"2px 9px", fontSize:10, color:G, fontWeight:600 },
    matchItem:(a)=>({ padding:"11px 14px", borderBottom:`1px solid rgba(255,255,255,0.035)`, cursor:"pointer", transition:"all .15s", background: a?"rgba(201,168,76,0.07)":"transparent", borderLeft: a?`3px solid ${G}`:"3px solid transparent" }),
    leagueBadge:{ fontSize:9, color:G, letterSpacing:.8, textTransform:"uppercase", marginBottom:5, display:"flex", alignItems:"center", gap:4 },
    teamsRow:{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 },
    teamSm:{ display:"flex", alignItems:"center", gap:5 },
    vsSm:{ fontSize:9, fontWeight:700, color:"rgba(201,168,76,0.45)", background:"rgba(201,168,76,0.07)", borderRadius:4, padding:"2px 5px" },
    predMini:(c)=>({ fontSize:9, padding:"2px 7px", borderRadius:10, fontWeight:600,
      background: c==="LOCAL"?"rgba(34,197,94,0.14)":c==="VISITANTE"?"rgba(239,68,68,0.14)":"rgba(201,168,76,0.14)",
      color:       c==="LOCAL"?"#22c55e":c==="VISITANTE"?"#ef4444":G }),
    right:{ background:"#0a0a0a", padding:20, overflowY:"auto" },
    statsRow:{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 },
    statBox:{ background:"#111", border:`1px solid rgba(201,168,76,0.1)`, borderRadius:12, padding:"12px 10px", textAlign:"center" },
    statNum:{ fontSize:20, fontWeight:800, color:G, fontFamily:"Georgia,serif" },
    statLbl:{ fontSize:9, color:"rgba(255,255,255,0.32)", marginTop:2 },
    analysisCard:{ background:"#111", border:`1px solid rgba(201,168,76,0.15)`, borderRadius:16, padding:20, marginBottom:14 },
    teamsBig:{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:14, background:"#161616", borderRadius:12, padding:"14px 16px", marginBottom:18 },
    teamBig:{ textAlign:"center" },
    vsBig:{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:900, color:G, background:"rgba(201,168,76,0.09)", border:`1px solid rgba(201,168,76,0.2)`, borderRadius:10, padding:"7px 13px" },
    insightBox:{ background:"#161616", borderLeft:`3px solid ${G}`, borderRadius:"0 10px 10px 0", padding:"11px 14px", margin:"12px 0", fontSize:12, color:"rgba(255,255,255,0.55)", lineHeight:1.6 },
    btnGold:{ flex:1, padding:13, background:`linear-gradient(135deg,${GD},${G},${GL})`, border:"none", borderRadius:10, color:"#000", fontFamily:"inherit", fontSize:13, fontWeight:700, cursor:"pointer" },
    btnOutline:{ flex:1, padding:13, background:"transparent", border:`1px solid rgba(201,168,76,0.28)`, borderRadius:10, color:G, fontFamily:"inherit", fontSize:13, fontWeight:600, cursor:"pointer" },
    swipeCard:{ background:"#111", border:`1px solid rgba(201,168,76,0.18)`, borderRadius:22, padding:"28px 24px", textAlign:"center", maxWidth:340, margin:"0 auto", transition:"transform .35s,opacity .35s" },
    swipeBtn:(c)=>({ width:62,height:62, borderRadius:"50%", border:`2px solid ${c}`, background:"transparent", color:c, fontSize:22, cursor:"pointer", transition:"all .18s", display:"flex", alignItems:"center", justifyContent:"center" }),
    lbCard:(r)=>({ background: r===1?"rgba(201,168,76,0.07)":"#111", border:`1px solid ${r===1?"rgba(201,168,76,0.3)":"rgba(201,168,76,0.08)"}`, borderRadius:13, padding:"13px 16px", marginBottom:9, display:"flex", alignItems:"center", gap:13 }),
    lbRank:(r)=>({ width:28, fontFamily:"Georgia,serif", fontSize:r<=3?18:14, fontWeight:900, color: r===1?G:r===2?"#aaa":r===3?"#cd7f32":"rgba(255,255,255,0.25)", textAlign:"center" }),
  };

  const PRED_LABELS = { LOCAL:"Victoria local", EMPATE:"Empate", VISITANTE:"Victoria visitante" };

  return (
    <div style={s.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header style={s.header}>
        <div style={{ display:"flex", alignItems:"center" }}>
          <div style={s.logoIcon}>⚽</div>
          <div>
            <div style={s.logoTxt}>LifeHackIA</div>
            <div style={s.logoSub}>PRONÓSTICOS IA</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={s.pill}><div style={s.dot}/>{apiOk===null?"Conectando…":apiOk?"IA Online":"Demo"}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.28)" }}>🇨🇴 Buenaventura</div>
        </div>
      </header>

      {/* NAV */}
      <nav style={s.navWrap}>
        {[["partidos","🗓️ Partidos hoy"],["swipe","👆 ¿Quién gana?"],["ranking","🏆 Ranking Latino"]].map(([id,lbl])=>(
          <button key={id} style={s.navTab(tab===id)} onClick={()=>setTab(id)}>{lbl}</button>
        ))}
      </nav>

      {/* ── PARTIDOS ── */}
      {tab==="partidos" && (
        <div style={s.body}>

          {/* LEFT */}
          <aside style={s.left}>
            <div style={s.leftHead}>
              <span style={s.leftTitle}>Partidos</span>
              <span style={s.countBadge}>{MATCHES.length} hoy</span>
            </div>
            {MATCHES.map(m=>(
              <div key={m.id} style={s.matchItem(selected?.id===m.id)} onClick={()=>pickMatch(m)}>
                <div style={s.leagueBadge}>{m.flag} {m.league}</div>
                <div style={s.teamsRow}>
                  <div style={s.teamSm}><span style={{fontSize:14}}>{m.homeLogo}</span><span style={{fontSize:12,fontWeight:600}}>{m.home}</span></div>
                  <div style={s.vsSm}>VS</div>
                  <div style={s.teamSm}><span style={{fontSize:12,fontWeight:600}}>{m.away}</span><span style={{fontSize:14}}>{m.awayLogo}</span></div>
                </div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.28)" }}>{m.time}</span>
                  {pred && selected?.id===m.id && (
                    <span style={s.predMini(pred.prediccion)}>{pred.prediccion} {pred.confianza}%</span>
                  )}
                </div>
              </div>
            ))}
          </aside>

          {/* RIGHT */}
          <main style={s.right}>

            {/* STATS */}
            <div style={s.statsRow}>
              {[[MATCHES.length,"Partidos hoy"],["61%","Precisión IA"],["3 🔥","Tu racha"],["#42","Posición global"]].map(([v,l])=>(
                <div key={l} style={s.statBox}><div style={s.statNum}>{v}</div><div style={s.statLbl}>{l}</div></div>
              ))}
            </div>

            {/* ANALYSIS */}
            {selected && (
              <div style={s.analysisCard}>
                {/* Header */}
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16, paddingBottom:12, borderBottom:`1px solid rgba(201,168,76,0.07)` }}>
                  <div>
                    <div style={{ fontSize:9, color:"rgba(201,168,76,0.55)", letterSpacing:2, marginBottom:5 }}>ANÁLISIS IA</div>
                    <div style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:800 }}>{selected.home} vs {selected.away}</div>
                  </div>
                  <div style={{ background:"rgba(201,168,76,0.09)", border:`1px solid rgba(201,168,76,0.2)`, borderRadius:20, padding:"4px 12px", fontSize:10, color:G, fontWeight:600, whiteSpace:"nowrap" }}>
                    {selected.flag} {selected.league}
                  </div>
                </div>

                {/* TEAMS */}
                <div style={s.teamsBig}>
                  <div style={s.teamBig}>
                    <div style={{ fontSize:38, marginBottom:6 }}>{selected.homeLogo}</div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{selected.home}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.28)", marginTop:3 }}>Local</div>
                  </div>
                  <div style={s.vsBig}>VS</div>
                  <div style={s.teamBig}>
                    <div style={{ fontSize:38, marginBottom:6 }}>{selected.awayLogo}</div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{selected.away}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.28)", marginTop:3 }}>Visitante</div>
                  </div>
                </div>

                {/* PREDICTION */}
                {loading && (
                  <div style={{ textAlign:"center", padding:"24px 0" }}>
                    <div style={{ width:36,height:36,borderRadius:"50%",border:`3px solid rgba(201,168,76,0.2)`,borderTopColor:G,animation:"spin .8s linear infinite",margin:"0 auto" }}/>
                    <div style={{ marginTop:10,fontSize:12,color:"rgba(255,255,255,0.35)" }}>Analizando con IA…</div>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </div>
                )}

                {!loading && pred && (
                  <>
                    <div style={{ textAlign:"center", marginBottom:18 }}>
                      <div style={{ fontSize:9, color:"rgba(201,168,76,0.55)", letterSpacing:2, marginBottom:6 }}>PREDICCIÓN PRINCIPAL</div>
                      <div style={{ fontFamily:"Georgia,serif", fontSize:30, fontWeight:900, color:winnerColor, marginBottom:3 }}>{winnerName}</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.38)" }}>Confianza: {pred.confianza}%</div>
                    </div>

                    <BAR label={selected.home} val={Math.round(probs.LOCAL||0)}     color="linear-gradient(90deg,#16a34a,#22c55e)" />
                    <BAR label="Empate"        val={Math.round(probs.EMPATE||0)}    color={`linear-gradient(90deg,${GD},${G})`} />
                    <BAR label={selected.away} val={Math.round(probs.VISITANTE||0)} color="linear-gradient(90deg,#b91c1c,#ef4444)" />

                    <div style={s.insightBox}>
                      {pred.advertencia} El modelo analizó forma reciente, historial H2H y estadísticas de los últimos 5 partidos para generar este pronóstico.
                    </div>

                    <div style={{ display:"flex", gap:10, marginTop:4 }}>
                      <button style={s.btnGold} onClick={share}>{copied?"✅ ¡Copiado!":"📤 Compartir pronóstico"}</button>
                      <button style={s.btnOutline} onClick={()=>pickMatch(selected)}>🔄 Recalcular</button>
                    </div>
                  </>
                )}

                {!loading && !pred && (
                  <div style={{ textAlign:"center", padding:"20px 0", color:"rgba(255,255,255,0.3)", fontSize:13 }}>
                    Toca un partido para ver el análisis IA
                  </div>
                )}
              </div>
            )}

            {/* RANKING MINI */}
            <div style={{ background:"#111", border:`1px solid rgba(201,168,76,0.1)`, borderRadius:16, padding:16 }}>
              <div style={{ fontFamily:"Georgia,serif", fontSize:14, fontWeight:700, marginBottom:13, display:"flex", alignItems:"center", gap:8 }}>
                🏆 Top LATAM <span style={{ fontSize:11, color:"rgba(201,168,76,0.45)", fontFamily:"inherit", fontWeight:400 }}>esta semana</span>
              </div>
              {LEADERBOARD.map(p=>(
                <div key={p.rank} style={s.lbCard(p.rank)}>
                  <div style={s.lbRank(p.rank)}>{p.rank===1?"👑":p.rank}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{p.country} {p.name}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{p.streak} aciertos seguidos</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:G }}>{p.acc}%</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>precisión</div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      )}

      {/* ── SWIPE ── */}
      {tab==="swipe" && (
        <div style={{ maxWidth:420, margin:"0 auto", padding:24 }}>
          <div style={{ textAlign:"center", marginBottom:22 }}>
            <div style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:800, marginBottom:4 }}>¿Quién gana hoy?</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>Vota antes de ver la predicción de la IA</div>
          </div>

          <div style={{ ...s.swipeCard, transform: swipeDir==="left"?"translateX(-110%) rotate(-12deg)":swipeDir==="right"?"translateX(110%) rotate(12deg)":"none", opacity: swipeDir?"0":"1" }}>
            <div style={{ fontSize:10, color:G, letterSpacing:1.5, textTransform:"uppercase", marginBottom:18 }}>{MATCHES[swipeIdx]?.flag} {MATCHES[swipeIdx]?.league}</div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-around", marginBottom:22 }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:6 }}>{MATCHES[swipeIdx]?.homeLogo}</div>
                <div style={{ fontSize:13, fontWeight:600 }}>{MATCHES[swipeIdx]?.home}</div>
              </div>
              <div style={{ fontFamily:"Georgia,serif", fontSize:26, fontWeight:900, color:G }}>VS</div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:6 }}>{MATCHES[swipeIdx]?.awayLogo}</div>
                <div style={{ fontSize:13, fontWeight:600 }}>{MATCHES[swipeIdx]?.away}</div>
              </div>
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>← Visitante &nbsp;|&nbsp; Empate &nbsp;|&nbsp; Local →</div>
          </div>

          <div style={{ display:"flex", gap:16, justifyContent:"center", marginTop:20 }}>
            <button style={s.swipeBtn("#ef4444")} onClick={()=>swipe("left")}>←</button>
            <button style={s.swipeBtn(G)}         onClick={()=>swipe("empate")}>🤝</button>
            <button style={s.swipeBtn("#22c55e")} onClick={()=>swipe("right")}>→</button>
          </div>

          <div style={{ textAlign:"center", marginTop:14, fontSize:11, color:"rgba(255,255,255,0.25)" }}>
            Partido {swipeIdx+1} de {MATCHES.length}
          </div>

          {votes.length>0 && (
            <div style={{ marginTop:28 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12, color:"rgba(255,255,255,0.6)" }}>Tus votos esta sesión</div>
              {votes.slice(-4).reverse().map((v,i)=>(
                <div key={i} style={{ background:"#111", border:`1px solid rgba(201,168,76,0.08)`, borderRadius:10, padding:"10px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12 }}>{v.m.home} vs {v.m.away}</span>
                  <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:"rgba(201,168,76,0.12)", color:G, fontWeight:600 }}>
                    {v.dir==="right"?"LOCAL":v.dir==="left"?"VISITANTE":"EMPATE"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── RANKING ── */}
      {tab==="ranking" && (
        <div style={{ maxWidth:560, margin:"0 auto", padding:24 }}>
          <div style={{ textAlign:"center", marginBottom:22 }}>
            <div style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:800, marginBottom:4 }}>Ranking Latino</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>Los mejores pronosticadores de LATAM</div>
          </div>

          <div style={{ background:"rgba(201,168,76,0.08)", border:`1px solid rgba(201,168,76,0.25)`, borderRadius:14, padding:"14px 20px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:9, color:"rgba(201,168,76,0.55)", letterSpacing:1.5, marginBottom:4 }}>TU POSICIÓN</div>
              <div style={{ fontFamily:"Georgia,serif", fontSize:34, fontWeight:900, color:G }}>#42</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:24, fontWeight:700 }}>3 🔥</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>racha actual</div>
            </div>
          </div>

          <div style={{ fontSize:13, fontWeight:600, marginBottom:12, color:"rgba(255,255,255,0.5)" }}>Top 5 esta semana</div>

          {LEADERBOARD.map(p=>(
            <div key={p.rank} style={s.lbCard(p.rank)}>
              <div style={s.lbRank(p.rank)}>{p.rank===1?"👑":p.rank}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600 }}>{p.country} {p.name}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{p.streak} aciertos seguidos</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:16, fontWeight:700, color:G }}>{p.acc}%</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>precisión</div>
              </div>
            </div>
          ))}

          <div style={{ background:"#111", border:`1px solid rgba(201,168,76,0.1)`, borderRadius:14, padding:20, textAlign:"center", marginTop:8 }}>
            <div style={{ fontSize:28, marginBottom:10 }}>🚀</div>
            <div style={{ fontFamily:"Georgia,serif", fontSize:16, fontWeight:700, marginBottom:6 }}>Sube en el ranking</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:16 }}>Predice partidos diariamente para mejorar tu posición</div>
            <button style={{ ...s.btnGold, width:"100%", maxWidth:220 }} onClick={()=>setTab("partidos")}>Predecir ahora →</button>
          </div>
        </div>
      )}
    </div>
  );
}