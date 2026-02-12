// Script: Equipo con más partidos entre 2 y 3 goles en La Liga 2025-2026
const API_KEY = '7742659853f144e2bd653f19a68b8e5a';
const BASE_URL = 'https://api.football-data.org/v4';
const LA_LIGA_ID = 2014;
const SEASON = 2025;

async function fetchJSON(url) {
  const response = await fetch(url, {
    headers: { 'X-Auth-Token': API_KEY },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function main() {
  // 1. Obtener equipos de La Liga
  const standingsUrl = `${BASE_URL}/competitions/${LA_LIGA_ID}/standings?season=${SEASON}`;
  const standings = await fetchJSON(standingsUrl);
  const equipos = standings.standings[0].table;

  let maxCount = 0;
  let equiposMax = [];
  for (const equipo of equipos) {
    // 2. Obtener partidos jugados por el equipo
    const matchesUrl = `${BASE_URL}/teams/${equipo.team.id}/matches?season=${SEASON}&competition=${LA_LIGA_ID}`;
    const data = await fetchJSON(matchesUrl);
    const partidos = data.matches || [];
    // 3. Contar partidos con 2 o 3 goles totales
    let count = 0;
    for (const partido of partidos) {
      if (partido.status !== 'FINISHED') continue;
      const goles = (partido.score.fullTime.home ?? 0) + (partido.score.fullTime.away ?? 0);
      if (goles >= 2 && goles <= 3) count++;
    }
    if (count > maxCount) {
      maxCount = count;
      equiposMax = [equipo.team.name];
    } else if (count === maxCount) {
      equiposMax.push(equipo.team.name);
    }
    console.log(`- ${equipo.team.name}: ${count} partidos entre 2 y 3 goles`);
    // Pausa para no superar el límite de la API
    await new Promise(r => setTimeout(r, 700));
  }
  console.log('\n🏆 Equipo(s) con más partidos entre 2 y 3 goles:');
  equiposMax.forEach(e => console.log(`- ${e} (${maxCount} partidos)`));
}

main();
