"use client";
import { useEffect, useState } from "react";
import { db } from "../../firebase-config";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

export default function GanadoraPage() {
  const [ganadora, setGanadora] = useState<any>(null);

  useEffect(() => {
    const cargarGanadora = async () => {
      const q = query(collection(db, "combinadas"), orderBy("cuota", "desc"), limit(1));
      const snapshot = await getDocs(q);
      setGanadora(snapshot.docs[0]?.data() || null);
    };
    cargarGanadora();
  }, []);

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-yellow-700">Combinada Ganadora Premium</h1>
      {ganadora ? (
        <div className="bg-white p-6 rounded shadow">
          <div className="font-bold text-lg mb-2">{ganadora.nombre}</div>
          <div>Cuota: <span className="font-semibold">{ganadora.cuota}</span></div>
          <div>Equipos: <span>{Array.isArray(ganadora.equipos) ? ganadora.equipos.join(", ") : ganadora.equipos}</span></div>
          <div className="text-xs text-gray-500">Creada: {ganadora.fecha}</div>
        </div>
      ) : (
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-8">No hay combinada ganadora disponible.</div>
      )}
    </div>
  );
}
