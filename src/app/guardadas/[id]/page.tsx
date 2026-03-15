"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db, auth } from "../../../firebase-config";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { deleteField } from "firebase/firestore";

export const dynamic = 'force-dynamic';

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

interface Partido {
  equipo: string;
  apuesta: string;
  cuota: string;
  liga: string;
  estado?: "acertado" | "fallado" | "pendiente" | null;
  justificacion?: string; // Added this optional property
}

interface CombinadaGuardada {
  id: string;
  tipo: string;
  nombre: string;
  fechaCreacion: string;
  jornadaCreacion: number;
  temporada: string;
  equipos: string[];
  partidos?: Partido[];
  tituloPartidos?: string;
  resultadosPorJornada: { [key: string]: ResultadoJornada };
  estadisticas: EstadisticasGlobales;
  combinada?: Array<{
    nombre: string;
    apuesta: string;
    cuota: string;
    liga: string;
    justificacion: string;
  }>;
}

export default function DetalleCombinada() {
  const CREATOR_UID = "hDkn8W38nVZKQD1piviUrmwvHtt2";
  const [isCreator, setIsCreator] = useState(false);
  const [combinada, setCombinada] = useState<CombinadaGuardada | null>(null);
  const [loading, setLoading] = useState(true);
  const [editandoJornada, setEditandoJornada] = useState<number | null>(null);
  const [jornadaActiva, setJornadaActiva] = useState<number | null>(null);
  const [acertadosTemp, setAcertadosTemp] = useState(0);
  const [falladosTemp, setFalladosTemp] = useState(0);
  const [editandoPartidos, setEditandoPartidos] = useState(false);
  const [partidosTemp, setPartidosTemp] = useState<Array<{equipo: string; apuesta: string; cuota: string; liga: string}>>([]);
  const [tituloPartidos, setTituloPartidos] = useState("⚽ Equipos y Pronósticos de esta Combinada");
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsCreator(user?.uid === CREATOR_UID);
      if (user) {
        console.log("UID del usuario autenticado:", user.uid);
        if (user.uid === "hDkn8W38nVZKQD1piviUrmwvHtt2") {
          console.log("El usuario está autorizado como administrador.");
        } else {
          console.log("El usuario no está autorizado como administrador.");
        }
      } else {
        console.log("No hay usuario autenticado.");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    cargarCombinada();
  }, [id]);

  // Agregar más registros para depuración
  const cargarCombinada = async () => {
    try {
        const docRef = doc(db, "historialCombinadas", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = {
                id: docSnap.id,
                ...docSnap.data()
            } as CombinadaGuardada;

            console.log("Datos recuperados de Firebase:", data);

            // Validar y procesar el array combinada
            if (!data.partidos || data.partidos.length === 0) {
                console.warn("El campo 'partidos' no existe o está vacío.");
                if (data.combinada && Array.isArray(data.combinada)) {
                    data.partidos = data.combinada.map((item: {
                        nombre: string;
                        apuesta: string;
                        cuota: string;
                        liga: string;
                        justificacion: string;
                    }) => ({
                        equipo: item.nombre || "Equipo sin nombre",
                        apuesta: item.apuesta || "A definir",
                        cuota: item.cuota || "1.80",
                        liga: item.liga || "Liga por definir",
                        estado: null,
                        justificacion: item.justificacion || "No definido"
                    }));
                    delete data.combinada; // Eliminar el campo duplicado
                    await updateDoc(docRef, { partidos: data.partidos, combinada: deleteField() });
                } else {
                    data.partidos = data.equipos.map(equipo => ({
                        equipo,
                        apuesta: "A definir",
                        cuota: "1.80",
                        liga: "Liga por definir",
                        estado: null,
                        justificacion: "No definido"
                    }));
                    await updateDoc(docRef, { partidos: data.partidos });
                }
            }

            console.log("Datos completos del documento recuperado:", data);
            setCombinada(data);
            setTituloPartidos(data.tituloPartidos || "⚽ Equipos y Pronósticos de esta Combinada");
        } else {
            alert("Combinada no encontrada");
            router.push("/guardadas");
        }
    } catch (error) {
        console.error("Error al cargar combinada:", error);
    } finally {
        setLoading(false);
    }
  };

  const actualizarJornada = async (jornada: number, acertados: number, fallados: number) => {
    if (!combinada) return;

    try {
      const totalEquipos = combinada.equipos.length;
      const pendientes = totalEquipos - acertados - fallados;

      if (acertados + fallados > totalEquipos) {
        alert(`Error: La suma de acertados (${acertados}) + fallados (${fallados}) no puede ser mayor que el total de equipos (${totalEquipos})`);
        return;
      }

      let estadoGeneral: "GANADA" | "PERDIDA" | "PENDIENTE" = "PENDIENTE";
      if (fallados > 0) {
        estadoGeneral = "PERDIDA";
      } else if (acertados === totalEquipos) {
        estadoGeneral = "GANADA";
      }

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

      const nuevosResultados = {
        ...combinada.resultadosPorJornada,
        [jornada]: nuevoResultado
      };

      // Recalcular estadísticas
      const calcularEstadisticas = (jornadas: ResultadoJornada[]): EstadisticasGlobales => {
        const totalJornadas = jornadas.length;
        const ganadas = jornadas.filter((j) => j.estadoGeneral === "GANADA").length;
        const perdidas = jornadas.filter((j) => j.estadoGeneral === "PERDIDA").length;
        const pendientesTotal = jornadas.filter((j) => j.estadoGeneral === "PENDIENTE").length;
        const porcentajeExito = totalJornadas > 0 ? (ganadas / totalJornadas) * 100 : 0;

        const jornadasOrdenadas = [...jornadas].sort((a, b) => b.jornada - a.jornada);
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

        return {
          totalJornadas,
          ganadas,
          perdidas,
          pendientes: pendientesTotal,
          porcentajeExito: Math.round(porcentajeExito * 10) / 10,
          rachaActual,
          mejorRacha,
        };
      };

      const nuevasEstadisticas = calcularEstadisticas(Object.values(nuevosResultados) as ResultadoJornada[]);
      console.log("Estadísticas calculadas:", nuevasEstadisticas);

      await updateDoc(doc(db, "historialCombinadas", id), {
        resultadosPorJornada: nuevosResultados,
        estadisticas: nuevasEstadisticas
      });

      setCombinada({
        ...combinada,
        resultadosPorJornada: nuevosResultados,
        estadisticas: nuevasEstadisticas
      });

      setEditandoJornada(null);
      alert(`✓ Jornada ${jornada} actualizada correctamente`);
    } catch (error) {
      console.error("Error al actualizar jornada:", error);
      alert("Error al actualizar la jornada");
    }
  };

  const guardarPartidosEditados = async () => {
    if (!combinada) return;

    try {
        // Extraer solo los nombres de los equipos
        const equipos = partidosTemp.map(p => p.equipo);

        await updateDoc(doc(db, "historialCombinadas", id), {
            partidos: partidosTemp, // Guardar detalles completos en `partidos`
            equipos: equipos, // Guardar solo los nombres en `equipos`
            tituloPartidos: tituloPartidos
        });

        setCombinada({
            ...combinada,
            partidos: partidosTemp,
            equipos: equipos,
            tituloPartidos: tituloPartidos
        });

        setEditandoPartidos(false);
        alert("✓ Equipos, pronósticos y ligas actualizados correctamente");
    } catch (error) {
      console.error("Error al actualizar partidos:", error);
      alert("Error al actualizar los partidos");
    }
  };

  const cambiarEstadoPartido = async (indice: number, nuevoEstado: "acertado" | "fallado" | "pendiente" | null) => {
    if (!combinada || !combinada.partidos || !jornadaActiva) {
      alert("⚠️ Primero selecciona una jornada en el timeline");
      return;
    }

    try {
      const partidosActualizados = [...combinada.partidos];
      partidosActualizados[indice] = {
        ...partidosActualizados[indice],
        estado: partidosActualizados[indice].estado === nuevoEstado ? null : nuevoEstado
      };

      // Calcular acertados, fallados y pendientes
      const acertados = partidosActualizados.filter(p => p.estado === "acertado").length;
      const fallados = partidosActualizados.filter(p => p.estado === "fallado").length;
      const pendientes = partidosActualizados.length - acertados - fallados;

      // Determinar estado general
      let estadoGeneral: "GANADA" | "PERDIDA" | "PENDIENTE" = "PENDIENTE";
      if (fallados > 0) {
        estadoGeneral = "PERDIDA";
      } else if (pendientes === 0 && acertados === partidosActualizados.length) {
        estadoGeneral = "GANADA";
      }

      // Calcular cuota total
      const cuotaTotal = partidosActualizados.reduce((total, p) => {
        const cuota = parseFloat(p.cuota) || 1;
        return total * cuota;
      }, 1);

      // Actualizar la jornada activa
      const nuevosResultados = { ...combinada.resultadosPorJornada };
      nuevosResultados[jornadaActiva] = {
        jornada: jornadaActiva,
        fecha: nuevosResultados[jornadaActiva]?.fecha || new Date().toLocaleDateString("es-ES"),
        acertados,
        fallados,
        pendientes,
        estadoGeneral,
        cuotaTotal
      };

      // Recalcular estadísticas globales
      const todasJornadas = Object.values(nuevosResultados) as ResultadoJornada[];
      const totalJornadas = todasJornadas.length;
      const ganadas = todasJornadas.filter((j: ResultadoJornada) => j.estadoGeneral === "GANADA").length;
      const perdidas = todasJornadas.filter((j: ResultadoJornada) => j.estadoGeneral === "PERDIDA").length;
      const pendientesTotal = todasJornadas.filter((j: ResultadoJornada) => j.estadoGeneral === "PENDIENTE").length;
      const porcentajeExito = totalJornadas > 0 ? (ganadas / totalJornadas) * 100 : 0;

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

      let mejorRacha = 0;
      let rachaTemp = 0;
      for (const j of jornadasOrdenadas.reverse()) {
        if (j.estadoGeneral === "GANADA" || j.estadoGeneral === "PERDIDA") {
          if (rachaTemp > mejorRacha) mejorRacha = rachaTemp;
          rachaTemp = 1;
        }
      }
      if (rachaTemp > mejorRacha) mejorRacha = rachaTemp;

      const estadisticasActualizadas: EstadisticasGlobales = {
        totalJornadas,
        ganadas,
        perdidas,
        pendientes: pendientesTotal,
        porcentajeExito,
        rachaActual,
        mejorRacha
      };

      console.log("Estadísticas actualizadas:", estadisticasActualizadas);
      console.log("Partidos actualizados:", partidosActualizados);
      console.log("Resultados por jornada actualizados:", nuevosResultados);

      // Actualizar en Firebase
      await updateDoc(doc(db, "historialCombinadas", id), {
        partidos: partidosActualizados,
        resultadosPorJornada: nuevosResultados,
        estadisticas: estadisticasActualizadas
      });

      // Actualizar estado local
      setCombinada({
        ...combinada,
        partidos: partidosActualizados,
        resultadosPorJornada: nuevosResultados,
        estadisticas: estadisticasActualizadas
      });
    } catch (error) {
      console.error("Error al cambiar estado del partido:", error);
      alert("Error al actualizar el estado del partido");
    }
  };

  const eliminarJornada = async (jornada: number) => {
    if (!combinada) return;
    if (!confirm(`¿Estás seguro de eliminar la Jornada ${jornada}?`)) return;

    try {
      const nuevosResultados = { ...combinada.resultadosPorJornada };
      delete nuevosResultados[jornada];

      // Recalcular estadísticas
      const todasJornadas = Object.values(nuevosResultados) as ResultadoJornada[];
      const totalJornadas = todasJornadas.length;
      const ganadas = todasJornadas.filter((j: ResultadoJornada) => j.estadoGeneral === "GANADA").length;
      const perdidas = todasJornadas.filter((j: ResultadoJornada) => j.estadoGeneral === "PERDIDA").length;
      const pendientesTotal = todasJornadas.filter((j: ResultadoJornada) => j.estadoGeneral === "PENDIENTE").length;
      const porcentajeExito = totalJornadas > 0 ? (ganadas / totalJornadas) * 100 : 0;

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

      await updateDoc(doc(db, "historialCombinadas", id), {
        resultadosPorJornada: nuevosResultados,
        estadisticas: nuevasEstadisticas
      });

      setCombinada({
        ...combinada,
        resultadosPorJornada: nuevosResultados,
        estadisticas: nuevasEstadisticas
      });

      alert(`✓ Jornada ${jornada} eliminada correctamente`);
    } catch (error) {
      console.error("Error al eliminar jornada:", error);
      alert("Error al eliminar la jornada");
    }
  };

  const eliminarCombinada = async () => {
    if (!confirm("¿Estás seguro de eliminar esta combinada?")) return;
    
    try {
      await deleteDoc(doc(db, "historialCombinadas", id));
      alert("Combinada eliminada correctamente");
      router.push("/guardadas");
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Error al eliminar la combinada");
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

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#204080] via-[#1e3a75] to-[#1b3366] py-6 px-4 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </main>
    );
  }

  if (!combinada) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#204080] via-[#1e3a75] to-[#1b3366] py-6 px-4 flex items-center justify-center">
        <div className="text-white text-xl">Combinada no encontrada</div>
      </main>
    );
  }

  const jornadasArray = Object.values(combinada.resultadosPorJornada || {}) as ResultadoJornada[];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#204080] via-[#1e3a75] to-[#1b3366] py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Botón volver */}
        <button
          onClick={() => router.push("/guardadas")}
          className="bg-white/90 text-blue-700 px-4 py-2 rounded-lg font-semibold shadow hover:bg-white hover:shadow-lg transition flex items-center gap-2 mb-4"
        >
          ← Volver al Historial
        </button>

        {/* Header de la combinada */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-4">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full font-bold text-sm border-2 ${getTipoColor(combinada.tipo)} mb-2`}>
                {getTipoNombre(combinada.tipo)}
              </span>
              <h1 className="text-3xl font-extrabold text-blue-900">{combinada.nombre}</h1>
              <p className="text-gray-600 mt-1">
                📅 {combinada.temporada} • Creada en Jornada {combinada.jornadaCreacion} • ⚽ {combinada.equipos.length} equipos
              </p>
            </div>
          </div>

          {/* Estadísticas principales */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center border-2 border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{combinada.estadisticas.totalJornadas}</div>
              <div className="text-xs text-gray-600 font-semibold">Jornadas Jugadas</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center border-2 border-green-200">
              <div className="text-2xl font-bold text-green-700">{combinada.estadisticas.ganadas}</div>
              <div className="text-xs text-gray-600 font-semibold">✅ Ganadas</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center border-2 border-red-200">
              <div className="text-2xl font-bold text-red-700">{combinada.estadisticas.perdidas}</div>
              <div className="text-xs text-gray-600 font-semibold">❌ Perdidas</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center border-2 border-purple-200">
              <div className="text-2xl font-bold text-purple-700">{combinada.estadisticas.porcentajeExito.toFixed(0)}%</div>
              <div className="text-xs text-gray-600 font-semibold">% Éxito</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center border-2 border-orange-200">
              <div className="text-2xl font-bold text-orange-700">{combinada.estadisticas.mejorRacha} 🔥</div>
              <div className="text-xs text-gray-600 font-semibold">Mejor Racha</div>
            </div>
          </div>
        </div>

        {/* Timeline de jornadas */}
        <div className="bg-white rounded-xl shadow-xl p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📅 Timeline de Jornadas</h2>
          {isCreator && (
            <div className="mb-3 text-sm text-gray-600 bg-blue-50 border border-blue-300 rounded p-2">
              💡 <strong>Tip:</strong> Haz clic en una jornada para activarla y poder marcar los partidos como acertados/fallados.
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {jornadasArray.sort((a, b) => a.jornada - b.jornada).map((j) => {
              const icon = j.estadoGeneral === "GANADA" ? "✅" : j.estadoGeneral === "PERDIDA" ? "❌" : "⏳";
              const bgColor = j.estadoGeneral === "GANADA" ? "bg-green-100 border-green-400" : 
                              j.estadoGeneral === "PERDIDA" ? "bg-red-100 border-red-400" : 
                              "bg-yellow-100 border-yellow-400";
              const isActiva = jornadaActiva === j.jornada;
              
              return (
                <div 
                  key={j.jornada} 
                  onClick={() => isCreator && setJornadaActiva(j.jornada)}
                  className={`${bgColor} border-2 rounded-lg px-4 py-3 text-center min-w-[80px] relative ${
                    isCreator ? 'cursor-pointer hover:shadow-lg transition' : ''
                  } ${isActiva ? 'ring-4 ring-blue-500 shadow-xl' : ''}`}
                >
                  {isCreator && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarJornada(j.jornada);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 shadow-lg z-10"
                      title="Eliminar jornada"
                    >
                      ✕
                    </button>
                  )}
                  {isActiva && (
                    <div className="absolute -top-2 -left-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                      ⚡
                    </div>
                  )}
                  <div className="text-sm font-bold text-gray-700">Jornada {j.jornada}</div>
                  <div className="text-3xl my-1">{icon}</div>
                  <div className="text-xs text-gray-600">
                    <div>✅ {j.acertados}</div>
                    <div>❌ {j.fallados}</div>
                    <div>⏳ {j.pendientes}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Equipos y Pronósticos con botones de estado */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-4">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">{tituloPartidos}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {combinada.partidos?.map((partido, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-2 shadow-md ${
                  partido.estado === "acertado"
                    ? "bg-green-50 border-green-400"
                    : partido.estado === "fallado"
                    ? "bg-red-50 border-red-400"
                    : "bg-yellow-50 border-yellow-400"
                }`}
              >
                <h3 className="text-sm font-bold text-gray-800">{partido.equipo}</h3>
                <p className="text-xs text-gray-600">Liga: {partido.liga}</p>
                <p className="text-xs text-gray-600">Apuesta: {partido.apuesta}</p>
                <p className="text-xs text-gray-600">Criterio: {partido.justificacion || "No definido"}</p>
                <p className="text-xs text-gray-600">Cuota: {partido.cuota}</p>
                <p className="text-xs font-semibold">
                  Estado: {" "}
                  <span
                    className={
                      partido.estado === "acertado"
                        ? "text-green-600"
                        : partido.estado === "fallado"
                        ? "text-red-600"
                        : "text-gray-600"
                    }
                  >
                    {partido.estado ? partido.estado.charAt(0).toUpperCase() + partido.estado.slice(1) : "Pendiente"}
                  </span>
                </p>
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={() => cambiarEstadoPartido(index, "acertado")}
                    className="bg-green-500 text-white px-1 py-0.5 text-xs rounded hover:bg-green-600"
                  >
                    Acertada
                  </button>
                  <button
                    onClick={() => cambiarEstadoPartido(index, "fallado")}
                    className="bg-red-500 text-white px-1 py-0.5 text-xs rounded hover:bg-red-600"
                  >
                    Fallada
                  </button>
                  <button
                    onClick={() => cambiarEstadoPartido(index, "pendiente")}
                    className="bg-yellow-500 text-white px-1 py-0.5 text-xs rounded hover:bg-yellow-600"
                  >
                    Pendiente
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controles Admin */}
        {isCreator && (
          <div className="bg-white rounded-xl shadow-xl p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🔧 Controles Admin</h2>
            
            {/* Formulario para añadir/editar jornada */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4 mb-4">
              <h3 className="font-bold text-blue-800 mb-3">➕ Añadir/Editar Jornada</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-700 font-semibold block mb-1">Número de Jornada:</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej: 5"
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:outline-none"
                    onChange={(e) => {
                      const jornadaNum = parseInt(e.target.value) || 0;
                      if (jornadaNum > 0) {
                        setEditandoJornada(jornadaNum);
                        const jornadaExistente = combinada.resultadosPorJornada[jornadaNum];
                        if (jornadaExistente) {
                          setAcertadosTemp(jornadaExistente.acertados);
                          setFalladosTemp(jornadaExistente.fallados);
                        } else {
                          setAcertadosTemp(0);
                          setFalladosTemp(0);
                        }
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700 font-semibold block mb-1">Acertados:</label>
                  <input
                    type="number"
                    min="0"
                    max={combinada.equipos.length}
                    value={editandoJornada ? acertadosTemp : 0}
                    onChange={(e) => setAcertadosTemp(parseInt(e.target.value) || 0)}
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:border-green-500 focus:outline-none disabled:bg-gray-100"
                    disabled={!editandoJornada}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700 font-semibold block mb-1">Fallados:</label>
                  <input
                    type="number"
                    min="0"
                    max={combinada.equipos.length}
                    value={editandoJornada ? falladosTemp : 0}
                    onChange={(e) => setFalladosTemp(parseInt(e.target.value) || 0)}
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:border-red-500 focus:outline-none disabled:bg-gray-100"
                    disabled={!editandoJornada}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      if (editandoJornada) {
                        actualizarJornada(editandoJornada, acertadosTemp, falladosTemp);
                      }
                    }}
                    disabled={!editandoJornada}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-lg"
                  >
                    💾 Guardar Jornada
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-600 mt-3 bg-white/50 rounded p-2">
                ℹ️ Los pendientes se calculan automáticamente: {combinada.equipos.length} equipos - Acertados - Fallados
              </div>
            </div>

            {/* Botón eliminar */}
            <button
              onClick={eliminarCombinada}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-lg"
            >
              🗑️ Eliminar Combinada Completa
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
