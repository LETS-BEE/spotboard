<template>
  <header class="bg-white shadow-md rounded-lg p-4">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-gray-800">{{ contestStore.contest?.contestTitle }}</h1>
      <div class="text-2xl text-gray-600 font-mono">{{ formattedContestTime }}</div>
    </div>
    <div class="mt-4 flex flex-wrap items-center gap-4">
      <input
        type="text"
        placeholder="Search team..."
        :value="searchQuery"
        @input="updateSearchQuery"
        class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div class="flex items-center gap-2">
        <button @click="changePage(-1)" :disabled="currentPage === 0" class="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300">-</button>
        <span class="text-gray-700">Page {{ currentPage + 1 }} of {{ totalPages }}</span>
        <button @click="changePage(1)" :disabled="currentPage >= totalPages - 1" class="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300">+</button>
      </div>
      <div class="flex items-center gap-2">
        <button @click="feedOne" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Feed One</button>
        <button @click="feedAll" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Feed All</button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useContestStore } from '~/stores/contest';
import { storeToRefs } from 'pinia';

const contestStore = useContestStore();
const { searchQuery, currentPage, totalPages, runFeeder } = storeToRefs(contestStore);

const formattedContestTime = computed(() => {
  const time = runFeeder.value?.contestTime ?? 0;
  const minutes = Math.floor(time / 60).toString().padStart(2, '0');
  const seconds = (time % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
});

function feedOne() {
  contestStore.feedOne();
}

function feedAll() {
  contestStore.feedAll();
}

function updateSearchQuery(event: Event) {
    const target = event.target as HTMLInputElement;
    contestStore.setSearchQuery(target.value);
}

function changePage(amount: number) {
    contestStore.changePage(amount);
}
</script>
