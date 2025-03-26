<template>
    <div>
      <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 class="text-xl font-semibold mb-4">{{ editMode ? 'Edit Role' : 'Tambah Role' }}</h2>
        <form @submit.prevent="submitRole">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              v-model="form.name"
              type="text"
              placeholder="Nama Role"
              class="p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="{ 'border-red-500': errors.name }"
            />
            <input
              v-model="form.description"
              type="text"
              placeholder="Deskripsi (opsional)"
              class="p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div v-if="Object.keys(errors).length > 0" class="mt-3 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
            <p class="font-semibold">Terjadi kesalahan:</p>
            <ul class="list-disc ml-5">
              <li v-for="(error, field) in errors" :key="field">{{ error }}</li>
            </ul>
          </div>
          <div class="mt-4 flex space-x-2">
            <button type="submit" class="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition">
              {{ editMode ? 'Update' : 'Tambah' }}
            </button>
            <button v-if="editMode" type="button" @click="cancelEdit" class="bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition">
              Batal
            </button>
          </div>
        </form>
      </div>
  
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <h2 class="text-xl font-semibold mb-4">Daftar Role</h2>
        <div v-if="loading" class="text-gray-500">Memuat...</div>
        <div v-else-if="roleStore.availableRoles.length === 0" class="text-gray-500">Tidak ada role.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full">
            <thead>
              <tr class="bg-gray-200 text-gray-600 uppercase text-sm">
                <th class="py-3 px-6 text-left">ID</th>
                <th class="py-3 px-6 text-left">Nama</th>
                <th class="py-3 px-6 text-left">Deskripsi</th>
                <th class="py-3 px-6 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="role in roleStore.availableRoles" :key="role.id" class="border-b">
                <td class="py-3 px-6">{{ role.id }}</td>
                <td class="py-3 px-6">{{ role.name }}</td>
                <td class="py-3 px-6">{{ role.description || '-' }}</td>
                <td class="py-3 px-6">
                  <button @click="editRole(role)" class="text-blue-500 hover:underline mr-2">Edit</button>
                  <button @click="deleteRole(role.id)" class="text-red-500 hover:underline">Hapus</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted } from 'vue'
  import { useRoleStore } from '../stores/roles'
  
  export default defineComponent({
    name: 'RoleManagement',
    setup() {
      const roleStore = useRoleStore()
      const loading = ref(true)
      const editMode = ref(false)
      const errors = ref<{ [key: string]: string }>({})
      const form = ref({
        id: 0,
        name: '',
        description: '',
      })
  
      const validateForm = () => {
        const newErrors: { [key: string]: string } = {}
        if (!form.value.name) newErrors.name = 'Nama role tidak boleh kosong'
        errors.value = newErrors
        return Object.keys(newErrors).length === 0
      }
  
      const submitRole = async () => {
        if (!validateForm()) return
        try {
          if (editMode.value) {
            await roleStore.updateRole(form.value.id, form.value.name, form.value.description)
          } else {
            await roleStore.createRole(form.value.name, form.value.description)
          }
          resetForm()
        } catch (err) {
          const error = err as { response?: { data?: { message?: string } } }
          errors.value = { general: error.response?.data?.message || 'Gagal menyimpan role' }
        }
      }
  
      const editRole = (role: { id: number; name: string; description: string }) => {
        editMode.value = true
        form.value = { id: role.id, name: role.name, description: role.description || '' }
      }
  
      const deleteRole = async (id: number) => {
        if (confirm('Yakin ingin menghapus role ini?')) {
          try {
            await roleStore.deleteRole(id)
          } catch (err) {
            const error = err as { response?: { data?: { message?: string } } }
            errors.value = { general: error.response?.data?.message || 'Gagal menghapus role' }
          }
        }
      }
  
      const resetForm = () => {
        editMode.value = false
        errors.value = {}
        form.value = { id: 0, name: '', description: '' }
      }
  
      const cancelEdit = () => {
        resetForm()
      }
  
      onMounted(async () => {
        if (!roleStore.roles.length) await roleStore.fetchRoles()
        loading.value = false
      })
  
      return { roleStore, loading, editMode, form, errors, submitRole, editRole, deleteRole, cancelEdit }
    },
  })
</script>
