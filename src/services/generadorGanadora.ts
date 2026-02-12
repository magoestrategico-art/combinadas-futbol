import { obtenerEquiposConEstadisticas, calcularPromedioGolesTotales } from '@/services/footballData';

export type EquipoSeleccionado = {
  nombre: string;
  liga: string;
  criterio: string;
  apuesta: string;
  cuota: number;
  justificacion: string;
};

// Mapeo de IDs de ligas a nombres legibles
const LIGA_NOMBRES: Record<number, string> = {
  2014: 'La Liga',
  2015: 'Segunda División',
  2021: 'Premier League',
  2002: 'Bundesliga',
  2019: 'Serie A',
  2016: 'Ligue 1',
  2003: 'Eredivisie',
  2013: 'Brasileirão',
  2017: 'Primeira Liga',
  // Agrega más si usas otras ligas
};

export async function generarCombinadaPersonalizada(picks: { liga: string; criterio: string }[]): Promise<EquipoSeleccionado[]> {
  const picksValidos = picks.filter((p) => p.liga && p.criterio);
  const resultado: EquipoSeleccionado[] = [];
  for (const pick of picksValidos) {
    const leagueId = Number(pick.liga);
    // Usar temporada 2025 (para 2025-2026)
    const equipos = await obtenerEquiposConEstadisticas(leagueId, 2025);
    console.log('DEBUG equipos:', equipos);
    let seleccionado: any = null;
    let justificacion = '';
    let apuesta = '';
    let cuota = 1.3 + Math.random() * 0.5;

    if (pick.criterio === 'OVER_1_5') {
      seleccionado = equipos
        .map((e: any) => ({ ...e, promedioGoles: calcularPromedioGolesTotales(e) }))
        .sort((a: any, b: any) => b.promedioGoles - a.promedioGoles)[0];
      apuesta = 'Más de 1.5 goles';
      justificacion = seleccionado ? `Promedio de ${seleccionado.promedioGoles?.toFixed?.(2) ?? '-'} goles por partido.` : '';
    } else if (pick.criterio === 'UNDER_3_5') {
      seleccionado = equipos
        .map((e: any) => ({ ...e, promedioGoles: calcularPromedioGolesTotales(e) }))
        .sort((a: any, b: any) => a.promedioGoles - b.promedioGoles)[0];
      apuesta = 'Menos de 3.5 goles';
      justificacion = seleccionado ? `Promedio de ${seleccionado.promedioGoles?.toFixed?.(2) ?? '-'} goles por partido.` : '';
    } else if (pick.criterio === 'GANADOR') {
      seleccionado = equipos.sort((a: any, b: any) => b.won - a.won)[0];
      apuesta = 'Victoria';
      justificacion = seleccionado ? `Ha ganado ${seleccionado.won} de ${seleccionado.playedGames} partidos.` : '';
    } else if (pick.criterio === 'PERDEDOR') {
      seleccionado = equipos.sort((a: any, b: any) => b.lost - a.lost)[0];
      apuesta = 'Derrota';
      justificacion = seleccionado ? `Ha perdido ${seleccionado.lost} de ${seleccionado.playedGames} partidos.` : '';
    } else if (pick.criterio === 'EMPATE') {
      seleccionado = equipos.sort((a: any, b: any) => b.draw - a.draw)[0];
      apuesta = 'Empate';
      justificacion = seleccionado ? `Ha empatado ${seleccionado.draw} de ${seleccionado.playedGames} partidos.` : '';
    }
    console.log('DEBUG pick:', pick, 'seleccionado:', seleccionado);
    if (seleccionado) {
      resultado.push({
        nombre: seleccionado.team?.name || seleccionado.team?.nombre || seleccionado.name,
        liga: LIGA_NOMBRES[leagueId] || 'Otra',
        criterio: pick.criterio,
        apuesta,
        cuota,
        justificacion
      });
    }
  }
  console.log('DEBUG resultado:', resultado);
  return resultado;
}

export function calcularCuotaTotalGanadora(picks: EquipoSeleccionado[]): number {
  return picks.reduce((total, pick) => total * pick.cuota, 1);
}
