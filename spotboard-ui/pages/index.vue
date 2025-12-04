<template>
  <div class="page-container" :class="{ 'award-mode': contestStore.awardMode }">
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
        <div class="dashboard-section" v-if="!contestStore.awardMode">
            <RecentEvents />
        </div>
      </main>
      <footer v-if="!contestStore.awardMode">
        <p>
          <a href="https://github.com/spotboard/spotboard" target="_blank">Spotboard</a>
          - Redesigned with Material 3 Expressive
        </p>
      </footer>
    </div>

    <!-- Award Slide Overlay -->
    <AwardSlide
        :is-visible="contestStore.awardSlideVisible"
        :data="contestStore.awardSlideData"
        @close="contestStore.awardSlideVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { useContestStore } from '~/stores/contest';

const contestStore = useContestStore();
const route = useRoute();

onMounted(async () => {
  if (process.client) {
    if (!contestStore.isLoaded) {
      await contestStore.loadContestAndRuns();
    } else {
      contestStore.rehydrate();
    }

    // Handle URL parameters for Fast Forward
    // Example: ?run_id=123 or ?time=60
    if (contestStore.isLoaded) {
      const runId = route.query.run_id ? parseInt(route.query.run_id as string, 10) : undefined;
      const time = route.query.time ? parseInt(route.query.time as string, 10) : undefined;

      if (runId !== undefined || time !== undefined) {
          contestStore.fastForward({ runId, time });
      } else {
          // Default behavior: Feed everything up to freeze time (if configured)
          contestStore.feedInitial();
      }

      contestStore.startEventFeedPolling();
    }

    // Keyboard Event Listener for Award Mode
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
    // Only handle if in award mode
    if (!contestStore.awardMode) {
        // Optional: Shortcut to start Award Mode? e.g. Ctrl+Alt+A
        if (e.ctrlKey && e.altKey && e.code === 'KeyA') {
            if (confirm("Start Award Mode?")) {
                contestStore.startAwardMode();
            }
        }
        return;
    }

    if (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'Enter') {
        e.preventDefault();
        contestStore.nextAwardStep();
    } else if (e.code === 'Escape') {
        if (contestStore.awardSlideVisible) {
            contestStore.awardSlideVisible = false;
        } else {
            // Optional: Exit award mode?
            if (confirm("Exit Award Mode?")) {
                contestStore.exitAwardMode();
            }
        }
    }
}
</script>

<style scoped>
.page-container {
  max-width: 1800px;
  margin: 0 auto;
  padding: 1rem;
  transition: all 0.5s ease;
}

.page-container.award-mode {
    background-color: #1a1a1a; /* Dark background for award mode */
    color: #ffffff;
    min-height: 100vh;
    padding: 2rem;
}

.main-grid {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 1.5rem;
    align-items: start;
}

.award-mode .main-grid {
    grid-template-columns: 1fr; /* Full width for scoreboard in award mode */
    display: block;
}

.scoreboard-section {
    min-width: 0;
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
