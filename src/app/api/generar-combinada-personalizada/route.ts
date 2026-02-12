import { NextRequest, NextResponse } from 'next/server';
import { generarCombinadaPersonalizada } from '@/services/generadorGanadora';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { picks } = body;
    if (!Array.isArray(picks) || picks.length === 0) {
      return NextResponse.json({ success: false, error: 'No hay picks seleccionados' }, { status: 400 });
    }
    const resultado = await generarCombinadaPersonalizada(picks);
    return NextResponse.json({ success: true, data: resultado });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error generando combinada personalizada' }, { status: 500 });
  }
}
