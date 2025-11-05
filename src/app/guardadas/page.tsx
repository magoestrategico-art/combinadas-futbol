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

interface CombinadaGuardada {
  id: string;
  tipo: string;
  nombre: string;
  fechaGuardado: string;
  partidos: Partido[];
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
  }, [combinadas, filtroTipo, filtroEstado, busqueda, ordenamiento]);

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

  const aplicarFiltros = () => {
    let resultado = [...combinadas];

    // Filtro por tipo
    if (filtroTipo !== "todos") {
      resultado = resultado.filter(c => c.tipo === filtroTipo);
    }

    // Filtro por estado
    if (filtroEstado !== "todos") {
      resultado = resultado.filter(c => {
        const stats = calcularEstadisticas(c);
        if (filtroEstado === "ganadas") return stats.todosAcertados;
        if (filtroEstado === "perdidas") return stats.algunoFallado;
        if (filtroEstado === "pendientes") return stats.todosPendientes;
        return true;
      });
    }

    // Búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(c => 
        c.nombre.toLowerCase().includes(termino) ||
        c.partidos.some(p => p.equipo.toLowerCase().includes(termino))
      );
    }

    // Ordenamiento
    if (ordenamiento === "fecha-desc") {
      resultado.sort((a, b) => new Date(b.fechaGuardado).getTime() - new Date(a.fechaGuardado).getTime());
    } else if (ordenamiento === "fecha-asc") {
      resultado.sort((a, b) => new Date(a.fechaGuardado).getTime() - new Date(b.fechaGuardado).getTime());
    } else if (ordenamiento === "aciertos") {
      resultado.sort((a, b) => {
        const statsA = calcularEstadisticas(a);
        const statsB = calcularEstadisticas(b);
        return statsB.porcentajeAciertos - statsA.porcentajeAciertos;
      });
    }

    setCombinadasFiltradas(resultado);
  };

  const calcularEstadisticas = (combinada: CombinadaGuardada) => {
    const acertados = combinada.partidos.filter(p => p.estado === "acertado").length;
    const fallados = combinada.partidos.filter(p => p.estado === "fallado").length;
    const pendientes = combinada.partidos.filter(p => p.estado === "pendiente").length;
    const total = combinada.partidos.length;
    const porcentajeAciertos = total > 0 ? (acertados / total) * 100 : 0;
    const cuotaTotal = combinada.partidos.reduce((acc, p) => acc * parseFloat(p.cuota), 1);
    const todosAcertados = acertados === total;
    const algunoFallado = fallados > 0;
    const todosPendientes = pendientes === total;

    return { acertados, fallados, pendientes, total, porcentajeAciertos, cuotaTotal, todosAcertados, algunoFallado, todosPendientes };
  };

  const calcularEstadisticasGlobales = () => {
    const totalCombinadas = combinadas.length;
    const ganadas = combinadas.filter(c => calcularEstadisticas(c).todosAcertados).length;
    const perdidas = combinadas.filter(c => calcularEstadisticas(c).algunoFallado).length;
    const pendientes = combinadas.filter(c => calcularEstadisticas(c).todosPendientes).length;
    const porcentajeGanadas = totalCombinadas > 0 ? (ganadas / totalCombinadas) * 100 : 0;

    return { totalCombinadas, ganadas, perdidas, pendientes, porcentajeGanadas };
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

      // Verificar si ya fue usado
      if (codigoData.usado) {
        alert("Este código ya ha sido utilizado");
        setValidandoCodigo(false);
        return;
      }

      // Activar premium por 30 días
      const fechaActivacion = new Date();
      const fechaExpiracion = new Date();
      fechaExpiracion.setDate(fechaExpiracion.getDate() + 30);

      // Actualizar código como usado
      await updateDoc(doc(db, "codigosPremium", codigoDoc.id), {
        usado: true,
        userId: userId,
        fechaActivacion: fechaActivacion.toISOString(),
        fechaExpiracion: fechaExpiracion.toISOString()
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
                          href="https://ko-fi.com/Vicente1742"
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
                    {/* Estadísticas detalladas */}
                    <div className="mb-3 flex flex-wrap gap-3 items-center bg-white/80 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-900">Partidos:</span>
                        <span className="text-green-600 font-bold">{stats.acertados} ✔</span>
                        <span className="text-red-600 font-bold">{stats.fallados} ✗</span>
                        <span className="text-gray-600 font-bold">{stats.pendientes} ⏳</span>
                        <span className="text-gray-500 text-xs">/ {stats.total}</span>
                      </div>
                      <div className="h-6 w-px bg-gray-300"></div>
                      <div>
                        <span className="font-bold text-blue-900">Cuota: </span>
                        <span className="text-orange-600 font-bold text-base">{stats.cuotaTotal.toFixed(2)}</span>
                      </div>
                      <div className="h-6 w-px bg-gray-300"></div>
                      <div>
                        <span className="font-bold text-blue-900">% Aciertos: </span>
                        <span className="text-purple-600 font-bold text-base">{stats.porcentajeAciertos.toFixed(0)}%</span>
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
