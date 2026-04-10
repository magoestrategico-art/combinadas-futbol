import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { db } from '@/firebase-config';

// Inicializar Firebase si no está inicializado
if (!initializeApp.length) {
  initializeApp({
    credential: applicationDefault(),
  });
}

const db = getFirestore();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validar datos recibidos
    if (!body || !body.collection || !body.data) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { collection, data } = body;

    // Guardar datos en Firestore
    const docRef = await db.collection(collection).add(data);

    return NextResponse.json({ message: 'Datos guardados correctamente', id: docRef.id });
  } catch (error) {
    console.error('Error al guardar datos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}