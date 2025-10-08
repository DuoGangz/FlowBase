<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
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
