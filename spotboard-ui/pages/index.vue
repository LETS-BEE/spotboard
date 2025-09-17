<template>
  <div class="container mx-auto p-4 font-sans">
    <div v-if="contestStore.isLoading" class="text-center text-gray-500">
      Loading Contest Data...
    </div>
    <div v-else-if="contestStore.error" class="text-center text-red-500">
      Error: {{ contestStore.error }}
    </div>
    <div v-else-if="contestStore.isLoaded">
      <HeaderControls />
      <main class="mt-4">
        <Scoreboard />
      </main>
      <footer class="text-center text-gray-500 text-sm mt-8">
        <p>
          <a href="https://github.com/spotboard/spotboard" target="_blank" class="text-blue-500 hover:underline">Spotboard</a>
          Refactored with Nuxt 4, Vue 3, and Tailwind CSS.
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useContestStore } from '~/stores/contest';

const contestStore = useContestStore();

onMounted(async () => {
  if (process.client) {
    if (!contestStore.isLoaded) {
      await contestStore.loadContestAndRuns();
    } else {
      contestStore.rehydrate();
    }

    // Start polling after initial data is ready
    if(contestStore.isLoaded) {
        contestStore.startEventFeedPolling();
    }
  }
});

onUnmounted(() => {
    if(process.client) {
        contestStore.stopEventFeedPolling();
    }
});
</script>
