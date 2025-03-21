<template>
  <div class="bg-white p-6 rounded-lg shadow-lg">
    <h2 class="text-xl font-semibold mb-4">Audit Trail</h2>
    <div v-if="loading" class="text-gray-500">Memuat...</div>
    <div v-else-if="auditLogs.length === 0" class="text-gray-500">Tidak ada data audit trail.</div>
    <div v-else class="relative w-full overflow-x-auto">
      <table class="w-full table-auto bg-white shadow rounded-lg">
        <thead>
          <tr class="bg-gray-200 text-gray-600 uppercase text-sm">
            <th class="py-3 px-4 text-left">ID</th>
            <th class="py-3 px-4 text-left">User ID</th>
            <th class="py-3 px-4 text-left">Username</th>
            <th class="py-3 px-4 text-left">Action</th>
            <th class="py-3 px-4 text-left">Details</th>
            <th class="py-3 px-4 text-left">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in auditLogs" :key="log.id" class="border-b">
            <td class="py-3 px-4">{{ log.id }}</td>
            <td class="py-3 px-4">{{ log.user_id }}</td>
            <td class="py-3 px-4">{{ log.username }}</td>
            <td class="py-3 px-4">{{ log.action }}</td>
            <td class="py-3 px-4 break-words">{{ log.details }}</td>
            <td class="py-3 px-4 whitespace-nowrap">{{ log.timestamp }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import axios from 'axios'

export default defineComponent({
  name: 'AuditTrail',
  setup() {
    interface AuditLog {
      id: number;
      user_id: number;
      username: string;
      action: string;
      details: string;
      timestamp: string;
    }

    const auditLogs = ref<AuditLog[]>([])

    const fetchAuditTrail = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('http://localhost:5000/audit-trail', {
          headers: { Authorization: `Bearer ${token}` },
        })
        auditLogs.value = response.data
      } catch (err) {
        console.error('Gagal mengambil audit trail:', err)
      }
    }

    onMounted(fetchAuditTrail)

    return { auditLogs }
  },
})
</script>
