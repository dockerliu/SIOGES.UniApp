import { defineConfig } from 'vite'
import uniPlugin from '@dcloudio/vite-plugin-uni'

// The plugin is CommonJS. Normalize both the Vite-bundled and Node ESM
// interop shapes: either the function itself or { default: function }.
const uni = typeof uniPlugin === 'function'
  ? uniPlugin
  : (uniPlugin as unknown as { default: typeof uniPlugin }).default

export default defineConfig({
  plugins: [uni()],
  server: { host: '0.0.0.0', port: 5173 },
})
