<template>
  <div v-if="isVisible" class="award-slide-overlay" @click="$emit('close')">
    <div class="award-slide-card" @click.stop>
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
  animation: fadeIn 0.3s ease;
}

.award-slide-card {
  background: white;
  width: 80%;
  max-width: 1000px;
  border-radius: 32px;
  padding: 4rem;
  text-align: center;
  position: relative;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.rank-badge {
    position: absolute;
    top: -20px;
    right: 40px;
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    font-size: 4rem;
    font-weight: 800;
    padding: 1rem 2rem;
    border-radius: 0 0 20px 20px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.group-name {
    font-size: 2rem;
    color: var(--md-sys-color-secondary);
    margin-bottom: 0.5rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 2px;
}

.team-name {
    font-size: 4rem;
    font-weight: 900;
    color: var(--md-sys-color-on-surface);
    margin-bottom: 3rem;
    line-height: 1.1;
}

.others-list {
    text-align: left;
    background: var(--md-sys-color-surface-variant);
    color: var(--md-sys-color-on-surface-variant);
    padding: 2rem;
    border-radius: 16px;
    margin-top: 2rem;
}

.other-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(0,0,0,0.1);
    font-size: 1.2rem;
}

.other-item:last-child {
    border-bottom: none;
}

.description {
    margin-top: 2rem;
    font-size: 1.5rem;
    color: var(--md-sys-color-on-surface-variant);
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideUp {
    from { transform: translateY(50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
</style>
