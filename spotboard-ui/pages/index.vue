<template>
  <div class="page-container">
    <div v-if="contestStore.isLoading" class="state-container">
      <div class="loading-spinner"></div>
      <p>Loading Contest Data...</p>
    </div>
    <div v-else-if="contestStore.error" class="state-container">
       <span class="material-icons error-icon">error_outline</span>
      <p class="error-message">Error: {{ contestStore.error }}</p>
    </div>
    <div v-else-if="contestStore.isLoaded" class="content-container">
      <HeaderControls />
      <main class="main-grid">
        <div class="scoreboard-section">
            <Scoreboard />
        </div>
        <div class="dashboard-section">
            <RecentEvents />
        </div>
      </main>
      <footer>
        <p>
          <a href="https://github.com/spotboard/spotboard" target="_blank">Spotboard</a>
          - Redesigned with Material 3 Expressive
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

<style scoped>
.page-container {
  max-width: 1800px;
  margin: 0 auto;
  padding: 1rem;
}

.main-grid {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 1.5rem;
    align-items: start;
}

.scoreboard-section {
    min-width: 0; /* Prevents flex/grid overflow issues */
}

.dashboard-section {
    position: sticky;
    top: 1rem;
    height: calc(100vh - 150px);
    overflow: hidden;
}

@media (max-width: 1200px) {
    .main-grid {
        grid-template-columns: 1fr;
    }
    .dashboard-section {
        position: static;
        height: 500px;
    }
}

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  color: var(--md-sys-color-on-surface-variant);
}

.error-icon {
    font-size: 48px;
    color: var(--md-sys-color-error);
    margin-bottom: 1rem;
}

.error-message {
    color: var(--md-sys-color-error);
    font-size: 1.2rem;
}

.loading-spinner {
  border: 4px solid var(--md-sys-color-surface-container-high);
  border-top: 4px solid var(--md-sys-color-primary);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

footer {
  text-align: center;
  margin-top: 4rem;
  font-size: 0.9rem;
  color: var(--md-sys-color-on-surface-variant);
}

footer a {
  color: var(--md-sys-color-primary);
  text-decoration: none;
  font-weight: 500;
}

footer a:hover {
  text-decoration: underline;
}
</style>
