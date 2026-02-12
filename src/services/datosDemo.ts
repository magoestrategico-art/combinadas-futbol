// Datos DEMO para pruebas cuando API-Football no devuelve resultados
// Estos son partidos reales de La Liga con estadísticas aproximadas

export const fixturesDemo = {
  response: [
    {
      fixture: { id: 1, date: '2025-11-15T20:00:00Z' },
      league: { id: 140, name: 'La Liga', country: 'Spain' },
      teams: {
        home: { id: 541, name: 'Real Madrid', logo: '' },
        away: { id: 727, name: 'Osasuna', logo: '' }
      }
    },
    {
      fixture: { id: 2, date: '2025-11-16T18:30:00Z' },
      league: { id: 140, name: 'La Liga', country: 'Spain' },
      teams: {
        home: { id: 529, name: 'Barcelona', logo: '' },
        away: { id: 720, name: 'Las Palmas', logo: '' }
      }
    },
    {
      fixture: { id: 3, date: '2025-11-16T16:15:00Z' },
      league: { id: 140, name: 'La Liga', country: 'Spain' },
      teams: {
        home: { id: 530, name: 'Atletico Madrid', logo: '' },
        away: { id: 724, name: 'Alaves', logo: '' }
      }
    },
    {
      fixture: { id: 4, date: '2025-11-17T14:00:00Z' },
      league: { id: 140, name: 'La Liga', country: 'Spain' },
      teams: {
        home: { id: 536, name: 'Sevilla', logo: '' },
        away: { id: 728, name: 'Rayo Vallecano', logo: '' }
      }
    },
    {
      fixture: { id: 5, date: '2025-11-17T16:15:00Z' },
      league: { id: 140, name: 'La Liga', country: 'Spain' },
      teams: {
        home: { id: 532, name: 'Valencia', logo: '' },
        away: { id: 548, name: 'Real Betis', logo: '' }
      }
    }
  ]
};

export const estadisticasDemo: Record<number, any> = {
  // ===== LA LIGA (Primera División) =====
  
  // Real Madrid (Ganador + Under 3.5)
  541: {
    team: { id: 541, name: 'Real Madrid' },
    form: 'WWDWW',
    league: 'La Liga',
    fixtures: { played: { total: 13 }, wins: { total: 10 }, draws: { total: 2 }, loses: { total: 1 } },
    goals: { for: { average: { total: '2.1' } }, against: { average: { total: '0.7' } } }
  },
  // Barcelona (alta probabilidad no pierde + over goles)
  529: {
    team: { id: 529, name: 'Barcelona' },
    form: 'WWWWL',
    league: 'La Liga',
    fixtures: { played: { total: 13 }, wins: { total: 11 }, draws: { total: 1 }, loses: { total: 1 } },
    goals: { for: { average: { total: '3.2' } }, against: { average: { total: '1.1' } } }
  },
  // Atletico Madrid (alta probabilidad no pierde + under goles)
  530: {
    team: { id: 530, name: 'Atletico Madrid' },
    form: 'DWWDW',
    league: 'La Liga',
    fixtures: { played: { total: 13 }, wins: { total: 8 }, draws: { total: 4 }, loses: { total: 1 } },
    goals: { for: { average: { total: '1.5' } }, against: { average: { total: '0.6' } } }
  },
  // Osasuna
  727: {
    team: { id: 727, name: 'Osasuna' },
    form: 'LWDLL',
    fixtures: { played: { total: 12 }, wins: { total: 3 }, draws: { total: 3 }, loses: { total: 6 } },
    goals: { for: { average: { total: '1.0' } }, against: { average: { total: '1.8' } } }
  },
  // Las Palmas (over goles)
  720: {
    team: { id: 720, name: 'Las Palmas' },
    form: 'LLWLL',
    fixtures: { played: { total: 12 }, wins: { total: 3 }, draws: { total: 2 }, loses: { total: 7 } },
    goals: { for: { average: { total: '1.3' } }, against: { average: { total: '2.2' } } }
  },
  // Alaves (under goles)
  724: {
    team: { id: 724, name: 'Alaves' },
    form: 'DLDWD',
    fixtures: { played: { total: 12 }, wins: { total: 2 }, draws: { total: 6 }, loses: { total: 4 } },
    goals: { for: { average: { total: '0.8' } }, against: { average: { total: '1.0' } } }
  },
  // Sevilla
  536: {
    team: { id: 536, name: 'Sevilla' },
    form: 'WDLWD',
    fixtures: { played: { total: 12 }, wins: { total: 4 }, draws: { total: 4 }, loses: { total: 4 } },
    goals: { for: { average: { total: '1.3' } }, against: { average: { total: '1.3' } } }
  },
  // Rayo Vallecano
  728: {
    team: { id: 728, name: 'Rayo Vallecano' },
    form: 'LWLWL',
    fixtures: { played: { total: 12 }, wins: { total: 4 }, draws: { total: 2 }, loses: { total: 6 } },
    goals: { for: { average: { total: '1.2' } }, against: { average: { total: '1.6' } } }
  },
  // Valencia
  532: {
    team: { id: 532, name: 'Valencia' },
    form: 'LLLLD',
    fixtures: { played: { total: 12 }, wins: { total: 1 }, draws: { total: 3 }, loses: { total: 8 } },
    goals: { for: { average: { total: '0.9' } }, against: { average: { total: '1.7' } } }
  },
  // Real Betis
  548: {
    team: { id: 548, name: 'Real Betis' },
    form: 'WLDWL',
    league: 'La Liga',
    fixtures: { played: { total: 13 }, wins: { total: 5 }, draws: { total: 3 }, loses: { total: 5 } },
    goals: { for: { average: { total: '1.4' } }, against: { average: { total: '1.4' } } }
  },

  // ===== SEGUNDA DIVISIÓN (LaLiga2) =====
  
  // Racing Santander (UNDER 3.5 goles)
  715: {
    team: { id: 715, name: 'Racing Santander' },
    form: 'WDWDD',
    league: 'LaLiga2',
    fixtures: { played: { total: 14 }, wins: { total: 6 }, draws: { total: 5 }, loses: { total: 3 } },
    goals: { for: { average: { total: '1.1' } }, against: { average: { total: '0.8' } } }
  },
  // Sporting Gijon (OVER 1.5 goles)
  546: {
    team: { id: 546, name: 'Sporting Gijon' },
    form: 'WWLWW',
    league: 'LaLiga2',
    fixtures: { played: { total: 14 }, wins: { total: 8 }, draws: { total: 2 }, loses: { total: 4 } },
    goals: { for: { average: { total: '1.9' } }, against: { average: { total: '1.4' } } }
  },
  // Granada (UNDER 3.5)
  716: {
    team: { id: 716, name: 'Granada' },
    form: 'DWWDL',
    league: 'LaLiga2',
    fixtures: { played: { total: 14 }, wins: { total: 7 }, draws: { total: 4 }, loses: { total: 3 } },
    goals: { for: { average: { total: '1.2' } }, against: { average: { total: '0.9' } } }
  },
  // Levante (OVER 1.5)
  729: {
    team: { id: 729, name: 'Levante' },
    form: 'WLWWL',
    league: 'LaLiga2',
    fixtures: { played: { total: 14 }, wins: { total: 7 }, draws: { total: 3 }, loses: { total: 4 } },
    goals: { for: { average: { total: '1.8' } }, against: { average: { total: '1.5' } } }
  }
};
