// Script: Cuántas veces han coincidido 4 equipos en la misma jornada (fecha) en La Liga 2025-2026
const API_KEY = '7742659853f144e2bd653f19a68b8e5a';
const BASE_URL = 'https://api.football-data.org/v4';
const SEASON = 2025;
const LA_LIGA_ID = 2014;

// Nombres exactos según Football-Data.org
const equipos = [
  { nombre: 'FC Barcelona', id: null },
  { nombre: 'Villarreal CF', id: null },
  { nombre: 'Club Atlético de Madrid', id: null },
  { nombre: 'Real Betis Balompié', id: null }
];

async function fetchJSON(url) {
  const response = await fetch(url, {
    headers: { 'X-Auth-Token': API_KEY },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function main() {
  // 1. Obtener IDs de los equipos
  const standingsUrl = `${BASE_URL}/competitions/${LA_LIGA_ID}/standings?season=${SEASON}`;
  const standings = await fetchJSON(standingsUrl);
  const tabla = standings.standings[0].table;
  for (const eq of equipos) {
    const found = tabla.find(e => e.team.name === eq.nombre);
    if (found) eq.id = found.team.id;
    else throw new Error('No se encontró el equipo: ' + eq.nombre);
  }

  // 2. Obtener partidos jugados por cada equipo
  const partidosPorEquipo = {};
  for (const eq of equipos) {
    const matchesUrl = `${BASE_URL}/teams/${eq.id}/matches?season=${SEASON}&competition=${LA_LIGA_ID}`;
    const data = await fetchJSON(matchesUrl);
    partidosPorEquipo[eq.nombre] = (data.matches || []).filter(m => m.status === 'FINISHED');
    await new Promise(r => setTimeout(r, 700));
  }

  // 3. Mapear por fecha (o jornada)
  const fechasPorEquipo = {};
  for (const eq of equipos) {
    fechasPorEquipo[eq.nombre] = partidosPorEquipo[eq.nombre].map(m => m.utcDate.split('T')[0]);
  }

  // 4. Buscar fechas donde los 4 equipos jugaron
  const todasFechas = [].concat(...Object.values(fechasPorEquipo));
  const fechasUnicas = [...new Set(todasFechas)];
  let coincidencias = 0;
  for (const fecha of fechasUnicas) {
    if (equipos.every(eq => fechasPorEquipo[eq.nombre].includes(fecha))) {
      coincidencias++;
      console.log(`✔ Coincidencia en fecha: ${fecha}`);
    }
  }
  console.log(`\n🔎 Los 4 equipos han coincidido en la misma jornada (fecha) un total de: ${coincidencias} veces.`);
}

main();
