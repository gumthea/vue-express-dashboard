<template>
    <div class="min-h-screen bg-gray-100 p-6">
      <h1 class="text-3xl font-bold mb-6">Audit Trail</h1>
      <div v-if="loading" class="text-gray-500">Memuat...</div>
      <div v-else-if="auditTrails.length === 0" class="text-gray-500">Tidak ada data audit trail.</div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr class="bg-gray-200 text-gray-600 uppercase text-sm">
              <th class="py-3 px-6 text-left">ID</th>
              <th class="py-3 px-6 text-left">Username</th>
              <th class="py-3 px-6 text-left">Action</th>
              <th class="py-3 px-6 text-left">Details</th>
              <th class="py-3 px-6 text-left">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trail in auditTrails" :key="trail.id" class="border-b">
              <td class="py-3 px-6">{{ trail.id }}</td>
              <td class="py-3 px-6">{{ trail.username }}</td>
              <td class="py-3 px-6">{{ trail.action }}</td>
              <td class="py-3 px-6">{{ trail.details }}</td>
              <td class="py-3 px-6">{{ trail.timestamp }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, onMounted, ref } from 'vue'
  import axios from 'axios'
  import { getUserData } from '../utils/auth'
  
  interface AuditTrail {
    id: number
    user_id: number
    username: string
    action: string
    details: string
    timestamp: string
  }
  
  export default defineComponent({
    name: 'AuditTrail',
    setup() {
      const auditTrails = ref<AuditTrail[]>([])
      const loading = ref(true)
  
      const fetchAuditTrail = async () => {
        try {
          const token = localStorage.getItem('token')
          const response = await axios.get('http://localhost:5000/audit-trail', {
            headers: { Authorization: `Bearer ${token}` },
          })
          auditTrails.value = response.data
        } catch (err) {
          console.error('Gagal mengambil audit trail:', err)
        } finally {
          loading.value = false
        }
      }
  
      onMounted(fetchAuditTrail)
  
      return { auditTrails, loading }
    },
  })
</script>
