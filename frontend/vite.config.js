import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Configure build for multiple HTML entry points
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        patientSignIn: resolve(__dirname, 'public/patientSign-in.html'),
        patientSignUp: resolve(__dirname, 'public/patientSign-up.html'),
        dashboard: resolve(__dirname, 'public/dashboard.html'),
        patientPortal: resolve(__dirname, 'public/patientPortal.html'),
        analytics: resolve(__dirname, 'public/analytics.html'),
        debugAuth: resolve(__dirname, 'public/debug-auth.html'),
        testGoogleAuth: resolve(__dirname, 'public/test-google-auth.html'),
        aiAssistant: resolve(__dirname, 'public/ai-assistant.html'),
        emailVerification: resolve(__dirname, 'email-verification.html')
      }
    }
  },
  
  // Configure development server
  server: {
    port: 5173,
    open: true
  },
  
  // Configure path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@components': resolve(__dirname, 'src/components'),
      '@config': resolve(__dirname, 'src/config')
    }
  }
}) 