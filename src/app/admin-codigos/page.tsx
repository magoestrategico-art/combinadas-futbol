"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";

interface Codigo {
  id: string;
  codigo: string;
  usado: boolean;
  userId?: string;
  fechaActivacion?: string;
  fechaExpiracion?: string;
  fechaCreacion: string;
}

export default function AdminCodigosPage() {
  const CREATOR_UID = "hDkn8W38nVZKQD1piviUrmwvHtt2";
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [codigos, setCodigos] = useState<Codigo[]>([]);
  const [generandoCodigo, setGenerandoCodigo] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.uid === CREATOR_UID) {
        setIsCreator(true);
        cargarCodigos();
      } else {
        setIsCreator(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const cargarCodigos = async () => {
    try {
      const q = query(collection(db, "codigosPremium"), orderBy("fechaCreacion", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Codigo[];
      setCodigos(data);
    } catch (error) {
      console.error("Error al cargar códigos:", error);
    } finally {
      setLoading(false);
    }
  };

  const generarCodigoAleatorio = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = 'PREMIUM-';
    for (let i = 0; i < 6; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
  };

  const crearCodigo = async () => {
    setGenerandoCodigo(true);
    try {
      const nuevoCodigo = generarCodigoAleatorio();
      await addDoc(collection(db, "codigosPremium"), {
        codigo: nuevoCodigo,
        usado: false,
        fechaCreacion: new Date().toISOString()
      });
      alert(`Código creado: ${nuevoCodigo}\n\nCópialo y envíalo al usuario que pagó en Ko-fi`);
      cargarCodigos();
    } catch (error) {
      console.error("Error al crear código:", error);
      alert("Error al crear el código");
    } finally {
      setGenerandoCodigo(false);
    }
  };

  const copiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    alert(`Código copiado: ${codigo}`);
  };

  if (!loading && !isCreator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-700 mb-4">Solo el administrador puede acceder a esta página</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#23407a', padding: '32px 20px' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">🔑 Administrador de Códigos Premium</h1>
            <p className="text-blue-100 text-sm">Genera y gestiona códigos de acceso premium</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition"
          >
            ← Volver
          </button>
        </div>

        {/* Generar nuevo código */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-xl">
          <h2 className="text-xl font-bold text-purple-700 mb-4">Crear Nuevo Código</h2>
          <p className="text-gray-600 text-sm mb-4">
            Genera un código único para enviar a los usuarios que pagaron en Ko-fi
          </p>
          <button
            onClick={crearCodigo}
            disabled={generandoCodigo}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            {generandoCodigo ? "Generando..." : "✨ Generar Código Premium"}
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg text-center">
            <div className="text-3xl font-bold text-blue-600">{codigos.length}</div>
            <div className="text-sm text-gray-600 font-semibold">Total Códigos</div>
          </div>
          <div className="bg-green-100 rounded-xl p-4 shadow-lg text-center border-2 border-green-400">
            <div className="text-3xl font-bold text-green-700">{codigos.filter(c => c.usado).length}</div>
            <div className="text-sm text-gray-700 font-semibold">Usados</div>
          </div>
          <div className="bg-orange-100 rounded-xl p-4 shadow-lg text-center border-2 border-orange-400">
            <div className="text-3xl font-bold text-orange-700">{codigos.filter(c => !c.usado).length}</div>
            <div className="text-sm text-gray-700 font-semibold">Disponibles</div>
          </div>
        </div>

        {/* Lista de códigos */}
        <div className="bg-white rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Lista de Códigos</h2>
          {loading ? (
            <p className="text-center text-gray-500">Cargando...</p>
          ) : codigos.length === 0 ? (
            <p className="text-center text-gray-500">No hay códigos creados aún</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-3 font-bold text-gray-700">Código</th>
                    <th className="text-left p-3 font-bold text-gray-700">Estado</th>
                    <th className="text-left p-3 font-bold text-gray-700">Creado</th>
                    <th className="text-left p-3 font-bold text-gray-700">Usado</th>
                    <th className="text-left p-3 font-bold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {codigos.map(codigo => (
                    <tr key={codigo.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-purple-700">{codigo.codigo}</td>
                      <td className="p-3">
                        {codigo.usado ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                            ✓ Usado
                          </span>
                        ) : (
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                            ○ Disponible
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(codigo.fechaCreacion).toLocaleDateString('es-ES')}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {codigo.fechaActivacion ? new Date(codigo.fechaActivacion).toLocaleDateString('es-ES') : '-'}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => copiarCodigo(codigo.codigo)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-600 transition"
                        >
                          📋 Copiar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
