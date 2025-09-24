<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <TopNav v-if="route.path !== '/login'" />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import TopNav from '~/components/TopNav.vue'
const route = useRoute()
</script>
