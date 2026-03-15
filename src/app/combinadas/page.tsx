"use client";

import Head from "next/head";

export default function GuiaYTutorialPage() {
  return (
    <>
      <Head>
        <title>Guía y Tutorial</title>
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-gray-100 to-gray-300 py-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Guía y Tutorial: Cómo usar la plataforma</h1>
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl border-2 border-gray-400">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Introducción</h2>
          <p className="text-lg text-gray-700 mb-6">
            Bienvenido a nuestra plataforma de combinadas de fútbol. Aquí te explicaremos cómo puedes crear, gestionar y disfrutar de tus propias combinadas de manera sencilla.
          </p>

          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Paso 1: Registro e inicio de sesión</h2>
          <p className="text-lg text-gray-700 mb-6">
            Para comenzar, regístrate en nuestra plataforma o inicia sesión si ya tienes una cuenta. Esto te permitirá guardar tus combinadas y acceder a ellas en cualquier momento.
          </p>

          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Paso 2: Crear una nueva combinada</h2>
          <p className="text-lg text-gray-700 mb-6">
            Dirígete a la sección "Crear nueva combinada". Allí podrás:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-6">
            <li>Escribir un nombre para tu combinada.</li>
            <li>Definir la cuota de la combinada.</li>
            <li>Seleccionar los equipos y criterios que formarán parte de la combinada.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Paso 3: Guardar y gestionar tus combinadas</h2>
          <p className="text-lg text-gray-700 mb-6">
            Una vez que hayas creado tu combinada, guárdala para poder consultarla más tarde en la sección "Mis Combinadas". Desde allí, podrás:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-6">
            <li>Editar el nombre o los equipos de una combinada.</li>
            <li>Eliminar combinadas que ya no necesites.</li>
            <li>Consultar estadísticas de tus combinadas, como el porcentaje de éxito y las rachas ganadoras.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Ejemplo práctico</h2>
          <p className="text-lg text-gray-700 mb-6">
            Imagina que quieres crear una combinada para la jornada actual de La Liga. Selecciona los equipos y criterios que prefieras, asigna un nombre como "Mi Combinada de La Liga" y guarda tu selección. Luego, podrás ver los resultados en la sección de "Mis Combinadas".
          </p>

          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Consejos y trucos</h2>
          <p className="text-lg text-gray-700 mb-6">
            - Experimenta con diferentes criterios para encontrar las combinadas más exitosas.
            - Consulta las estadísticas de tus combinadas para mejorar tus estrategias.
            - Comparte tus combinadas con amigos y compite para ver quién tiene la mejor racha.
          </p>

          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Estado de las combinadas</h2>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Equipos y Pronósticos de esta Combinada</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4">
              <h3 className="text-xl font-bold">R.Madrid</h3>
              <p>Liga: 1 DIVISION ESPAÑA</p>
              <p>Apuesta: Ganador</p>
              <p>Criterio: No definido</p>
              <p>Cuota:</p>
              <p className="font-semibold">Estado: <span className="text-green-600">Acertada</span></p>
            </div>
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4">
              <h3 className="text-xl font-bold">Manchester Utd</h3>
              <p>Liga: Premier League</p>
              <p>Apuesta: +1,5 GOLES</p>
              <p>Criterio: No definido</p>
              <p>Cuota:</p>
              <p className="font-semibold">Estado: <span className="text-red-600">Fallada</span></p>
            </div>
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4">
              <h3 className="text-xl font-bold">Verona</h3>
              <p>Liga: Serie A</p>
              <p>Apuesta: Pierde</p>
              <p>Criterio: No definido</p>
              <p>Cuota:</p>
              <p className="font-semibold">Estado: <span className="text-gray-600">Pendiente</span></p>
            </div>
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4">
              <h3 className="text-xl font-bold">Borussia Dortmund</h3>
              <p>Liga: Bundesliga</p>
              <p>Apuesta: -3,5 GOLES</p>
              <p>Criterio: No definido</p>
              <p>Cuota:</p>
              <p className="font-semibold">Estado: <span className="text-gray-600">Pendiente</span></p>
            </div>
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4">
              <h3 className="text-xl font-bold">Angers</h3>
              <p>Liga: Ligue 1</p>
              <p>Apuesta: -3,5 GOLES</p>
              <p>Criterio: No definido</p>
              <p>Cuota:</p>
              <p className="font-semibold">Estado: <span className="text-gray-600">Pendiente</span></p>
            </div>
          </div>

          <p className="text-lg text-gray-700">
            ¡Esperamos que disfrutes usando nuestra plataforma y que tengas mucho éxito con tus combinadas!
          </p>
        </div>
        <button
          onClick={() => { window.location.href = '/' }}
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition"
        >
          Volver a la página principal
        </button>
      </div>
    </>
  );
}
