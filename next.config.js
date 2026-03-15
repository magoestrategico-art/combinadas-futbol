/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Removido 'output: export' para permitir rutas dinámicas con SSR
  devIndicators: {
    buildActivity: false,
  },
};

module.exports = nextConfig;
