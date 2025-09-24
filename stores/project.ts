import { defineStore } from 'pinia'

type Project = { id:number; name:string; slug:string }

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [] as Project[],
    current: null as Project | null
  }),
  actions: {
    async fetchAll() {
      this.projects = await $fetch<Project[]>('/api/projects')
    },
    setCurrent(p: Project | null) {
      this.current = p
    }
  }
})


