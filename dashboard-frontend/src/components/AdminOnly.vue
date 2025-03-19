<template>
    <div class="min-h-screen bg-gray-100 p-6">
      <h1 class="text-3xl font-bold mb-6">Halaman Khusus Admin</h1>
      <p class="text-gray-700">Hanya admin yang bisa melihat halaman ini.</p>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue'
  
  export default defineComponent({
    name: 'AdminOnly',
  })
</script>
