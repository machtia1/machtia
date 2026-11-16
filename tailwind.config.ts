import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cm: {
          bg: '#0A0E27',
          primary: '#2E3192',
          primaryDark: '#1F2266',
          accent: '#29ABE2',
          navy: '#082a5c',
          tinta: '#0b1f4d',
          cian: '#1fe0ee',
        },
      },
    },
  },
  plugins: [],
};

export default config;
