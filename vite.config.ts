import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-chakra': ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion'],
          'vendor-web3': ['viem', 'wagmi', '@tanstack/react-query'],
          'vendor-appkit': ['@reown/appkit', '@reown/appkit-adapter-wagmi'],
        },
      },
    },
  },
  server: {
    port: 5199,
    host: '0.0.0.0',
  },
})
