// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  nitro: {
    preset: process.env.NITRO_PRESET || 'vercel',
    externals: {
      // Force-bundle all node_modules to avoid runtime resolution in Vercel functions
      inline: true
    }
  },
  vite: {
    ssr: {
      // Prevent SSR from externalizing these so they get bundled in server output
      noExternal: true
    }
  },
  routeRules: {
    '/**': {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
      }
    }
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  css: [],
  runtimeConfig: {
    fbProjectId: process.env.FB_PROJECT_ID,
    fbClientEmail: process.env.FB_CLIENT_EMAIL,
    fbPrivateKey: process.env.FB_PRIVATE_KEY,
    public: {
      fbApiKey: process.env.FB_API_KEY,
      fbAuthDomain: process.env.FB_AUTH_DOMAIN
    }
  }
})
