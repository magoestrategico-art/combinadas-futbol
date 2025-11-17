"use client";
import GuardadasPage from "../guardadas/page";
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
      usuarioId: user.uid,
      cuota,
      partidos: partidosConEstado,
      fecha: new Date().toLocaleString()
    });
  return <GuardadasPage origen="mis-combinadas" />;
}
