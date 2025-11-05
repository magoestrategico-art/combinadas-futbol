"use client";
import React, { useState } from "react";
import styles from "./Simulador.module.css";

const PARTIDOS = 10;
const opciones = [
  { value: "fallo", label: "Fallo", icon: "✗", color: "#e53935" },
  { value: "acierto", label: "Acierto", icon: "✓", color: "#388e3c" },
];

function generarResultadosAleatorios() {
  let arr = Array(PARTIDOS).fill("fallo");
  let aciertoIdx = Math.floor(Math.random() * PARTIDOS);
  arr[aciertoIdx] = "acierto";
  for (let i = 0; i < PARTIDOS; i++) {
    if (i !== aciertoIdx && Math.random() > 0.8) arr[i] = "acierto";
  }
  return arr;
}

function calcularProgresion(
  apuestaInicial: number,
  cuota: number,
  objetivo: number,
  resultados: string[]
) {
  let progresion = [];
  let perdidaARecuperar = 0;
  let balance = 0;
  for (let i = 0; i < PARTIDOS; i++) {
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

export default function SimuladorPage() {
  const [apuestaInicial, setApuestaInicial] = useState(1);
  const [cuota, setCuota] = useState(4);
  const [objetivo, setObjetivo] = useState(3);
  const [resultados, setResultados] = useState(generarResultadosAleatorios());
  const progresion = Array.isArray(resultados) && resultados.length === PARTIDOS
    ? calcularProgresion(apuestaInicial, cuota, objetivo, resultados)
    : [];
  const balanceFinal = progresion.length > 0 ? progresion[progresion.length - 1].balance : 0;

  function simularAleatorio() {
    setResultados(generarResultadosAleatorios());
  }

  function handleResultado(idx: number, value: string) {
    setResultados((prev) => prev.map((r, i) => (i === idx ? value : r)));
  }

  return (
    <div className={styles.container}>
      <div className={styles.simuladorBox}>
        <div className={styles.headerNav}>
          <a href="/" className={styles.headerBtn}>
            🏠 Volver a la web principal
          </a>
        </div>
        <h1 className={styles.titulo}>Simulador de Estrategia de Apuestas</h1>
        <div className={styles.subtitulo}>
          Escenario Extremo: 9 Fallos + 1 Acierto Final
        </div>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <a href="/combinadas" className={styles.combinadasBtn}>
            🧮 Ir a Combinadas
          </a>
        </div>
        <div className={styles.infoBox}>
          <b>¿Cómo funciona esta estrategia?</b><br />
          <b>Escenario Extremo:</b> Esta simulación muestra el peor caso posible: 9 fallos consecutivos y 1 acierto final. Verás cómo la estrategia de recuperación ajusta las apuestas para mantener ganancia positiva incluso en este escenario tan adverso. Cada fallo aumenta la próxima apuesta para recuperar todas las pérdidas + ganancia objetivo.
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
          <form className={styles.form} onSubmit={e => { e.preventDefault(); simularAleatorio(); }} style={{ flex: '1 1 400px', display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 0 }}>
            <div className={styles.inputGroup}>
              <label>Apuesta Inicial (€)</label><br />
              <input type="number" min={0.01} step={0.01} value={apuestaInicial} onChange={e => setApuestaInicial(Number(e.target.value))} />
            </div>
            <div className={styles.inputGroup}>
              <label>Cuota Promedio</label><br />
              <input type="number" min={1.01} step={0.01} value={cuota} onChange={e => setCuota(Number(e.target.value))} />
            </div>
            <div className={styles.inputGroup}>
              <label>Ganancia Objetivo (€)</label><br />
              <input type="number" min={0.01} step={0.01} value={objetivo} onChange={e => setObjetivo(Number(e.target.value))} />
            </div>
            <button type="submit" className={styles.simularBtn} style={{ background: "linear-gradient(90deg,#23407a,#3b6cb7)", boxShadow: "0 4px 16px #23407a22", minWidth: 240, minHeight: 48, fontSize: 20, fontWeight: 700 }}>
              🎲 Simular Estrategia
            </button>
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
                  <td>€ {r.apuesta.toFixed(2)}</td>
                  <td>{r.cuota.toFixed(2)}</td>
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
                  <td className={r.ganancia < 0 ? styles.gananciaNegativa : styles.gananciaPositiva}>
                    {r.ganancia < 0 ? `€ ${r.ganancia.toFixed(2)}` : `+€ ${r.ganancia.toFixed(2)}`}
                  </td>
                  <td className={r.balance < 0 ? styles.gananciaNegativa : styles.gananciaPositiva}>
                    {r.balance < 0 ? `€ ${r.balance.toFixed(2)}` : `€ ${r.balance.toFixed(2)}`}
                  </td>
                  <td className={styles.gananciaNegativa}>
                    {r.perdidaARecuperar > 0 ? `€ ${r.perdidaARecuperar.toFixed(2)}` : '€ 0.00'}
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
