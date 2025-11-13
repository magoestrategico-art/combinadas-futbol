// Servicio para interactuar con Football-Data.org
// API gratuita con acceso a temporada actual 2024-2025

const API_KEY = process.env.FOOTBALL_DATA_KEY || '';
const BASE_URL = 'https://api.football-data.org/v4';

// ID de La Liga en Football-Data.org
const LA_LIGA_ID = 2014; // Primera División España (La Liga)
const SEGUNDA_DIVISION_ID = 2015; // Segunda División España

interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

interface TeamStats {
  team: Team;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

interface StandingsResponse {
  standings: Array<{
    table: TeamStats[];
  }>;
}

/**
 * Obtener equipos de una liga con sus estadísticas
 */
export async function obtenerEquiposConEstadisticas(
  leagueId: number = LA_LIGA_ID,
  season: number = 2025 // Intentar primero la temporada 2025
): Promise<TeamStats[]> {
  let url = `${BASE_URL}/competitions/${leagueId}/standings?season=${season}`;
  console.log('🌐 Football-Data.org URL:', url);
  let response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Auth-Token': API_KEY,
    },
  });

  // Si la respuesta es 403 o 404, intentar con la temporada anterior (2024)
  if (response.status === 403 || response.status === 404) {
    console.warn('⚠️ No disponible season=2025, probando con season=2024');
    url = `${BASE_URL}/competitions/${leagueId}/standings?season=2024`;
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Auth-Token': API_KEY,
      },
    });
    if (response.status === 403 || response.status === 404) {
      console.error('❌ Ninguna temporada disponible para esta liga en el plan actual.');
      throw new Error('No hay datos disponibles para la temporada actual ni la anterior.');
    }
  }

  if (!response.ok) {
    console.error('❌ Error al consultar Football-Data.org:', response.status);
    throw new Error(`Error: ${response.status}`);
  }

  const data: StandingsResponse = await response.json();

  if (!data.standings || data.standings.length === 0) {
    console.error('❌ No se encontraron datos de la liga');
    return [];
  }

  return data.standings[0].table;
}

/**
 * Calcular promedio de goles totales por partido (a favor + en contra)
 */
export function calcularPromedioGolesTotales(stats: TeamStats): number {
  if (stats.playedGames === 0) return 0;
  
  const golesAFavor = stats.goalsFor / stats.playedGames;
  const golesEnContra = stats.goalsAgainst / stats.playedGames;
  
  return golesAFavor + golesEnContra;
}

/**
 * Encontrar equipo(s) con menor promedio de goles
 */
export async function encontrarEquipoConMenosGoles(
  leagueId: number = LA_LIGA_ID,
  season: number = 2024
): Promise<{ equipos: string[]; promedio: number }> {
  const equipos = await obtenerEquiposConEstadisticas(leagueId, season);
  
  if (equipos.length === 0) {
    return { equipos: [], promedio: 0 };
  }

  // Calcular promedio para cada equipo
  const equiposConPromedio = equipos.map(equipo => ({
    nombre: equipo.team.name,
    promedio: calcularPromedioGolesTotales(equipo),
  }));

  // Ordenar por menor promedio
  equiposConPromedio.sort((a, b) => a.promedio - b.promedio);

  // Encontrar todos los equipos con el menor promedio (puede haber empates)
  const menorPromedio = equiposConPromedio[0].promedio;
  const equiposConMenorPromedio = equiposConPromedio
    .filter(e => e.promedio === menorPromedio)
    .map(e => e.nombre);

  return {
    equipos: equiposConMenorPromedio,
    promedio: menorPromedio,
  };
}

/**
 * Obtener equipos ordenados por criterio de goles
 */
export async function obtenerEquiposPorCriterioGoles(
  leagueId: number = LA_LIGA_ID,
  season: number = 2024,
  criterio: 'UNDER_3_5' | 'OVER_1_5' | 'OVER_2_5'
): Promise<TeamStats[]> {
  const equipos = await obtenerEquiposConEstadisticas(leagueId, season);
  
  // Ordenar según el criterio
  const equiposOrdenados = [...equipos].sort((a, b) => {
    const promedioA = calcularPromedioGolesTotales(a);
    const promedioB = calcularPromedioGolesTotales(b);
    
    if (criterio === 'UNDER_3_5') {
      // Menor promedio primero (más partidos con menos de 3.5 goles)
      return promedioA - promedioB;
    } else {
      // Mayor promedio primero (más partidos con más goles)
      return promedioB - promedioA;
    }
  });

  return equiposOrdenados;
}

/**
 * Calcular probabilidad de que un equipo no pierda (victoria o empate)
 */
export function calcularProbabilidadNoPierde(stats: TeamStats): number {
  if (stats.playedGames === 0) return 0;
  
  const partidosNoPerdidos = stats.won + stats.draw;
  return (partidosNoPerdidos / stats.playedGames) * 100;
}

export { LA_LIGA_ID, SEGUNDA_DIVISION_ID };
