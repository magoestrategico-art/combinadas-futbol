// Script temporal para consultar equipos de La Liga con menos goles

const API_KEY = 'bb96056d49737886e0e6917eab7076ff';
const API_HOST = 'v3.football.api-sports.io';
const BASE_URL = `https://${API_HOST}`;

async function obtenerEquiposLaLiga() {
  const url = `${BASE_URL}/teams?league=140&season=2023`;
  
  console.log('🔍 Consultando equipos de La Liga (temporada 2023)...');
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-apisports-key': API_KEY,
    },
  });

  const data = await response.json();
  console.log('📡 Status:', response.status);
  if (data.errors && Object.keys(data.errors).length > 0) {
    console.log('⚠️ Errores:', data.errors);
  }
  return data.response || [];
}

async function obtenerEstadisticasEquipo(teamId) {
  const url = `${BASE_URL}/teams/statistics?league=140&season=2023&team=${teamId}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-apisports-key': API_KEY,
    },
  });

  const data = await response.json();
  return data.response;
}

async function encontrarEquipoConMenosGoles() {
  try {
    // 1. Obtener todos los equipos de La Liga
    const equipos = await obtenerEquiposLaLiga();
    console.log(`✅ Encontrados ${equipos.length} equipos\n`);

    // 2. Obtener estadísticas de cada equipo
    const equiposConStats = [];
    
    for (const equipo of equipos.slice(0, 10)) { // Solo primeros 10 para no gastar muchas llamadas
      console.log(`📊 Consultando: ${equipo.team.name}...`);
      
      const stats = await obtenerEstadisticasEquipo(equipo.team.id);
      
      if (stats && stats.goals) {
        const golesAFavor = parseFloat(stats.goals.for.average.total || '0');
        const golesEnContra = parseFloat(stats.goals.against.average.total || '0');
        const promedio = golesAFavor + golesEnContra;
        
        equiposConStats.push({
          nombre: equipo.team.name,
          id: equipo.team.id,
          golesAFavor: golesAFavor.toFixed(2),
          golesEnContra: golesEnContra.toFixed(2),
          promedioTotal: promedio.toFixed(2),
        });
        
        console.log(`   Goles favor: ${golesAFavor.toFixed(2)} | Contra: ${golesEnContra.toFixed(2)} | Total: ${promedio.toFixed(2)}`);
      }
      
      // Pequeña pausa para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 3. Ordenar por promedio de goles (menor a mayor)
    equiposConStats.sort((a, b) => parseFloat(a.promedioTotal) - parseFloat(b.promedioTotal));

    console.log('\n🏆 RESULTADOS:');
    console.log('=====================================');
    
    const menorPromedio = equiposConStats[0].promedioTotal;
    const equiposConMenorPromedio = equiposConStats.filter(e => e.promedioTotal === menorPromedio);
    
    if (equiposConMenorPromedio.length === 1) {
      console.log(`\n✅ Equipo con MENOS goles por partido:`);
      console.log(`   ${equiposConMenorPromedio[0].nombre} - ${equiposConMenorPromedio[0].promedioTotal} goles/partido`);
    } else {
      console.log(`\n✅ Equipos EMPATADOS con menos goles (${menorPromedio} goles/partido):`);
      equiposConMenorPromedio.forEach(e => {
        console.log(`   - ${e.nombre}`);
      });
    }
    
    console.log('\n📋 Top 5 equipos con menos goles:');
    equiposConStats.slice(0, 5).forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.nombre} - ${e.promedioTotal} goles/partido`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

encontrarEquipoConMenosGoles();
