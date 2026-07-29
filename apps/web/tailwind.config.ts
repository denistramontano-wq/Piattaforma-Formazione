import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#eef4ff',
          100: '#d9e6ff',
          400: '#5b8def',
          500: '#3366ff',
          600: '#254edb',
          700: '#1c3ba8',
        },
      },
    },
  },
  plugins: [],
};

export default config;
