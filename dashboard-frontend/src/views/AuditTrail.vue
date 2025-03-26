<template>
  <div class="bg-white p-6 rounded-lg shadow-lg">
    <h2 class="text-xl font-semibold mb-4">Audit Trail</h2>

    <div v-if="loading" class="text-gray-500">Memuat...</div>
    <div v-else-if="auditLogs.length === 0" class="text-gray-500">Tidak ada data audit trail.</div>

    <div v-else class="relative w-full">
      <div class="overflow-auto border rounded-lg">
        <div class="w-full overflow-x-auto">
          <table class="w-full table-auto bg-white">
            <thead class="sticky top-0 bg-gray-200 shadow">
              <tr class="text-gray-600 uppercase text-sm">
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
      <!-- <div class="flex flex-col overflow-x-auto">
        <div class="sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 sm:px-6 lg:px-8">
            <div class="overflow-x-auto">
              <table
                class="min-w-full text-start text-sm font-light text-surface dark:text-white">
                <thead class="sticky top-0 bg-gray-200 shadow">
                  <tr class="text-gray-600 uppercase text-sm">
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
        </div>
      </div> -->

      <!-- Pagination Controls -->
      <div class="mt-4 flex justify-between">
        <button 
          @click="prevPage"
          :disabled="pagination.currentPage <= 1"
          class="px-4 py-2 bg-gray-300 rounded-md"
        >
          Prev
        </button>
        
        <span>Page {{ pagination.currentPage }} of {{ pagination.totalPages }}</span>
        
        <button 
          @click="nextPage"
          :disabled="pagination.currentPage >= pagination.totalPages"
          class="px-4 py-2 bg-gray-300 rounded-md"
        >
          Next
        </button>
      </div>
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
    const loading = ref(true)
    const pagination = ref({ currentPage: 1, totalPages: 1 })

    const fetchAuditTrail = async () => {
      try {
        loading.value = true
        const token = localStorage.getItem('token')
        const response = await axios.get('http://localhost:5000/api/audit', {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: pagination.value.currentPage, limit: 10 },
        })
        auditLogs.value = response.data.data
        pagination.value = response.data.pagination
      } catch (err) {
        console.error('Gagal mengambil audit trail:', err)
      } finally {
        loading.value = false
      }
    }

    const nextPage = () => {
      if (pagination.value.currentPage < pagination.value.totalPages) {
        pagination.value.currentPage++
        fetchAuditTrail()
      }
    }

    const prevPage = () => {
      if (pagination.value.currentPage > 1) {
        pagination.value.currentPage--
        fetchAuditTrail()
      }
    }

    onMounted(fetchAuditTrail)

    return { auditLogs, loading, pagination, nextPage, prevPage }
  },
})
</script>
