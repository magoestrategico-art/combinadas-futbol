'use client';

import React, { useState } from 'react';

const LIGAS = [
  { nombre: "Premier League", key: "premier", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { nombre: "LaLiga", key: "laliga", emoji: "🇪🇸" },
  { nombre: "Bundesliga", key: "bundesliga", emoji: "🇩🇪" },
  { nombre: "Serie A", key: "serie a", emoji: "🇮🇹" },
  { nombre: "Ligue 1", key: "ligue 1", emoji: "🇫🇷" },
  { nombre: "Champions", key: "champions", emoji: "⭐" },
];

function getIconoResultado(resultado: string) {
  if (resultado.includes("OVER 2.5")) return { icono: "🔥", color: "#22c55e", label: "OVER 2.5", prob: 85 };
  if (resultado.includes("INTERESANTE")) return { icono: "⚠️", color: "#f59e0b", label: "INTERESANTE", prob: 60 };
  if (resultado.includes("NO APOSTAR")) return { icono: "❌", color: "#ef4444", label: "NO APOSTAR", prob: 30 };
  return { icono: "📊", color: "#94a3b8", label: "", prob: 50 };
}

function Spinner() {
  return (
    <div style={{
      width: "36px", height: "36px", margin: "10px auto",
      border: "4px solid #334155",
      borderTop: "4px solid #22c55e",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite"
    }} />
  );
}

function ComponenteAPI() {
  const [liga, setLiga] = useState("");
  const [historial, setHistorial] = useState<{ liga: string; resultado: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const analizar = async () => {
    if (loading || !liga) return;
    setLoading(true);
    try {
      const res = await fetch("/api-analizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liga }),
      });
      const data = await res.json();
      setHistorial(prev => [{ liga, resultado: data.resultado }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const info = historial.length > 0 ? getIconoResultado(historial[0].resultado) : null;
  const partido = historial.length > 0 ? historial[0].resultado.replace(/^.*?\(/, "").replace(/\)$/, "") : "";
  const cabecera = historial.length > 0 ? historial[0].resultado.split("(")[0].trim() : "";

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .liga-btn:hover { opacity: 0.85; transform: scale(1.03); }
        .analizar-btn:hover:not(:disabled) { background: #16a34a !important; }
      `}</style>
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1a2744 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}>
        <div style={{
          background: "#1e293b",
          padding: "36px",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.6)",
          textAlign: "center",
        }}>

          {/* Header con gradiente */}
          <div style={{ marginBottom: "8px" }}>
            <span style={{ fontSize: "36px" }}>⚽</span>
            <h2 style={{
              margin: "8px 0 4px",
              fontSize: "24px",
              fontWeight: "800",
              background: "linear-gradient(90deg, #22c55e, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>Análisis de Partidos</h2>
            <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>Selecciona una liga y analiza el mejor partido</p>
          </div>

          {/* Botón volver */}
          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: "transparent", color: "#64748b", border: "1px solid #334155",
              borderRadius: "8px", padding: "6px 14px", fontSize: "13px",
              cursor: "pointer", marginBottom: "24px"
            }}
          >
            ← Volver
          </button>

          {/* Selector de ligas */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "20px" }}>
            {LIGAS.map((l) => (
              <button
                key={l.key}
                className="liga-btn"
                onClick={() => setLiga(l.key)}
                style={{
                  padding: "10px 6px",
                  borderRadius: "10px",
                  border: liga === l.key ? "2px solid #22c55e" : "2px solid #334155",
                  background: liga === l.key ? "#052e16" : "#0f172a",
                  color: liga === l.key ? "#22c55e" : "#94a3b8",
                  fontSize: "12px",
                  fontWeight: liga === l.key ? "700" : "400",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: "20px", marginBottom: "4px" }}>{l.emoji}</div>
                {l.nombre}
              </button>
            ))}
          </div>

          {/* Botón analizar */}
          <button
            className="analizar-btn"
            onClick={analizar}
            disabled={loading || !liga}
            style={{
              width: "100%",
              padding: "14px",
              background: liga ? "#22c55e" : "#334155",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: liga ? "pointer" : "not-allowed",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Analizando..." : "🔍 Analizar partido"}
          </button>

          {/* Spinner */}
          {loading && <Spinner />}

          {/* Historial de resultados */}
          {historial.map((item, i) => {
            const inf = getIconoResultado(item.resultado);
            const part = item.resultado.replace(/^.*?\(/, "").replace(/\)$/, "");
            const cab = item.resultado.split("(")[0].trim();
            return (
              <div key={i} style={{
                marginTop: "16px",
                padding: "20px",
                background: "#0f172a",
                borderRadius: "14px",
                animation: i === 0 ? "fadeIn 0.4s ease" : "none",
                border: `1px solid ${inf.color}33`,
                opacity: i === 0 ? 1 : 0.6,
                position: "relative",
              }}>
                {/* Botón eliminar */}
                <button
                  onClick={() => setHistorial(prev => prev.filter((_, idx) => idx !== i))}
                  title="Eliminar"
                  style={{
                    position: "absolute", top: "10px", right: "10px",
                    background: "transparent", border: "none",
                    color: "#475569", fontSize: "16px", cursor: "pointer",
                    lineHeight: 1, padding: "2px 6px", borderRadius: "6px",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
                >
                  ✕
                </button>

                <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
                  {i === 0 ? "Último análisis" : `Análisis anterior`} · {item.liga}
                </div>
                <div style={{ fontSize: "40px", marginBottom: "6px" }}>{inf.icono}</div>
                <div style={{ color: inf.color, fontWeight: "800", fontSize: "17px", marginBottom: "6px" }}>{cab}</div>
                {part && part !== item.resultado && (
                  <div style={{ color: "white", fontSize: "14px", marginBottom: "12px", fontWeight: "600" }}>{part}</div>
                )}
                <div style={{ textAlign: "left" }}>
                  <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>
                    Probabilidad estimada: {inf.prob}%
                  </div>
                  <div style={{ background: "#1e293b", borderRadius: "99px", height: "8px", overflow: "hidden" }}>
                    <div style={{
                      width: `${inf.prob}%`, height: "100%",
                      background: `linear-gradient(90deg, ${inf.color}, ${inf.color}aa)`,
                      borderRadius: "99px",
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default ComponenteAPI;
