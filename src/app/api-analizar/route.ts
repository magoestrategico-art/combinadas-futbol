import { NextResponse } from 'next/server';

const API_KEY = process.env.FOOTBALL_DATA_KEY || "";

const LIGAS: Record<string, string> = {
  "premier": "PL",
  "premier league": "PL",
  "laliga": "PD",
  "la liga": "PD",
  "españa": "PD",
  "bundesliga": "BL1",
  "alemania": "BL1",
  "serie a": "SA",
  "seriea": "SA",
  "italia": "SA",
  "ligue 1": "FL1",
  "ligue1": "FL1",
  "francia": "FL1",
  "champions": "CL",
  "champions league": "CL",
  "eredivisie": "DED",
  "holanda": "DED",
  "portugal": "PPL",
  "brasil": "BSA"
};

interface Match {
  score: { fullTime: { home: number | null; away: number | null } };
  homeTeam: { id: number };
  awayTeam: { id: number };
}

function calcularMedia(matches: Match[], teamId: number): number {
  let goles = 0;
  let count = 0;

  for (const m of matches || []) {
    if (m.score.fullTime.home === null || m.score.fullTime.away === null) continue;

    const esLocal = m.homeTeam.id === teamId;
    const marcados = esLocal ? m.score.fullTime.home : m.score.fullTime.away;
    const encajados = esLocal ? m.score.fullTime.away : m.score.fullTime.home;

    goles += (marcados + encajados);
    count++;
  }

  return count > 0 ? goles / count : 0;
}

export async function POST(request: Request) {
  const { liga } = await request.json();

  if (!liga) {
    return NextResponse.json({ resultado: "Falta la liga" });
  }

  try {
    const code = LIGAS[liga.toLowerCase().trim()];
    if (!code) return NextResponse.json({ resultado: "Liga no soportada" });

    // � PARTIDOS PROGRAMADOS (sin límite de fechas)
    const partidosRes = await fetch(
      `https://api.football-data.org/v4/competitions/${code}/matches?status=SCHEDULED`,
      { headers: { "X-Auth-Token": API_KEY } }
    );
    const partidosData = await partidosRes.json();
    const partidos = partidosData.matches;

    if (!partidos || partidos.length === 0) {
      const motivo = partidosData.message || partidosData.error || "Sin partidos en la API";
      return NextResponse.json({ resultado: `Sin datos: ${motivo}` });
    }

    let mejorPartido: string | null = null;
    let mejorMedia = 0;

    // 🔁 ANALIZAR SOLO LOS PRIMEROS 5 PARTIDOS (evitar rate limit)
    const primeros = partidos.slice(0, 5);
    for (const partido of primeros) {
      const homeId = partido.homeTeam.id;
      const awayId = partido.awayTeam.id;

      const [homeRes, awayRes] = await Promise.all([
        fetch(`https://api.football-data.org/v4/teams/${homeId}/matches?limit=5&status=FINISHED`, {
          headers: { "X-Auth-Token": API_KEY }
        }),
        fetch(`https://api.football-data.org/v4/teams/${awayId}/matches?limit=5&status=FINISHED`, {
          headers: { "X-Auth-Token": API_KEY }
        })
      ]);

      const [homeData, awayData] = await Promise.all([homeRes.json(), awayRes.json()]);

      const mediaHome = calcularMedia(homeData.matches, homeId);
      const mediaAway = calcularMedia(awayData.matches, awayId);
      const mediaTotal = mediaHome + mediaAway;

      if (mediaTotal > mejorMedia) {
        mejorMedia = mediaTotal;
        mejorPartido = `${partido.homeTeam.name} vs ${partido.awayTeam.name}`;
      }
    }

    if (!mejorPartido) {
      return NextResponse.json({ resultado: "No se encontró partido" });
    }

    let resultado: string;

    if (mejorMedia >= 3) {
      resultado = `🔥 MEJOR PARTIDO OVER 2.5 (${mejorPartido})`;
    } else if (mejorMedia >= 2.5) {
      resultado = `⚠️ PARTIDO INTERESANTE (${mejorPartido})`;
    } else {
      resultado = `❌ NO APOSTAR (${mejorPartido})`;
    }

    return NextResponse.json({ resultado });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ resultado: "Error al analizar" });
  }
}