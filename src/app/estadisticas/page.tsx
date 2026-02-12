"use client";
import { useEffect, useState } from "react";
import { db, auth } from "../../firebase-config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function EstadisticasPage() {
  const [user, setUser] = useState<any>(null);
  const [combinadas, setCombinadas] = useState<any[]>([]);

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

  const total = combinadas.length;
  const cuotaMedia = total > 0 ? (combinadas.reduce((acc, c) => acc + parseFloat(c.cuota || "0"), 0) / total).toFixed(2) : "0";

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Estadísticas Generales</h1>
      {user ? (
        <div className="bg-white p-6 rounded shadow">
          <div className="mb-4">Total de combinadas: <span className="font-bold">{total}</span></div>
          <div className="mb-4">Cuota media: <span className="font-bold">{cuotaMedia}</span></div>
          {/* Puedes agregar más estadísticas aquí */}
        </div>
      ) : (
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-8">Inicia sesión para ver tus estadísticas.</div>
      )}
    </div>
  );
}
