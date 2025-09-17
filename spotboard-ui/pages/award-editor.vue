<template>
  <div class="container mx-auto p-8">
    <h1 class="text-4xl font-bold mb-6">Award Slide Editor</h1>
    <div class="bg-white shadow-md rounded-lg p-6">
      <div v-if="successMessage" class="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
        {{ errorMessage }}
      </div>
      <form @submit.prevent="saveContent">
        <div class="mb-4">
          <label for="password" class="block text-gray-700 font-bold mb-2">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="mb-6">
          <label for="content" class="block text-gray-700 font-bold mb-2">JSON Content</label>
          <textarea
            id="content"
            v-model="content"
            rows="20"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
        <div class="flex items-center justify-end">
          <button
            type="submit"
            :disabled="isSaving"
            class="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-wait"
          >
            {{ isSaving ? 'Saving...' : 'Save Content' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const password = ref('');
const content = ref('');
const isSaving = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

onMounted(async () => {
  try {
    const data = await $fetch('/api/award-slide');
    content.value = JSON.stringify(data, null, 2);
  } catch (e: any) {
    errorMessage.value = 'Failed to load existing content.';
    console.error(e);
  }
});

async function saveContent() {
  isSaving.value = true;
  successMessage.value = '';
  errorMessage.value = '';

  try {
    // Basic JSON validation before sending
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
    errorMessage.value = e.data?.statusMessage || 'An unexpected error occurred.';
    console.error(e);
  } finally {
    isSaving.value = false;
  }
}
</script>
