"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { auth } from "../firebase-config";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [welcome, setWelcome] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoggedIn(!!user);
      if (user) setWelcome("¡Bienvenido!");
      else setWelcome("");
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
    setWelcome("");
    setEmail("");
    setPassword("");
    setError("");
  };

  return (
    <main className="min-h-screen w-full bg-[#204080] flex flex-col">
      {/* Cabecera */}
      <header className="flex items-center justify-between px-16 pt-12 pb-2">
        <h1 className="text-6xl font-extrabold text-white text-center w-full" style={{textShadow:'2px 4px 12px #000, 0 2px 0 #fff'}}>Combinadas de Fútbol</h1>
        <div className="absolute top-8 right-8 flex gap-2">
          {!loggedIn ? (
            <>
              <button
                className="bg-blue-400 text-white px-4 py-1 rounded-full font-semibold text-base shadow hover:bg-blue-500 transition min-w-[110px]"
                onClick={() => setShowLogin(true)}
              >
                Iniciar Sesión
              </button>
              <Link href="/register" className="bg-green-500 text-white px-4 py-1 rounded-full font-semibold text-base shadow hover:bg-green-600 transition min-w-[110px]">Registrarse</Link>
            </>
          ) : (
            <button
              className="bg-red-500 text-white px-4 py-1 rounded-full font-semibold text-base shadow hover:bg-red-600 transition min-w-[110px]"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          )}
        </div>
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
        <div className="flex justify-center mt-6">
          <div className="bg-green-100 text-green-800 px-6 py-3 rounded-xl font-bold shadow">{welcome}</div>
        </div>
      )}

      {/* Botones principales */}
      <div className="flex flex-wrap justify-center gap-4 mt-8">
        {loggedIn && (
          <Link href="/combinadas" className="bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg border-2 border-white hover:bg-blue-800 transition">
            <span>👤</span> Mis Combinadas
          </Link>
        )}
        <Link href="/ganadora" className="bg-orange-400 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow hover:bg-orange-500 transition">
          <span>🏆</span> Combinada Ganadora Premium
        </Link>
        <button className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold shadow hover:bg-red-600 transition">Limpiar Todos los Resultados</button>
        <Link href="/simulador" className="bg-green-500 text-white px-8 py-3 rounded-xl font-bold shadow hover:bg-green-600 transition">Simulador</Link>
      </div>

      {/* Tarjetas de combinadas */}
      <section className="flex flex-wrap justify-center gap-8 mt-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-80 flex flex-col items-center border-2 border-purple-400">
          <h2 className="text-2xl font-bold text-purple-700 mb-2">Combinada Premium</h2>
          <div className="bg-purple-500 text-white px-4 py-2 rounded-full font-bold mb-2">10 Equipos</div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 w-80 flex flex-col items-center border-2 border-green-400">
          <h2 className="text-2xl font-bold text-green-700 mb-2">Combinada Clásica</h2>
          <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold mb-2">5 Equipos</div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 w-80 flex flex-col items-center border-2 border-orange-400">
          <h2 className="text-2xl font-bold text-orange-500 mb-2">Combinada Select</h2>
          <div className="bg-orange-400 text-white px-4 py-2 rounded-full font-bold mb-2">3 Equipos</div>
        </div>
      </section>
    </main>
  );
}
