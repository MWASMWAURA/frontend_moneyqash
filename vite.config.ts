import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` (dev/prod)
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@shared': path.resolve(__dirname, './shared'),
      },
    },
    // Set base URL for production (empty for root domain)
    base: env.VITE_BASE_URL || '/',
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development', // Only sourcemap in dev for faster builds
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better caching
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-toast'],
            'query-vendor': ['@tanstack/react-query'],
            'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge'],
          },
        },
      },
      // Enable tree shaking
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production', // Only drop console in production
          drop_debugger: true,
        },
      },
      // Reduce chunk size warnings threshold
      chunkSizeWarningLimit: 300,
    },
    server: {
      host: true, // Allow external connections for mobile testing
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          // Note: cookies are handled by the browser; avoid forcing a cookie domain
          headers: {
            'Origin': env.VITE_ORIGIN || 'http://localhost:5173',
            'Referer': env.VITE_REFERER || 'http://localhost:5173/',
          },
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Ensure cookies are forwarded
              const cookie = req.headers.cookie;
              if (cookie) {
                proxyReq.setHeader('cookie', cookie);
              }
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
              const setCookie = proxyRes.headers['set-cookie'];
              if (setCookie) {
                console.log('Set-Cookie received from target:', setCookie);
              }
            });
          },
        },
      },
    },
    preview: {
      port: 4173,
      host: true,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', '@tanstack/react-query'],
    },
    define: {
      // Define global constants
      __APP_ENV__: JSON.stringify(env.APP_ENV || 'development'),
    },
  }
})
