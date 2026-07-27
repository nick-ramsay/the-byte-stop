import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Needed so `datadog-ci sourcemaps upload` has something to unminify against.
    sourcemap: true,
  },
  server: {
    // Bind-mounted volumes under Docker Desktop on macOS don't always propagate
    // inotify events, so polling keeps HMR working inside the container.
    watch: {
      usePolling: true,
    },
  },
})
