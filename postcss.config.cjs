// ADD THIS: PostCSS config compatible with Tailwind v3 and v4
const tailwindVersion = require('tailwindcss/package.json').version
const isTailwindV4 = Number.parseInt(tailwindVersion.split('.')[0] ?? '3', 10) >= 4

const tailwindPlugin = isTailwindV4 ? require('@tailwindcss/postcss') : require('tailwindcss')

module.exports = {
  plugins: [tailwindPlugin(), require('autoprefixer')()],
}
