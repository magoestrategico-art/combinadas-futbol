import React, { useState } from "react";
import styles from "../app/simulador/Simulador.module.css";

const opciones = [
  { value: "fallo", label: "Fallo", icon: "✗", color: "#e53935" },
  { value: "acierto", label: "Acierto", icon: "✓", color: "#388e3c" },
];

function calcularProgresion(
  apuestaInicial: number,
  cuota: number,
  objetivo: number,
  resultados: string[]
) {
  let progresion = [];
  let perdidaARecuperar = 0;
  let balance = 0;
  for (let i = 0; i < resultados.length; i++) {
    const esInicio = i === 0 || resultados[i - 1] === "acierto";
    let apuesta = esInicio ? apuestaInicial : (perdidaARecuperar + objetivo) / (cuota - 1);
    apuesta = Math.round(apuesta * 100) / 100;
    let resultado = resultados[i];
    let ganancia = resultado === "acierto" ? apuesta * cuota - apuesta : -apuesta;
    balance += ganancia;
    perdidaARecuperar = resultado === "fallo" ? (esInicio ? apuesta : perdidaARecuperar + apuesta) : 0;
    progresion.push({
      partido: i + 1,
      apuesta,
      cuota,
      resultado,
      ganancia,
      balance,
      perdidaARecuperar: resultado === "fallo" ? perdidaARecuperar : 0,
    });
    if (resultado === "acierto") perdidaARecuperar = 0;
  }
  return progresion;
}

export default function SimuladorCombinadaFull({ partidos = 10, cuota = 4, objetivo = 3 }) {
  const [apuestaInicial, setApuestaInicial] = useState(1);
  const [cuotaSim, setCuotaSim] = useState(cuota);
  const [objetivoSim, setObjetivoSim] = useState(objetivo);
  const [resultados, setResultados] = useState(Array(partidos).fill("fallo"));
  const progresion = Array.isArray(resultados) && resultados.length === partidos
    ? calcularProgresion(apuestaInicial, cuotaSim, objetivoSim, resultados)
    : [];
  const balanceFinal = progresion.length > 0 ? progresion[progresion.length - 1].balance : 0;

  function handleResultado(idx: number, value: string) {
    setResultados((prev) => prev.map((r, i) => (i === idx ? value : r)));
  }

  return (
    <div className={styles.container}>
      <div className={styles.simuladorBox}>
        <div style={{background:'#204080',borderRadius:32,padding:'32px 32px 24px 32px',marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:32, fontWeight:700, color:'#e10098',display:'flex',alignItems:'center'}}>
              <span style={{fontSize:36,marginRight:10}}>🎲</span> Simulador de Combinada
            </span>
          </div>
          <div style={{display:'flex',gap:32,marginTop:24,marginBottom:16}}>
            <div style={{color:'#ffb300',fontWeight:600,fontSize:22}}>Apuesta inicial (€):</div>
            <input type="number" min={0.01} step={0.01} value={apuestaInicial} onChange={e => setApuestaInicial(Number(e.target.value))} style={{width:70,fontSize:22,borderRadius:8,border:'2px solid #e10098',color:'#204080',textAlign:'center',fontWeight:700,background:'#fff'}} />
            <div style={{color:'#ffb300',fontWeight:600,fontSize:22}}>Cuota:</div>
            <input type="number" min={1.01} step={0.01} value={cuotaSim} onChange={e => setCuotaSim(Number(e.target.value))} style={{width:70,fontSize:22,borderRadius:8,border:'2px solid #e10098',color:'#204080',textAlign:'center',fontWeight:700,background:'#fff'}} />
            <div style={{color:'#ffb300',fontWeight:600,fontSize:22}}>Objetivo (€):</div>
            <input type="number" min={0.01} step={0.01} value={objetivoSim} onChange={e => setObjetivoSim(Number(e.target.value))} style={{width:70,fontSize:22,borderRadius:8,border:'2px solid #e10098',color:'#204080',textAlign:'center',fontWeight:700,background:'#fff'}} />
            <div style={{color:'#ffb300',fontWeight:600,fontSize:22}}>Balance final:</div>
            <span style={{fontWeight:700,fontSize:22,color:balanceFinal>=0?'#388e3c':'#e53935'}}>{balanceFinal>=0?'+':'-'}€ {Math.abs(balanceFinal).toFixed(2)}</span>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{display:'flex',gap:32,alignItems:'center',marginBottom:8}}>
            <div style={{fontWeight:700,fontSize:22,color:'#204080'}}>Jornada</div>
            <div style={{fontWeight:700,fontSize:22,color:'#204080'}}>Estado</div>
            <div style={{fontWeight:700,fontSize:22,color:'#204080'}}>Cuota</div>
            <div style={{fontWeight:700,fontSize:22,color:'#204080'}}>Ganancia/Pérdida</div>
            <div style={{fontWeight:700,fontSize:22,color:'#204080'}}>Balance</div>
          </div>
          <div style={{background:'#fff',borderRadius:12,padding:'18px 24px',marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:24,color:'#23407a',marginBottom:8,display:'flex',alignItems:'center'}}>
              <span style={{fontSize:28,marginRight:10}}>📅</span> Timeline de Jornadas
            </div>
            <div style={{background:'#eaf4ff',border:'1px solid #bfc2cc',borderRadius:8,padding:'10px 18px',marginBottom:12,color:'#23407a',fontSize:17}}>
              <span style={{fontWeight:600}}>💡 Tip:</span> Haz clic en una jornada para activarla y poder marcar los partidos como acertados/fallados.
            </div>
            {/* Aquí iría la lógica de timeline si se quiere implementar visualmente */}
          </div>
        </div>
        <div className={styles.tablaBox}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Partido</th>
                <th>Apuesta (€)</th>
                <th>Cuota</th>
                <th>Resultado</th>
                <th>Ganancia/Pérdida (€)</th>
                <th>Balance Acumulado (€)</th>
                <th>Pérdidas a Recuperar (€)</th>
              </tr>
            </thead>
            <tbody>
              {progresion.map((r, idx) => (
                <tr key={r.partido}>
                  <td>Partido {r.partido}</td>
                    <td>€ {isFinite(r.apuesta) ? r.apuesta.toFixed(2) : '—'}</td>
                    <td>{isFinite(r.cuota) ? r.cuota.toFixed(2) : '—'}</td>
                    <td>
                      <select
                        value={r.resultado}
                        onChange={e => handleResultado(idx, e.target.value)}
                        style={{
                          fontWeight: 600,
                          fontSize: 18,
                          borderRadius: 10,
                          border: "2px solid #bbb",
                          padding: "6px 16px 6px 10px",
                          color: r.resultado === "fallo" ? "#e53935" : "#388e3c",
                          background: "#fff",
                          minWidth: 110,
                          boxShadow: "0 2px 8px #0001"
                        }}
                      >
                        {opciones.map(opt => (
                          <option key={opt.value} value={opt.value} style={{ color: opt.color }}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={r.ganancia < 0 || !isFinite(r.ganancia) ? styles.gananciaNegativa : styles.gananciaPositiva}>
                      {isFinite(r.ganancia) ? (r.ganancia < 0 ? `€ ${r.ganancia.toFixed(2)}` : `+€ ${r.ganancia.toFixed(2)}`) : '—'}
                    </td>
                    <td className={r.balance < 0 || !isFinite(r.balance) ? styles.gananciaNegativa : styles.gananciaPositiva}>
                      {isFinite(r.balance) ? `€ ${r.balance.toFixed(2)}` : '—'}
                    </td>
                    <td className={styles.gananciaNegativa}>
                      {isFinite(r.perdidaARecuperar) && r.perdidaARecuperar > 0 ? `€ ${r.perdidaARecuperar.toFixed(2)}` : '€ 0.00'}
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
