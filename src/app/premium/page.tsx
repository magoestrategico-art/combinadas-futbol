"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

export default function PremiumPage() {
  const [user, setUser] = useState<any>(null);
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(true);
  const [validando, setValidando] = useState(false);
  const [mensaje, setMensaje] = useState<{tipo: "success" | "error", texto: string} | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const router = useRouter();

  const CODIGO_PREMIUM = "FUTBOL2025";
  const KOFI_URL = "https://ko-fi.com/s/f1fa74cc26";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await verificarPremium(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const verificarPremium = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const ahora = new Date();
        const expira = userData.premiumExpira?.toDate();
        
        if (userData.isPremium && expira && expira > ahora) {
          setIsPremium(true);
        } else if (userData.isPremium && expira && expira <= ahora) {
          // Premium expirado
          setIsPremium(false);
          setMensaje({tipo: "error", texto: "Tu membresía Premium ha expirado. Renueva para seguir disfrutando."});
        }
      }
    } catch (error) {
      console.error("Error verificando premium:", error);
    } finally {
      setLoading(false);
    }
  };

  const validarCodigo = async () => {
    if (!user) {
      setMensaje({tipo: "error", texto: "Debes iniciar sesión primero"});
      return;
    }

    if (codigo.trim().toUpperCase() !== CODIGO_PREMIUM) {
      setMensaje({tipo: "error", texto: "Código incorrecto. Verifica que lo hayas copiado correctamente."});
      return;
    }

    setValidando(true);
    try {
      const expiraEn30Dias = new Date();
      expiraEn30Dias.setDate(expiraEn30Dias.getDate() + 30);

      await setDoc(doc(db, "users", user.uid), {
        isPremium: true,
        premiumSince: serverTimestamp(),
        premiumExpira: expiraEn30Dias,
        codigoUsado: CODIGO_PREMIUM,
        ultimaActivacion: serverTimestamp()
      }, { merge: true });

      setMensaje({tipo: "success", texto: "¡Código activado! Ya tienes acceso Premium por 30 días 🎉"});
      setIsPremium(true);
      
      setTimeout(() => {
        router.push("/guardadas");
      }, 2000);
    } catch (error) {
      console.error("Error activando código:", error);
      setMensaje({tipo: "error", texto: "Error al activar el código. Inténtalo de nuevo."});
    } finally {
      setValidando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">🔒 Acceso Premium</h1>
          <p className="text-gray-600 mb-6">Debes iniciar sesión para activar tu membresía Premium</p>
          <Link href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition inline-block">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">¡Eres Premium!</h1>
          <p className="text-gray-600 mb-6">Ya tienes acceso completo al historial de combinadas</p>
          <Link href="/guardadas" className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition inline-block">
            Ver Historial Completo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏆 Hazte Premium</h1>
          <p className="text-gray-600">Acceso completo al historial de combinadas</p>
        </div>

        {/* Beneficios */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">¿Qué incluye Premium?</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-bold text-gray-800">Historial Completo Ilimitado</p>
                <p className="text-sm text-gray-600">Accede a todas tus combinadas guardadas sin límites</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-bold text-gray-800">Sistema de Jornadas</p>
                <p className="text-sm text-gray-600">Marca resultados semana a semana y ve tu progreso</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <p className="font-bold text-gray-800">Estadísticas Avanzadas</p>
                <p className="text-sm text-gray-600">% de éxito, rachas, jornadas ganadas y más</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💾</span>
              <div>
                <p className="font-bold text-gray-800">Sin Límites de Almacenamiento</p>
                <p className="text-sm text-gray-600">Guarda todas las combinadas que quieras</p>
              </div>
            </div>
          </div>
        </div>

        {/* Precio */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-6 mb-6 text-center">
          <p className="text-white font-bold text-lg mb-2">Solo por</p>
          <p className="text-white font-black text-5xl mb-2">€1.50</p>
          <p className="text-white font-bold">por mes</p>
          <p className="text-white text-sm mt-2">Precio del café ☕ - Valor del éxito 🏆</p>
        </div>

        {/* Botón Ko-fi */}
        <a 
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl text-center font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition shadow-lg mb-6"
        >
          💳 Pagar con Ko-fi
        </a>

        {/* Formulario código */}
        <div className="border-t-2 border-gray-200 pt-6">
          <h3 className="font-bold text-gray-800 mb-3 text-center">¿Ya pagaste? Ingresa tu código</h3>
          
          {mensaje && (
            <div className={`mb-4 p-4 rounded-lg ${mensaje.tipo === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {mensaje.texto}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ingresa tu código aquí"
              className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-center font-bold text-lg uppercase focus:border-blue-500 focus:outline-none"
              disabled={validando}
            />
            <button
              onClick={validarCodigo}
              disabled={validando || !codigo}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {validando ? "..." : "Activar"}
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            El código te llegó en el archivo descargado de Ko-fi
          </p>
        </div>

        {/* Link volver */}
        <div className="text-center mt-6">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
