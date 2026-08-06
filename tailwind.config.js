/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm off-white / pale clinical grey, one confident accent.
        bone: '#F6F4F0',
        bone2: '#EEEAE3',
        grey: '#D9D9D6',
        ink: '#14181A',
        ink2: '#3C4448',
        muted: '#6B7478',
        accent: '#0E5C5C',
        accentHi: '#0F7A75',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        soft: '14px',
        softer: '22px',
      },
      // Extra steps used by the hairline borders and legibility washes. These feed the
      // `/xx` colour modifier, so `border-ink/12` and `bg-ink/92` resolve.
      opacity: {
        12: '0.12',
        45: '0.45',
        92: '0.92',
        97: '0.97',
      },
      maxWidth: {
        shell: '1440px',
      },
      transitionTimingFunction: {
        calm: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
