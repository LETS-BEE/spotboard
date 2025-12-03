<template>
  <div class="scoreboard-container">
    <div class="scoreboard-header">
      <div class="rank-header">Rank</div>
      <div class="team-header">Team</div>
      <div class="solved-header">Solved</div>
      <div class="penalty-header">Penalty</div>
      <div class="problems-header">
        <div v-for="problem in contestStore.contest?.problems" :key="problem.id" class="problem-name">
          {{ problem.name }}
        </div>
      </div>
    </div>
    <div class="scoreboard-body">
      <TeamRow v-for="teamStatus in filteredTeams" :key="teamStatus.team.id" :team-status="teamStatus" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useContestStore } from '~/stores/contest';
import { storeToRefs } from 'pinia';

const contestStore = useContestStore();
const { filteredTeams } = storeToRefs(contestStore);
</script>

<style scoped>
.scoreboard-container {
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.scoreboard-header {
  display: grid;
  grid-template-columns: 50px 3fr 1fr 1fr 6fr;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  background-color: var(--md-sys-color-surface-container-high);
  font-weight: 500;
  font-size: 0.8rem;
  color: var(--md-sys-color-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.rank-header, .solved-header, .penalty-header {
  text-align: center;
}

.team-header {
  text-align: left;
}

.problems-header {
  display: flex;
  justify-content: space-around;
  gap: 0.5rem;
}

.problem-name {
  width: 48px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scoreboard-body {
  /* This container holds the rows */
}
</style>
