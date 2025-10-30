"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase-config";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

import Link from "next/link";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        setError("Debes verificar tu correo electrónico antes de acceder. Revisa tu bandeja de entrada.");
        await signOut(auth);
        return;
      }
      setSuccess(true);
      setLoggedIn(true);
      setShowLogin(false);
      setTimeout(() => {
        router.push("/combinadas");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setLoggedIn(false);
    setEmail("");
    setPassword("");
    setError("");
    setSuccess(false);
    router.push("/login");
  };

  return (
    <main className="min-h-screen w-full bg-[#204080] flex flex-col">
      {/* Cabecera */}
      <header className="flex items-center justify-between px-16 pt-12 pb-2">
        <h1 className="text-6xl font-extrabold text-white" style={{textShadow:'2px 4px 12px #000, 0 2px 0 #fff'}}>Combinadas de Fútbol</h1>
        <div className="flex gap-4">
          {!loggedIn ? (
            <>
              <button
                className="bg-transparent border border-white/40 text-white py-3 px-10 rounded-full font-semibold text-xl shadow hover:bg-blue-600/30 transition"
                onClick={() => setShowLogin(true)}
              >
                Iniciar Sesión
              </button>
              <Link href="/register" className="bg-green-500 text-white py-3 px-10 rounded-full font-semibold text-xl shadow hover:bg-green-600 transition">Registrarse</Link>
            </>
          ) : (
            <button
              className="bg-red-500 text-white py-3 px-10 rounded-full font-semibold text-xl shadow hover:bg-red-600 transition"
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
            <h2 className="text-4xl font-extrabold mb-7 text-[#204080] tracking-tight drop-shadow" style={{textShadow:'0 2px 0 #fff'}}>Iniciar sesión</h2>
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
              {success && <div className="text-green-600 mb-5 font-semibold text-center">¡Inicio de sesión exitoso! Redirigiendo...</div>}
              <button type="submit" className="w-full bg-gradient-to-r from-[#204080] to-blue-400 text-white py-3 rounded-lg font-bold text-xl shadow hover:from-blue-700 hover:to-blue-500 transition">Entrar</button>
            </form>
            <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
              <Link href="/" className="bg-[#204080] text-white py-2 px-8 rounded font-bold text-lg hover:bg-blue-700 transition">Volver a inicio</Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
