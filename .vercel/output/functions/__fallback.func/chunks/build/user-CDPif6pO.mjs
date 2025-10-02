import { defineStore } from 'pinia';

const useUserStore = defineStore("user", {
  state: () => ({
    id: 1,
    name: "Demo User",
    email: "demo@example.com",
    role: "ADMIN"
  }),
  actions: {
    setRole(r) {
      this.role = r;
    }
  }
});

export { useUserStore as u };
//# sourceMappingURL=user-CDPif6pO.mjs.map
