"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../firebase-config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface Partido {
  equipo: string;
  liga: string;
  descripcion: string;
  dia: string;
  fecha: string;
  hora: string;
  apuesta: string;
  cuota: string;
  estado: string;
}

export default function GanadoraPage() {
  const CREATOR_UID = "hDkn8W38nVZKQD1piviUrmwvHtt2";
  const [isCreator, setIsCreator] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const router = useRouter();

  const defaultPartidos: Partido[] = [
    {
      equipo: "Real Madrid",
      liga: "LA LIGA",
      descripcion: "Los Blancos",
      dia: "Sábado",
      fecha: "10/11/2025",
      hora: "16:00",
      apuesta: "Más de 2,5 GOLES",
      cuota: "1.85",
      estado: "pendiente"
    },
    {
      equipo: "Barcelona",
      liga: "LA LIGA",
      descripcion: "Barça",
      dia: "Sábado",
      fecha: "10/11/2025",
      hora: "18:30",
      apuesta: "Ambas marcan",
      cuota: "1.90",
      estado: "pendiente"
    },
    {
      equipo: "Atletico Madrid",
      liga: "LA LIGA",
      descripcion: "Colchoneros",
      dia: "Domingo",
      fecha: "11/11/2025",
      hora: "14:00",
      apuesta: "Victoria local",
      cuota: "1.75",
      estado: "pendiente"
    },
    {
      equipo: "Manchester City",
      liga: "PREMIER LEAGUE",
      descripcion: "Citizens",
      dia: "Domingo",
      fecha: "11/11/2025",
      hora: "17:00",
      apuesta: "Más de 3,5 GOLES",
      cuota: "2.00",
      estado: "pendiente"
    },
    {
      equipo: "Bayern Munich",
      liga: "BUNDESLIGA",
      descripcion: "Baviera",
      dia: "Domingo",
      fecha: "11/11/2025",
      hora: "19:30",
      apuesta: "Menos de 4,5 GOLES",
      cuota: "1.80",
      estado: "pendiente"
    }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.uid === CREATOR_UID) {
        setIsCreator(true);
      }
      cargarPartidos();
    });
    return () => unsubscribe();
  }, []);

  const cargarPartidos = async () => {
    try {
      const docRef = doc(db, "config", "partidosGanadora");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPartidos(docSnap.data().partidos || defaultPartidos);
      } else {
        setPartidos(defaultPartidos);
      }
    } catch (error) {
      console.error("Error al cargar partidos:", error);
      setPartidos(defaultPartidos);
    } finally {
      setLoading(false);
    }
  };

  const actualizarPartido = (index: number, campo: keyof Partido, valor: string) => {
    const nuevosPartidos = [...partidos];
    nuevosPartidos[index] = { ...nuevosPartidos[index], [campo]: valor };
    setPartidos(nuevosPartidos);
  };

  const calcularCuotaTotal = () => {
    return partidos.reduce((total, p) => total * parseFloat(p.cuota || "1"), 1).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#ffd700' }}>
        <div className="text-2xl font-bold text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start" style={{ background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)', minHeight: '100vh', padding: '48px 20px 56px 20px', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div className="w-full max-w-4xl mb-6 flex justify-between items-center">
        <button
          onClick={() => router.push("/")}
          className="bg-white/90 text-yellow-700 px-4 py-2 rounded-lg font-semibold hover:bg-white transition shadow"
        >
          ← Volver
        </button>
        {isCreator && (
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 rounded-lg font-semibold shadow transition ${
              editMode ? "bg-red-500 text-white hover:bg-red-600" : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {editMode ? "❌ Cancelar" : "✏️ Editar"}
          </button>
        )}
      </div>

      {/* Card Principal */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl border-4 border-yellow-600">
        
        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-yellow-700 mb-2">🏆 COMBINADA GANADORA PREMIUM</h1>
          <p className="text-gray-600 font-semibold">5 Partidos Seleccionados</p>
          <div className="mt-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-6 py-3 rounded-full inline-block font-black text-2xl shadow-lg">
            Cuota Total: {calcularCuotaTotal()}
          </div>
        </div>

        {/* Lista de Partidos */}
        <div className="space-y-4">
          {partidos.map((partido, index) => (
            <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-5 border-2 border-yellow-300 shadow-md hover:shadow-lg transition">
              {editMode ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={partido.equipo}
                      onChange={(e) => actualizarPartido(index, "equipo", e.target.value)}
                      className="border-2 border-gray-300 rounded px-3 py-2 font-bold"
                      placeholder="Equipo"
                    />
                    <input
                      type="text"
                      value={partido.liga}
                      onChange={(e) => actualizarPartido(index, "liga", e.target.value)}
                      className="border-2 border-gray-300 rounded px-3 py-2"
                      placeholder="Liga"
                    />
                  </div>
                  <input
                    type="text"
                    value={partido.descripcion}
                    onChange={(e) => actualizarPartido(index, "descripcion", e.target.value)}
                    className="w-full border-2 border-gray-300 rounded px-3 py-2"
                    placeholder="Descripción"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={partido.dia}
                      onChange={(e) => actualizarPartido(index, "dia", e.target.value)}
                      className="border-2 border-gray-300 rounded px-3 py-2"
                      placeholder="Día"
                    />
                    <input
                      type="text"
                      value={partido.fecha}
                      onChange={(e) => actualizarPartido(index, "fecha", e.target.value)}
                      className="border-2 border-gray-300 rounded px-3 py-2"
                      placeholder="dd/mm/yyyy"
                    />
                    <input
                      type="text"
                      value={partido.hora}
                      onChange={(e) => actualizarPartido(index, "hora", e.target.value)}
                      className="border-2 border-gray-300 rounded px-3 py-2"
                      placeholder="HH:MM"
                    />
                    <input
                      type="text"
                      value={partido.cuota}
                      onChange={(e) => actualizarPartido(index, "cuota", e.target.value)}
                      className="border-2 border-gray-300 rounded px-3 py-2"
                      placeholder="Cuota"
                    />
                  </div>
                  <input
                    type="text"
                    value={partido.apuesta}
                    onChange={(e) => actualizarPartido(index, "apuesta", e.target.value)}
                    className="w-full border-2 border-gray-300 rounded px-3 py-2 font-semibold"
                    placeholder="Tipo de apuesta"
                  />
                  <select
                    value={partido.estado}
                    onChange={(e) => actualizarPartido(index, "estado", e.target.value)}
                    className="w-full border-2 border-gray-300 rounded px-3 py-2"
                  >
                    <option value="pendiente">⏳ Pendiente</option>
                    <option value="acertado">✅ Acertado</option>
                    <option value="fallado">❌ Fallado</option>
                  </select>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-black text-xl text-yellow-800">{partido.equipo}</div>
                      <div className="text-xs text-gray-600 font-semibold">{partido.liga}</div>
                      <div className="text-sm text-gray-700 italic">{partido.descripcion}</div>
                    </div>
                    <div className="text-right">
                      <div className="bg-yellow-600 text-white px-3 py-1 rounded-full font-black text-lg">
                        {partido.cuota}
                      </div>
                      <div className={`mt-1 text-lg ${
                        partido.estado === 'acertado' ? 'text-green-600' :
                        partido.estado === 'fallado' ? 'text-red-600' :
                        'text-gray-500'
                      }`}>
                        {partido.estado === 'acertado' ? '✅' :
                         partido.estado === 'fallado' ? '❌' : '⏳'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 bg-white rounded-lg p-3 border border-yellow-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">📅 {partido.dia}, {partido.fecha}</span>
                      <span className="text-gray-600">🕐 {partido.hora}</span>
                    </div>
                    <div className="mt-2 font-bold text-yellow-700 text-center">
                      {partido.apuesta}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Botones de Admin */}
        {isCreator && editMode && (
          <div className="mt-8 flex gap-4 justify-center">
            <button
              onClick={async () => {
                setSaveStatus(null);
                try {
                  // Ordenar por fecha y hora antes de guardar
                  const partidosOrdenados = [...partidos].sort((a, b) => {
                    const convertirFecha = (fecha: string) => {
                      const partes = fecha.split('/');
                      if (partes.length === 3) {
                        return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
                      }
                      return fecha;
                    };
                    
                    const fechaA = new Date(convertirFecha(a.fecha) + 'T' + a.hora.padStart(5, '0'));
                    const fechaB = new Date(convertirFecha(b.fecha) + 'T' + b.hora.padStart(5, '0'));
                    return fechaA.getTime() - fechaB.getTime();
                  });
                  await setDoc(doc(db, "config", "partidosGanadora"), { partidos: partidosOrdenados });
                  setPartidos(partidosOrdenados);
                  setSaveStatus("Guardado correctamente");
                  setEditMode(false);
                } catch (err) {
                  setSaveStatus("Error al guardar");
                  console.error("Error al guardar:", err);
                }
              }}
              className="bg-green-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-green-600 transition"
            >
              💾 Guardar Cambios
            </button>
          </div>
        )}

        {saveStatus && (
          <div className={`mt-4 text-center font-semibold ${saveStatus.includes("Error") ? "text-red-600" : "text-green-600"}`}>
            {saveStatus}
          </div>
        )}
      </div>
    </div>
  );
}
