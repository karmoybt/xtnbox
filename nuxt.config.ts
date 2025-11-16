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
  hooks: {
    'nitro:config'(config) {
      config.routeRules = {
        '/api/**': { cors: true },
      }
    },
  },
})