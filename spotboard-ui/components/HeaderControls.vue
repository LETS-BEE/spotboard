<template>
  <header class="header-controls">
    <div class="title-bar">
      <h1 class="contest-title">{{ contestStore.contest?.contestTitle }}</h1>
      <div class="contest-time">{{ formattedContestTime }}</div>
    </div>
    <div class="controls-bar">
      <div class="search-field">
        <span class="material-icons">search</span>
        <input
          type="text"
          placeholder="Search team or university..."
          :value="searchQuery"
          @input="updateSearchQuery"
        />
      </div>
      <div class="feed-controls">
        <button @click="toggleAutoFeed" class="icon-button" :class="{ 'active': isAutoFeeding }" title="Auto Feed">
            <span class="material-icons">{{ isAutoFeeding ? 'pause' : 'play_arrow' }}</span>
        </button>
        <button @click="toggleNotifications" class="icon-button" :class="{ 'active': notificationsEnabled }" title="Notifications">
             <span class="material-icons">{{ notificationsEnabled ? 'visibility' : 'visibility_off' }}</span>
        </button>
        <div class="divider"></div>
        <button @click="feedOne" class="filled-button">Feed One</button>
        <button @click="feedAll" class="filled-tonal-button">Feed All</button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useContestStore } from '~/stores/contest';
import { storeToRefs } from 'pinia';

const contestStore = useContestStore();
const { searchQuery, runFeeder, isAutoFeeding, notificationsEnabled } = storeToRefs(contestStore);

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

function toggleAutoFeed() {
    contestStore.toggleAutoFeed();
}

function toggleNotifications() {
    contestStore.toggleNotifications();
}

function updateSearchQuery(event: Event) {
    const target = event.target as HTMLInputElement;
    contestStore.setSearchQuery(target.value);
}

onMounted(async () => {
  if (process.client) {
    window.addEventListener('keydown', handleKeydown);
  }
});

onUnmounted(() => {
    if(process.client) {
        contestStore.stopEventFeedPolling();
        window.removeEventListener('keydown', handleKeydown);
    }
});

function handleKeydown(e: KeyboardEvent) {
  // Only handle if not in award mode
  if (!contestStore.awardMode) {
    if (e.key === ' ' || e.key === 'Space') {
      // Spacebar toggles auto feed
      e.preventDefault();
      contestStore.toggleAutoFeed();
    } else if (e.key.toLowerCase() === 'f') {
      // 'F' feeds one event
      e.preventDefault();
      contestStore.feedOne();
    } else if (e.key.toLowerCase() === 'a') {
      // 'A' feeds all events
      e.preventDefault();
      contestStore.feedAll();
    } else if (e.key.toLowerCase() === 'n') {
      // 'N' toggles notifications
      e.preventDefault();
      contestStore.toggleNotifications();
    }
  }
}
</script>

<style scoped>
/* Using Material Symbols */
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

.header-controls {
  background-color: var(--md-sys-color-surface-container);
  padding: 1.5rem;
  border-radius: 24px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
  margin-bottom: 2rem;
}

.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1.5rem;
}

.contest-title {
  font-family: 'Google Sans', sans-serif; /* Expressive font */
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
}

.contest-time {
  font-family: 'Roboto Mono', monospace;
  font-size: 2rem;
  color: var(--md-sys-color-primary);
  font-weight: 500;
}

.controls-bar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.search-field {
  flex-grow: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--md-sys-color-surface-container-highest);
  padding: 0 1rem;
  border-radius: 28px; /* M3 Pill shape */
  height: 56px;
}

.search-field .material-icons {
  color: var(--md-sys-color-on-surface-variant);
}

.search-field input {
  background: none;
  border: none;
  outline: none;
  width: 100%;
  height: 100%;
  font-size: 1rem;
  color: var(--md-sys-color-on-surface);
}

.pagination-controls, .feed-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.divider {
    width: 1px;
    height: 24px;
    background-color: var(--md-sys-color-outline-variant);
    margin: 0 0.5rem;
}

.pagination-controls span {
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.9rem;
    min-width: 80px;
    text-align: center;
}

/* Base button styles */
button {
  border: none;
  border-radius: 20px;
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface-variant);
}

.icon-button {
    background-color: transparent;
    color: var(--md-sys-color-on-surface-variant);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-button:not(:disabled):hover {
    background-color: var(--md-sys-color-surface-container-hover);
}

.icon-button.active {
    color: var(--md-sys-color-primary);
    background-color: var(--md-sys-color-secondary-container);
}

.filled-button {
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}

.filled-button:not(:disabled):hover {
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  background-color: var(--md-sys-color-primary-hover);
}

.filled-tonal-button {
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.filled-tonal-button:not(:disabled):hover {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    background-color: var(--md-sys-color-secondary-container-hover);
}
</style>
