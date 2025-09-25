import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const apiKey = config.public.fbApiKey as string | undefined
  const authDomain = config.public.fbAuthDomain as string | undefined

  // If Firebase is not configured, provide safe no-ops instead of crashing
  if (!apiKey || !authDomain) {
    console.warn('[Firebase] Missing fbApiKey/fbAuthDomain in runtimeConfig.public. Google login disabled.')
    return {
      provide: {
        googleLogin: async () => { throw new Error('Firebase is not configured (missing API key or Auth domain).') },
        googleLogout: async () => {}
      }
    }
  }

  const app = getApps().length ? getApp() : initializeApp({ apiKey, authDomain })
  const auth = getAuth(app)
  const provider = new GoogleAuthProvider()

  return {
    provide: {
      googleLogin: async () => {
        const cred = await signInWithPopup(auth, provider)
        return cred.user.getIdToken()
      },
      googleLogout: async () => signOut(auth)
    }
  }
})


