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
        },
      },
    },
  },
  plugins: [],
};

export default config;
