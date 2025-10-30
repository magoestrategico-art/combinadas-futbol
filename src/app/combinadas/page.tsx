"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../firebase-config";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

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
    await addDoc(collection(db, "combinadas"), {
      nombre,
      cuota,
      equipos: equipos.split(",").map(e => e.trim()),
      usuarioId: user.uid,
      fecha: new Date().toLocaleString()
    });
    setNombre("");
    setCuota("");
    setEquipos("");
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
                  <div className="text-base">Equipos: <span className="font-semibold text-blue-500">{Array.isArray(comb.equipos) ? comb.equipos.join(", ") : comb.equipos}</span></div>
                  <div className="text-xs text-gray-500">Creada: {comb.fecha}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
