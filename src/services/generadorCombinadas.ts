import {
  obtenerFixturesProximos,
  obtenerEstadisticasEquipo,
  calcularProbabilidadNoPierde,
  calcularPromedioGolesTotales,
  analizarRacha,
} from '@/services/apiFootball';

interface PartidoSeleccionado {
  equipoLocal: string;
  equipoVisitante: string;
  fecha: string;
  liga: string;
  criterio: string;
  seleccion: string;
  cuota: number;
  justificacion: string;
}

/**
 * Generar combinada SELECT automática con 3 picks según criterios
 */
export async function generarCombinadaSelect(): Promise<PartidoSeleccionado[]> {
  try {
    console.log('🔍 Consultando API-Football...');
    
    // 1. Obtener fixtures próximos de La Liga (temporada 2024-2025)
    const fixturesData = await obtenerFixturesProximos(140, 2025);
    console.log('📅 Fixtures obtenidos:', fixturesData.response?.length || 0);
    
    const fixtures = fixturesData.response.slice(0, 20); // Analizar los próximos 20 partidos
    console.log('🎯 Analizando primeros 20 partidos...');

    const picks: PartidoSeleccionado[] = [];

    // Arrays para almacenar candidatos por criterio
    const candidatosNoPierde: Array<{ partido: any; stats: any; prob: number }> = [];
    const candidatosOver15: Array<{ partido: any; stats: any; promedio: number }> = [];
    const candidatosUnder35: Array<{ partido: any; stats: any; promedio: number }> = [];

    // 2. Analizar cada partido
    for (const fixture of fixtures) {
      const homeTeamId = fixture.teams.home.id;
      const awayTeamId = fixture.teams.away.id;

      try {
        // Obtener estadísticas de ambos equipos (temporada 2024-2025)
        const homeStatsData = await obtenerEstadisticasEquipo(homeTeamId, 140, 2025);
        const awayStatsData = await obtenerEstadisticasEquipo(awayTeamId, 140, 2025);

        const homeStats = homeStatsData.response;
        const awayStats = awayStatsData.response;

        // CRITERIO 1: Alta probabilidad de no perder (victoria o empate)
        const probHomeNoPierde = calcularProbabilidadNoPierde(homeStats);
        const probAwayNoPierde = calcularProbabilidadNoPierde(awayStats);

        if (probHomeNoPierde >= 60) {
          candidatosNoPierde.push({
            partido: fixture,
            stats: homeStats,
            prob: probHomeNoPierde,
          });
        }
        if (probAwayNoPierde >= 60) {
          candidatosNoPierde.push({
            partido: fixture,
            stats: awayStats,
            prob: probAwayNoPierde,
          });
        }

        // CRITERIO 2: Over 1.5 goles (promedio alto de goles)
        const promedioGoles = (calcularPromedioGolesTotales(homeStats) + calcularPromedioGolesTotales(awayStats)) / 2;

        if (promedioGoles >= 2.5) {
          candidatosOver15.push({
            partido: fixture,
            stats: { home: homeStats, away: awayStats },
            promedio: promedioGoles,
          });
        }

        // CRITERIO 3: Under 3.5 goles (promedio bajo de goles)
        if (promedioGoles <= 2.2) {
          candidatosUnder35.push({
            partido: fixture,
            stats: { home: homeStats, away: awayStats },
            promedio: promedioGoles,
          });
        }

        // Pequeña pausa para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error analizando partido ${fixture.teams.home.name} vs ${fixture.teams.away.name}:`, error);
      }
    }

    console.log('📊 Candidatos encontrados:');
    console.log(`  - NO PIERDE: ${candidatosNoPierde.length}`);
    console.log(`  - OVER 1.5: ${candidatosOver15.length}`);
    console.log(`  - UNDER 3.5: ${candidatosUnder35.length}`);

    // 3. PICK 1: Mejor equipo con probabilidad de no perder
    if (candidatosNoPierde.length > 0) {
      const mejorNoPierde = candidatosNoPierde.sort((a, b) => b.prob - a.prob)[0];
      const racha = analizarRacha(mejorNoPierde.stats.form);

      picks.push({
        equipoLocal: mejorNoPierde.partido.teams.home.name,
        equipoVisitante: mejorNoPierde.partido.teams.away.name,
        fecha: new Date(mejorNoPierde.partido.fixture.date).toLocaleDateString('es-ES'),
        liga: mejorNoPierde.partido.league.name,
        criterio: 'Alta probabilidad NO PIERDE',
        seleccion: '1X (Victoria Local o Empate)',
        cuota: 1.4 + Math.random() * 0.3, // Cuota estimada
        justificacion: `${mejorNoPierde.prob.toFixed(1)}% no pierde. Racha: ${racha.wins}V-${racha.draws}E en últimos 5.`,
      });
    }

    // 4. PICK 2: Mejor partido Over 1.5 goles
    if (candidatosOver15.length > 0) {
      const mejorOver = candidatosOver15.sort((a, b) => b.promedio - a.promedio)[0];

      picks.push({
        equipoLocal: mejorOver.partido.teams.home.name,
        equipoVisitante: mejorOver.partido.teams.away.name,
        fecha: new Date(mejorOver.partido.fixture.date).toLocaleDateString('es-ES'),
        liga: mejorOver.partido.league.name,
        criterio: 'OVER 1.5 Goles',
        seleccion: 'Más de 1.5 goles',
        cuota: 1.3 + Math.random() * 0.2,
        justificacion: `Promedio ${mejorOver.promedio.toFixed(2)} goles por partido. Alta probabilidad de goles.`,
      });
    }

    // 5. PICK 3: Mejor partido Under 3.5 goles
    if (candidatosUnder35.length > 0) {
      const mejorUnder = candidatosUnder35.sort((a, b) => a.promedio - b.promedio)[0];

      picks.push({
        equipoLocal: mejorUnder.partido.teams.home.name,
        equipoVisitante: mejorUnder.partido.teams.away.name,
        fecha: new Date(mejorUnder.partido.fixture.date).toLocaleDateString('es-ES'),
        liga: mejorUnder.partido.league.name,
        criterio: 'UNDER 3.5 Goles',
        seleccion: 'Menos de 3.5 goles',
        cuota: 1.35 + Math.random() * 0.25,
        justificacion: `Promedio ${mejorUnder.promedio.toFixed(2)} goles por partido. Partidos cerrados.`,
      });
    }

    return picks;
  } catch (error) {
    console.error('Error generando combinada SELECT:', error);
    throw error;
  }
}

/**
 * Calcular cuota total de la combinada
 */
export function calcularCuotaTotal(picks: PartidoSeleccionado[]): number {
  return picks.reduce((total, pick) => total * pick.cuota, 1);
}
