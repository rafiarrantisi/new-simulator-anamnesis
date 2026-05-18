/** Tailwind ter-scope: di-render dalam Shadow DOM (preflight aman, tak
 *  bocor ke design.css app legacy — kontrak §3B.4). */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ruang periksa semi-gelap (plan §2.2: dark default station exam)
        exam: {
          bg: '#0b0f14',
          panel: '#121823',
          line: '#1f2a37',
          ink: '#e6edf3',
          mut: '#8b98a5',
          accent: '#4cc2ff',
          warn: '#ffb454',
          danger: '#ff6b6b',
          ok: '#5ce39b',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        chart: ['Sloan', 'Optician Sans', 'monospace'],
      },
    },
  },
  plugins: [],
};
