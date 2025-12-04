<template>
  <div class="page-container">
    <div class="editor-card">
      <h1 class="title">Award Slide Editor</h1>

      <div v-if="successMessage" class="alert is-success">
        <span class="material-icons">check_circle</span>
        <p>{{ successMessage }}</p>
      </div>
      <div v-if="errorMessage" class="alert is-error">
        <span class="material-icons">error</span>
        <p>{{ errorMessage }}</p>
      </div>

      <form @submit.prevent="saveContent" class="editor-form">
        <div class="form-field">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Enter password to save"
          />
        </div>
        <div class="form-field">
          <label for="content">JSON Content</label>
          <p class="help-text">
              Format: { "slides": [ { "id": "teamId", "name": "Team Name", "group": "Group", "rank": 1, "description": "Winner...", "others": [...] } ] }
          </p>
          <textarea
            id="content"
            v-model="content"
            rows="20"
            placeholder="Enter award slide JSON here..."
          ></textarea>
        </div>
        <div class="form-actions">
           <button
            type="button"
            @click="previewSlide"
            class="text-button"
            :disabled="!isValidJson"
          >
            <span class="material-icons">visibility</span>
            Preview First Slide
          </button>
          <button
            type="submit"
            :disabled="isSaving"
            class="filled-button"
          >
            <span v-if="isSaving" class="spinner"></span>
            {{ isSaving ? 'Saving...' : 'Save Content' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Preview Overlay -->
    <AwardSlide
        v-if="showPreview"
        :is-visible="showPreview"
        :data="previewData"
        @close="showPreview = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
// Auto-import of components should work in Nuxt, but explicit import is safe
import AwardSlide from '~/components/AwardSlide.vue';

const password = ref('');
const content = ref('');
const isSaving = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const showPreview = ref(false);
const previewData = ref<any>(null);

onMounted(async () => {
  try {
    const data = await $fetch('/api/award-slide');
    content.value = JSON.stringify(data, null, 2);
  } catch (e: any) {
    errorMessage.value = 'Failed to load existing content. Using empty template.';
    content.value = JSON.stringify({ slides: [] }, null, 2);
    console.error(e);
  }
});

const isValidJson = computed(() => {
    try {
        JSON.parse(content.value);
        return true;
    } catch (e) {
        return false;
    }
});

function previewSlide() {
    try {
        const json = JSON.parse(content.value);
        if (json.slides && json.slides.length > 0) {
            previewData.value = json.slides[0];
            showPreview.value = true;
        } else {
            errorMessage.value = "No slides found in JSON to preview.";
        }
    } catch (e) {
        errorMessage.value = "Invalid JSON.";
    }
}

async function saveContent() {
  isSaving.value = true;
  successMessage.value = '';
  errorMessage.value = '';

  try {
    JSON.parse(content.value);

    await $fetch('/api/award-slide', {
      method: 'POST',
      body: {
        password: password.value,
        content: content.value,
      },
    });
    successMessage.value = 'Content saved successfully!';
  } catch (e: any) {
    errorMessage.value = e.data?.statusMessage || 'An unexpected error occurred. Check password or JSON format.';
    console.error(e);
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.editor-card {
  background-color: var(--md-sys-color-surface-container);
  padding: 2rem;
  border-radius: 24px;
}

.title {
  font-family: 'Google Sans', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
  margin-bottom: 2rem;
}

.alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 12px;
  font-size: 0.9rem;
}

.alert.is-success {
  background-color: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
}

.alert.is-error {
  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

.editor-form .form-field {
  margin-bottom: 1.5rem;
}

.editor-form label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--md-sys-color-on-surface-variant);
}

.help-text {
    font-size: 0.8rem;
    color: var(--md-sys-color-on-surface-variant);
    margin-bottom: 0.5rem;
    font-family: monospace;
}

.editor-form input,
.editor-form textarea {
  width: 100%;
  background-color: var(--md-sys-color-surface-container-highest);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
  padding: 1rem;
  font-size: 1rem;
  color: var(--md-sys-color-on-surface);
  transition: border-color 0.2s;
}

.editor-form input:focus,
.editor-form textarea:focus {
  outline: none;
  border-color: var(--md-sys-color-primary);
}

.editor-form textarea {
  font-family: 'Roboto Mono', monospace;
  min-height: 400px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.filled-button {
  border: none;
  border-radius: 20px;
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.text-button {
    background: transparent;
    border: none;
    color: var(--md-sys-color-primary);
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.text-button:disabled,
.filled-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--md-sys-color-on-primary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
