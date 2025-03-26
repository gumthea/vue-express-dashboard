<template>
  <div>
    <!-- Form Tambah/Edit Pengguna -->
    <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 class="text-xl font-semibold mb-4">{{ editMode ? 'Edit Pengguna' : 'Tambah Pengguna' }}</h2>
      <form @submit.prevent="userStore.submitUser">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            v-model="form.username"
            type="text"
            placeholder="Username"
            class="p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="{ 'border-red-500': errors.username }"
          />
          <input
            v-model="form.password"
            type="password"
            placeholder="Password"
            class="p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="{ 'border-red-500': errors.password }"
          />
          <select
            v-model="form.roleId"
            class="p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="{ 'border-red-500': errors.roleId }"
          >
            <option v-for="role in roleStore.availableRoles" :key="role.id" :value="role.id">
              {{ role.name }}
            </option>
          </select>
        </div>
        <div v-if="Object.keys(errors).length > 0" class="mt-3 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
          <p class="font-semibold">Terjadi kesalahan:</p>
          <ul class="list-disc ml-5">
            <li v-for="(error, field) in errors" :key="field">{{ error }}</li>
          </ul>
        </div>
        <div class="mt-4 flex space-x-2">
          <button
            type="submit"
            class="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition"
          >
            {{ editMode ? 'Update' : 'Tambah' }}
          </button>
          <button
            v-if="editMode"
            type="button"
            @click="userStore.resetForm"
            class="bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition"
          >
            Batal
          </button>
        </div>
      </form>
    </div>

    <!-- Daftar Pengguna -->
    <div class="bg-white p-6 rounded-lg shadow-lg">
      <h2 class="text-xl font-semibold mb-4">Daftar Pengguna</h2>
      <div v-if="loading" class="text-gray-500">Memuat...</div>
      <div v-else-if="users.length === 0" class="text-gray-500">Tidak ada pengguna.</div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="bg-gray-200 text-gray-600 uppercase text-sm">
              <th class="py-3 px-6 text-left">ID</th>
              <th class="py-3 px-6 text-left">Username</th>
              <th class="py-3 px-6 text-left">Role</th>
              <th class="py-3 px-6 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="border-b">
              <td class="py-3 px-6">{{ user.id }}</td>
              <td class="py-3 px-6">{{ user.username }}</td>
              <td class="py-3 px-6">{{ getRoleName(user.role_id) }}</td>
              <td class="py-3 px-6">
                <button @click="userStore.editUser(user)" class="text-blue-500 hover:underline mr-2">Edit</button>
                <button @click="userStore.deleteUser(user.id)" class="text-red-500 hover:underline">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/users'
import { useRoleStore } from '../stores/roles'
import { storeToRefs } from 'pinia'

export default defineComponent({
  name: 'UserManagement',
  setup() {
    const userStore = useUserStore()
    const roleStore = useRoleStore()

    // Menggunakan storeToRefs agar state tetap reaktif
    const { users, loading, form, editMode, errors } = storeToRefs(userStore)

    // Fungsi untuk mendapatkan nama role berdasarkan ID
    const getRoleName = (roleId: number) => {
      const role = roleStore.availableRoles.find(r => r.id === roleId)
      return role?.name || 'Unknown'
    }

    // Panggil fetch data saat komponen dimuat
    onMounted(() => {
      userStore.fetchUsers()
      roleStore.fetchRoles()
    })

    return {
      userStore,
      roleStore,
      users,
      loading,
      form,
      editMode,
      errors,
      getRoleName,
    }
  },
})
</script>
