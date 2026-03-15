import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        'primary-foreground': 'var(--primary-foreground-color)',
        background: 'var(--background-color)',
        card: 'var(--card-color)',
        'card-border': 'var(--card-border-color)',
        'text-primary': 'var(--text-primary-color)',
        'text-secondary': 'var(--text-secondary-color)',
        destructive: 'var(--destructive-color)',
        'destructive-foreground': 'var(--destructive-foreground-color)',
        accent: 'var(--accent-color)',
        'accent-foreground': 'var(--accent-foreground-color)',
        ring: 'var(--ring-color)',
        input: 'var(--input-color)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      transitionDuration: {
        '300': '300ms',
      },
    },
  },
  plugins: [],
}

export default config
