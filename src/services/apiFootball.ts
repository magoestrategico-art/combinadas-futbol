// Servicio para interactuar con API-Football
import { fixturesDemo, estadisticasDemo } from './datosDemo';

const API_KEY = process.env.API_FOOTBALL_KEY || '';
const API_HOST = process.env.API_FOOTBALL_HOST || 'v3.football.api-sports.io';
const BASE_URL = `https://${API_HOST}`;
const USE_DEMO = true; // Modo DEMO activo - cambiar a false cuando tengas plan de pago de API-Football

interface FixtureResponse {
  response: Array<{
    fixture: {
      id: number;
      date: string;
    };
    league: {
      id: number;
      name: string;
      country: string;
    };
    teams: {
      home: {
        id: number;
        name: string;
        logo: string;
      };
      away: {
        id: number;
        name: string;
        logo: string;
      };
    };
  }>;
}

interface TeamStatistics {
  team: {
    id: number;
    name: string;
  };
  form: string; // "WWDWL"
  fixtures: {
    played: {
      total: number;
    };
    wins: {
      total: number;
    };
    draws: {
      total: number;
    };
    loses: {
      total: number;
    };
  };
  goals: {
    for: {
      average: {
        total: string;
      };
    };
    against: {
      average: {
        total: string;
      };
    };
  };
}

interface StatisticsResponse {
  response: TeamStatistics;
}

/**
 * Obtener fixtures próximos de La Liga
 */
export async function obtenerFixturesProximos(leagueId: number = 140, season: number = 2024): Promise<FixtureResponse> {
  // MODO DEMO: Usar datos de prueba
  if (USE_DEMO) {
    console.log('🎭 MODO DEMO: Usando datos de prueba');
    return fixturesDemo as FixtureResponse;
  }

  // Intentar obtener partidos de hoy en adelante
  const today = new Date();
  const from = today.toISOString().split('T')[0]; // Formato: YYYY-MM-DD
  
  const url = `${BASE_URL}/fixtures?league=${leagueId}&season=${season}&from=${from}`;
  
  console.log('🌐 URL API:', url);
  console.log('🔑 API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NO ENCONTRADA');
  console.log('📅 Buscando desde:', from);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-apisports-key': API_KEY,
    },
  });

  console.log('📡 Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error response:', errorText);
    throw new Error(`Error en API-Football: ${response.status}`);
  }

  const data = await response.json();
  console.log('📦 Fixtures recibidos:', data.response?.length || 0);
  
  return data;
}

/**
 * Obtener estadísticas de un equipo en una temporada
 */
export async function obtenerEstadisticasEquipo(teamId: number, leagueId: number = 140, season: number = 2024): Promise<StatisticsResponse> {
  // MODO DEMO: Usar datos de prueba
  if (USE_DEMO) {
    const stats = estadisticasDemo[teamId];
    if (stats) {
      return { response: stats };
    }
    // Si no existe, devolver datos genéricos
    return {
      response: {
        team: { id: teamId, name: 'Equipo' },
        form: 'DWDWL',
        fixtures: { played: { total: 10 }, wins: { total: 4 }, draws: { total: 3 }, loses: { total: 3 } },
        goals: { for: { average: { total: '1.5' } }, against: { average: { total: '1.5' } } }
      }
    };
  }

  const url = `${BASE_URL}/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-apisports-key': API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Error al obtener estadísticas: ${response.status}`);
  }

  return response.json();
}

/**
 * Calcular porcentaje de victorias + empates (para criterio "no pierde")
 */
export function calcularProbabilidadNoPierde(stats: TeamStatistics): number {
  const played = stats.fixtures.played.total;
  const wins = stats.fixtures.wins.total;
  const draws = stats.fixtures.draws.total;
  
  if (played === 0) return 0;
  
  return ((wins + draws) / played) * 100;
}

/**
 * Calcular promedio de goles totales (para Over/Under)
 */
export function calcularPromedioGolesTotales(stats: TeamStatistics): number {
  const golesAFavor = parseFloat(stats.goals.for.average.total) || 0;
  const golesEnContra = parseFloat(stats.goals.against.average.total) || 0;
  
  return golesAFavor + golesEnContra;
}

/**
 * Analizar racha reciente (últimos 5 partidos)
 */
export function analizarRacha(form: string): { wins: number; draws: number; loses: number } {
  const ultimos5 = form.slice(-5);
  
  return {
    wins: (ultimos5.match(/W/g) || []).length,
    draws: (ultimos5.match(/D/g) || []).length,
    loses: (ultimos5.match(/L/g) || []).length,
  };
}

/**
 * Obtener todos los equipos de una liga con sus estadísticas
 */
export async function obtenerEquiposLiga(leagueId: number, season: number = 2025): Promise<any[]> {
  if (USE_DEMO) {
    console.log('🎭 MODO DEMO: Devolviendo equipos de demostración');
    // Retornar los equipos que tenemos en datosDemo
    return Object.keys(estadisticasDemo).map(teamId => ({
      teamId: parseInt(teamId),
      stats: estadisticasDemo[parseInt(teamId)]
    }));
  }

  const url = `${BASE_URL}/teams?league=${leagueId}&season=${season}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-apisports-key': API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Error al obtener equipos: ${response.status}`);
  }

  const data = await response.json();
  
  // Obtener estadísticas de cada equipo
  const equiposConStats = [];
  for (const team of data.response) {
    try {
      const statsData = await obtenerEstadisticasEquipo(team.team.id, leagueId, season);
      equiposConStats.push({
        teamId: team.team.id,
        teamName: team.team.name,
        stats: statsData.response
      });
      await new Promise(resolve => setTimeout(resolve, 100)); // Pausas para no saturar API
    } catch (error) {
      console.error(`Error obteniendo stats de ${team.team.name}:`, error);
    }
  }

  return equiposConStats;
}
