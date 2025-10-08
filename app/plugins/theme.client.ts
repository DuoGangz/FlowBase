import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { useThemeStore } from '~~/stores/theme'

export default defineNuxtPlugin(() => {
  const themeStore = useThemeStore()
  themeStore.init()

  const apply = (val: 'light' | 'dark') => {
    const root = document.documentElement
    if (val === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }

  // Apply immediately on startup
  apply(themeStore.theme)

  // React to changes
  const { theme } = storeToRefs(themeStore)
  watch(theme, (v) => apply(v))
})
