import { defineStore } from 'pinia'

type Theme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: 'light' as Theme
  }),
  actions: {
    init() {
      try {
        const saved = localStorage.getItem('theme') as Theme | null
        if (saved === 'dark' || saved === 'light') {
          this.theme = saved
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          this.theme = 'dark'
        }
      } catch {}
    },
    setTheme(t: Theme) {
      this.theme = t
      try { localStorage.setItem('theme', t) } catch {}
    },
    toggle() {
      this.setTheme(this.theme === 'dark' ? 'light' : 'dark')
    }
  }
})
