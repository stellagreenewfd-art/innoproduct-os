/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ip: {
          bg: '#f8fafc',
          surface: '#ffffff',
          border: '#e2e8f0',
          primary: '#4f46e5',
          'primary-light': '#eef2ff',
          'primary-dark': '#3730a3',
          accent: '#0ea5e9',
          'accent-light': '#e0f2fe',
          success: '#10b981',
          'success-light': '#ecfdf5',
          warning: '#f59e0b',
          'warning-light': '#fffbeb',
          danger: '#ef4444',
          'danger-light': '#fef2f2',
          text: '#1e293b',
          'text-secondary': '#64748b',
          'text-tertiary': '#94a3b8',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
