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
        <h1 className={styles.titulo}>Simulador de Estrategia de Apuestas</h1>
        <div className={styles.subtitulo}>Simula tu combinada jornada a jornada</div>
        <div className={styles.infoBox}>
          <b>¿Cómo funciona?</b><br />
          Simula tus resultados reales, ajusta apuestas y calcula tu balance acumulado según tus aciertos y fallos.
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
          <form className={styles.form} onSubmit={e => e.preventDefault()} style={{ flex: '1 1 400px', display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 0 }}>
            <div className={styles.inputGroup}>
              <label>Apuesta Inicial (€)</label><br />
              <input type="number" min={0.01} step={0.01} value={apuestaInicial} onChange={e => setApuestaInicial(Number(e.target.value))} />
            </div>
            <div className={styles.inputGroup}>
              <label>Cuota Promedio</label><br />
              <input type="number" min={1.01} step={0.01} value={cuotaSim} onChange={e => setCuotaSim(Number(e.target.value))} />
            </div>
            <div className={styles.inputGroup}>
              <label>Ganancia Objetivo (€)</label><br />
              <input type="number" min={0.01} step={0.01} value={objetivoSim} onChange={e => setObjetivoSim(Number(e.target.value))} />
            </div>
          </form>
          <div
            className={styles.balanceBox}
            style={{
              background: balanceFinal >= 0 ? '#eafbe7' : '#fff0f0',
              border: balanceFinal >= 0 ? '2px solid #4caf50' : '2px solid #e53935',
            }}
          >
            <span className={styles.balanceFinal}>
              € {balanceFinal.toFixed(2)}
            </span>
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
