import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],

  build: {
    rollupOptions: {
      input: {

        main: resolve(__dirname, 'index.html'),

        emailVerification: resolve(__dirname, 'email-verification.html'),

        businessRegistration: resolve(__dirname, 'public/businessRegistration.html'),
        businessSignIn: resolve(__dirname, 'public/businessSignIn.html'),
        dashboard: resolve(__dirname, 'public/dashboard.html'),
        patientPortal: resolve(__dirname, 'public/patientPortal.html'),
        patientSignIn: resolve(__dirname, 'public/patientSign-in.html'),
        patientSignUp: resolve(__dirname, 'public/patientSign-up.html'),

      }
    }
  },

  server: {
    port: 5173,
    open: true
  },

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