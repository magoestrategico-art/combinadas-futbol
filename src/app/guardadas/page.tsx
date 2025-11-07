"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../firebase-config";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
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

interface ResultadoJornada {
  jornada: number;
  fecha: string;
  acertados: number;
  fallados: number;
  pendientes: number;
  estadoGeneral: "GANADA" | "PERDIDA" | "PENDIENTE";
  cuotaTotal: number;
}

interface EstadisticasGlobales {
  totalJornadas: number;
  ganadas: number;
  perdidas: number;
  pendientes: number;
  porcentajeExito: number;
  rachaActual: number;
  mejorRacha: number;
}

interface CombinadaGuardada {
  id: string;
  tipo: string;
  nombre: string;
  fechaCreacion: string;
  jornadaCreacion: number;
  temporada: string;
  equipos: string[];
  resultadosPorJornada: { [key: string]: ResultadoJornada };
  estadisticas: EstadisticasGlobales;
}

export default function GuardadasPage() {
  const CREATOR_UID = "hDkn8W38nVZKQD1piviUrmwvHtt2";
  const [isCreator, setIsCreator] = useState(false);
  const [combinadas, setCombinadas] = useState<CombinadaGuardada[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());
  const [editandoJornada, setEditandoJornada] = useState<{combinadaId: string, jornada: number} | null>(null);
  const [acertadosTemp, setAcertadosTemp] = useState(0);
  const [falladosTemp, setFalladosTemp] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsCreator(user?.uid === CREATOR_UID);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    cargarCombinadas();
  }, []);

  const cargarCombinadas = async () => {
    try {
      const q = query(collection(db, "historialCombinadas"), orderBy("fechaCreacion", "desc"));
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
      const nuevo = new Set(prev);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });
  };

  const eliminarCombinada = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta combinada?")) return;
    
    try {
      await deleteDoc(doc(db, "historialCombinadas", id));
      setCombinadas(prev => prev.filter(c => c.id !== id));
      alert("Combinada eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Error al eliminar la combinada");
    }
  };

  const actualizarJornada = async (combinadaId: string, jornada: number, acertados: number, fallados: number) => {
    try {
      const combinada = combinadas.find(c => c.id === combinadaId);
      if (!combinada) return;

      const totalEquipos = combinada.equipos.length;
      const pendientes = totalEquipos - acertados - fallados;

      // Validación
      if (acertados + fallados > totalEquipos) {
        alert(`Error: La suma de acertados (${acertados}) + fallados (${fallados}) no puede ser mayor que el total de equipos (${totalEquipos})`);
        return;
      }

      // Determinar estado general
      let estadoGeneral: "GANADA" | "PERDIDA" | "PENDIENTE" = "PENDIENTE";
      if (fallados > 0) {
        estadoGeneral = "PERDIDA";
      } else if (acertados === totalEquipos) {
        estadoGeneral = "GANADA";
      }

      // Calcular cuota (simplificado - usaremos 1.8 por defecto)
      const cuotaTotal = Math.pow(1.8, totalEquipos);

      const nuevoResultado: ResultadoJornada = {
        jornada,
        fecha: new Date().toISOString(),
        acertados,
        fallados,
        pendientes,
        estadoGeneral,
        cuotaTotal
      };

      // Actualizar resultadosPorJornada
      const nuevosResultados = {
        ...combinada.resultadosPorJornada,
        [jornada]: nuevoResultado
      };

      // Recalcular estadísticas globales
      const todasJornadas = Object.values(nuevosResultados) as ResultadoJornada[];
      const totalJornadas = todasJornadas.length;
      const ganadas = todasJornadas.filter((j: ResultadoJornada) => j.estadoGeneral === "GANADA").length;
      const perdidas = todasJornadas.filter((j: ResultadoJornada) => j.estadoGeneral === "PERDIDA").length;
      const pendientesTotal = todasJornadas.filter((j: ResultadoJornada) => j.estadoGeneral === "PENDIENTE").length;
      const porcentajeExito = totalJornadas > 0 ? (ganadas / totalJornadas) * 100 : 0;

      // Calcular racha actual
      const jornadasOrdenadas = todasJornadas.sort((a: ResultadoJornada, b: ResultadoJornada) => b.jornada - a.jornada);
      let rachaActual = 0;
      const ultimoEstado = jornadasOrdenadas[0]?.estadoGeneral;
      
      if (ultimoEstado === "GANADA" || ultimoEstado === "PERDIDA") {
        for (const j of jornadasOrdenadas) {
          if (j.estadoGeneral === ultimoEstado) {
            rachaActual++;
          } else if (j.estadoGeneral !== "PENDIENTE") {
            break;
          }
        }
        if (ultimoEstado === "PERDIDA") rachaActual = -rachaActual;
      }

      // Calcular mejor racha
      let mejorRacha = 0;
      let rachaTemp = 0;
      for (const j of jornadasOrdenadas.reverse()) {
        if (j.estadoGeneral === "GANADA") {
          rachaTemp++;
          mejorRacha = Math.max(mejorRacha, rachaTemp);
        } else if (j.estadoGeneral === "PERDIDA") {
          rachaTemp = 0;
        }
      }

      const nuevasEstadisticas: EstadisticasGlobales = {
        totalJornadas,
        ganadas,
        perdidas,
        pendientes: pendientesTotal,
        porcentajeExito,
        rachaActual,
        mejorRacha
      };

      // Actualizar en Firebase
      await updateDoc(doc(db, "historialCombinadas", combinadaId), {
        resultadosPorJornada: nuevosResultados,
        estadisticas: nuevasEstadisticas
      });

      // Actualizar estado local
      setCombinadas(prev => prev.map(c => 
        c.id === combinadaId 
          ? { ...c, resultadosPorJornada: nuevosResultados, estadisticas: nuevasEstadisticas }
          : c
      ));

      setEditandoJornada(null);
      alert(`✓ Jornada ${jornada} actualizada correctamente`);
    } catch (error) {
      console.error("Error al actualizar jornada:", error);
      alert("Error al actualizar la jornada");
    }
  };

  const getTipoColor = (tipo: string) => {
    if (tipo === 'premium') return 'bg-purple-100 text-purple-700 border-purple-400';
    if (tipo === 'clasica') return 'bg-green-100 text-green-700 border-green-400';
    return 'bg-orange-100 text-orange-700 border-orange-400';
  };

  const getTipoNombre = (tipo: string) => {
    if (tipo === 'premium') return '🏆 PREMIUM';
    if (tipo === 'clasica') return '💚 CLÁSICA';
    return '🎯 SELECT';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#204080] via-[#1e3a75] to-[#1b3366] py-6 px-4 flex flex-col items-center">
      {/* Botón volver */}
      <div className="w-full max-w-6xl mb-4">
        <button
          onClick={() => router.push("/")}
          className="bg-white/90 text-blue-700 px-4 py-2 rounded-lg font-semibold shadow hover:bg-white hover:shadow-lg transition flex items-center gap-2"
        >
          ← Volver a la página principal
        </button>
      </div>

      {/* Título */}
      <h1 className="text-3xl font-extrabold mb-2 text-white drop-shadow-lg tracking-tight">
        📊 Historial de Combinadas
      </h1>
      <p className="text-sm text-blue-100 mb-6 font-semibold text-center">
        Seguimiento de combinadas a través de todas las jornadas
      </p>

      {/* Lista de combinadas */}
      {loading ? (
        <div className="text-center text-white text-xl">Cargando...</div>
      ) : combinadas.length === 0 ? (
        <div className="bg-yellow-100 text-yellow-800 p-6 rounded-2xl text-center font-semibold text-lg shadow-lg">
          No hay combinadas guardadas en el historial todavía.
        </div>
      ) : (
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combinadas.map((comb) => {
            const jornadasArray = Object.values(comb.resultadosPorJornada || {}) as ResultadoJornada[];

            return (
              <div 
                key={comb.id} 
                className="bg-white rounded-xl shadow-xl border-2 border-blue-400 overflow-hidden cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300"
                onClick={() => router.push(`/guardadas/${comb.id}`)}
              >
                <div className="p-4">
                  {/* Tipo y nombre */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full font-bold text-xs border-2 ${getTipoColor(comb.tipo)}`}>
                      {getTipoNombre(comb.tipo)}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-blue-900 mb-3">{comb.nombre}</h2>

                  {/* Estadísticas compactas */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">Jornadas</div>
                      <div className="text-lg font-bold text-blue-700">{comb.estadisticas.totalJornadas}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">Ganadas</div>
                      <div className="text-lg font-bold text-green-700">{comb.estadisticas.ganadas}</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">% Éxito</div>
                      <div className="text-lg font-bold text-purple-700">{comb.estadisticas.porcentajeExito.toFixed(0)}%</div>
                    </div>
                  </div>

                  {/* Timeline mini */}
                  <div className="mb-2">
                    <div className="text-xs text-gray-500 mb-1">Timeline:</div>
                    <div className="flex gap-1 flex-wrap">
                      {jornadasArray.sort((a, b) => a.jornada - b.jornada).slice(0, 8).map((j) => {
                        const icon = j.estadoGeneral === "GANADA" ? "✅" : j.estadoGeneral === "PERDIDA" ? "❌" : "⏳";
                        return (
                          <span key={j.jornada} className="text-sm" title={`Jornada ${j.jornada}`}>
                            {icon}
                          </span>
                        );
                      })}
                      {jornadasArray.length > 8 && <span className="text-xs text-gray-400">+{jornadasArray.length - 8}</span>}
                    </div>
                  </div>

                  {/* Info adicional */}
                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span>📅 {comb.temporada}</span>
                      <span>⚽ {comb.equipos.length} equipos</span>
                    </div>
                  </div>

                  {/* Botón ver más */}
                  <div className="mt-3 text-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      Ver detalles →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
