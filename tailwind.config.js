/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          app: 'var(--bg-app)',
          elevated: 'var(--bg-elevated)',
          subtle: 'var(--bg-subtle)'
        },
        fg: {
          primary: 'var(--fg-primary)',
          muted: 'var(--fg-muted)',
          inverted: 'var(--fg-inverted)'
        },
        border: {
          DEFAULT: 'var(--border)'
        },
        accent: {
          DEFAULT: 'var(--accent)',
          fg: 'var(--accent-foreground)'
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        ring: 'var(--ring)'
      },
      boxShadow: {
        focus: '0 0 0 3px var(--ring)'
      }
    },
  },
  plugins: [],
}
