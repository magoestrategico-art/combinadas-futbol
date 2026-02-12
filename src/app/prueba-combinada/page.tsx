"use client";

import { useState } from "react";

export default function PruebaCombinada() {
  const [jornadas, setJornadas] = useState([
    { id: 1, ganados: 5, perdidos: 0, pendientes: 0, estado: "GANADA" },
    { id: 2, ganados: 4, perdidos: 1, pendientes: 0, estado: "PERDIDA" },
    { id: 3, ganados: 3, perdidos: 2, pendientes: 0, estado: "PERDIDA" },
    { id: 4, ganados: 5, perdidos: 0, pendientes: 0, estado: "GANADA" },
  ]);

  const [equipos, setEquipos] = useState([
    { equipo: "LAS PALMAS", apuesta: "Empate o Gana", liga: "2 DIVISION ESPAÑA", estado: "acertado" },
    { equipo: "Andorra", apuesta: "+1,5 GOLES", liga: "2 DIVISION ESPAÑA", estado: "pendiente" },
    { equipo: "Zaragoza", apuesta: "Empata o pierde", liga: "CHINESE SUPER LEAGUE", estado: "fallado" },
    { equipo: "Leganes", apuesta: "-3,5 GOLES", liga: "2 DIVISION ESPAÑA", estado: "acertado" },
    { equipo: "Deportivo de la Coruña", apuesta: "+1,5 GOLES", liga: "2 DIVISION ESPAÑA", estado: "pendiente" },
  ]);

  // Agregar registros para depurar el estado de los equipos
  console.log("Estado inicial de equipos:", equipos);

  const cambiarEstadoPartido = (index: number, nuevoEstado: string) => {
    const nuevosEquipos = [...equipos];
    nuevosEquipos[index].estado = nuevoEstado;
    setEquipos(nuevosEquipos);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Encabezado */}
      <div className="bg-blue-900 text-white p-4 rounded-lg mb-4">
        <button className="text-sm text-white underline">&larr; Volver al Historial</button>
        <h1 className="text-2xl font-bold">Combinada Clásica - J1</h1>
        <p>2024/25 &bull; Creada en Jornada 1 &bull; ⚽ 5 equipos</p>
        <div className="grid grid-cols-5 gap-4 mt-4">
          <div className="text-center">
            <p className="text-lg font-bold">15</p>
            <p>Jornadas Jugadas</p>
          </div>
          <div className="text-center text-green-500">
            <p className="text-lg font-bold">7</p>
            <p>Ganadas</p>
          </div>
          <div className="text-center text-red-500">
            <p className="text-lg font-bold">7</p>
            <p>Perdidas</p>
          </div>
          <div className="text-center text-purple-500">
            <p className="text-lg font-bold">47%</p>
            <p>% Éxito</p>
          </div>
          <div className="text-center text-orange-500">
            <p className="text-lg font-bold">3</p>
            <p>Mejor Racha</p>
          </div>
        </div>
      </div>

      {/* Timeline de Jornadas */}
      <div className="bg-white p-4 rounded-lg mb-4">
        <h2 className="text-lg font-bold">Timeline de Jornadas</h2>
        <p className="text-sm text-gray-500">Tip: Haz clic en una jornada para activarla y poder marcar los partidos como acertados/fallados.</p>
        <div className="grid grid-cols-6 gap-2 mt-4">
          {jornadas.map((jornada) => (
            <div
              key={jornada.id}
              className={`p-2 rounded-lg text-center ${jornada.estado === "GANADA" ? "bg-green-200" : "bg-red-200"}`}
            >
              <p>Jornada {jornada.id}</p>
              <p>✔️ {jornada.ganados}</p>
              <p>❌ {jornada.perdidos}</p>
              <p>⏳ {jornada.pendientes}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Equipos y Pronósticos */}
      <div className="bg-white p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Equipos y Pronósticos de esta Combinada</h2>
          <button className="bg-blue-500 text-white px-4 py-2 rounded">Editar</button>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {equipos.map((equipo, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <h3 className="text-lg font-bold">{equipo.equipo} - {equipo.apuesta}</h3>
              <p className="text-sm text-gray-500">{equipo.liga}</p>
              <div className="flex justify-between mt-2">
                <button
                  className={`px-2 py-1 rounded ${equipo.estado === "acertado" ? "bg-green-500 text-white" : "bg-gray-200"}`}
                  onClick={() => cambiarEstadoPartido(index, "acertado")}
                >✔️</button>
                <button
                  className={`px-2 py-1 rounded ${equipo.estado === "fallado" ? "bg-red-500 text-white" : "bg-gray-200"}`}
                  onClick={() => cambiarEstadoPartido(index, "fallado")}
                >❌</button>
                <button
                  className={`px-2 py-1 rounded ${equipo.estado === "pendiente" ? "bg-yellow-500 text-white" : "bg-gray-200"}`}
                  onClick={() => cambiarEstadoPartido(index, "pendiente")}
                >⏳</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controles Admin */}
      <div className="bg-white p-4 rounded-lg">
        <h2 className="text-lg font-bold">Controles Admin</h2>
        <div className="flex items-center gap-4 mt-4">
          <input type="number" placeholder="Número de Jornada" className="border p-2 rounded" />
          <input type="number" placeholder="Acertados" className="border p-2 rounded" />
          <input type="number" placeholder="Fallados" className="border p-2 rounded" />
          <button className="bg-gray-500 text-white px-4 py-2 rounded">Guardar Jornada</button>
        </div>
        <button className="bg-red-500 text-white px-4 py-2 rounded mt-4">Eliminar Combinada Completa</button>
      </div>
    </div>
  );
}