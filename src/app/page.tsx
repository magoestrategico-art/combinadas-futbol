"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase-config";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, increment, runTransaction, collection, addDoc, getDocs } from "firebase/firestore";

export default function HomePage() {
  // UID del creador (admin)
  const CREATOR_UID = "hDkn8W38nVZKQD1piviUrmwvHtt2";
  const [isCreator, setIsCreator] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [saveStatus10, setSaveStatus10] = useState<string | null>(null);
  const [saveStatus5, setSaveStatus5] = useState<string | null>(null);
  const [saveStatus3, setSaveStatus3] = useState<string | null>(null);
  const [saveHistorialStatus, setSaveHistorialStatus] = useState<{tipo: string, mensaje: string} | null>(null);
  
  // VERSIÓN: 2.0 - Sistema de Jornadas Implementado

  // Estructura de partido editable
  const [partidos10, setPartidos10] = useState<any[]>([]); // Cambiar el tipo inicial a 'any[]' para evitar errores de tipo

  // Estructura de partido editable
  const [partidos5, setPartidos5] = useState<any[]>([]); // Cambiar el tipo inicial a 'any[]' para evitar errores de tipo

  const [partidos3, setPartidos3] = useState<any[]>([]); // Cambiar el tipo inicial a 'any[]' para evitar errores de tipo

  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState([0, 0, 0]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [welcome, setWelcome] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Estado para desplegar cada combinada de forma independiente
  const [openPremium, setOpenPremium] = useState(false);
  const [openClasica, setOpenClasica] = useState(false);
  const [openSelect, setOpenSelect] = useState(false);

  // Contador de visitas
  const [visitas, setVisitas] = useState<number | null>(null);

  // NUEVO: Estados para temporada y jornada
  const [temporadaActual, setTemporadaActual] = useState("2025/26");
  const [jornadaActual, setJornadaActual] = useState(1);

  // Función para actualizar la jornada en Firestore
  const actualizarJornada = async (nuevaJornada: number) => {
    if (!isCreator) {
      console.warn("El usuario no es administrador. No se puede actualizar la jornada.");
      return;
    }

    try {
      const configRef = doc(db, "config", "jornadaActual");
      console.log("Intentando actualizar la jornada en Firestore a:", nuevaJornada);
      console.log("Verificando conexión con Firestore y permisos del usuario...");

      // Intentar actualizar el documento en Firestore
      await setDoc(configRef, { jornada: nuevaJornada }, { merge: true });
      console.log("Jornada actualizada correctamente en Firestore.");

      // Actualizar el estado local
      setJornadaActual(nuevaJornada);
      console.log("Estado local de jornadaActual actualizado a:", nuevaJornada);
    } catch (error) {
      console.error("Error al actualizar la jornada en Firestore:", error);
    }
  };

  // Manejar el cambio de jornada desde el input
  const manejarCambioJornada = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaJornada = parseInt(e.target.value) || 1;
    console.log("Nuevo valor ingresado para jornada:", nuevaJornada);
    setJornadaActual(nuevaJornada);
    console.log("Llamando a la función actualizarJornada con el valor:", nuevaJornada);
    actualizarJornada(nuevaJornada);
  };

  // Cargar la jornada actual desde Firestore al cargar la página
  useEffect(() => {
    async function cargarJornada() {
      try {
        const configRef = doc(db, "config", "jornadaActual");
        console.log("Intentando cargar la jornada desde Firestore...");
        const snapshot = await getDoc(configRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          console.log("Documento obtenido de Firestore:", data);
          if (data.jornada !== undefined) {
            setJornadaActual(data.jornada); // Asegurarse de que el estado se actualice correctamente
            console.log("Jornada cargada correctamente:", data.jornada);
          } else {
            console.warn("El documento 'jornadaActual' no contiene el campo 'jornada'.");
          }
        } else {
          console.warn("No se encontró el documento 'jornadaActual' en Firestore.");
        }
      } catch (error) {
        console.error("Error al cargar la jornada actual desde Firestore:", error);
      }
    }

    cargarJornada();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Evento onAuthStateChanged disparado. Usuario UID:", user?.uid, "Timestamp:", new Date().toISOString());
      setLoggedIn(!!user);
      setIsCreator(!!user && user.uid === CREATOR_UID);

      if (user) {
        console.log("Usuario autenticado:", user.uid);
        setWelcome("¡Bienvenido!");

        // Verificar si es premium
        if (user.uid === CREATOR_UID) {
          setIsPremium(true);
        } else {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const ahora = new Date();
              const expira = userData.premiumExpira?.toDate();

              if (userData.isPremium && expira && expira > ahora) {
                setIsPremium(true);
              } else {
                setIsPremium(false);
              }
            }
          } catch (error) {
            console.error("Error verificando premium:", error);
            setIsPremium(false);
          }
        }
      } else {
        console.log("No hay usuario autenticado.");
        setWelcome("");
        setIsPremium(false);
      }
    });

    return () => {
      console.log("Desuscribiendo evento onAuthStateChanged.");
      unsubscribe();
    };
  }, []);

  // Cargar y guardar partidos de Firestore para 10, 5 y 3
  useEffect(() => {
    async function fetchPartidos() {
      const snap10 = await getDoc(doc(db, "config", "partidos10"));
      if (snap10.exists()) {
        const data = snap10.data();
        if (Array.isArray(data.partidos) && data.partidos.length >= 5) {
          setPartidos10(data.partidos); // Esto ahora será compatible con el tipo 'any[]'
        } else {
          console.warn("El documento 'partidos10' no contiene al menos 5 partidos válidos.");
        }
      }
      const snap5 = await getDoc(doc(db, "config", "partidos5"));
      if (snap5.exists()) {
        const data = snap5.data();
        if (Array.isArray(data.partidos)) setPartidos5(data.partidos);
      }
      const snap3 = await getDoc(doc(db, "config", "partidos3"));
      if (snap3.exists()) {
        const data = snap3.data();
        if (Array.isArray(data.partidos)) setPartidos3(data.partidos);
      }
    }
    fetchPartidos();
  }, []);
  const guardarPartidos5 = async () => {
    await setDoc(doc(db, "config", "partidos5"), { partidos: partidos5 });
  };
  const guardarPartidos3 = async () => {
    await setDoc(doc(db, "config", "partidos3"), { partidos: partidos3 });
  };

  // Función para guardar combinada al historial
  const guardarAlHistorial = async (tipo: 'premium' | 'clasica' | 'select', partidos: any[], nombre: string) => {
    try {
      setSaveHistorialStatus({ tipo, mensaje: "Guardando..." });
      
      // Extraer solo los nombres de los equipos
      // Validar que cada partido tenga el campo 'equipo'
      const equipos = partidos.map(p => p.equipo || "Equipo no especificado");
      console.log("Equipos extraídos:", equipos);
      
      // Guardar información completa de los partidos (equipo, apuesta, cuota)
      const partidosInfo = partidos.map(p => ({
        equipo: p.equipo,
        apuesta: p.apuesta,
        cuota: p.cuota,
        liga: p.liga,
        //criterio: p.criterio, // Agregar el criterio al guardar los datos de los partidos
      }));
      
      // Calcular estadísticas iniciales de esta jornada
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

      // Crear el objeto de resultado para la jornada actual
      const resultadoJornadaActual = {
        jornada: jornadaActual,
        fecha: new Date().toISOString(),
        acertados,
        fallados,
        pendientes,
        estadoGeneral,
        cuotaTotal
      };

      // Crear estadísticas globales iniciales
      const estadisticas = {
        totalJornadas: 1,
        ganadas: estadoGeneral === "GANADA" ? 1 : 0,
        perdidas: estadoGeneral === "PERDIDA" ? 1 : 0,
        pendientes: estadoGeneral === "PENDIENTE" ? 1 : 0,
        porcentajeExito: estadoGeneral === "GANADA" ? 100 : 0,
        rachaActual: estadoGeneral === "GANADA" ? 1 : estadoGeneral === "PERDIDA" ? -1 : 0,
        mejorRacha: estadoGeneral === "GANADA" ? 1 : 0
      };

      // Guardar en Firebase con la nueva estructura
      await addDoc(collection(db, "historialCombinadas"), {
        tipo,
        nombre: `${nombre} - J${jornadaActual}`,
        equipos,
        partidos: partidosInfo, // NUEVO: Información completa de los partidos
        fechaCreacion: new Date().toISOString(),
        jornadaCreacion: jornadaActual,
        temporada: temporadaActual,
        resultadosPorJornada: {
          [jornadaActual]: resultadoJornadaActual
        },
        estadisticas
      });
      
      console.log("Datos que se guardarán en Firebase:", {
        tipo,
        nombre: `${nombre} - J${jornadaActual}`,
        equipos,
        partidos: partidosInfo,
        fechaCreacion: new Date().toISOString(),
        jornadaCreacion: jornadaActual,
        temporada: temporadaActual,
        resultadosPorJornada: {
          [jornadaActual]: resultadoJornadaActual
        },
        estadisticas
      });
      
      setSaveHistorialStatus({ tipo, mensaje: "✓ Guardada" });
      setTimeout(() => setSaveHistorialStatus(null), 3000);
    } catch (error) {
      console.error("Error al guardar:", error);
      setSaveHistorialStatus({ tipo, mensaje: "✗ Error" });
      setTimeout(() => setSaveHistorialStatus(null), 3000);
    }
  };

  // Contador de visitas
  useEffect(() => {
    const contadorRef = doc(db, "stats", "visitas");
    const incrementarVisita = async () => {
      try {
        // Intenta actualizar el contador
        await updateDoc(contadorRef, { total: increment(1) });
      } catch {
        // Si no existe, lo crea
        await setDoc(contadorRef, { total: 1 });
      }
      // Lee el valor actualizado
      const snap = await getDoc(contadorRef);
      setVisitas(snap.exists() ? snap.data().total : 1);
    };
    incrementarVisita();
  }, []);

  // Si aún no se han cargado los partidos, mostrar loading
  if (partidos10 === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#204080]">
        <span className="text-white text-2xl font-bold">Cargando partidos...</span>
      </main>
    );
  }

  const tabs = [
    partidos10.length > 0 && { label: "Combinada de 10 partidos", partidos: partidos10, color: "purple" },
    partidos5.length > 0 && { label: "Combinada de 5 partidos", partidos: partidos5, color: "green" },
    partidos3.length > 0 && { label: "Combinada de 3 partidos", partidos: partidos3, color: "orange" },
  ].filter(Boolean);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowLogin(false);
    } catch (err: any) {
      setError("Credenciales incorrectas");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setWelcome("");
    setEmail("");
    setPassword("");
    setError("");
  };

  // Prueba de guardado en historialCombinadas
  const guardarPrueba = async () => {
    try {
      const docRef = await addDoc(collection(db, "historialCombinadas"), {
        prueba: "Este es un test",
        usuario: "hDkn8W38nVZKQD1piviUrmwvHtt2",
        fecha: new Date().toISOString(),
      });
      console.log("Documento guardado con ID:", docRef.id);
    } catch (error) {
      console.error("Error al guardar el documento:", error);
    }
  };

  // Verificación de autenticación
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Usuario autenticado:", user.uid);
    } else {
      console.log("No hay usuario autenticado.");
    }
  });

  return (
    <main className="min-h-screen w-full bg-[#204080] flex flex-col">
      {isCreator && (
        <div className="w-full flex justify-center mt-4 mb-6">
          <Link href="/combinada-nueva">
            <button className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition">
              🚀 Ir a Combinada Personalizada
            </button>
          </Link>
        </div>
      )}
      {/* Cabecera */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between px-4 md:px-8 pt-4 md:pt-8 pb-4 md:pb-6 border-b-2 border-white/10 relative">
        {/* Botones en móvil arriba, en desktop a la derecha */}
        <div className="flex justify-end gap-2 mb-3 md:mb-0 md:absolute md:top-6 md:right-6">
          {!loggedIn ? (
            <>
              <button
                className="bg-blue-400 text-white px-2.5 py-1 md:px-3 md:py-1 rounded-full font-semibold text-xs md:text-sm shadow hover:bg-blue-500 transition"
                onClick={() => setShowLogin(true)}
              >
                Iniciar Sesión
              </button>
              <Link href="/register" className="bg-green-500 text-white px-2.5 py-1 md:px-3 md:py-1 rounded-full font-semibold text-xs md:text-sm shadow hover:bg-green-600 transition">Registrarse</Link>
            </>
          ) : (
            <button
              className="bg-red-500 text-white px-2.5 py-1 md:px-3 md:py-1 rounded-full font-semibold text-xs md:text-sm shadow hover:bg-red-600 transition"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          )}

          {/* Enlace a admin-partidos solo para el creador */}
          {isCreator && (
            <Link href="/admin-partidos" className="bg-yellow-400 text-blue-900 px-2.5 py-1 md:px-3 md:py-1 rounded-full font-semibold text-xs md:text-sm shadow hover:bg-yellow-500 transition">
              Admin
            </Link>
          )}
        </div>
        
        {/* Título centrado */}
        <h1 className="text-xl md:text-3xl font-extrabold text-white text-center w-full tracking-wide leading-tight" style={{textShadow:'0 2px 8px rgba(0,0,0,0.3)'}}>Apuestas Combinadas con Estrategia</h1>
      </header>

      {/* Modal de login */}
      {showLogin && !loggedIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white/95 p-10 rounded-2xl shadow-2xl border border-blue-300 relative">
            <button
              className="absolute top-4 right-4 text-blue-700 text-2xl font-bold hover:text-red-500"
              onClick={() => setShowLogin(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <h2 className="text-3xl font-extrabold mb-7 text-[#204080] tracking-tight drop-shadow" style={{textShadow:'0 2px 0 #fff'}}>Iniciar sesión</h2>
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full mb-5 p-4 border-2 border-blue-200 rounded-lg bg-blue-50 text-lg focus:outline-none focus:border-blue-400 transition placeholder:text-blue-400"
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full mb-5 p-4 border-2 border-blue-200 rounded-lg bg-blue-50 text-lg focus:outline-none focus:border-blue-400 transition placeholder:text-blue-400"
                required
              />
              {error && <div className="text-red-500 mb-5 font-semibold text-center">{error}</div>}
              <button type="submit" className="w-full bg-gradient-to-r from-[#204080] to-blue-400 text-white py-3 rounded-lg font-bold text-xl shadow hover:from-blue-700 hover:to-blue-500 transition">Entrar</button>
            </form>
          </div>
        </div>
      )}

      {/* Mensaje de bienvenida */}
      {welcome && (
        <div className="flex justify-center mt-3">
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold shadow text-sm">{welcome}</div>
        </div>
      )}

      {/* NUEVO: Controles de Temporada y Jornada (solo admin) */}
      {isCreator && (
        <div className="flex justify-center gap-3 mt-3 px-3">
          <div className="bg-purple-100 border-2 border-purple-400 rounded-lg px-4 py-2 flex items-center gap-2 shadow">
            <label htmlFor="temporada" className="text-purple-900 font-bold text-sm">📅 Temporada:</label>
            <input 
              id="temporada"
              type="text" 
              value={temporadaActual}
              onChange={(e) => setTemporadaActual(e.target.value)}
              className="bg-white border border-purple-300 rounded px-2 py-1 text-sm font-semibold w-24 focus:outline-none focus:border-purple-500"
              placeholder="2024/25"
            />
          </div>
          <div className="bg-green-100 border-2 border-green-400 rounded-lg px-4 py-2 flex items-center gap-2 shadow">
            <label htmlFor="jornada" className="text-green-900 font-bold text-sm">🏁 Jornada:</label>
            <input 
              id="jornada"
              type="number" 
              value={jornadaActual}
              onChange={(e) => {
                const nuevaJornada = parseInt(e.target.value) || 1;
                console.log("Nuevo valor ingresado para jornada:", nuevaJornada);
                setJornadaActual(nuevaJornada);
                console.log("Llamando a la función actualizarJornada con el valor:", nuevaJornada);
                actualizarJornada(nuevaJornada);
              }}
              className="bg-white border border-green-300 rounded px-2 py-1 text-sm font-semibold w-16 focus:outline-none focus:border-green-500"
              min="1"
            />
          </div>
        </div>
      )}

      {/* Botones principales */}
      <div className="flex flex-wrap justify-center gap-2 mt-3 px-3">
        {loggedIn && (
          <Link href="/combinadas" className="bg-blue-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-semibold flex items-center gap-1 shadow border border-white hover:bg-blue-800 transition text-xs md:text-sm">
            <span>👤</span> GUIA Y TUTORIAL
          </Link>
        )}
        {!isPremium && (
          <Link href="/premium" className={`bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-bold flex items-center gap-1 shadow-lg hover:from-yellow-500 hover:to-orange-600 transition text-xs md:text-sm ${loggedIn ? 'animate-pulse' : ''}`}>
            <span>⭐</span> Hazte Premium
          </Link>
        )}
        <Link href="/guardadas" className="bg-indigo-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-semibold flex items-center gap-1 shadow border border-white hover:bg-indigo-700 transition text-xs md:text-sm">
          <span>📁</span> Historial
        </Link>
        <Link href="/ganadora" className="bg-orange-400 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-semibold flex items-center gap-1 shadow hover:bg-orange-500 transition text-xs md:text-sm">
          <span>🏆</span> Ganadora Premium
        </Link>
        {isCreator && (
          <Link href="/admin-codigos" className="bg-purple-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-semibold flex items-center gap-1 shadow hover:bg-purple-700 transition text-xs md:text-sm">
            <span>🔑</span> Códigos Premium
          </Link>
        )}
        <Link href="/simulador" className="bg-green-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-semibold shadow hover:bg-green-600 transition text-xs md:text-sm">Simulador</Link>
        <Link href="/analisis" className="bg-blue-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-semibold flex items-center gap-1 shadow border border-white hover:bg-blue-600 transition text-xs md:text-sm">
          <span>📊</span> Ir a Análisis
        </Link>
      </div>

      {/* Tarjetas de combinadas con edición admin */}
      <div className="w-full flex flex-col md:flex-row items-stretch md:items-start justify-center mt-4 md:mt-6 gap-6 px-3 md:px-4">
        {/* Combinada de 10 partidos */}
        <div className="bg-white rounded-xl shadow-md md:shadow-lg px-4 py-3 md:px-5 md:py-4 flex flex-col items-center min-w-[300px] max-w-xs w-full md:w-auto transition-all duration-300 border border-gray-200 hover:shadow-2xl md:hover:scale-105 md:hover:-translate-y-1 animate-fadeIn">
          <div className="flex items-center gap-3 w-full justify-between cursor-pointer" onClick={() => setOpenPremium(open => !open)}>
            <div className="text-lg md:text-xl font-extrabold text-purple-700">
              Combinada<br className="md:hidden" /> Premium
            </div>
            <span className="rounded-full px-3 md:px-4 py-1 text-white font-bold text-xs md:text-sm bg-purple-500 text-center leading-tight">10<br className="md:hidden" />Equipos</span>
            <span className="rounded-full bg-cyan-100 p-1.5 flex items-center justify-center transition-transform hover:rotate-180 duration-300">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" stroke="#1e90ff" strokeWidth="2" strokeLinecap="round"/></svg>
            </span>
          </div>
          {openPremium && (
            <div className="w-full mt-3 flex flex-col gap-2 max-h-[500px] overflow-y-auto animate-slideDown">
              {partidos10.map((p, idx) => {
                const bgColor = p.estado === "acertado" ? "bg-green-50" : p.estado === "fallado" ? "bg-red-50" : "bg-white";
                const borderColor = p.estado === "acertado" ? "border-green-500" : p.estado === "fallado" ? "border-red-500" : "border-gray-200";
                return (
                <div key={idx} className={`${bgColor} border-2 ${borderColor} rounded-lg p-3 shadow-sm flex flex-col gap-1.5`}>
                  {editMode && isCreator ? (
                    <>
                      <input className="font-bold text-base text-blue-900 mb-0.5 px-2 py-1 border rounded" value={p.equipo} onChange={e => setPartidos10(arr => arr.map((x, i) => i === idx ? { ...x, equipo: e.target.value } : x))} />
                      <input className="text-xs font-semibold text-gray-600 mb-0.5 px-2 py-1 border rounded" value={p.liga} onChange={e => setPartidos10(arr => arr.map((x, i) => i === idx ? { ...x, liga: e.target.value } : x))} />
                      <input className="text-sm text-gray-700 mb-0.5 px-2 py-1 border rounded" value={p.descripcion} onChange={e => setPartidos10(arr => arr.map((x, i) => i === idx ? { ...x, descripcion: e.target.value } : x))} />
                      <div className="flex gap-1 mb-0.5">
                        <select className="w-20 text-xs rounded px-1 py-1 border" value={p.dia} onChange={e => setPartidos10(arr => arr.map((x, i) => i === idx ? { ...x, dia: e.target.value } : x))}>
                          <option value="Lunes">Lunes</option>
                          <option value="Martes">Martes</option>
                          <option value="Miércoles">Miércoles</option>
                          <option value="Jueves">Jueves</option>
                          <option value="Viernes">Viernes</option>
                          <option value="Sábado">Sábado</option>
                          <option value="Domingo">Domingo</option>
                        </select>
                        <input type="text" placeholder="dd/mm/yyyy" className="w-24 text-xs rounded px-1 py-1 border" value={p.fecha} onChange={e => setPartidos10(arr => arr.map((x, i) => i === idx ? { ...x, fecha: e.target.value } : x))} />
                        <input type="text" placeholder="HH:MM" className="w-16 text-xs rounded px-1 py-1 border" value={p.hora} onChange={e => setPartidos10(arr => arr.map((x, i) => i === idx ? { ...x, hora: e.target.value } : x))} />
                      </div>
                      <div className="flex gap-2 items-center mb-0.5">
                        <input className="bg-orange-400 text-white font-semibold rounded-full px-3 py-1 text-xs flex-1" value={p.apuesta} onChange={e => setPartidos10(arr => arr.map((x, i) => i === idx ? { ...x, apuesta: e.target.value } : x))} />
                        <input className="text-blue-600 font-bold text-sm w-16 px-1 py-1 border rounded" value={p.cuota} onChange={e => setPartidos10(arr => arr.map((x, i) => i === idx ? { ...x, cuota: e.target.value } : x))} />
                      </div>
                      <select className="w-28 text-xs rounded px-1 py-1 border" value={p.estado} onChange={e => setPartidos10(arr => arr.map((x, i) => i === idx ? { ...x, estado: e.target.value } : x))}>
                        <option value="pendiente">Pendiente</option>
                        <option value="acertado">✔ Acertado</option>
                        <option value="fallado">✗ Fallado</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <div className="font-bold text-base text-blue-900">{p.equipo}</div>
                      <div className="inline-block bg-blue-100 text-xs font-semibold text-blue-700 px-2 py-0.5 rounded-full mb-0.5">{p.liga}</div>
                      <div className="text-xs text-gray-600 mb-0.5">{p.descripcion}</div>
                      <div className="flex gap-1.5 mb-0.5 flex-wrap">
                        <span className="inline-flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.5 rounded text-xs font-semibold text-blue-700"><span role="img" aria-label="calendario">📅</span>{p.dia}</span>
                        <span className="inline-flex items-center gap-0.5 bg-gray-100 px-1.5 py-0.5 rounded text-xs font-semibold text-gray-700">{p.fecha}</span>
                        <span className="inline-flex items-center gap-0.5 bg-green-100 px-1.5 py-0.5 rounded text-xs font-semibold text-green-700"><span role="img" aria-label="reloj">⏰</span>{p.hora}</span>
                      </div>
                      <div className="flex gap-2 items-center mb-0.5">
                        <span className="bg-orange-400 text-white font-semibold rounded-full px-3 py-1 text-xs">{p.apuesta}</span>
                        <span className="text-blue-600 font-bold text-sm">Cuota: {p.cuota}</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        {p.estado === "acertado" && <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-xl text-xs">✔ Acertado</span>}
                        {p.estado === "fallado" && <span className="bg-red-100 text-red-500 font-bold px-3 py-1 rounded-xl text-xs">✗ Fallado</span>}
                        {p.estado === "pendiente" && <span className="bg-gray-100 text-gray-500 font-bold px-3 py-1 rounded-xl text-xs">Pendiente</span>}
                      </div>
                    </>
                  )}
                </div>
                );
              })}
              {isCreator && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button onClick={() => setEditMode(e => !e)} className="bg-yellow-400 text-blue-900 px-4 py-1.5 rounded-lg font-semibold shadow hover:bg-yellow-500 transition text-sm">{editMode ? 'Cancelar' : 'Editar'}</button>
                  {editMode && (
                    <button
                      onClick={async () => {
                        setSaveStatus10(null);
                        try {
                          // Ordenar por fecha y hora antes de guardar
                          const partidosOrdenados = [...partidos10].sort((a, b) => {
                            // Convertir fecha dd/mm/yyyy a yyyy-mm-dd
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
                          await setDoc(doc(db, "config", "partidos10"), { partidos: partidosOrdenados });
                          setPartidos10(partidosOrdenados); // Actualizar estado local con orden
                          setSaveStatus10("Guardado correctamente");
                          setEditMode(false);
                        } catch (err) {
                          setSaveStatus10("Error al guardar");
                          console.error("Error al guardar partidos10:", err);
                        }
                      }}
                      className="bg-green-500 text-white px-4 py-1.5 rounded-lg font-semibold shadow hover:bg-green-600 transition text-sm"
                    >
                      💾 Guardar
                    </button>
                  )}
                  <button
                    onClick={() => guardarAlHistorial('premium', partidos10, 'Combinada Premium')}
                    className="bg-purple-600 text-white px-4 py-1.5 rounded-lg font-semibold shadow hover:bg-purple-700 transition text-sm"
                  >
                    📁 Historial
                  </button>
                  {saveStatus10 && (
                    <span className={`text-sm font-semibold ${saveStatus10.includes("Error") ? "text-red-600" : "text-green-600"}`}>{saveStatus10}</span>
                  )}
                  {saveHistorialStatus?.tipo === 'premium' && (
                    <span className="text-purple-700 font-semibold text-sm">{saveHistorialStatus.mensaje}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Combinada de 5 partidos */}
        <div className="bg-white rounded-xl shadow-md md:shadow-lg px-4 py-3 md:px-5 md:py-4 flex flex-col items-center min-w-[300px] max-w-xs w-full md:w-auto transition-all duration-300 border border-gray-200 hover:shadow-2xl md:hover:scale-105 md:hover:-translate-y-1 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 w-full justify-between cursor-pointer" onClick={() => setOpenClasica(open => !open)}>
            <div className="text-lg md:text-xl font-extrabold text-green-700">
              Combinada<br className="md:hidden" /> Clásica
            </div>
            <span className="rounded-full px-3 md:px-4 py-1 text-white font-bold text-xs md:text-sm bg-green-500 text-center leading-tight">5<br className="md:hidden" />Equipos</span>
            <span className="rounded-full bg-cyan-100 p-1.5 flex items-center justify-center transition-transform hover:rotate-180 duration-300">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" stroke="#1e90ff" strokeWidth="2" strokeLinecap="round"/></svg>
            </span>
          </div>
          {openClasica && (
            <div className="w-full mt-3 flex flex-col gap-2 max-h-[500px] overflow-y-auto animate-slideDown">
              {partidos5.map((p, idx) => {
                const bgColor = p.estado === "acertado" ? "bg-green-50" : p.estado === "fallado" ? "bg-red-50" : "bg-white";
                const borderColor = p.estado === "acertado" ? "border-green-500" : p.estado === "fallado" ? "border-red-500" : "border-gray-200";
                return (
                <div key={idx} className={`${bgColor} border-[3px] ${borderColor} rounded-2xl p-4 shadow flex flex-col gap-2`}>
                  {editMode && isCreator ? (
                    <>
                      <input className="font-bold text-lg text-blue-900 mb-1" value={p.equipo} onChange={e => setPartidos5(arr => arr.map((x, i) => i === idx ? { ...x, equipo: e.target.value } : x))} />
                      <input className="text-xs font-bold text-gray-500 mb-1" value={p.liga} onChange={e => setPartidos5(arr => arr.map((x, i) => i === idx ? { ...x, liga: e.target.value } : x))} />
                      <input className="text-sm text-gray-700 mb-1" value={p.descripcion} onChange={e => setPartidos5(arr => arr.map((x, i) => i === idx ? { ...x, descripcion: e.target.value } : x))} />
                      <div className="flex gap-2 mb-1">
                        <select className="w-24 text-xs rounded px-2 border" value={p.dia} onChange={e => setPartidos5(arr => arr.map((x, i) => i === idx ? { ...x, dia: e.target.value } : x))}>
                          <option value="Lunes">Lunes</option>
                          <option value="Martes">Martes</option>
                          <option value="Miércoles">Miércoles</option>
                          <option value="Jueves">Jueves</option>
                          <option value="Viernes">Viernes</option>
                          <option value="Sábado">Sábado</option>
                          <option value="Domingo">Domingo</option>
                        </select>
                        <input type="date" className="w-28 text-xs rounded px-2 border" value={p.fecha} onChange={e => setPartidos5(arr => arr.map((x, i) => i === idx ? { ...x, fecha: e.target.value } : x))} />
                        <input type="time" className="w-20 text-xs rounded px-2 border" value={p.hora} onChange={e => setPartidos5(arr => arr.map((x, i) => i === idx ? { ...x, hora: e.target.value } : x))} />
                      </div>
                      <div className="flex gap-4 items-center mb-1">
                        <input className="bg-orange-400 text-white font-bold rounded-full px-4 py-1 text-sm" value={p.apuesta} onChange={e => setPartidos5(arr => arr.map((x, i) => i === idx ? { ...x, apuesta: e.target.value } : x))} />
                        <input className="text-blue-600 font-bold text-base ml-2" value={p.cuota} onChange={e => setPartidos5(arr => arr.map((x, i) => i === idx ? { ...x, cuota: e.target.value } : x))} />
                      </div>
                      <select className="w-32 text-xs rounded px-2 border" value={p.estado} onChange={e => setPartidos5(arr => arr.map((x, i) => i === idx ? { ...x, estado: e.target.value } : x))}>
                        <option value="pendiente">Pendiente</option>
                        <option value="acertado">✔ Acertado</option>
                        <option value="fallado">✗ Fallado</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <div className="font-bold text-lg text-blue-900">{p.equipo}</div>
                      <div className="inline-block bg-blue-100 text-xs font-bold text-blue-700 px-3 py-1 rounded-full mb-1">{p.liga}</div>
                      <div className="text-sm text-gray-700 mb-1">{p.descripcion}</div>
                      <div className="flex gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-xs font-semibold text-blue-700"><span role="img" aria-label="calendario">📅</span>{p.dia}</span>
                        <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs font-semibold text-gray-700">{p.fecha}</span>
                        <span className="inline-flex items-center gap-1 bg-green-100 px-2 py-1 rounded text-xs font-semibold text-green-700"><span role="img" aria-label="reloj">⏰</span>{p.hora}</span>
                      </div>
                      <div className="flex gap-4 items-center mb-1">
                        <span className="bg-orange-400 text-white font-bold rounded-full px-4 py-1 text-sm">{p.apuesta}</span>
                        <span className="text-blue-600 font-bold text-base ml-2">Cuota: {p.cuota}</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        {p.estado === "acertado" && <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-xl text-xs">✔ Acertado</span>}
                        {p.estado === "fallado" && <span className="bg-red-100 text-red-500 font-bold px-3 py-1 rounded-xl text-xs">✗ Fallado</span>}
                        {p.estado === "pendiente" && <span className="bg-gray-100 text-gray-500 font-bold px-3 py-1 rounded-xl text-xs">Pendiente</span>}
                      </div>
                    </>
                  )}
                </div>
                );
              })}
              {isCreator && (
                <div className="flex gap-4 mt-6 flex-wrap">
                  <button onClick={() => setEditMode(e => !e)} className="bg-yellow-400 text-blue-900 px-6 py-2 rounded-lg font-bold shadow hover:bg-yellow-500 transition">{editMode ? 'Cancelar' : 'Editar'}</button>
                  {editMode && (
                    <button
                      onClick={async () => {
                        setSaveStatus5(null);
                        try {
                          // Ordenar por fecha y hora antes de guardar
                          const partidosOrdenados = [...partidos5].sort((a, b) => {
                            // Convertir fecha dd/mm/yyyy a yyyy-mm-dd
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
                          await setDoc(doc(db, "config", "partidos5"), { partidos: partidosOrdenados });
                          setPartidos5(partidosOrdenados); // Actualizar estado local con orden
                          setSaveStatus5("Guardado correctamente");
                          setEditMode(false);
                        } catch (err) {
                          setSaveStatus5("Error al guardar");
                          console.error("Error al guardar partidos5:", err);
                        }
                      }}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-green-600 transition"
                    >
                      Guardar Cambios
                    </button>
                  )}
                  <button
                    onClick={() => guardarAlHistorial('clasica', partidos5, 'Combinada Clásica')}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-green-700 transition"
                  >
                    📁 Guardar al Historial
                  </button>
                  {saveStatus5 && (
                    <span className={saveStatus5.includes("Error") ? "text-red-600" : "text-green-600"}>{saveStatus5}</span>
                  )}
                  {saveHistorialStatus?.tipo === 'clasica' && (
                    <span className="text-green-700 font-semibold">{saveHistorialStatus.mensaje}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Combinada de 3 partidos */}
        <div className="bg-white rounded-xl shadow-md md:shadow-lg px-4 py-3 md:px-5 md:py-4 flex flex-col items-center min-w-[300px] max-w-xs w-full md:w-auto transition-all duration-300 border border-gray-200 hover:shadow-2xl md:hover:scale-105 md:hover:-translate-y-1 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 w-full justify-between cursor-pointer" onClick={() => setOpenSelect(open => !open)}>
            <div className="text-lg md:text-xl font-extrabold text-orange-600">
              Combinada<br className="md:hidden" /> Select
            </div>
            <span className="rounded-full px-3 md:px-4 py-1 text-white font-bold text-xs md:text-sm bg-orange-500 text-center leading-tight">3<br className="md:hidden" />Equipos</span>
            <span className="rounded-full bg-cyan-100 p-1.5 flex items-center justify-center transition-transform hover:rotate-180 duration-300">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" stroke="#1e90ff" strokeWidth="2" strokeLinecap="round"/></svg>
            </span>
          </div>
          {openSelect && (
            <div className="w-full mt-3 flex flex-col gap-2 max-h-[500px] overflow-y-auto animate-slideDown">
              {partidos3.map((p, idx) => {
                const bgColor = p.estado === "acertado" ? "bg-green-50" : p.estado === "fallado" ? "bg-red-50" : "bg-white";
                const borderColor = p.estado === "acertado" ? "border-green-500" : p.estado === "fallado" ? "border-red-500" : "border-gray-200";
                return (
                <div key={idx} className={`${bgColor} border-[3px] ${borderColor} rounded-2xl p-4 shadow flex flex-col gap-2`}>
                  {editMode && isCreator ? (
                    <>
                      <input className="font-bold text-lg text-blue-900 mb-1" value={p.equipo} onChange={e => setPartidos3(arr => arr.map((x, i) => i === idx ? { ...x, equipo: e.target.value } : x))} />
                      <input className="text-xs font-bold text-gray-500 mb-1" value={p.liga} onChange={e => setPartidos3(arr => arr.map((x, i) => i === idx ? { ...x, liga: e.target.value } : x))} />
                      <input className="text-sm text-gray-700 mb-1" value={p.descripcion} onChange={e => setPartidos3(arr => arr.map((x, i) => i === idx ? { ...x, descripcion: e.target.value } : x))} />
                      <div className="flex gap-2 mb-1">
                        <select className="w-24 text-xs rounded px-2 border" value={p.dia} onChange={e => setPartidos3(arr => arr.map((x, i) => i === idx ? { ...x, dia: e.target.value } : x))}>
                          <option value="Lunes">Lunes</option>
                          <option value="Martes">Martes</option>
                          <option value="Miércoles">Miércoles</option>
                          <option value="Jueves">Jueves</option>
                          <option value="Viernes">Viernes</option>
                          <option value="Sábado">Sábado</option>
                          <option value="Domingo">Domingo</option>
                        </select>
                        <input type="date" className="w-28 text-xs rounded px-2 border" value={p.fecha} onChange={e => setPartidos3(arr => arr.map((x, i) => i === idx ? { ...x, fecha: e.target.value } : x))} />
                        <input type="time" className="w-20 text-xs rounded px-2 border" value={p.hora} onChange={e => setPartidos3(arr => arr.map((x, i) => i === idx ? { ...x, hora: e.target.value } : x))} />
                      </div>
                      <div className="flex gap-4 items-center mb-1">
                        <input className="bg-orange-400 text-white font-bold rounded-full px-4 py-1 text-sm" value={p.apuesta} onChange={e => setPartidos3(arr => arr.map((x, i) => i === idx ? { ...x, apuesta: e.target.value } : x))} />
                        <input className="text-blue-600 font-bold text-base ml-2" value={p.cuota} onChange={e => setPartidos3(arr => arr.map((x, i) => i === idx ? { ...x, cuota: e.target.value } : x))} />
                      </div>
                      <select className="w-32 text-xs rounded px-2 border" value={p.estado} onChange={e => setPartidos3(arr => arr.map((x, i) => i === idx ? { ...x, estado: e.target.value } : x))}>
                        <option value="pendiente">Pendiente</option>
                        <option value="acertado">✔ Acertado</option>
                        <option value="fallado">✗ Fallado</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <div className="font-bold text-lg text-blue-900">{p.equipo}</div>
                      <div className="inline-block bg-blue-100 text-xs font-bold text-blue-700 px-3 py-1 rounded-full mb-1">{p.liga}</div>
                      <div className="text-sm text-gray-700 mb-1">{p.descripcion}</div>
                      <div className="flex gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-xs font-semibold text-blue-700"><span role="img" aria-label="calendario">📅</span>{p.dia}</span>
                        <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs font-semibold text-gray-700">{p.fecha}</span>
                        <span className="inline-flex items-center gap-1 bg-green-100 px-2 py-1 rounded text-xs font-semibold text-green-700"><span role="img" aria-label="reloj">⏰</span>{p.hora}</span>
                      </div>
                      <div className="flex gap-4 items-center mb-1">
                        <span className="bg-orange-400 text-white font-bold rounded-full px-4 py-1 text-sm">{p.apuesta}</span>
                        <span className="text-blue-600 font-bold text-base ml-2">Cuota: {p.cuota}</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        {p.estado === "acertado" && <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-xl text-xs">✔ Acertado</span>}
                        {p.estado === "fallado" && <span className="bg-red-100 text-red-500 font-bold px-3 py-1 rounded-xl text-xs">✗ Fallado</span>}
                        {p.estado === "pendiente" && <span className="bg-gray-100 text-gray-500 font-bold px-3 py-1 rounded-xl text-xs">Pendiente</span>}
                      </div>
                    </>
                  )}
                </div>
                );
              })}
              {isCreator && (
                <div className="flex gap-4 mt-6 flex-wrap">
                  <button onClick={() => setEditMode(e => !e)} className="bg-yellow-400 text-blue-900 px-6 py-2 rounded-lg font-bold shadow hover:bg-yellow-500 transition">{editMode ? 'Cancelar' : 'Editar'}</button>
                  {editMode && (
                    <button
                      onClick={async () => {
                        setSaveStatus3(null);
                        try {
                          // Ordenar por fecha y hora antes de guardar
                          const partidosOrdenados = [...partidos3].sort((a, b) => {
                            // Convertir fecha dd/mm/yyyy a yyyy-mm-dd
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
                          await setDoc(doc(db, "config", "partidos3"), { partidos: partidosOrdenados });
                          setPartidos3(partidosOrdenados); // Actualizar estado local con orden
                          setSaveStatus3("Guardado correctamente");
                          setEditMode(false);
                        } catch (err) {
                          setSaveStatus3("Error al guardar");
                          console.error("Error al guardar partidos3:", err);
                        }
                      }}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-green-600 transition"
                    >
                      Guardar Cambios
                    </button>
                  )}
                  <button
                    onClick={() => guardarAlHistorial('select', partidos3, 'Combinada Select')}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-orange-700 transition"
                  >
                    📁 Guardar al Historial
                  </button>
                  {saveStatus3 && (
                    <span className={saveStatus3.includes("Error") ? "text-red-600" : "text-green-600"}>{saveStatus3}</span>
                  )}
                  {saveHistorialStatus?.tipo === 'select' && (
                    <span className="text-orange-700 font-semibold">{saveHistorialStatus.mensaje}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
        {/* Aquí estaba el recuadro de selección de partido, eliminado por petición */}
      {isCreator && (
        <div className="w-full flex justify-center mt-8">
          <span className="text-white text-lg font-semibold bg-blue-900 px-6 py-2 rounded-full shadow">Visitas: {visitas !== null ? visitas : '...'}</span>
        </div>
      )}
  </main>
  );
}
