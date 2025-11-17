"use client";
import { useState, useEffect } from "react";
import { auth } from "../../firebase-config";
import { useRouter } from "next/navigation";
import { db } from "../../firebase-config";
import { addDoc, collection } from "firebase/firestore";


type Pick = {
  liga: string;
  criterio: string;
};

type Resultado = {
  liga: string;
  criterio: string;
  nombre: string;
  apuesta: string;
  cuota: number;
  justificacion: string;
};

const ligas = [
  { nombre: "La Liga", id: 2014 },
  { nombre: "Premier League", id: 2021 },
  { nombre: "Serie A", id: 2019 },
  { nombre: "Bundesliga", id: 2002 },
  { nombre: "Ligue 1", id: 2015 },
  { nombre: "Segunda División", id: 2016 }, // id único
];
const criterios = [
  { label: "+1,5 goles", value: "OVER_1_5" },
  { label: "-3,5 goles", value: "UNDER_3_5" },
  { label: "Ganador", value: "GANADOR" },
  { label: "Perdedor", value: "PERDEDOR" },
  { label: "Empate", value: "EMPATE" },
];


export default function CombinadaNuevaPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [nombreCombinada, setNombreCombinada] = useState<string>("");
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const guardarCombinada = async () => {
    if (!resultado || !nombreCombinada.trim() || !user) return;
    try {
      const equipos = resultado.map(r => r.nombre);
      await addDoc(collection(db, "combinadas"), {
        nombre: nombreCombinada.trim(),
        cuota: "", // Puedes calcular la cuota total si lo deseas
        partidos: equipos.map(nombre => ({ nombre, estado: "pendiente" })),
        usuarioId: user.uid,
        fecha: new Date().toLocaleString(),
        personalizada: true,
        picks: resultado
      });
      router.push("/combinadas");
    } catch (error) {
      alert("Error al guardar la combinada en Firebase");
      console.error(error);
    }
  };
  const [picks, setPicks] = useState<Pick[]>([
    { liga: "", criterio: "" },
    { liga: "", criterio: "" },
    { liga: "", criterio: "" },
    { liga: "", criterio: "" },
    { liga: "", criterio: "" },
  ]);
  const [resultado, setResultado] = useState<Resultado[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (i: number, campo: keyof Pick, valor: string) => {
    const nueva = [...picks];
    nueva[i][campo] = valor;
    setPicks(nueva);
  };

  const generar = async () => {
    setLoading(true);
    setError(null);
    setResultado(null);
    try {
      const response = await fetch("/api/generar-combinada-personalizada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks }),
      });
      const data = await response.json();
      if (data.success) {
        setResultado(data.data);
      } else {
        setError(data.error || "Error al generar combinada");
      }
    } catch (e) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  console.log("resultado:", resultado);
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-yellow-300 to-pink-200 py-10">
      <div className="w-full flex justify-start mb-4 max-w-2xl">
        <a href="/" className="bg-fuchsia-200 hover:bg-fuchsia-300 text-fuchsia-900 px-5 py-2 rounded-lg font-semibold shadow transition border border-fuchsia-400">← Volver a la página principal</a>
      </div>
      <h1 className="text-3xl font-bold mb-6 text-fuchsia-700">Combinada Personalizada (NUEVA)</h1>
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl border-2 border-fuchsia-400 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {picks.map((pick: Pick, i: number) => (
            <div key={i} className="bg-fuchsia-50 rounded-xl p-4 border border-fuchsia-200">
              <div className="mb-2 font-bold text-fuchsia-700">Pick {i + 1}</div>
              <select
                className="w-full mb-2 p-2 rounded border"
                value={pick.liga}
                onChange={e => handleChange(i, "liga", e.target.value)}
              >
                <option value="">Elige liga</option>
                {ligas.map(l => (
                  <option key={`liga-${i}-${l.id}`} value={l.id}>{l.nombre}</option>
                ))}
              </select>
              <select
                className="w-full p-2 rounded border"
                value={pick.criterio}
                onChange={e => handleChange(i, "criterio", e.target.value)}
              >
                <option value="">Elige criterio</option>
                {criterios.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
          <button
            onClick={generar}
            className="bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:from-fuchsia-600 hover:to-pink-700 transition transform hover:scale-105"
            disabled={loading}
          >
            {loading ? "Generando..." : "Generar combinada personalizada"}
          </button>
          {resultado && (
            <>
              <input
                type="text"
                className="border rounded px-3 py-2 w-full max-w-xs text-center"
                placeholder="Nombre de la combinada"
                value={nombreCombinada}
                onChange={e => setNombreCombinada(e.target.value)}
              />
              <button
                onClick={guardarCombinada}
                className={`bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition ${!nombreCombinada.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!nombreCombinada.trim()}
              >
                Guardar combinada
              </button>
            </>
          )}
        </div>
        {error && (
          <div className="text-center text-red-600 font-bold mt-4">{error}</div>
        )}
        {resultado && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2 text-fuchsia-700">Resultado:</h3>
            <ul className="space-y-2">
              {resultado.map((pick, i) => (
                <li key={i} className="bg-fuchsia-100 rounded p-3 border border-fuchsia-300">
                  <div><span className="font-bold">Liga:</span> {pick.liga}</div>
                  <div><span className="font-bold">Criterio:</span> {pick.criterio}</div>
                  <div><span className="font-bold">Equipo:</span> {pick.nombre}</div>
                  <div><span className="font-bold">Apuesta:</span> {pick.apuesta}</div>
                  <div><span className="font-bold">Cuota:</span> {pick.cuota?.toFixed ? pick.cuota.toFixed(2) : pick.cuota}</div>
                  <div><span className="font-bold">Justificación:</span> {pick.justificacion}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
