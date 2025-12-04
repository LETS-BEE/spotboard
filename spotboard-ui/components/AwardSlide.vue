<template>
  <div v-if="isVisible" class="award-slide-overlay" @click="$emit('close')">
    <div class="award-slide-card" @click.stop>
      <div v-if="data.icon" class="award-icon-container">
          <img :src="`/img/award/${data.icon}.png`" alt="Award Icon" class="award-icon" />
      </div>
      <div class="rank-badge">{{ data.rank }}</div>
      <div class="content">
        <h2 class="group-name">{{ data.group }}</h2>
        <h1 class="team-name">{{ data.name }}</h1>

        <div v-if="data.others && data.others.length" class="others-list">
             <div v-for="(other, index) in data.others" :key="index" class="other-item">
                 <span class="other-group">{{ other.group }}</span>
                 <span class="other-name">{{ other.name }}</span>
                 <span v-if="other.rank" class="other-rank">#{{ other.rank }}</span>
             </div>
        </div>

        <div v-if="data.description" class="description">
            {{ data.description }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps<{
  isVisible: boolean;
  data: any;
}>();

const emit = defineEmits(['close']);
</script>

<style scoped>
.award-slide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.5s ease;
}

.award-slide-card {
  background: white;
  width: 70%;
  max-width: 800px; /* Reduced max-width */
  border-radius: 32px;
  padding: 3rem; /* Reduced padding */
  text-align: center;
  position: relative;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  animation: slideUp 2.0s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: visible; /* Changed to visible to allow icon/badge to pop out if needed, or keep hidden? Icon might need to be inside. */
}

/* Icon Styling */
.award-icon-container {
    margin-bottom: 1rem;
}

.award-icon {
    height: 120px;
    width: auto;
    object-fit: contain;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));
}

.rank-badge {
    position: absolute;
    top: -20px;
    right: 40px;
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    font-size: 3rem; /* Reduced size */
    font-weight: 800;
    padding: 0.8rem 1.6rem;
    border-radius: 0 0 20px 20px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.group-name {
    font-size: 1.5rem; /* Reduced size */
    color: var(--md-sys-color-secondary);
    margin-bottom: 0.5rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 2px;
}

.team-name {
    font-size: 3rem; /* Reduced size */
    font-weight: 900;
    color: var(--md-sys-color-on-surface);
    margin-bottom: 2rem;
    line-height: 1.1;
}

.others-list {
    text-align: left;
    background: var(--md-sys-color-surface-variant);
    color: var(--md-sys-color-on-surface-variant);
    padding: 1.5rem; /* Reduced padding */
    border-radius: 16px;
    margin-top: 1.5rem;
}

.other-item {
    display: flex;
    justify-content: space-between;
    padding: 0.4rem 0;
    border-bottom: 1px solid rgba(0,0,0,0.1);
    font-size: 1.1rem; /* Reduced size */
}

.other-item:last-child {
    border-bottom: none;
}

.description {
    margin-top: 1.5rem;
    font-size: 1.3rem; /* Reduced size */
    color: var(--md-sys-color-on-surface-variant);
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideUp {
    from { transform: translateY(100px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
</style>
