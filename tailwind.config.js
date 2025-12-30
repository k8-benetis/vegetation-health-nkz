/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // CRITICAL: Prefix todas las clases para evitar colisiones con el host
  prefix: 'vp-',
  corePlugins: {
    // CRITICAL: Desactivar preflight para no resetear estilos del host
    // El preflight de Tailwind resetea márgenes, paddings y estilos base
    // que rompen los grids y layouts del host
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
