<template>
  <div class="h-screen">
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>
    <p class="text-gray-700">Selamat datang di dashboard. Role Anda: {{ roleStore.userRoleName || 'Unknown' }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRoleStore } from '../stores/roles'

export default defineComponent({
  name: 'Dashboard',
  setup() {
    const roleStore = useRoleStore()
    return { roleStore }
  },
})
</script>
