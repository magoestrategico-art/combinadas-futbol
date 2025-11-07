"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase-config";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, increment, runTransaction, collection, addDoc } from "firebase/firestore";

export default function HomePage() {
  // UID del creador (admin)
  const CREATOR_UID = "hDkn8W38nVZKQD1piviUrmwvHtt2";
  const [isCreator, setIsCreator] = useState(false);
  const [saveStatus10, setSaveStatus10] = useState<string | null>(null);
  const [saveStatus5, setSaveStatus5] = useState<string | null>(null);
  const [saveStatus3, setSaveStatus3] = useState<string | null>(null);
  const [saveHistorialStatus, setSaveHistorialStatus] = useState<{tipo: string, mensaje: string} | null>(null);

  // Estructura de partido editable
  const defaultPartidos10 = [
    {
      equipo: "Bahia",
      liga: "CAMPEONATO BRASILEIRO SÉRIE A",
      descripcion: "El Tricolor de Aço de Salvador",
      dia: "Viernes",
      fecha: "17/10/2025",
      hora: "02:30",
      apuesta: "-3,5 GOLES",
      cuota: "1.80",
      estado: "pendiente"
    },
    {
    equipo: "Flamengo",
    liga: "CAMPEONATO BRASILEIRO SÉRIE A",
    descripcion: "O Mengão, o más querido",
    dia: "Sábado",
      fecha: "18/10/2025",
      hora: "16:00",
      apuesta: "Mais de 2,5 GOLS",
      cuota: "1.90",
      estado: "pendiente"
    },
    {
      equipo: "Palmeiras",
      liga: "CAMPEONATO BRASILEIRO SÉRIE A",
      descripcion: "Verdão, o campeão do povo",
      dia: "Domingo",
      fecha: "19/10/2025",
      hora: "18:30",
      apuesta: "Ambas marcam",
      cuota: "2.10",
      estado: "pendiente"
    },
    {
      equipo: "Santos",
      liga: "CAMPEONATO BRASILEIRO SÉRIE A",
      descripcion: "Peixe, a equipe da Vila",
      dia: "Quarta-feira",
      fecha: "22/10/2025",
      hora: "21:00",
      apuesta: "Menos de 3,5 GOLS",
      cuota: "1.75",
      estado: "pendiente"
    },
    {
      equipo: "Corinthians",
      liga: "CAMPEONATO BRASILEIRO SÉRIE A",
      descripcion: "Timão, o orgulho de São Paulo",
      dia: "Quinta-feira",
      fecha: "23/10/2025",
      hora: "20:00",
      apuesta: "Vitoria do Corinthians",
      cuota: "2.00",
      estado: "pendiente"
    },
    {
      equipo: "São Paulo",
      liga: "CAMPEONATO BRASILEIRO SÉRIE A",
      descripcion: "Tricolor, o time do Morumbi",
      dia: "Sábado",
      fecha: "25/10/2025",
      hora: "19:00",
  apuesta: "Empate anula aposta",
      cuota: "1.85",
      estado: "pendiente"
    },
    {
      equipo: "Atlético Mineiro",
      liga: "CAMPEONATO BRASILEIRO SÉRIE A",
      descripcion: "Galo, o time da massa",
      dia: "Domingo",
      fecha: "26/10/2025",
      hora: "16:00",
      apuesta: "Mais de 1,5 GOLS",
      cuota: "1.60",
      estado: "pendiente"
    },
    {
      equipo: "Internacional",
      liga: "CAMPEONATO BRASILEIRO SÉRIE A",
      descripcion: "Inter, o colorado",
      dia: "Quarta-feira",
      fecha: "29/10/2025",
      hora: "21:00",
      apuesta: "Ambas marcam",
      cuota: "2.20",
      estado: "pendiente"
    },
    {
      equipo: "Grêmio",
      liga: "CAMPEONATO BRASILEIRO SÉRIE A",
      descripcion: "Grêmio, o imortal",
      dia: "Quinta-feira",
      fecha: "30/10/2025",
      hora: "20:00",
      apuesta: "Vitoria do Grêmio",
      cuota: "2.10",
      estado: "pendiente"
    },
    {
      equipo: "Cruzeiro",
      liga: "CAMPEONATO BRASILEIRO SÉRIE A",
      descripcion: "Raposa, o time celeste",
      dia: "Sábado",
      fecha: "01/11/2025",
      hora: "19:00",
      apuesta: "Menos de 4,5 GOLS",
      cuota: "1.70",
      estado: "pendiente"
    },
  ];
  while (defaultPartidos10.length < 10) defaultPartidos10.push({ ...defaultPartidos10[0], equipo: `Equipo ${defaultPartidos10.length+1}` });
  const [partidos10, setPartidos10] = useState(defaultPartidos10);

  // Estructura de partido editable
  const defaultPartidos5 = [
    {
      equipo: "Alianza Lima",
      liga: "LIGA 1 PERÚ",
      descripcion: "Los Blanquiazules de La Victoria",
      dia: "Viernes",
      fecha: "17/10/2025",
      hora: "03:30",
      apuesta: "-3,5 GOLES",
      cuota: "1.75",
      estado: "pendiente"
    },
  ];
  while (defaultPartidos5.length < 5) defaultPartidos5.push({ ...defaultPartidos5[0], equipo: `Equipo ${defaultPartidos5.length+1}` });
  const [partidos5, setPartidos5] = useState(defaultPartidos5);

  const defaultPartidos3 = [
    {
      equipo: "Inde del Valle",
      liga: "LIGA PRO ECUADOR",
      descripcion: "Los Rayados del Valle de los Chillos",
      dia: "Viernes",
      fecha: "17/10/2025",
      hora: "04:00",
      apuesta: "-3,5 GOLES",
      cuota: "1.90",
      estado: "pendiente"
    },
  ];
  while (defaultPartidos3.length < 3) defaultPartidos3.push({ ...defaultPartidos3[0], equipo: `Equipo ${defaultPartidos3.length+1}` });
  const [partidos3, setPartidos3] = useState(defaultPartidos3);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoggedIn(!!user);
      setIsCreator(!!user && user.uid === CREATOR_UID);
      if (user) setWelcome("¡Bienvenido!");
      else setWelcome("");
    });
    return () => unsubscribe();
  }, []);

  // Cargar y guardar partidos de Firestore para 10, 5 y 3
  useEffect(() => {
    async function fetchPartidos() {
      const snap10 = await getDoc(doc(db, "config", "partidos10"));
      if (snap10.exists()) {
        const data = snap10.data();
        if (Array.isArray(data.partidos)) setPartidos10(data.partidos);
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
      
      await addDoc(collection(db, "historialCombinadas"), {
        tipo,
        nombre,
        partidos,
        fechaGuardado: new Date().toISOString()
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
    { label: "Combinada de 10 partidos", partidos: partidos10, color: "purple" },
    { label: "Combinada de 5 partidos", partidos: partidos5, color: "green" },
    { label: "Combinada de 3 partidos", partidos: partidos3, color: "orange" },
  ];


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

  return (
    <main className="min-h-screen w-full bg-[#204080] flex flex-col">
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

      {/* Botones principales */}
      <div className="flex flex-wrap justify-center gap-2 mt-3 px-3">
        {loggedIn && (
          <Link href="/combinadas" className="bg-blue-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-semibold flex items-center gap-1 shadow border border-white hover:bg-blue-800 transition text-xs md:text-sm">
            <span>👤</span> Mis Combinadas
          </Link>
        )}
        <Link href="/guardadas" className="bg-indigo-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-semibold flex items-center gap-1 shadow border border-white hover:bg-indigo-700 transition text-xs md:text-sm">
          <span>📁</span> Historial
        </Link>
        <Link href="/ganadora" className="bg-orange-400 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-semibold flex items-center gap-1 shadow hover:bg-orange-500 transition text-xs md:text-sm">
          <span>🏆</span> Ganadora Premium
        </Link>
        {isCreator && (
          <>
            <Link href="/admin-codigos" className="bg-purple-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-semibold flex items-center gap-1 shadow hover:bg-purple-700 transition text-xs md:text-sm">
              <span>🔑</span> Códigos Premium
            </Link>
            <button className="bg-red-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-semibold shadow hover:bg-red-600 transition text-xs md:text-sm">Limpiar Resultados</button>
          </>
        )}
        <Link href="/simulador" className="bg-green-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-semibold shadow hover:bg-green-600 transition text-xs md:text-sm">Simulador</Link>
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
                          <option value="Miércoles">Miér</option>
                          <option value="Jueves">Jueves</option>
                          <option value="Viernes">Vier</option>
                          <option value="Sábado">Sáb</option>
                          <option value="Domingo">Dom</option>
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
                      <div className="flex gap-1.5 mt-0.5">
                        {p.estado === "acertado" && <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-lg text-xs">✔ Acertado</span>}
                        {p.estado === "fallado" && <span className="bg-red-100 text-red-500 font-semibold px-2 py-0.5 rounded-lg text-xs">✗ Fallado</span>}
                        {p.estado === "pendiente" && <span className="bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-lg text-xs">Pendiente</span>}
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
