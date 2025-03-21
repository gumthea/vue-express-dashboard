<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>
    <p class="text-gray-700">Selamat datang di dashboard. Role Anda: {{ role }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { getUserData } from '../utils/auth'

export default defineComponent({
  name: 'Dashboard',
  setup() {
    const userData = getUserData()
    const role = userData?.role || 'Unknown'
    console.log('Role:', role)
    return { role }
  },
})
</script>
