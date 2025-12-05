<template>
  <div class="team-row"
    :class="{
        'is-first-place': teamStatus.rank === 1 && !contestStore.awardMode,
        'award-focused': contestStore.awardMode && contestStore.currentAwardTeamId === teamStatus.team.id,
        'award-dimmed': contestStore.awardMode && contestStore.currentAwardTeamId !== teamStatus.team.id && !isFinalized,
        'award-finalized': contestStore.awardMode && isFinalized,
        'is-clickable': contestStore.awardMode && isFinalized
    }"
    @click="handleClick"
  >
    <div class="rank">{{ teamStatus.rank }}</div>
    <div class="team-info">
        <div class="team-name">{{ isObfuscated ? '?????' : teamStatus.team.name }}</div>
        <div class="team-group" v-if="!isObfuscated">{{ teamStatus.team.getGroup(true) }}</div>

        <div class="balloons-container" v-if="!isObfuscated">
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
      <div v-for="problem in contestStore.contest?.problems" :key="problem.id" class="problem-status-container">
        <div v-if="teamStatus.getProblemStatus(problem).isAttempted()" :class="problemStatusClasses(teamStatus.getProblemStatus(problem))" class="problem-status">
          <span v-if="teamStatus.getProblemStatus(problem).isAccepted()">{{ teamStatus.getProblemStatus(problem).getSolvedTime() }}'</span>
          <span v-else-if="teamStatus.getProblemStatus(problem).getFailedAttempts() > 0">-{{ teamStatus.getProblemStatus(problem).getFailedAttempts() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TeamStatus, TeamProblemStatus } from '~/utils/contest';
import { useContestStore } from '~/stores/contest';

const props = defineProps<{
  teamStatus: TeamStatus
}>();

const contestStore = useContestStore();

const isFinalized = computed(() => {
    return contestStore.finalizedTeams.includes(props.teamStatus.team.id);
});

const hasRuns = computed(() => {
    // Check if team has any attempts at all
    return Object.values(props.teamStatus.problemStatuses).some(ps => ps.isAttempted());
});

const isObfuscated = computed(() => {
    // Hide teams with no runs only in Award Mode
    return contestStore.awardMode && !hasRuns.value;
});

const solvedBalloons = computed(() => {
    if (isObfuscated.value) return [];
    const balloons: string[] = [];
    Object.values(props.teamStatus.problemStatuses).forEach(ps => {
        if (ps.isAccepted()) {
            balloons.push(ps.problem.color);
        }
    });
    return balloons;
});

const problemStatusClasses = (ps: TeamProblemStatus) => {
  const classes = [];

  if (ps.isAccepted()) {
    // A vibrant, successful green
    classes.push('is-accepted');
  } else if (ps.isFailed()) {
    // A clear, but not jarring, red
    classes.push('is-failed');
  } else if (ps.isPending()) {
    // An attention-grabbing yellow/orange
    classes.push('is-pending');
  } else {
    // A neutral, low-emphasis state for attempted but not yet judged
    classes.push('is-attempted');
  }

  // Check for animation trigger
  const anim = animationState.value[ps.problem.id];
  if (anim) {
    classes.push(anim);
  }

  return classes.join(' ');
};

// Animation State
const animationState = ref<{ [problemId: number]: string }>({});
// Configuration for animation type ('flash' or 'flip')
const ANIMATION_TYPE = 'flip'; // Can be 'flash' or 'flip'

// Watch for changes in problem status for this team
watch(
  () => props.teamStatus.problemStatuses,
  (newStatuses, oldStatuses) => {
    if (!contestStore.awardMode) return;

    for (const pidStr in newStatuses) {
      const pid = parseInt(pidStr);
      const ps = newStatuses[pid];

      // We need a way to detect if this specific problem just updated.
      // Since `teamStatus` is mutable and deep watched, `oldStatuses` might be the same object reference.
      // However, we can track the "last known state" locally if needed.
      // But `nextAwardStep` updates the run, which updates the team status.
      // A simpler way: Watch specific properties we care about if possible, or just trigger on deep change.

      // Let's rely on the fact that if we are the "current focused team" in award mode, we want to animate changes.
      if (contestStore.currentAwardTeamId === props.teamStatus.team.id) {
          // If this problem status changed recently (we can check run timestamp or just trigger?)
          // Since we don't have easy "diff" here without deep cloning previous state,
          // we can check if it matches the "last processed run" if we had access to it.

          // Alternative: Use a specialized watcher or just trigger animation on any change if it's the focused team.
          // But we want to animate ONLY the problem that changed.

          // Let's assume any change in "isAccepted", "isFailed" or "isPending" warrants an animation check.
          // Since we can't easily diff deep objects that are mutated in place without a clone,
          // we will implement a lightweight tracker.
      }
    }
  },
  { deep: true }
);

// Better approach: Watch the 'runs' of the problem statuses?
// Or simply, since we are only animating the *currently focused* team in award mode,
// we can watch `contestStore.recentRuns`. If the top run belongs to this team, we animate the corresponding problem.

watch(
    () => contestStore.recentRuns,
    (newRuns) => {
        if (!contestStore.awardMode || newRuns.length === 0) return;
        const lastRun = newRuns[0];

        if (lastRun.team.id === props.teamStatus.team.id) {
            // This team just had a run processed. Animate the problem cell.
            const pid = lastRun.problem.id;
            triggerAnimation(pid);
        }
    },
    { deep: true }
);

function triggerAnimation(problemId: number) {
    animationState.value[problemId] = `animate-${ANIMATION_TYPE}`;

    // Remove class after animation completes to allow re-triggering
    setTimeout(() => {
        delete animationState.value[problemId];
    }, 1000); // Match CSS animation duration
}

function handleClick() {
    if (contestStore.awardMode && isFinalized.value) {
        contestStore.showAwardSlideForTeam(props.teamStatus.team.id);
    }
}
</script>

<style scoped>
.team-row {
  display: grid;
  grid-template-columns: 50px 3fr 1fr 1fr 6fr;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  transition: background-color 0.2s ease-in-out, transform 0.2s ease, opacity 0.2s ease;
}

.team-row:hover {
  background-color: var(--md-sys-color-surface-container-hover);
}

.team-row.is-first-place {
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  border-left: 5px solid var(--md-sys-color-primary);
}

.team-row.is-clickable {
    cursor: pointer;
}

/* Award Mode Styles */
.team-row.award-dimmed {
    opacity: 0.3;
    filter: grayscale(0.8);
}

.team-row.award-focused {
    opacity: 1;
    transform: scale(1.02);
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    background-color: #333; /* Dark theme focused bg */
    border: 1px solid #666;
    z-index: 10;
    position: relative;
    color: white;
}

.team-row.award-finalized {
    opacity: 1;
    border-left: 5px solid gold; /* Mark finalized teams clearly */
}

/* Ensure text colors are readable in dark award mode */
.award-focused .team-name, .award-focused .rank, .award-focused .solved, .award-focused .penalty {
    color: white !important;
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

/* Flash Animation */
.animate-flash {
    animation: flash-animation 0.5s ease-in-out;
}

@keyframes flash-animation {
    0% { transform: scale(1); filter: brightness(1); }
    50% { transform: scale(1.5); filter: brightness(2); z-index: 10; }
    100% { transform: scale(1); filter: brightness(1); }
}

/* Flip Animation */
.animate-flip {
    animation: flip-animation 0.8s ease-in-out;
    backface-visibility: visible;
}

@keyframes flip-animation {
    0% { transform: perspective(400px) rotateY(0); }
    40% { transform: perspective(400px) rotateY(90deg); }
    60% { transform: perspective(400px) rotateY(90deg); } /* Hold briefly? */
    100% { transform: perspective(400px) rotateY(0); }
}
</style>
