/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{vue,svelte}",
  ],
  safelist: [
    // Tamaños necesarios
    'w-4', 'h-4', 'w-5', 'h-5', 'w-6', 'h-6', 'w-8', 'h-8', 
    'w-10', 'h-10', 'w-12', 'h-12', 'w-16', 'h-16',
    // Colores
    'bg-green-600', 'bg-green-700', 'hover:bg-green-700',
    'text-green-100', 'text-green-600', 'text-green-700',
    'bg-blue-50', 'bg-blue-500', 'bg-yellow-500', 'bg-red-50',
    'border-green-500', 'ring-green-500', 'focus:ring-green-500',
    // Layouts
    'rounded-lg', 'rounded-xl', 'shadow-lg', 'min-h-screen',
    'max-w-md', 'space-y-6', 'space-y-4', 'flex-shrink-0',
    // Gradientes
    'bg-gradient-to-br', 'from-blue-50', 'to-green-50'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f0',
          100: '#dcf2dc',
          200: '#bce5bc',
          300: '#8dd18d',
          400: '#56b556',
          500: '#228B22', // Verde principal
          600: '#1e7a1e',
          700: '#1a661a',
          800: '#175217',
          900: '#154515',
        },
        secondary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#DC143C', // Rojo principal
          600: '#c41e3a',
          700: '#a71e34',
          800: '#881e2e',
          900: '#701a25',
        },
      },
    },
  },
  plugins: [],
}
