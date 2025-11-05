export default function ContactoPage() {
  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Contacto</h1>
      <div className="bg-white p-6 rounded shadow">
        <p className="mb-4">¿Tienes dudas, sugerencias o quieres colaborar? Escríbenos:</p>
        <ul className="mb-4">
          <li>Email: <a href="mailto:info@combinadasdefutbol.com" className="text-blue-600 underline">info@combinadasdefutbol.com</a></li>
          <li>Instagram: <a href="https://instagram.com/combinadasdefutbol" target="_blank" rel="noopener" className="text-pink-600 underline">@combinadasdefutbol</a></li>
        </ul>
        <p>Puedes usar el formulario de contacto o escribirnos directamente por redes sociales.</p>
      </div>
    </div>
  );
}
