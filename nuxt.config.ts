import { defineNuxtConfig } from 'nuxt/config'
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint',
             '@nuxt/hints', 
             '@nuxt/ui'],
  nitro: {
    experimental: { database: true },
  },
  routeRules: {
      '/api/auth/**': { cors: true },
      '/api/**': { middleware: ['trace-id', 'rate-limit'] }, // todos los APIs
    },
  hooks: {
    'nitro:config'(config) {
      config.routeRules = {
        '/api/**': { cors: true },
      }
      
    },
  },
})