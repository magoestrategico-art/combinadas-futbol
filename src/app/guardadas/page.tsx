"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebase-config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

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

interface CombinadaGuardada {
  id: string;
  tipo: string;
  nombre: string;
  fechaGuardado: string;
  partidos: Partido[];
}

export default function GuardadasPage() {
  const [combinadas, setCombinadas] = useState<CombinadaGuardada[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    cargarCombinadas();
  }, []);

  const cargarCombinadas = async () => {
    try {
      const q = query(collection(db, "historialCombinadas"), orderBy("fechaGuardado", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CombinadaGuardada[];
      setCombinadas(data);
    } catch (error) {
      console.error("Error al cargar combinadas:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandir = (id: string) => {
    setExpandidas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "premium": return "text-purple-700 bg-purple-100 border-purple-300";
      case "clasica": return "text-green-700 bg-green-100 border-green-300";
      case "select": return "text-orange-700 bg-orange-100 border-orange-300";
      default: return "text-blue-700 bg-blue-100 border-blue-300";
    }
  };

  const getTipoNombre = (tipo: string) => {
    switch (tipo) {
      case "premium": return "Premium";
      case "clasica": return "Clásica";
      case "select": return "Select";
      default: return tipo;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start" style={{ background: '#23407a', minHeight: '100vh', padding: '48px 20px 56px 20px', boxSizing: 'border-box' }}>
      {/* Botón volver */}
      <div className="w-full max-w-6xl flex justify-start mb-6">
        <button
          onClick={() => router.push("/")}
          className="bg-blue-700 text-white rounded-full px-6 py-2 font-semibold shadow hover:bg-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Volver a la página principal"
        >
          Volver a la página principal
        </button>
      </div>

      {/* Título */}
      <h1 className="text-5xl font-extrabold mb-4 text-white drop-shadow-lg tracking-tight" style={{textShadow:'0 4px 16px #2a5298'}}>
        Historial de Combinadas
      </h1>
      <p className="text-lg text-blue-100 mb-8 font-semibold text-center">
        Revisa todas las combinadas guardadas con su histórico de resultados
      </p>

      {/* Contenido */}
      <div className="w-full max-w-6xl">
        {loading ? (
          <div className="text-center text-white text-xl">Cargando...</div>
        ) : combinadas.length === 0 ? (
          <div className="bg-yellow-100 text-yellow-800 p-6 rounded-2xl text-center font-semibold text-lg shadow-lg">
            No hay combinadas guardadas en el historial todavía.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {combinadas.map(comb => {
              const isExpanded = expandidas.has(comb.id);
              return (
              <div key={comb.id} className="bg-white/95 rounded-2xl shadow-2xl border-2 border-blue-200 overflow-hidden">
                {/* Header clickeable */}
                <div 
                  className="flex items-center justify-between p-6 cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => toggleExpandir(comb.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-2xl transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                      ▶
                    </span>
                    <span className={`px-4 py-2 rounded-full font-bold text-lg border-2 ${getTipoColor(comb.tipo)}`}>
                      {getTipoNombre(comb.tipo)}
                    </span>
                    <h2 className="text-2xl font-bold text-blue-900">{comb.nombre}</h2>
                  </div>
                  <div className="text-sm text-gray-600 font-semibold">
                    Guardada: {new Date(comb.fechaGuardado).toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                {/* Partidos - Sección desplegable */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t-2 border-gray-200 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {comb.partidos.map((partido, idx) => {
                        const bgColor = partido.estado === "acertado" ? "bg-green-100" : 
                                       partido.estado === "fallado" ? "bg-red-100" : 
                                       "bg-blue-50";
                        const borderColor = partido.estado === "acertado" ? "border-green-600" : 
                                           partido.estado === "fallado" ? "border-red-600" : 
                                           "border-blue-300";
                        
                        return (
                          <div key={idx} className={`${bgColor} border-[3px] ${borderColor} rounded-2xl p-4 shadow flex flex-col gap-2`}>
                            <div className="font-bold text-lg text-blue-900">{partido.equipo}</div>
                            <div className="inline-block bg-blue-100 text-xs font-bold text-blue-700 px-3 py-1 rounded-full mb-1 self-start">
                              {partido.liga}
                            </div>
                            <div className="text-sm text-gray-700 mb-1">{partido.descripcion}</div>
                            <div className="flex gap-2 mb-1 flex-wrap">
                              <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-xs font-semibold text-blue-700">
                                📅 {partido.dia}
                              </span>
                              <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs font-semibold text-gray-700">
                                {partido.fecha}
                              </span>
                              <span className="inline-flex items-center gap-1 bg-green-100 px-2 py-1 rounded text-xs font-semibold text-green-700">
                                ⏰ {partido.hora}
                              </span>
                            </div>
                            <div className="flex gap-4 items-center mb-1 flex-wrap">
                              <span className="bg-orange-400 text-white font-bold rounded-full px-4 py-1 text-sm">
                                {partido.apuesta}
                              </span>
                              <span className="text-blue-600 font-bold text-base">
                                Cuota: {partido.cuota}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-1">
                              {partido.estado === "acertado" && (
                                <span className="bg-green-600 text-white font-bold px-3 py-1 rounded-xl text-xs">
                                  ✔ Acertado
                                </span>
                              )}
                              {partido.estado === "fallado" && (
                                <span className="bg-red-600 text-white font-bold px-3 py-1 rounded-xl text-xs">
                                  ✗ Fallado
                                </span>
                              )}
                              {partido.estado === "pendiente" && (
                                <span className="bg-gray-500 text-white font-bold px-3 py-1 rounded-xl text-xs">
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
