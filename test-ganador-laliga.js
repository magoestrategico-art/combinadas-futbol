// Script para Football-Data.org: equipo con más victorias en La Liga 2025-2026
const API_KEY = '7742659853f144e2bd653f19a68b8e5a';
const BASE_URL = 'https://api.football-data.org/v4';
const LA_LIGA_ID = 2014;

async function main() {
  const url = `${BASE_URL}/competitions/${LA_LIGA_ID}/standings?season=2025`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'X-Auth-Token': API_KEY },
  });
  if (!response.ok) {
    console.error('Error:', response.status, response.statusText);
    return;
  }
  const data = await response.json();
  const equipos = data.standings[0].table;
  const maxVictorias = Math.max(...equipos.map(e => e.won));
  const equiposMax = equipos.filter(e => e.won === maxVictorias);
  console.log('🏆 Equipo(s) con más victorias en La Liga 2025-2026:');
  equiposMax.forEach(e => {
    console.log(`- ${e.team.name} (${e.won} victorias)`);
  });
}
main();
