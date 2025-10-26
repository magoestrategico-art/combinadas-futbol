"use client";
import { useState } from "react";

export default function SimuladorPage() {
  const [cuota, setCuota] = useState("");
  const [apuesta, setApuesta] = useState("");
  const [ganancia, setGanancia] = useState<string | null>(null);

  const calcularGanancia = (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseFloat(cuota);
    const a = parseFloat(apuesta);
    if (isNaN(c) || isNaN(a) || c <= 0 || a <= 0) {
      setGanancia("Valores inválidos");
      return;
    }
    setGanancia((c * a).toFixed(2));
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Simulador de Apuestas</h1>
      <form onSubmit={calcularGanancia} className="bg-white p-6 rounded shadow mb-8">
        <input
          type="number"
          step="0.01"
          placeholder="Cuota total"
          value={cuota}
          onChange={e => setCuota(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Cantidad apostada (€)"
          value={apuesta}
          onChange={e => setApuesta(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          required
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold">Calcular Ganancia</button>
      </form>
      {ganancia !== null && (
        <div className="bg-blue-50 p-4 rounded text-lg font-semibold text-blue-800 text-center">
          Ganancia potencial: {isNaN(Number(ganancia)) ? ganancia : `${ganancia} €`}
        </div>
      )}
    </div>
  );
}
