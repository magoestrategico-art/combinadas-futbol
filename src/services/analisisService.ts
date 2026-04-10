import axios from "axios";

// 🔥 TU LÓGICA (ejemplo - luego la cambiamos por la tuya)
function tuLogica(datos: { home: number; away: number }) {
  if (datos.home > 2 && datos.away > 1) {
    return "OVER 2.5 GOLES 🔥";
  }

  return "NO APOSTAR";
}

// 🔥 LLAMADA A API (CAMBIA URL POR LA TUYA)
async function obtenerDatosAPI(liga: string) {
  const response = await axios.get("TU_API_URL_AQUI");

  return response.data;
}

// 🔥 TRANSFORMAR DATOS
function transformarDatos(apiData: { home_goals?: number; away_goals?: number }) {
  return {
    home: apiData.home_goals || 1.5,
    away: apiData.away_goals || 1.2
  };
}

export { tuLogica, obtenerDatosAPI, transformarDatos };