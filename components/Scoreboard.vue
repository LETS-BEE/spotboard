<template>
  <div class="bg-white shadow-md rounded-lg overflow-hidden">
    <table class="min-w-full">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solved</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penalty</th>
          <th v-for="problem in contestStore.contest?.problems" :key="problem.id" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            {{ problem.name }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        <TeamRow v-for="teamStatus in paginatedTeams" :key="teamStatus.team.id" :team-status="teamStatus" />
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { useContestStore } from '~/stores/contest';
import { storeToRefs } from 'pinia';

const contestStore = useContestStore();
const { paginatedTeams } = storeToRefs(contestStore);
</script>
