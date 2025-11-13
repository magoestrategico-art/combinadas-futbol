"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../firebase-config";
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";
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

interface PartidoSelect {
  equipoLocal: string;
  equipoVisitante: string;
  fecha: string;
  liga: string;
  criterio: string;
  seleccion: string;
  cuota: number;
  justificacion: string;
}

interface EquipoGanadora {
  nombre: string;
  liga: string;
  criterio: string;
  apuesta: string;
  cuota: number;
  justificacion: string;
}

interface CombinadaSelectData {
  nombre: string;
  fecha: string;
  picks: PartidoSelect[];
  cuotaTotal: number;
  numPicks: number;
}

interface CombinadaGanadoraData {
  nombre: string;
  fecha: string;
  picks: EquipoGanadora[];
  cuotaTotal: number;
  numPicks: number;
}

export default function GanadoraPage() {
  const CREATOR_UID = "hDkn8W38nVZKQD1piviUrmwvHtt2";
  const [isCreator, setIsCreator] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saveHistorialStatus, setSaveHistorialStatus] = useState<string | null>(null);
  const [combinadaSelect, setCombinadaSelect] = useState<CombinadaSelectData | null>(null);
  const [loadingSelect, setLoadingSelect] = useState(false);
  const [errorSelect, setErrorSelect] = useState<string | null>(null);
  const [combinadaGanadora, setCombinadaGanadora] = useState<CombinadaGanadoraData | null>(null);
  const [loadingGanadora, setLoadingGanadora] = useState(false);
  const [errorGanadora, setErrorGanadora] = useState<string | null>(null);
  // --- Estados para combinada personalizada ---
  const [personalizada, setPersonalizada] = useState([
    { liga: "", criterio: "" },
    { liga: "", criterio: "" },
    { liga: "", criterio: "" },
    { liga: "", criterio: "" },
    { liga: "", criterio: "" },
  ]);
  const [resultadoPersonalizada, setResultadoPersonalizada] = useState<any>(null);
  const [loadingPersonalizada, setLoadingPersonalizada] = useState(false);
  const [errorPersonalizada, setErrorPersonalizada] = useState<string | null>(null);
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

  const generarCombinadaAutomatica = async () => {
    setLoadingSelect(true);
    setErrorSelect(null);
    try {
      const response = await fetch('/api/generar-combinada-select');
      const data = await response.json();
      
      if (data.success) {
        setCombinadaSelect(data.data);
      } else {
        setErrorSelect(data.error || 'Error al generar combinada');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorSelect('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoadingSelect(false);
    }
  };

  const generarCombinadaGanadoraAuto = async () => {
    setLoadingGanadora(true);
    setErrorGanadora(null);
    try {
      const response = await fetch('/api/generar-combinada-ganadora');
      const data = await response.json();
      
      if (data.success) {
        setCombinadaGanadora(data.data);
      } else {
        setErrorGanadora(data.error || 'Error al generar combinada');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorGanadora('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoadingGanadora(false);
    }
  };

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

  const guardarAlHistorial = async () => {
    setSaveHistorialStatus(null);
    try {
      await addDoc(collection(db, "historialCombinadas"), {
        tipo: "ganadora",
        nombre: "Combinada Ganadora Premium",
        fechaGuardado: new Date().toISOString(),
        partidos: partidos
      });
      setSaveHistorialStatus("✅ Guardada en el historial correctamente");
      setTimeout(() => setSaveHistorialStatus(null), 3000);
    } catch (error) {
      console.error("Error al guardar en historial:", error);
      setSaveHistorialStatus("❌ Error al guardar en historial");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#ffd700' }}>
        <div className="text-2xl font-bold text-white">Cargando...</div>
      </div>
    );
  }

  // --- Formulario de combinada personalizada ---
  const ligasDisponibles = [
    { nombre: "La Liga", id: 2014 },
    { nombre: "Premier League", id: 2021 },
    { nombre: "Serie A", id: 2019 },
    { nombre: "Bundesliga", id: 2002 },
    { nombre: "Ligue 1", id: 2015 },
    { nombre: "Segunda División", id: 2015 },
  ];
  const criteriosDisponibles = [
    { label: "+1,5 goles", value: "OVER_1_5" },
    { label: "-3,5 goles", value: "UNDER_3_5" },
    { label: "Ganador", value: "GANADOR" },
    { label: "Perdedor", value: "PERDEDOR" },
    { label: "Empate", value: "EMPATE" },
  ];
  // ...

  const handlePersonalizadaChange = (i: number, campo: 'liga' | 'criterio', valor: string) => {
    const nueva = [...personalizada];
    nueva[i][campo] = valor;
    setPersonalizada(nueva);
  };

  const generarCombinadaPersonalizada = async () => {
    setLoadingPersonalizada(true);
    setErrorPersonalizada(null);
    setResultadoPersonalizada(null);
    try {
      const response = await fetch('/api/generar-combinada-personalizada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ picks: personalizada })
      });
      const data = await response.json();
      if (data.success) {
        setResultadoPersonalizada({ picks: data.data });
      } else {
        setErrorPersonalizada(data.error || 'Error al generar combinada personalizada');
      }
    } catch (e) {
      setErrorPersonalizada('Error generando combinada personalizada');
    } finally {
      setLoadingPersonalizada(false);
    }
  };

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

      {/* Formulario de combinada personalizada */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl border-4 border-fuchsia-600 mb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-fuchsia-700 mb-2">🎯 COMBINADA PERSONALIZADA</h2>
          <p className="text-gray-600 font-semibold">Elige hasta 5 ligas y criterios, y genera tu propia combinada con datos de la temporada 2025-2026</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {personalizada.map((pick: { liga: string; criterio: string }, i: number) => (
            <div key={i} className="bg-fuchsia-50 rounded-xl p-4 border-2 border-fuchsia-200">
              <div className="mb-2 font-bold text-fuchsia-700">Pick {i + 1}</div>
              <select
                className="w-full mb-2 p-2 rounded border"
                value={pick.liga}
                onChange={e => handlePersonalizadaChange(i, "liga", e.target.value)}
              >
                <option value="">Elige liga</option>
                {ligasDisponibles.map((l, idx) => (
                  <option key={l.id + '-' + idx} value={l.id}>{l.nombre}</option>
                ))}
              </select>
              <select
                className="w-full p-2 rounded border"
                value={pick.criterio}
                onChange={e => handlePersonalizadaChange(i, "criterio", e.target.value)}
              >
                <option value="">Elige criterio</option>
                {criteriosDisponibles.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="text-center">
          <button
            onClick={generarCombinadaPersonalizada}
            className="bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:from-fuchsia-600 hover:to-pink-700 transition transform hover:scale-105"
            disabled={loadingPersonalizada}
          >
            {loadingPersonalizada ? "Generando..." : "Generar combinada personalizada"}
          </button>
        </div>
        {errorPersonalizada && (
          <div className="text-center text-red-600 font-bold mt-4">{errorPersonalizada}</div>
        )}
        {resultadoPersonalizada && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2 text-fuchsia-700">Resultado:</h3>
            <ul className="space-y-2">
              {resultadoPersonalizada.picks.map((pick: any, i: number) => (
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
