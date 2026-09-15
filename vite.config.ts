import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    // Cloudflare must lead so the SSR environment is the Worker runtime.
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    devtools(),
    tailwindcss(),
    // SPA/prerender — static shell; no runtime SSR (docs/adr/0001, 0002)
    tanstackStart({ spa: { enabled: true } }),
    viteReact(),
  ],
})

export default config
