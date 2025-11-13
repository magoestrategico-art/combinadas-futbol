// Script de prueba para Football-Data.org
// Encuentra el equipo con menos goles por partido en La Liga 2024-2025

const API_KEY = ''; // <-- PONER TU API KEY AQUÍ (obtener en https://www.football-data.org/client/register)
const BASE_URL = 'https://api.football-data.org/v4';
const LA_LIGA_ID = 2014;

async function probarFootballData() {
  if (!API_KEY) {
    console.log('❌ Error: Necesitas una API Key de Football-Data.org');
    console.log('📝 Regístrate gratis en: https://www.football-data.org/client/register');
    console.log('✏️  Luego copia tu API key y pégala en la variable API_KEY de este archivo');
    return;
  }

  try {
    console.log('🔍 Consultando La Liga temporada 2024-2025...\n');
    
    const url = `${BASE_URL}/competitions/${LA_LIGA_ID}/standings?season=2024`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Auth-Token': API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      const errorData = await response.json();
      console.error('Detalles:', errorData);
      return;
    }

    const data = await response.json();
    const equipos = data.standings[0].table;

    console.log(`✅ Encontrados ${equipos.length} equipos\n`);

    // Calcular promedio de goles para cada equipo
    const equiposConPromedio = equipos.map((equipo) => {
      const golesAFavor = equipo.goalsFor / equipo.playedGames;
      const golesEnContra = equipo.goalsAgainst / equipo.playedGames;
      const promedioTotal = golesAFavor + golesEnContra;

      return {
        nombre: equipo.team.name,
        partidos: equipo.playedGames,
        golesAFavor: golesAFavor.toFixed(2),
        golesEnContra: golesEnContra.toFixed(2),
        promedioTotal: promedioTotal.toFixed(2),
      };
    });

    // Ordenar por menor promedio
    equiposConPromedio.sort((a, b) => parseFloat(a.promedioTotal) - parseFloat(b.promedioTotal));

    console.log('📊 TOP 5 EQUIPOS CON MENOS GOLES POR PARTIDO:');
    console.log('=================================================\n');

    equiposConPromedio.slice(0, 5).forEach((equipo, index) => {
      console.log(`${index + 1}. ${equipo.nombre}`);
      console.log(`   Partidos: ${equipo.partidos}`);
      console.log(`   Goles a favor/partido: ${equipo.golesAFavor}`);
      console.log(`   Goles en contra/partido: ${equipo.golesEnContra}`);
      console.log(`   📉 Promedio total: ${equipo.promedioTotal} goles/partido`);
      console.log('');
    });

    // Verificar si hay empate en el primer lugar
    const menorPromedio = equiposConPromedio[0].promedioTotal;
    const equiposEmpatados = equiposConPromedio.filter(e => e.promedioTotal === menorPromedio);

    console.log('🏆 EQUIPO(S) CON MENOS GOLES:');
    console.log('=================================================\n');

    if (equiposEmpatados.length === 1) {
      console.log(`✅ ${equiposEmpatados[0].nombre}`);
      console.log(`   ${menorPromedio} goles por partido (promedio)`);
    } else {
      console.log(`✅ EMPATE (${equiposEmpatados.length} equipos con ${menorPromedio} goles/partido):`);
      equiposEmpatados.forEach(e => {
        console.log(`   - ${e.nombre}`);
      });
    }

    console.log('\n✨ ¡Datos de la temporada ACTUAL 2024-2025!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

probarFootballData();
