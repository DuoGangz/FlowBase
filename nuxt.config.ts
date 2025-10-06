// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  nitro: {
    preset: process.env.NITRO_PRESET || 'vercel',
    externals: {
      // Ensure SSR renderer deps are bundled so Vercel functions don't need them at runtime
      inline: ['vue', '@vue/shared', '@vue/runtime-core', '@vue/reactivity', 'vue-bundle-renderer']
    }
  },
  vite: {
    ssr: {
      // Prevent SSR from externalizing these so they get bundled in server output
      noExternal: ['vue-bundle-renderer', '@vue/shared', '@vue/reactivity', '@vue/runtime-core']
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
