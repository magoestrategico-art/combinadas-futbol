"use client";
import { useEffect, useState } from "react";
import { auth } from "../../firebase-config";
import { onAuthStateChanged, updateProfile } from "firebase/auth";

export default function PerfilPage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [edit, setEdit] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      setName(u?.displayName || "");
      setEmail(u?.email || "");
    });
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user) return;
    try {
      await updateProfile(user, { displayName: name });
      setEdit(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!user) {
    return <div className="max-w-xl mx-auto py-8 text-center">Inicia sesión para ver tu perfil.</div>;
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Mi Perfil</h1>
      <form onSubmit={handleUpdate} className="bg-white p-6 rounded shadow">
        <div className="mb-4">
          <label className="block font-semibold mb-2">Nombre:</label>
          {edit ? (
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" />
          ) : (
            <div className="p-2 bg-gray-100 rounded">{name}</div>
          )}
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-2">Email:</label>
          <div className="p-2 bg-gray-100 rounded">{email}</div>
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="flex gap-4">
          {edit ? (
            <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded font-bold">Guardar</button>
          ) : (
            <button type="button" onClick={() => setEdit(true)} className="bg-indigo-600 text-white py-2 px-6 rounded font-bold">Editar</button>
          )}
        </div>
      </form>
    </div>
  );
}
