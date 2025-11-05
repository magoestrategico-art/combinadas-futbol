"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../firebase-config";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// Página de Combinadas con estados de partidos
export default function CombinadasPage() {
  const [combinadas, setCombinadas] = useState<any[]>([]);
  const [nombre, setNombre] = useState("");
  const [cuota, setCuota] = useState("");
  const [equipos, setEquipos] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) cargarCombinadas(u.uid);
    });
  }, []);

  const cargarCombinadas = async (uid: string) => {
    const q = query(collection(db, "combinadas"), where("usuarioId", "==", uid));
    const snapshot = await getDocs(q);
    setCombinadas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const crearCombinada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Debes iniciar sesión");
    const equiposArray = equipos.split(",").map(e => e.trim());
    const partidosConEstado = equiposArray.map(equipo => ({
      nombre: equipo,
      estado: "pendiente" // pendiente, acertado, fallado
    }));
    await addDoc(collection(db, "combinadas"), {
      nombre,
      cuota,
      partidos: partidosConEstado,
      usuarioId: user.uid,
      fecha: new Date().toLocaleString()
    });
    setNombre("");
    setCuota("");
    setEquipos("");
    cargarCombinadas(user.uid);
  };

  const cambiarEstadoPartido = async (combinadaId: string, indexPartido: number, nuevoEstado: string) => {
    const combinada = combinadas.find(c => c.id === combinadaId);
    if (!combinada) return;
    
    // Manejar formato antiguo y nuevo
    let partidosActualizados;
    if (combinada.partidos) {
      partidosActualizados = [...combinada.partidos];
    } else if (combinada.equipos) {
      // Convertir formato antiguo a nuevo
      const equiposArray = Array.isArray(combinada.equipos) ? combinada.equipos : combinada.equipos.split(",").map((e: string) => e.trim());
      partidosActualizados = equiposArray.map((equipo: string) => ({
        nombre: equipo,
        estado: "pendiente"
      }));
    } else {
      return;
    }
    
    partidosActualizados[indexPartido].estado = nuevoEstado;
    
    // Actualizar en Firebase
    const { doc, updateDoc } = await import("firebase/firestore");
    const combinadaRef = doc(db, "combinadas", combinadaId);
    await updateDoc(combinadaRef, { partidos: partidosActualizados });
    
    // Recargar combinadas
    cargarCombinadas(user.uid);
  };

  return (
  <div className="min-h-screen flex flex-col items-center justify-start" style={{ background: '#23407a', minHeight: '100vh', padding: '48px 0 56px 0', boxSizing: 'border-box' }}>
      {/* Botón volver a la página principal */}
      <div className="w-full flex justify-start mb-6">
        <button
          onClick={() => router.push("/")}
          className="bg-blue-700 text-white rounded-full px-6 py-2 font-semibold shadow hover:bg-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Volver a la página principal"
        >
          Volver a la página principal
        </button>
      </div>
      <h1 className="text-5xl font-extrabold mb-6 text-white drop-shadow-lg tracking-tight" style={{textShadow:'0 4px 16px #2a5298'}}>Mis Combinadas</h1>
      <p className="text-lg text-blue-100 mb-8 font-semibold">Aquí puedes crear y gestionar tus propias combinadas de fútbol</p>
      <div className="w-full max-w-2xl">
        {user ? (
          <form onSubmit={crearCombinada} className="bg-white/95 p-8 rounded-2xl shadow-2xl mb-8 border border-blue-300">
            <h2 className="text-2xl font-bold mb-6 text-blue-700">Crear nueva combinada</h2>
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full mb-4 p-3 border-2 border-blue-200 rounded-lg bg-blue-50 text-lg focus:outline-none focus:border-blue-400 transition"
              required
            />
            <input
              type="number"
              placeholder="Cuota"
              value={cuota}
              onChange={e => setCuota(e.target.value)}
              className="w-full mb-4 p-3 border-2 border-blue-200 rounded-lg bg-blue-50 text-lg focus:outline-none focus:border-blue-400 transition"
              required
            />
            <input
              type="text"
              placeholder="Equipos (separados por coma)"
              value={equipos}
              onChange={e => setEquipos(e.target.value)}
              className="w-full mb-4 p-3 border-2 border-blue-200 rounded-lg bg-blue-50 text-lg focus:outline-none focus:border-blue-400 transition"
              required
            />
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white py-3 rounded-lg font-bold text-lg shadow hover:from-blue-700 hover:to-blue-500 transition">Crear Combinada</button>
          </form>
        ) : (
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-8 text-center font-semibold">Inicia sesión para crear y ver tus combinadas.</div>
        )}
        <div>
          {combinadas.length === 0 ? (
            <div className="text-blue-100 text-center font-semibold">No tienes combinadas guardadas.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {combinadas.map(comb => (
                <div key={comb.id} className="bg-white/90 p-6 rounded-xl shadow-lg border border-blue-200 flex flex-col gap-2">
                  <div className="font-bold text-2xl text-blue-800 mb-2">{comb.nombre}</div>
                  <div className="text-lg">Cuota: <span className="font-semibold text-blue-600">{comb.cuota}</span></div>
                  <div className="text-base font-semibold text-gray-700 mb-2">Partidos:</div>
                  <div className="flex flex-col gap-2">
                    {(() => {
                      // Compatibilidad con formato antiguo
                      const partidos = comb.partidos || (comb.equipos ? 
                        (Array.isArray(comb.equipos) ? comb.equipos : comb.equipos.split(","))
                        .map((e: string) => ({ nombre: typeof e === "string" ? e.trim() : e, estado: "pendiente" })) 
                        : []);
                      
                      return partidos.map((partido: any, index: number) => {
                        const bgColor = partido.estado === "acertado" ? "bg-green-100" : 
                                       partido.estado === "fallado" ? "bg-red-100" : 
                                       "bg-blue-50";
                        const borderColor = partido.estado === "acertado" ? "border-green-600" : 
                                           partido.estado === "fallado" ? "border-red-600" : 
                                           "border-blue-300";
                        const textColor = partido.estado === "acertado" ? "text-green-900" : 
                                         partido.estado === "fallado" ? "text-red-900" : 
                                         "text-blue-900";
                        
                        return (
                          <div key={index} className={`p-4 rounded-2xl border-[3px] ${bgColor} ${borderColor} ${textColor} flex justify-between items-center shadow-sm`}>
                            <span className="font-semibold text-lg">{partido.nombre}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => cambiarEstadoPartido(comb.id, index, "acertado")}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${partido.estado === "acertado" ? "bg-green-600 text-white" : "bg-white text-green-700 border-2 border-green-600 hover:bg-green-50"}`}
                              >
                                ✓ Acertado
                              </button>
                              <button
                                onClick={() => cambiarEstadoPartido(comb.id, index, "fallado")}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${partido.estado === "fallado" ? "bg-red-600 text-white" : "bg-white text-red-700 border-2 border-red-600 hover:bg-red-50"}`}
                              >
                                ✗ Fallado
                              </button>
                              <button
                                onClick={() => cambiarEstadoPartido(comb.id, index, "pendiente")}
                                className={`px-3 py-2 rounded-lg text-sm font-bold transition ${partido.estado === "pendiente" ? "bg-gray-600 text-white" : "bg-white text-gray-700 border-2 border-gray-400 hover:bg-gray-50"}`}
                              >
                                ⟳
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Creada: {comb.fecha}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
