"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../firebase-config";
import { collection, getDocs, query, orderBy, deleteDoc, doc, where, updateDoc, setDoc, getDoc } from "firebase/firestore";
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
  equipos: string[]; // Los 10 equipos fijos de esta combinada
  resultadosPorJornada: { [key: string]: ResultadoJornada }; // "10": {...}, "11": {...}
  estadisticas: EstadisticasGlobales;
}

type FiltroTipo = "todos" | "premium" | "clasica" | "select";
type FiltroEstado = "todos" | "ganadas" | "perdidas" | "pendientes";
type OrdenType = "fecha-desc" | "fecha-asc" | "aciertos";

export default function GuardadasPage() {
  const CREATOR_UID = "hDkn8W38nVZKQD1piviUrmwvHtt2";
  const [isCreator, setIsCreator] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [combinadas, setCombinadas] = useState<CombinadaGuardada[]>([]);
  const [combinadasFiltradas, setCombinadasFiltradas] = useState<CombinadaGuardada[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [ordenamiento, setOrdenamiento] = useState<OrdenType>("fecha-desc");
  const [filtroJornada, setFiltroJornada] = useState<string>("todas"); // Nueva: filtro por jornada
  const [showCodigoModal, setShowCodigoModal] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [validandoCodigo, setValidandoCodigo] = useState(false);
  const router = useRouter();
  
  const LIMITE_GRATIS = 2; // Número de combinadas que pueden ver usuarios gratis

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsCreator(user?.uid === CREATOR_UID);
      setUserId(user?.uid || null);
      
      if (user) {
        // Verificar si el usuario tiene premium activo
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.premiumHasta) {
              const fechaExpiracion = new Date(userData.premiumHasta);
              const ahora = new Date();
              setIsPremium(fechaExpiracion > ahora || user.uid === CREATOR_UID);
            } else {
              setIsPremium(user.uid === CREATOR_UID);
            }
          } else {
            setIsPremium(user.uid === CREATOR_UID);
          }
        } catch (error) {
          console.error("Error al verificar premium:", error);
          setIsPremium(user.uid === CREATOR_UID);
        }
      } else {
        setIsPremium(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    cargarCombinadas();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [combinadas, filtroTipo, filtroEstado, busqueda, ordenamiento, filtroJornada]);

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

  const aplicarFiltros = () => {
    let resultado = [...combinadas];

    // Filtro por tipo
    if (filtroTipo !== "todos") {
      resultado = resultado.filter(c => c.tipo === filtroTipo);
    }

    // Filtro por estado
    if (filtroEstado !== "todos") {
      resultado = resultado.filter(c => {
        const estado = calcularEstadoActual(c);
        if (filtroEstado === "ganadas") return estado.todosAcertados;
        if (filtroEstado === "perdidas") return estado.algunoFallado;
        if (filtroEstado === "pendientes") return estado.todosPendientes;
        return true;
      });
    }

    // NUEVO: Filtro por jornada (filtra combinadas que tengan resultados en esa jornada)
    if (filtroJornada !== "todas") {
      const jornadaNum = parseInt(filtroJornada);
      resultado = resultado.filter(c => c.resultadosPorJornada && c.resultadosPorJornada[jornadaNum]);
    }

    // Búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(c => 
        c.nombre.toLowerCase().includes(termino) ||
        c.equipos.some((equipo: string) => equipo.toLowerCase().includes(termino))
      );
    }

    // Ordenamiento
    if (ordenamiento === "fecha-desc") {
      resultado.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
    } else if (ordenamiento === "fecha-asc") {
      resultado.sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime());
    } else if (ordenamiento === "aciertos") {
      resultado.sort((a, b) => {
        return b.estadisticas.porcentajeExito - a.estadisticas.porcentajeExito;
      });
    }

    setCombinadasFiltradas(resultado);
  };

  // Calcula el estado actual de una combinada basado en todas sus jornadas
  const calcularEstadoActual = (combinada: CombinadaGuardada) => {
    const jornadas = Object.values(combinada.resultadosPorJornada || {});
    if (jornadas.length === 0) {
      return { todosAcertados: false, algunoFallado: false, todosPendientes: true };
    }

    const todasGanadas = jornadas.every(j => j.estadoGeneral === "GANADA");
    const algunaPerdida = jornadas.some(j => j.estadoGeneral === "PERDIDA");
    const todasPendientes = jornadas.every(j => j.estadoGeneral === "PENDIENTE");

    return {
      todosAcertados: todasGanadas,
      algunoFallado: algunaPerdida,
      todosPendientes: todasPendientes
    };
  };

  const calcularEstadisticasGlobales = () => {
    const totalCombinadas = combinadas.length;
    const ganadas = combinadas.filter(c => {
      const estado = calcularEstadoActual(c);
      return estado.todosAcertados;
    }).length;
    const perdidas = combinadas.filter(c => {
      const estado = calcularEstadoActual(c);
      return estado.algunoFallado;
    }).length;
    const pendientes = combinadas.filter(c => {
      const estado = calcularEstadoActual(c);
      return estado.todosPendientes;
    }).length;
    const porcentajeGanadas = totalCombinadas > 0 ? (ganadas / totalCombinadas) * 100 : 0;

    return { totalCombinadas, ganadas, perdidas, pendientes, porcentajeGanadas };
  };

  // Nueva función: Estadísticas por tipo de combinada (Premium, Clásica, Select)
  const calcularEstadisticasPorTipo = () => {
    const tipos = ['premium', 'clasica', 'select'];
    const resultados: any = {};

    tipos.forEach(tipo => {
      const combinadasTipo = combinadas.filter(c => c.tipo === tipo);
      const ganadas = combinadasTipo.filter(c => c.estadisticas.ganadas > 0).length;
      const perdidas = combinadasTipo.filter(c => c.estadisticas.perdidas > 0).length;
      const pendientes = combinadasTipo.filter(c => c.estadisticas.pendientes > 0).length;
      const total = combinadasTipo.length;
      const porcentaje = total > 0 ? (ganadas / total) * 100 : 0;

      // Calcular racha actual
      let rachaActual = 0;
      let tipoRachaActual = '';
      const combinadasOrdenadas = [...combinadasTipo].sort((a, b) => 
        new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
      );
      
      if (combinadasOrdenadas.length > 0) {
        const ultima = combinadasOrdenadas[0];
        tipoRachaActual = ultima.estadisticas.ganadas > ultima.estadisticas.perdidas ? 'ganadas' : 'perdidas';
        rachaActual = Math.abs(ultima.estadisticas.rachaActual);
      }

      // Calcular mejor racha de la temporada
      let mejorRacha = 0;
      for (const comb of combinadasOrdenadas) {
        mejorRacha = Math.max(mejorRacha, comb.estadisticas.mejorRacha);
      }

      resultados[tipo] = {
        total,
        ganadas,
        perdidas,
        pendientes,
        porcentaje,
        rachaActual,
        tipoRachaActual,
        mejorRacha
      };
    });

    return resultados;
  };

  // NUEVA: Función para actualizar o añadir jornada a una combinada existente
  const actualizarJornadaCombinada = async (
    combinadaId: string,
    jornada: number,
    partidos: Partido[]
  ) => {
    try {
      const combinada = combinadas.find(c => c.id === combinadaId);
      if (!combinada) return;

      // Calcular resultados de esta jornada
      const acertados = partidos.filter(p => p.estado === "acertado").length;
      const fallados = partidos.filter(p => p.estado === "fallado").length;
      const pendientes = partidos.filter(p => p.estado === "pendiente").length;
      const cuotaTotal = partidos.reduce((acc, p) => acc * parseFloat(p.cuota), 1);
      
      let estadoGeneral: "GANADA" | "PERDIDA" | "PENDIENTE" = "PENDIENTE";
      if (fallados > 0) {
        estadoGeneral = "PERDIDA";
      } else if (acertados === partidos.length) {
        estadoGeneral = "GANADA";
      }

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

      alert(`✓ Jornada ${jornada} actualizada correctamente`);
    } catch (error) {
      console.error("Error al actualizar jornada:", error);
      alert("Error al actualizar la jornada");
    }
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

  const validarCodigo = async () => {
    if (!codigo.trim()) {
      alert("Por favor introduce un código");
      return;
    }

    if (!userId) {
      alert("Debes iniciar sesión para activar el código");
      return;
    }

    setValidandoCodigo(true);

    try {
      // Buscar el código en Firebase
      const codigosRef = collection(db, "codigosPremium");
      const q = query(codigosRef, where("codigo", "==", codigo.trim().toUpperCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        alert("Código no válido");
        setValidandoCodigo(false);
        return;
      }

      const codigoDoc = snapshot.docs[0];
      const codigoData = codigoDoc.data();

      // Verificar si el usuario ya tiene premium activo
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.premiumHasta) {
          const fechaExpiracionActual = new Date(userData.premiumHasta);
          if (fechaExpiracionActual > new Date()) {
            alert("Ya tienes premium activo. Espera a que expire para renovar.");
            setValidandoCodigo(false);
            return;
          }
        }
      }

      // Activar premium por 30 días
      const fechaActivacion = new Date();
      const fechaExpiracion = new Date();
      fechaExpiracion.setDate(fechaExpiracion.getDate() + 30);

      // Registrar uso del código (sin marcarlo como usado definitivamente)
      const usosActuales = codigoData.usos || [];
      await updateDoc(doc(db, "codigosPremium", codigoDoc.id), {
        usos: [...usosActuales, {
          userId: userId,
          fechaActivacion: fechaActivacion.toISOString(),
          fechaExpiracion: fechaExpiracion.toISOString()
        }]
      });

      // Actualizar usuario con premium
      await setDoc(doc(db, "users", userId), {
        premiumHasta: fechaExpiracion.toISOString()
      }, { merge: true });

      alert(`¡Código activado! Tienes acceso premium hasta el ${fechaExpiracion.toLocaleDateString('es-ES')}`);
      setShowCodigoModal(false);
      setCodigo("");
      setIsPremium(true);
      
    } catch (error) {
      console.error("Error al validar código:", error);
      alert("Error al validar el código. Inténtalo de nuevo.");
    } finally {
      setValidandoCodigo(false);
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

  const estadisticasGlobales = calcularEstadisticasGlobales();
  const estadisticasPorTipo = calcularEstadisticasPorTipo();

  return (
    <div className="min-h-screen flex flex-col items-center justify-start" style={{ background: '#23407a', minHeight: '100vh', padding: '24px 16px 32px 16px', boxSizing: 'border-box' }}>
      {/* Botón volver */}
      <div className="w-full max-w-6xl flex justify-start mb-3">
        <button
          onClick={() => router.push("/")}
          className="bg-blue-700 text-white rounded-full px-4 py-1.5 text-sm font-semibold shadow hover:bg-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Volver a la página principal"
        >
          ← Volver a la página principal
        </button>
      </div>

      {/* Título */}
      <h1 className="text-3xl font-extrabold mb-2 text-white drop-shadow-lg tracking-tight" style={{textShadow:'0 4px 16px #2a5298'}}>
        📊 Historial de Combinadas
      </h1>
      <p className="text-sm text-blue-100 mb-4 font-semibold text-center">
        Revisa todas las combinadas guardadas con su histórico de resultados
      </p>

      {/* Estadísticas Globales */}
      {!loading && combinadas.length > 0 && (
        <div className="w-full max-w-6xl mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/95 rounded-lg shadow-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{estadisticasGlobales.totalCombinadas}</div>
            <div className="text-xs text-gray-600 font-semibold">Total Combinadas</div>
          </div>
          <div className="bg-green-100 rounded-lg shadow-lg p-3 text-center border-2 border-green-400">
            <div className="text-2xl font-bold text-green-700">{estadisticasGlobales.ganadas}</div>
            <div className="text-xs text-gray-700 font-semibold">✔ Ganadas</div>
          </div>
          <div className="bg-red-100 rounded-lg shadow-lg p-3 text-center border-2 border-red-400">
            <div className="text-2xl font-bold text-red-700">{estadisticasGlobales.perdidas}</div>
            <div className="text-xs text-gray-700 font-semibold">✗ Perdidas</div>
          </div>
          <div className="bg-yellow-100 rounded-lg shadow-lg p-3 text-center border-2 border-yellow-400">
            <div className="text-2xl font-bold text-yellow-700">{estadisticasGlobales.porcentajeGanadas.toFixed(0)}%</div>
            <div className="text-xs text-gray-700 font-semibold">% Acierto</div>
          </div>
        </div>
      )}

      {/* NUEVO: Estadísticas por Tipo de Combinada */}
      {!loading && combinadas.length > 0 && (
        <div className="w-full max-w-6xl mb-4">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            📈 Estadísticas por Tipo de Combinada
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Premium */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-4 border-2 border-purple-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-extrabold text-purple-700">🏆 PREMIUM</h3>
                <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  {estadisticasPorTipo.premium.total} combinadas
                </span>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-semibold">Ganadas:</span>
                  <span className="text-green-700 font-bold">✅ {estadisticasPorTipo.premium.ganadas}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-semibold">Perdidas:</span>
                  <span className="text-red-700 font-bold">❌ {estadisticasPorTipo.premium.perdidas}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-semibold">Pendientes:</span>
                  <span className="text-yellow-700 font-bold">⏳ {estadisticasPorTipo.premium.pendientes}</span>
                </div>
              </div>

              <div className="bg-purple-200 rounded-lg p-2 mb-2">
                <div className="text-center">
                  <div className="text-3xl font-black text-purple-700">{estadisticasPorTipo.premium.porcentaje.toFixed(0)}%</div>
                  <div className="text-xs text-purple-900 font-semibold">Tasa de Acierto</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/70 rounded p-2 text-center">
                  <div className="font-bold text-purple-700">
                    {estadisticasPorTipo.premium.tipoRachaActual === 'ganadas' ? '🔥' : '❄️'} {estadisticasPorTipo.premium.rachaActual}
                  </div>
                  <div className="text-gray-600">Racha actual</div>
                </div>
                <div className="bg-white/70 rounded p-2 text-center">
                  <div className="font-bold text-purple-700">🏆 {estadisticasPorTipo.premium.mejorRacha}</div>
                  <div className="text-gray-600">Mejor racha</div>
                </div>
              </div>
            </div>

            {/* Clásica */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-4 border-2 border-green-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-extrabold text-green-700">⚡ CLÁSICA</h3>
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  {estadisticasPorTipo.clasica.total} combinadas
                </span>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-semibold">Ganadas:</span>
                  <span className="text-green-700 font-bold">✅ {estadisticasPorTipo.clasica.ganadas}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-semibold">Perdidas:</span>
                  <span className="text-red-700 font-bold">❌ {estadisticasPorTipo.clasica.perdidas}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-semibold">Pendientes:</span>
                  <span className="text-yellow-700 font-bold">⏳ {estadisticasPorTipo.clasica.pendientes}</span>
                </div>
              </div>

              <div className="bg-green-200 rounded-lg p-2 mb-2">
                <div className="text-center">
                  <div className="text-3xl font-black text-green-700">{estadisticasPorTipo.clasica.porcentaje.toFixed(0)}%</div>
                  <div className="text-xs text-green-900 font-semibold">Tasa de Acierto</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/70 rounded p-2 text-center">
                  <div className="font-bold text-green-700">
                    {estadisticasPorTipo.clasica.tipoRachaActual === 'ganadas' ? '🔥' : '❄️'} {estadisticasPorTipo.clasica.rachaActual}
                  </div>
                  <div className="text-gray-600">Racha actual</div>
                </div>
                <div className="bg-white/70 rounded p-2 text-center">
                  <div className="font-bold text-green-700">🏆 {estadisticasPorTipo.clasica.mejorRacha}</div>
                  <div className="text-gray-600">Mejor racha</div>
                </div>
              </div>
            </div>

            {/* Select */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg p-4 border-2 border-orange-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-extrabold text-orange-700">🎯 SELECT</h3>
                <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  {estadisticasPorTipo.select.total} combinadas
                </span>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-semibold">Ganadas:</span>
                  <span className="text-green-700 font-bold">✅ {estadisticasPorTipo.select.ganadas}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-semibold">Perdidas:</span>
                  <span className="text-red-700 font-bold">❌ {estadisticasPorTipo.select.perdidas}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-semibold">Pendientes:</span>
                  <span className="text-yellow-700 font-bold">⏳ {estadisticasPorTipo.select.pendientes}</span>
                </div>
              </div>

              <div className="bg-orange-200 rounded-lg p-2 mb-2">
                <div className="text-center">
                  <div className="text-3xl font-black text-orange-700">{estadisticasPorTipo.select.porcentaje.toFixed(0)}%</div>
                  <div className="text-xs text-orange-900 font-semibold">Tasa de Acierto</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/70 rounded p-2 text-center">
                  <div className="font-bold text-orange-700">
                    {estadisticasPorTipo.select.tipoRachaActual === 'ganadas' ? '🔥' : '❄️'} {estadisticasPorTipo.select.rachaActual}
                  </div>
                  <div className="text-gray-600">Racha actual</div>
                </div>
                <div className="bg-white/70 rounded p-2 text-center">
                  <div className="font-bold text-orange-700">🏆 {estadisticasPorTipo.select.mejorRacha}</div>
                  <div className="text-gray-600">Mejor racha</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NUEVO: Gráfico de barras comparativo */}
      {!loading && combinadas.length > 0 && (
        <div className="w-full max-w-6xl mb-4">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            📊 Comparativa de Rendimiento
          </h2>
          <div className="bg-white/95 rounded-xl shadow-lg p-6">
            <div className="space-y-4">
              {/* Premium */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-purple-700 text-sm">🏆 PREMIUM</span>
                  <span className="font-bold text-purple-900">{estadisticasPorTipo.premium.porcentaje.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-1000"
                    style={{ width: `${estadisticasPorTipo.premium.porcentaje}%` }}
                  >
                    <span className="text-white text-xs font-bold">{estadisticasPorTipo.premium.ganadas}/{estadisticasPorTipo.premium.total}</span>
                  </div>
                </div>
              </div>

              {/* Clásica */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-green-700 text-sm">⚡ CLÁSICA</span>
                  <span className="font-bold text-green-900">{estadisticasPorTipo.clasica.porcentaje.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-1000"
                    style={{ width: `${estadisticasPorTipo.clasica.porcentaje}%` }}
                  >
                    <span className="text-white text-xs font-bold">{estadisticasPorTipo.clasica.ganadas}/{estadisticasPorTipo.clasica.total}</span>
                  </div>
                </div>
              </div>

              {/* Select */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-orange-700 text-sm">🎯 SELECT</span>
                  <span className="font-bold text-orange-900">{estadisticasPorTipo.select.porcentaje.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-1000"
                    style={{ width: `${estadisticasPorTipo.select.porcentaje}%` }}
                  >
                    <span className="text-white text-xs font-bold">{estadisticasPorTipo.select.ganadas}/{estadisticasPorTipo.select.total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Indicadores de referencia */}
            <div className="flex justify-between mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}

      {/* NUEVO: Timeline Semanal - Visualización de resultados por jornada */}
      {!loading && combinadas.length > 0 && combinadas.some(c => c.jornada) && (
        <div className="w-full max-w-6xl mb-4">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            📅 Resultados por Jornada
          </h2>
          <div className="bg-white/95 rounded-xl shadow-lg p-4 overflow-x-auto">
            <div className="min-w-max">
              {/* Encabezado de jornadas */}
              <div className="flex gap-2 mb-3">
                <div className="w-24 font-bold text-gray-700 text-sm flex items-center">Tipo</div>
                {Array.from(new Set(combinadas.map(c => c.jornada).filter(j => j !== undefined))).sort((a, b) => (a || 0) - (b || 0)).map(jornada => (
                  <div key={jornada} className="w-12 text-center">
                    <div className="text-xs font-bold text-gray-700">J{jornada}</div>
                  </div>
                ))}
              </div>

              {/* Fila Premium */}
              <div className="flex gap-2 mb-2 items-center">
                <div className="w-24 bg-purple-100 rounded px-2 py-1 text-xs font-bold text-purple-700 border border-purple-300">
                  🏆 Premium
                </div>
                {Array.from(new Set(combinadas.map(c => c.jornada).filter(j => j !== undefined))).sort((a, b) => (a || 0) - (b || 0)).map(jornada => {
                  const combinada = combinadas.find(c => c.tipo === 'premium' && c.jornada === jornada);
                  if (!combinada) return <div key={jornada} className="w-12 text-center text-gray-300">-</div>;
                  const stats = calcularEstadisticas(combinada);
                  const icono = stats.todosAcertados ? '✅' : stats.algunoFallado ? '❌' : '⏳';
                  const bgColor = stats.todosAcertados ? 'bg-green-100' : stats.algunoFallado ? 'bg-red-100' : 'bg-yellow-100';
                  return (
                    <div key={jornada} className={`w-12 h-12 ${bgColor} rounded flex items-center justify-center text-2xl cursor-pointer hover:scale-110 transition-transform`} title={`Jornada ${jornada}: ${combinada.nombre}`}>
                      {icono}
                    </div>
                  );
                })}
              </div>

              {/* Fila Clásica */}
              <div className="flex gap-2 mb-2 items-center">
                <div className="w-24 bg-green-100 rounded px-2 py-1 text-xs font-bold text-green-700 border border-green-300">
                  ⚡ Clásica
                </div>
                {Array.from(new Set(combinadas.map(c => c.jornada).filter(j => j !== undefined))).sort((a, b) => (a || 0) - (b || 0)).map(jornada => {
                  const combinada = combinadas.find(c => c.tipo === 'clasica' && c.jornada === jornada);
                  if (!combinada) return <div key={jornada} className="w-12 text-center text-gray-300">-</div>;
                  const stats = calcularEstadisticas(combinada);
                  const icono = stats.todosAcertados ? '✅' : stats.algunoFallado ? '❌' : '⏳';
                  const bgColor = stats.todosAcertados ? 'bg-green-100' : stats.algunoFallado ? 'bg-red-100' : 'bg-yellow-100';
                  return (
                    <div key={jornada} className={`w-12 h-12 ${bgColor} rounded flex items-center justify-center text-2xl cursor-pointer hover:scale-110 transition-transform`} title={`Jornada ${jornada}: ${combinada.nombre}`}>
                      {icono}
                    </div>
                  );
                })}
              </div>

              {/* Fila Select */}
              <div className="flex gap-2 items-center">
                <div className="w-24 bg-orange-100 rounded px-2 py-1 text-xs font-bold text-orange-700 border border-orange-300">
                  🎯 Select
                </div>
                {Array.from(new Set(combinadas.map(c => c.jornada).filter(j => j !== undefined))).sort((a, b) => (a || 0) - (b || 0)).map(jornada => {
                  const combinada = combinadas.find(c => c.tipo === 'select' && c.jornada === jornada);
                  if (!combinada) return <div key={jornada} className="w-12 text-center text-gray-300">-</div>;
                  const stats = calcularEstadisticas(combinada);
                  const icono = stats.todosAcertados ? '✅' : stats.algunoFallado ? '❌' : '⏳';
                  const bgColor = stats.todosAcertados ? 'bg-green-100' : stats.algunoFallado ? 'bg-red-100' : 'bg-yellow-100';
                  return (
                    <div key={jornada} className={`w-12 h-12 ${bgColor} rounded flex items-center justify-center text-2xl cursor-pointer hover:scale-110 transition-transform`} title={`Jornada ${jornada}: ${combinada.nombre}`}>
                      {icono}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leyenda */}
            <div className="flex gap-4 justify-center mt-4 pt-3 border-t border-gray-200 text-xs">
              <span className="flex items-center gap-1"><span className="text-lg">✅</span> Ganada</span>
              <span className="flex items-center gap-1"><span className="text-lg">❌</span> Perdida</span>
              <span className="flex items-center gap-1"><span className="text-lg">⏳</span> Pendiente</span>
            </div>
          </div>
        </div>
      )}

      {/* Filtros y búsqueda - Todo en una línea */}
      {!loading && combinadas.length > 0 && (
        <div className="w-full max-w-6xl mb-4 bg-white/95 rounded-lg shadow-lg p-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Búsqueda */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="🔍 Buscar por nombre o equipo..."
                className="w-full px-3 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Filtro por tipo */}
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)}
              className="px-3 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
            >
              <option value="todos">Tipo: Todos</option>
              <option value="premium">Tipo: Premium</option>
              <option value="clasica">Tipo: Clásica</option>
              <option value="select">Tipo: Select</option>
            </select>

            {/* Filtro por estado */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
              className="px-3 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
            >
              <option value="todos">Estado: Todos</option>
              <option value="ganadas">Estado: Ganadas</option>
              <option value="perdidas">Estado: Perdidas</option>
              <option value="pendientes">Estado: Pendientes</option>
            </select>

            {/* Ordenamiento como dropdown */}
            <select
              value={ordenamiento}
              onChange={(e) => setOrdenamiento(e.target.value as OrdenType)}
              className="px-3 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
            >
              <option value="fecha-desc">📅 Más recientes</option>
              <option value="fecha-asc">📅 Más antiguas</option>
              <option value="aciertos">📊 % Aciertos</option>
            </select>

            {/* NUEVO: Filtro por jornada */}
            <select
              value={filtroJornada}
              onChange={(e) => setFiltroJornada(e.target.value)}
              className="px-3 py-1.5 text-sm border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none font-semibold bg-purple-50"
            >
              <option value="todas">📆 Todas las jornadas</option>
              {Array.from(new Set(combinadas.map(c => c.jornada).filter(j => j !== undefined))).sort((a, b) => (a || 0) - (b || 0)).map(jornada => (
                <option key={jornada} value={jornada}>📆 Jornada {jornada}</option>
              ))}
            </select>

            {/* Separador */}
            <div className="hidden md:block h-8 w-px bg-gray-300"></div>

            {/* Contador de resultados */}
            <div className="text-gray-700 text-sm font-semibold whitespace-nowrap">
              {combinadasFiltradas.length} de {combinadas.length}
            </div>
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="w-full max-w-6xl">
        {loading ? (
          <div className="text-center text-white text-xl">Cargando...</div>
        ) : combinadas.length === 0 ? (
          <div className="bg-yellow-100 text-yellow-800 p-6 rounded-2xl text-center font-semibold text-lg shadow-lg">
            No hay combinadas guardadas en el historial todavía.
          </div>
        ) : combinadasFiltradas.length === 0 ? (
          <div className="bg-orange-100 text-orange-800 p-4 rounded-xl text-center font-semibold text-sm shadow-lg">
            No se encontraron combinadas con los filtros aplicados.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {combinadasFiltradas.map((comb, index) => {
              const isExpanded = expandidas.has(comb.id);
              const stats = calcularEstadisticas(comb);
              const estadoGeneral = stats.todosAcertados ? "ganada" : stats.algunoFallado ? "perdida" : "pendiente";
              const bgEstado = estadoGeneral === "ganada" ? "bg-green-50" : estadoGeneral === "perdida" ? "bg-red-50" : "bg-blue-50";
              const borderEstado = estadoGeneral === "ganada" ? "border-green-400" : estadoGeneral === "perdida" ? "border-red-400" : "border-blue-400";
              
              // Determinar si esta combinada está bloqueada (solo para usuarios no premium)
              const isBloqueada = !isPremium && index >= LIMITE_GRATIS;
              
              return (
              <div key={comb.id} className={`${bgEstado} rounded-xl shadow-xl border-2 ${borderEstado} overflow-hidden transition-all duration-300 ${isBloqueada ? 'opacity-50' : ''}`}>
                {/* Header clickeable */}
                <div 
                  className={`flex items-center justify-between p-4 ${!isBloqueada ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed'} transition-opacity`}
                  onClick={() => !isBloqueada && toggleExpandir(comb.id)}
                >
                  <div className="flex items-center gap-3 flex-1 flex-wrap">
                    {!isBloqueada && (
                      <span className="text-lg transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                        ▶
                      </span>
                    )}
                    {isBloqueada && <span className="text-lg">🔒</span>}
                    <span className={`px-3 py-1 rounded-full font-bold text-sm border-2 ${getTipoColor(comb.tipo)}`}>
                      {getTipoNombre(comb.tipo)}
                    </span>
                    <h2 className="text-lg font-bold text-blue-900">{isBloqueada ? "Combinada Premium" : comb.nombre}</h2>
                    
                    {/* Badge de estado */}
                    {!isBloqueada && estadoGeneral === "ganada" && (
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1">
                        ✔ GANADA
                      </span>
                    )}
                    {!isBloqueada && estadoGeneral === "perdida" && (
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1">
                        ✗ PERDIDA
                      </span>
                    )}
                    {!isBloqueada && estadoGeneral === "pendiente" && (
                      <span className="bg-gray-500 text-white px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1">
                        ⏳ PENDIENTE
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Botón eliminar (solo admin) */}
                    {isCreator && !isBloqueada && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarCombinada(comb.id);
                        }}
                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-600 transition text-xs"
                      >
                        🗑️ Eliminar
                      </button>
                    )}
                    {!isBloqueada && (
                      <div className="text-xs text-gray-600 font-semibold text-right">
                        <div>{new Date(comb.fechaGuardado).toLocaleDateString('es-ES', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mensaje de bloqueo Premium */}
                {isBloqueada && (
                  <div className="px-4 pb-4">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-center text-white shadow-xl">
                      <div className="text-4xl mb-3">👑</div>
                      <h3 className="text-xl font-bold mb-2">Contenido Premium</h3>
                      <p className="text-sm mb-4 opacity-90">
                        Accede a todo el historial de combinadas sin límites por solo €1.50/mes
                      </p>
                      <div className="flex flex-col gap-3 items-center">
                        <a
                          href="https://ko-fi.com/s/f1fa74cc26"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-yellow-400 text-purple-900 px-6 py-3 rounded-full font-bold hover:bg-yellow-300 transition shadow-lg text-sm inline-block"
                        >
                          ⭐ Obtener acceso - €1.50/mes
                        </a>
                        <button
                          onClick={() => setShowCodigoModal(true)}
                          className="text-white underline hover:text-yellow-300 transition text-sm"
                        >
                          ¿Ya tienes un código? Actívalo aquí
                        </button>
                      </div>
                      <p className="text-xs mt-3 opacity-75">
                        30 días de acceso • Sin renovación automática • Código por email
                      </p>
                    </div>
                  </div>
                )}

                {/* Resumen sin expandir */}
                {!isBloqueada && !isExpanded && (
                  <div className="px-4 pb-3 flex flex-wrap gap-2 items-center">
                    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 shadow text-sm">
                      <span className="font-bold text-blue-900">Partidos:</span>
                      <span className="text-green-600 font-bold">{stats.acertados} ✔</span>
                      <span className="text-red-600 font-bold">{stats.fallados} ✗</span>
                      <span className="text-gray-600 font-bold">{stats.pendientes} ⏳</span>
                      <span className="text-gray-500 text-xs">/ {stats.total}</span>
                    </div>
                    <div className="bg-white rounded-lg px-3 py-1.5 shadow text-sm">
                      <span className="font-bold text-blue-900">Cuota: </span>
                      <span className="text-orange-600 font-bold">{stats.cuotaTotal.toFixed(2)}</span>
                    </div>
                    <div className="bg-white rounded-lg px-3 py-1.5 shadow text-sm">
                      <span className="font-bold text-blue-900">Aciertos: </span>
                      <span className="text-purple-600 font-bold">{stats.porcentajeAciertos.toFixed(0)}%</span>
                    </div>
                  </div>
                )}

                {/* Partidos - Sección desplegable */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t-2 border-gray-300">
                    {/* NUEVO: Panel de Estadísticas Individuales Mejorado */}
                    <div className="mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 shadow-lg">
                      <h3 className="text-sm font-extrabold text-blue-900 mb-3 flex items-center gap-2">
                        📊 ESTADÍSTICAS DE ESTA COMBINADA
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Columna izquierda: Desglose de partidos */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 shadow">
                            <span className="text-sm font-semibold text-gray-700">Total de partidos:</span>
                            <span className="text-lg font-bold text-blue-700">{stats.total}</span>
                          </div>
                          <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2 shadow border border-green-200">
                            <span className="text-sm font-semibold text-gray-700">✅ Acertados:</span>
                            <span className="text-lg font-bold text-green-700">{stats.acertados}</span>
                          </div>
                          <div className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2 shadow border border-red-200">
                            <span className="text-sm font-semibold text-gray-700">❌ Fallados:</span>
                            <span className="text-lg font-bold text-red-700">{stats.fallados}</span>
                          </div>
                          <div className="flex items-center justify-between bg-yellow-50 rounded-lg px-3 py-2 shadow border border-yellow-200">
                            <span className="text-sm font-semibold text-gray-700">⏳ Pendientes:</span>
                            <span className="text-lg font-bold text-yellow-700">{stats.pendientes}</span>
                          </div>
                        </div>

                        {/* Columna derecha: Métricas clave */}
                        <div className="space-y-2">
                          {/* Tasa de acierto */}
                          <div className="bg-white rounded-lg px-3 py-2 shadow">
                            <div className="text-xs text-gray-600 mb-1">Tasa de acierto</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-500 ${
                                    stats.porcentajeAciertos >= 70 ? 'bg-green-500' : 
                                    stats.porcentajeAciertos >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${stats.porcentajeAciertos}%` }}
                                >
                                  {stats.porcentajeAciertos > 15 && `${stats.porcentajeAciertos.toFixed(0)}%`}
                                </div>
                              </div>
                              <span className="text-lg font-bold text-purple-700 min-w-[50px] text-right">
                                {stats.porcentajeAciertos.toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          {/* Cuota total */}
                          <div className="bg-orange-50 rounded-lg px-3 py-3 shadow border border-orange-200">
                            <div className="text-xs text-gray-600 mb-1">Cuota total</div>
                            <div className="text-2xl font-black text-orange-600">{stats.cuotaTotal.toFixed(2)}</div>
                          </div>

                          {/* Estado general */}
                          <div className={`rounded-lg px-3 py-3 shadow-lg border-2 text-center ${
                            estadoGeneral === 'ganada' ? 'bg-green-100 border-green-400' :
                            estadoGeneral === 'perdida' ? 'bg-red-100 border-red-400' :
                            'bg-blue-100 border-blue-400'
                          }`}>
                            <div className="text-xs text-gray-600 mb-1">Estado</div>
                            <div className={`text-lg font-black uppercase ${
                              estadoGeneral === 'ganada' ? 'text-green-700' :
                              estadoGeneral === 'perdida' ? 'text-red-700' :
                              'text-blue-700'
                            }`}>
                              {estadoGeneral === 'ganada' && '✅ GANADA'}
                              {estadoGeneral === 'perdida' && '❌ PERDIDA'}
                              {estadoGeneral === 'pendiente' && '⏳ PENDIENTE'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Barra de progreso visual */}
                      <div className="bg-white rounded-lg p-3 shadow">
                        <div className="text-xs font-semibold text-gray-600 mb-2">Progreso de partidos</div>
                        <div className="flex gap-1 h-4 rounded-full overflow-hidden bg-gray-200">
                          {stats.acertados > 0 && (
                            <div 
                              className="bg-green-500 transition-all duration-500" 
                              style={{ width: `${(stats.acertados / stats.total) * 100}%` }}
                              title={`${stats.acertados} acertados`}
                            ></div>
                          )}
                          {stats.fallados > 0 && (
                            <div 
                              className="bg-red-500 transition-all duration-500" 
                              style={{ width: `${(stats.fallados / stats.total) * 100}%` }}
                              title={`${stats.fallados} fallados`}
                            ></div>
                          )}
                          {stats.pendientes > 0 && (
                            <div 
                              className="bg-yellow-400 transition-all duration-500" 
                              style={{ width: `${(stats.pendientes / stats.total) * 100}%` }}
                              title={`${stats.pendientes} pendientes`}
                            ></div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {comb.partidos.map((partido, idx) => {
                        const bgColor = partido.estado === "acertado" ? "bg-green-100" : 
                                       partido.estado === "fallado" ? "bg-red-100" : 
                                       "bg-blue-50";
                        const borderColor = partido.estado === "acertado" ? "border-green-600" : 
                                           partido.estado === "fallado" ? "border-red-600" : 
                                           "border-blue-300";
                        
                        return (
                          <div key={idx} className={`${bgColor} border-2 ${borderColor} rounded-xl p-3 shadow flex flex-col gap-1.5 transition-all duration-200 hover:scale-105`}>
                            <div className="font-bold text-base text-blue-900">{partido.equipo}</div>
                            <div className="inline-block bg-blue-100 text-xs font-bold text-blue-700 px-2 py-0.5 rounded-full mb-1 self-start">
                              {partido.liga}
                            </div>
                            <div className="text-xs text-gray-700 mb-1">{partido.descripcion}</div>
                            <div className="flex gap-1.5 mb-1 flex-wrap">
                              <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded text-xs font-semibold text-blue-700">
                                📅 {partido.dia}
                              </span>
                              <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-xs font-semibold text-gray-700">
                                {partido.fecha}
                              </span>
                              <span className="inline-flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded text-xs font-semibold text-green-700">
                                ⏰ {partido.hora}
                              </span>
                            </div>
                            <div className="flex gap-3 items-center mb-1 flex-wrap">
                              <span className="bg-orange-400 text-white font-bold rounded-full px-3 py-0.5 text-xs">
                                {partido.apuesta}
                              </span>
                              <span className="text-blue-600 font-bold text-sm">
                                Cuota: {partido.cuota}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-1">
                              {partido.estado === "acertado" && (
                                <span className="bg-green-600 text-white font-bold px-2 py-0.5 rounded-lg text-xs shadow">
                                  ✔ Acertado
                                </span>
                              )}
                              {partido.estado === "fallado" && (
                                <span className="bg-red-600 text-white font-bold px-2 py-0.5 rounded-lg text-xs shadow">
                                  ✗ Fallado
                                </span>
                              )}
                              {partido.estado === "pendiente" && (
                                <span className="bg-gray-500 text-white font-bold px-2 py-0.5 rounded-lg text-xs shadow">
                                  ⏳ Pendiente
                                </span>
                              )}
                            </div>

                            {/* NUEVO: Botones de edición de estado (solo admin) */}
                            {isCreator && (
                              <div className="mt-2 pt-2 border-t border-gray-300">
                                <div className="text-xs font-semibold text-gray-600 mb-1">Cambiar estado:</div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => actualizarEstadoPartido(comb.id, idx, 'acertado')}
                                    className={`flex-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                      partido.estado === 'acertado' 
                                        ? 'bg-green-600 text-white shadow-lg scale-105' 
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                  >
                                    ✅ Acertado
                                  </button>
                                  <button
                                    onClick={() => actualizarEstadoPartido(comb.id, idx, 'fallado')}
                                    className={`flex-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                      partido.estado === 'fallado' 
                                        ? 'bg-red-600 text-white shadow-lg scale-105' 
                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                    }`}
                                  >
                                    ❌ Fallado
                                  </button>
                                  <button
                                    onClick={() => actualizarEstadoPartido(comb.id, idx, 'pendiente')}
                                    className={`flex-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                      partido.estado === 'pendiente' 
                                        ? 'bg-gray-600 text-white shadow-lg scale-105' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    ⏳ Pendiente
                                  </button>
                                </div>
                              </div>
                            )}
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

      {/* Modal para introducir código */}
      {showCodigoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCodigoModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-purple-700 mb-4 text-center">Activa tu Código Premium</h2>
            <p className="text-gray-600 text-sm mb-6 text-center">
              Introduce el código que recibiste por email después de tu pago
            </p>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ej: PREMIUM-ABC123"
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none text-center text-lg font-bold tracking-wider mb-4"
              maxLength={20}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCodigoModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
                disabled={validandoCodigo}
              >
                Cancelar
              </button>
              <button
                onClick={validarCodigo}
                disabled={validandoCodigo || !codigo.trim()}
                className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validandoCodigo ? "Validando..." : "Activar"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              El código te dará acceso premium durante 30 días
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
