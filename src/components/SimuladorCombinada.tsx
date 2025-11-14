import React, { useState } from "react";
import styles from "../app/simulador/Simulador.module.css";

interface SimuladorCombinadaProps {
  partidos: number;
  resultados: string[];
  cuota: number;
  objetivo: number;
}

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

export default function SimuladorCombinada({ partidos, resultados, cuota, objetivo }: SimuladorCombinadaProps) {
  const [apuestaInicial, setApuestaInicial] = useState(1);
  const [cuotaSim, setCuotaSim] = useState(cuota);
  const [objetivoSim, setObjetivoSim] = useState(objetivo);
  const [resultadosSim, setResultadosSim] = useState(resultados);

  const progresion = Array.isArray(resultadosSim) && resultadosSim.length === partidos
    ? calcularProgresion(apuestaInicial, cuotaSim, objetivoSim, resultadosSim)
    : [];
  const balanceFinal = progresion.length > 0 ? progresion[progresion.length - 1].balance : 0;

  return (
    <div className={styles.simuladorContainer + " mt-8"}>
      <h2 className="text-xl font-bold text-fuchsia-700 mb-4">🎲 Simulador de Combinada</h2>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div>
          <label className="font-semibold text-gray-700">Apuesta inicial (€):</label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={apuestaInicial}
            onChange={e => setApuestaInicial(Number(e.target.value))}
            className="border rounded px-3 py-2 w-32 text-center font-bold text-fuchsia-700 ml-2"
          />
        </div>
        <div>
          <label className="font-semibold text-gray-700">Cuota:</label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={cuotaSim}
            onChange={e => setCuotaSim(Number(e.target.value))}
            className="border rounded px-3 py-2 w-24 text-center font-bold text-fuchsia-700 ml-2"
          />
        </div>
        <div>
          <label className="font-semibold text-gray-700">Objetivo (€):</label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={objetivoSim}
            onChange={e => setObjetivoSim(Number(e.target.value))}
            className="border rounded px-3 py-2 w-24 text-center font-bold text-fuchsia-700 ml-2"
          />
        </div>
        <div>
          <span className="font-semibold text-gray-700">Balance final:</span>
          <span className="ml-2 font-bold text-green-700">{balanceFinal.toFixed(2)} €</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr>
              <th className="px-3 py-2">Jornada</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Cuota</th>
              <th className="px-3 py-2">Ganancia/Pérdida</th>
              <th className="px-3 py-2">Balance</th>
            </tr>
          </thead>
          <tbody>
            {progresion.map((p, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2 text-center">{p.partido}</td>
                <td className="px-3 py-2 text-center">
                  <select
                    value={resultadosSim[idx]}
                    onChange={e => {
                      const nuevos = [...resultadosSim];
                      nuevos[idx] = e.target.value;
                      setResultadosSim(nuevos);
                    }}
                    className="border rounded px-2 py-1 text-center font-bold"
                  >
                    {opciones.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-center">{p.cuota}</td>
                <td className="px-3 py-2 text-center font-bold">
                  {p.ganancia >= 0 ? `+${p.ganancia.toFixed(2)} €` : `${p.ganancia.toFixed(2)} €`}
                </td>
                <td className="px-3 py-2 text-center">{p.balance.toFixed(2)} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
