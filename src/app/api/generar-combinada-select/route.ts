import { NextResponse } from 'next/server';
import { generarCombinadaSelect, calcularCuotaTotal } from '@/services/generadorCombinadas';

export async function GET() {
  try {
    console.log('🚀 Iniciando generación de combinada SELECT...');
    
    // Generar combinada SELECT con 3 picks automáticos
    const picks = await generarCombinadaSelect();
    
    console.log('✅ Picks generados:', picks.length);
    console.log('📊 Datos:', JSON.stringify(picks, null, 2));
    
    // Calcular cuota total
    const cuotaTotal = calcularCuotaTotal(picks);
    
    return NextResponse.json({
      success: true,
      data: {
        nombre: 'Combinada SELECT Automática',
        fecha: new Date().toISOString(),
        picks,
        cuotaTotal: parseFloat(cuotaTotal.toFixed(2)),
        numPicks: picks.length,
      },
    });
  } catch (error) {
    console.error('❌ Error generando combinada:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error al generar la combinada. Intenta de nuevo más tarde.',
      },
      { status: 500 }
    );
  }
}
