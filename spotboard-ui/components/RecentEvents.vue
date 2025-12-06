<template>
  <div class="recent-events-container">
    <h2 class="section-title">
        Recent Events
        <span class="live-indicator" v-if="isAutoFeeding">LIVE</span>
    </h2>
    <div class="events-list">
      <transition-group name="list">
        <div v-for="run in recentRuns" :key="run.id" class="event-card" :class="getStatusClass(run)">
            <div class="event-header">
                <span class="timestamp">{{ formatTime(run.time) }}</span>
                <span class="problem-badge" :style="{ backgroundColor: getProblemColor(run) }">
                    {{ run.problem.name }}
                </span>
            </div>
            <div class="team-name">{{ run.team.name }}</div>
            <div class="status-text">
                <span v-if="run.isAccepted()">Correct</span>
                <span v-else-if="run.isPending()">Pending</span>
                <span v-else>Incorrect</span>
            </div>
             <div v-if="run.isAccepted()" class="balloon-icon" :style="{ backgroundImage: `url(/balloons/${run.problem.color}.png)` }"></div>
        </div>
      </transition-group>
      <div v-if="recentRuns.length === 0" class="empty-state">
        No recent events
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useContestStore } from '~/stores/contest';
import { storeToRefs } from 'pinia';
import type { Run } from '~/server/utils/contest';

const contestStore = useContestStore();
const { recentRuns, isAutoFeeding } = storeToRefs(contestStore);

function getStatusClass(run: Run) {
  if (run.isAccepted()) return 'is-accepted';
  if (run.isPending()) return 'is-pending';
  return 'is-failed';
}

function getProblemColor(run: Run) {
    // We can try to map the color name to a hex code if needed,
    // or if the color is already a hex/valid css color.
    // The original data seems to have color names like 'red', 'blue'.
    return run.problem.color;
}

function formatTime(minutes: number) {
    const m = Math.floor(minutes);
    return `${m}'`;
}
</script>

<style scoped>
.recent-events-container {
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: 16px;
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 1rem;
  color: var(--md-sys-color-on-surface);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.live-indicator {
    font-size: 0.7rem;
    background-color: var(--md-sys-color-error);
    color: var(--md-sys-color-on-error);
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: bold;
    animation: blink 2s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.events-list {
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-right: 4px; /* Space for scrollbar */
}

/* Scrollbar styling */
.events-list::-webkit-scrollbar {
  width: 6px;
}
.events-list::-webkit-scrollbar-thumb {
  background-color: var(--md-sys-color-outline-variant);
  border-radius: 3px;
}

.event-card {
  background-color: var(--md-sys-color-surface);
  padding: 0.75rem;
  border-radius: 12px;
  border-left: 4px solid transparent;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.event-card.is-accepted {
  border-left-color: var(--md-sys-color-tertiary); /* Green-ish usually */
  background-color: #f0fdf4; /* Light green tint - hardcoded for effect, should be token aware */
}
/* Dark mode adjustment if needed, but sticking to simple checks first */
@media (prefers-color-scheme: dark) {
    .event-card.is-accepted {
        background-color: rgba(0, 255, 0, 0.1);
    }
}


.event-card.is-failed {
  border-left-color: var(--md-sys-color-error);
  opacity: 0.8;
}

.event-card.is-pending {
  border-left-color: var(--md-sys-color-secondary);
}

.event-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.25rem;
    font-size: 0.8rem;
    color: var(--md-sys-color-on-surface-variant);
}

.problem-badge {
    color: white; /* Assuming dark colors */
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: bold;
    text-shadow: 0 0 2px rgba(0,0,0,0.5);
}

.team-name {
    font-weight: 500;
    font-size: 0.95rem;
    margin-bottom: 0.25rem;
    color: var(--md-sys-color-on-surface);
}

.status-text {
    font-size: 0.8rem;
    font-weight: 500;
}

.is-accepted .status-text { color: var(--md-sys-color-tertiary); }
.is-failed .status-text { color: var(--md-sys-color-error); }
.is-pending .status-text { color: var(--md-sys-color-secondary); }

.balloon-icon {
    position: absolute;
    right: 10px;
    bottom: 5px;
    width: 24px;
    height: 28px;
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0.8;
}

.empty-state {
    text-align: center;
    color: var(--md-sys-color-on-surface-variant);
    padding: 2rem;
    font-style: italic;
}


/* List Transitions */
.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* ensure leaving items are taken out of layout flow so others can move up smoothly */
.list-leave-active {
  position: absolute;
}
</style>
