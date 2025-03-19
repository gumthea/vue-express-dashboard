<template>
    <div class="min-h-screen bg-gray-100 p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Dashboard Admin</h1>
        <button @click="logout" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Logout
        </button>
      </div>
      <p class="text-gray-700">Selamat datang, {{ user?.username }}!</p>
      <p class="text-gray-700">Role Anda: {{ user?.role }}</p>
      <div v-if="hasRole('admin')" class="mt-4 space-y-2">
        <router-link to="/admin-only" class="text-blue-500 hover:underline block">
          Halaman Khusus Admin
        </router-link>
        <router-link to="/audit-trail" class="text-blue-500 hover:underline block">
          Lihat Audit Trail
        </router-link>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue'
  import { useRouter } from 'vue-router'
  import axios from 'axios'
  import { getUserData, hasRole } from '../utils/auth'
  
  export default defineComponent({
    name: 'Dashboard',
    setup() {
      const user = getUserData()
      const router = useRouter()
  
      const logout = async () => {
        try {
          const token = localStorage.getItem('token')
          await axios.post(
            'http://localhost:5000/logout',
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          )
        } catch (err) {
          console.error('Logout gagal:', err)
        } finally {
          localStorage.removeItem('token')
          router.push('/')
        }
      }
  
      return { user, hasRole, logout }
    },
  })
</script>
