<template>
  <tr class="hover:bg-gray-50">
    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ teamStatus.rank }}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
      <div>{{ teamStatus.team.name }}</div>
      <div class="text-xs text-gray-500">{{ teamStatus.team.getGroup(true) }}</div>
    </td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{{ teamStatus.getTotalSolved() }}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{{ teamStatus.getPenalty() }}</td>
    <td v-for="ps in Object.values(teamStatus.problemStatuses)" :key="ps.problem.id" class="px-6 py-4 whitespace-nowrap text-center text-sm">
      <div v-if="ps.isAttempted()" :class="problemStatusClasses(ps)" class="w-8 h-8 rounded-full flex items-center justify-center mx-auto">
        <span v-if="ps.isAccepted()">{{ ps.getSolvedTime() }}'</span>
        <span v-else-if="ps.getFailedAttempts() > 0">-{{ ps.getFailedAttempts() }}</span>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { TeamStatus, TeamProblemStatus } from '~/server/utils/contest';

const props = defineProps<{
  teamStatus: TeamStatus
}>();

const problemStatusClasses = (ps: TeamProblemStatus) => {
  if (ps.isAccepted()) {
    return 'bg-green-500 text-white';
  }
  if (ps.isFailed()) {
    return 'bg-red-500 text-white';
  }
  if (ps.isPending()) {
    return 'bg-yellow-400 text-white';
  }
  return 'bg-gray-200';
};
</script>
