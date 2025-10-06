// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  nitro: {
    // Use Vercel serverless so /api routes deploy
    preset: 'vercel',
    externals: {
      // Ensure renderer libs are bundled to avoid runtime resolution issues
      inline: ['vue-bundle-renderer', '@vue/shared']
    }
  },
  // Rely on Nitro's defaults for externalization/bundling.
  // Avoid forcing `noExternal` to reduce bundling surprises.
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
