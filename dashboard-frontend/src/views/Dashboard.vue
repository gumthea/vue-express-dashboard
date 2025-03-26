<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>
    <p class="text-gray-700">Selamat datang di dashboard. Role Anda: {{ authStore.userRoleName || 'Unknown' }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useAuthStore } from '../stores/auth'

export default defineComponent({
  name: 'Dashboard',
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },
})
</script>
