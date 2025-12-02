<template>
  <div class="team-row" :class="{ 'is-first-place': teamStatus.rank === 1 }">
    <div class="rank">{{ teamStatus.rank }}</div>
    <div class="team-info">
        <div class="team-name">{{ teamStatus.team.name }}</div>
        <div class="team-group">{{ teamStatus.team.getGroup(true) }}</div>

        <div class="balloons-container">
            <div
                v-for="(balloon, index) in solvedBalloons"
                :key="index"
                class="balloon"
                :style="{ backgroundImage: `url(/balloons/${balloon}.png)` }"
            ></div>
        </div>
    </div>
    <div class="solved">{{ teamStatus.getTotalSolved() }}</div>
    <div class="penalty">{{ teamStatus.getPenalty() }}</div>
    <div class="problems">
      <div v-for="ps in Object.values(teamStatus.problemStatuses)" :key="ps.problem.id" class="problem-status-container">
        <div v-if="ps.isAttempted()" :class="problemStatusClasses(ps)" class="problem-status">
          <span v-if="ps.isAccepted()">{{ ps.getSolvedTime() }}'</span>
          <span v-else-if="ps.getFailedAttempts() > 0">-{{ ps.getFailedAttempts() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TeamStatus, TeamProblemStatus } from '~/server/utils/contest';

const props = defineProps<{
  teamStatus: TeamStatus
}>();

const solvedBalloons = computed(() => {
    const balloons: string[] = [];
    Object.values(props.teamStatus.problemStatuses).forEach(ps => {
        if (ps.isAccepted()) {
            balloons.push(ps.problem.color);
        }
    });
    return balloons;
});

const problemStatusClasses = (ps: TeamProblemStatus) => {
  if (ps.isAccepted()) {
    // A vibrant, successful green
    return 'is-accepted';
  }
  if (ps.isFailed()) {
    // A clear, but not jarring, red
    return 'is-failed';
  }
  if (ps.isPending()) {
    // An attention-grabbing yellow/orange
    return 'is-pending';
  }
  // A neutral, low-emphasis state for attempted but not yet judged
  return 'is-attempted';
};
</script>

<style scoped>
.team-row {
  display: grid;
  grid-template-columns: 50px 3fr 1fr 1fr 6fr;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  transition: background-color 0.2s ease-in-out;
}

.team-row:hover {
  background-color: var(--md-sys-color-surface-container-hover);
}

.team-row.is-first-place {
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  border-left: 5px solid var(--md-sys-color-primary);
}

.rank {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--md-sys-color-primary);
  text-align: center;
}

.is-first-place .rank {
  color: var(--md-sys-color-primary);
}

.team-info {
  line-height: 1.3;
}

.team-name {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
}

.is-first-place .team-name {
    color: var(--md-sys-color-on-primary-container);
}

.team-group {
  font-size: 0.85rem;
  color: var(--md-sys-color-on-surface-variant);
}

.is-first-place .team-group {
    color: var(--md-sys-color-on-primary-container);
}

.balloons-container {
    height: 1.5rem;
    display: flex;
    flex-direction: row-reverse; /* Stack from right to left like original */
    justify-content: flex-end;
    margin-top: 0.2rem;
}

.balloon {
    width: 20px;
    height: 24px;
    background-size: contain;
    background-repeat: no-repeat;
    margin-right: -10px; /* Overlap */
    filter: drop-shadow(0px 1px 1px rgba(0,0,0,0.2));
}

.balloon:first-child {
    margin-right: 0;
}


.solved, .penalty {
  font-size: 1.1rem;
  font-weight: 400;
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
}

.problems {
  display: flex;
  justify-content: space-around;
  gap: 0.5rem;
}

.problem-status-container {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.problem-status {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 12px; /* Squircle shape */
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.problem-status:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.problem-status.is-accepted {
  background-color: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
}

.problem-status.is-failed {
  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  opacity: 0.8;
}

.problem-status.is-pending {
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  animation: pulse 2s infinite;
}

.problem-status.is-attempted {
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface-variant);
}


@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
