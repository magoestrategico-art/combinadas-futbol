"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../../firebase-config";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";

// Inicialmente los partidos por defecto
const defaultPartidos = [
  "Real Madrid vs Barcelona",
  "Atlético vs Sevilla",
  "Valencia vs Betis",
  "Villarreal vs Osasuna",
  "Athletic vs Celta",
  "Espanyol vs Getafe",
  "Granada vs Cádiz",
  "Levante vs Alavés",
  "Mallorca vs Elche",
  "Rayo vs Sociedad",
];

export default function AdminPartidosPage() {
  // UID del creador (ajusta este valor al UID real de tu usuario admin)
  const CREATOR_UID = "hDkn8W38nVZKQD1piviUrmwvHtt2";
  const [isCreator, setIsCreator] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [partidos, setPartidos] = useState<string[]>([...defaultPartidos]);
  const [mensaje, setMensaje] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoggedIn(!!user);
      setIsCreator(!!user && user.uid === CREATOR_UID);
      setChecking(false);
      // Si es el creador, cargar partidos desde Firestore
      if (user && user.uid === CREATOR_UID) {
        const docRef = doc(db, "config", "partidos");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.partidos)) setPartidos(data.partidos);
        }
      }
    });
    return () => unsubscribe();
  }, []);

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
    setEmail("");
    setPassword("");
    setError("");
  };

  const handleChange = (idx: number, value: string) => {
    setPartidos(arr => arr.map((p, i) => i === idx ? value : p));
  };

  const handleGuardar = async () => {
    try {
      await setDoc(doc(db, "config", "partidos"), { partidos });
      setMensaje("¡Partidos guardados correctamente!");
    } catch (e) {
      setMensaje("Error al guardar en Firestore");
    }
    setTimeout(() => setMensaje(""), 2000);
  };

  if (checking) {
    return null;
  }
  if (!loggedIn) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-blue-400">
        <div className="bg-white/90 p-10 rounded-2xl shadow-xl flex flex-col items-center">
          <h2 className="text-3xl font-bold mb-6 text-blue-800">Iniciar sesión como administrador</h2>
          <form onSubmit={handleLogin} className="w-full max-w-xs flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="p-3 border-2 border-blue-200 rounded-lg bg-blue-50 text-lg focus:outline-none focus:border-blue-400"
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="p-3 border-2 border-blue-200 rounded-lg bg-blue-50 text-lg focus:outline-none focus:border-blue-400"
              required
            />
            {error && <div className="text-red-500 font-semibold text-center">{error}</div>}
            <button type="submit" className="bg-gradient-to-r from-blue-700 to-blue-400 text-white py-3 rounded-lg font-bold text-xl shadow hover:from-blue-800 hover:to-blue-500 transition">Entrar</button>
          </form>
          <Link href="/" className="mt-6 text-blue-600 underline">Volver al inicio</Link>
        </div>
      </main>
    );
  }
  if (!isCreator) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-blue-400">
        <div className="bg-white/90 p-10 rounded-2xl shadow-xl flex flex-col items-center">
          <h2 className="text-3xl font-bold mb-6 text-blue-800">Acceso restringido</h2>
          <p className="text-lg text-gray-700">Solo el creador de la web puede editar los partidos.</p>
          <button onClick={handleLogout} className="mt-4 text-blue-600 underline">Cerrar sesión</button>
          <Link href="/" className="mt-6 text-blue-600 underline">Volver al inicio</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-900 to-blue-400 py-16">
      <div className="bg-white/95 p-10 rounded-2xl shadow-xl w-full max-w-2xl">
  <h1 className="text-4xl font-extrabold text-blue-900 mb-8 text-center">Editar Equipos de la Página Principal</h1>
        <form className="flex flex-col gap-5">
          {partidos.map((partido, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="font-bold text-blue-700 w-8">{idx+1}.</span>
              <input
                type="text"
                value={partido}
                onChange={e => handleChange(idx, e.target.value)}
                className="flex-1 p-3 rounded-lg border-2 border-blue-200 text-lg focus:outline-none focus:border-blue-500 bg-blue-50"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={handleGuardar}
            className="mt-6 bg-gradient-to-r from-blue-700 to-blue-400 text-white py-3 rounded-lg font-bold text-xl shadow hover:from-blue-800 hover:to-blue-500 transition"
          >
            Guardar Cambios
          </button>
          {mensaje && <div className="text-green-600 font-bold text-center mt-4">{mensaje}</div>}
        </form>
        <Link href="/" className="block mt-8 text-blue-600 underline text-center">Volver al inicio</Link>
      </div>
    </main>
  );
}
