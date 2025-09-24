import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    id: 1,
    name: 'Demo User',
    email: 'demo@example.com',
    role: 'ADMIN' as 'OWNER' | 'ADMIN' | 'MANAGER' | 'USER'
  })
  ,
  actions: {
    setRole(r: 'OWNER' | 'ADMIN' | 'MANAGER' | 'USER') {
      this.role = r
    }
  }
})



