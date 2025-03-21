<template>
  <div>
    <!-- Form Tambah/Edit Pengguna -->
    <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 class="text-xl font-semibold mb-4">{{ editMode ? 'Edit Pengguna' : 'Tambah Pengguna' }}</h2>
      <form @submit.prevent="submitUser">
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
            v-model="form.role"
            class="p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="{ 'border-red-500': errors.role }"
          >
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
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
            @click="cancelEdit"
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
              <td class="py-3 px-6">{{ user.role }}</td>
              <td class="py-3 px-6">
                <button @click="editUser(user)" class="text-blue-500 hover:underline mr-2">Edit</button>
                <button @click="deleteUser(user.id)" class="text-red-500 hover:underline">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// Script tetap sama seperti sebelumnya
import { defineComponent, ref, onMounted } from 'vue'
import axios from 'axios'

interface User {
  id: number
  username: string
  role: string
}

export default defineComponent({
  name: 'UserManagement',
  setup() {
    const users = ref<User[]>([])
    const loading = ref(true)
    const editMode = ref(false)
    const errors = ref<{ [key: string]: string }>({})
    const form = ref({
      id: 0,
      username: '',
      password: '',
      role: 'viewer' as 'admin' | 'editor' | 'viewer',
    })

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('http://localhost:5000/users', {
          headers: { Authorization: `Bearer ${token}` },
        })
        users.value = response.data
      } catch (err) {
        console.error('Gagal mengambil pengguna:', err)
      } finally {
        loading.value = false
      }
    }

    const validateForm = () => {
      const newErrors: { [key: string]: string } = {};
      if (!editMode.value) {
        if (!form.value.username) newErrors.username = 'Username tidak boleh kosong';
        if (!form.value.password) newErrors.password = 'Password tidak boleh kosong';
        if (!form.value.role) newErrors.role = 'Role tidak boleh kosong';
        if (form.value.password && form.value.password.length < 6) {
          newErrors.password = 'Password minimal 6 karakter';
        }
      } else {
        if (!form.value.username && !form.value.password && !form.value.role) {
          newErrors.general = 'Setidaknya satu field harus diisi';
        }
        if (form.value.password && form.value.password.length < 6) {
          newErrors.password = 'Password minimal 6 karakter';
        }
      }
      errors.value = newErrors;
      return Object.keys(newErrors).length === 0;
    }

    const submitUser = async () => {
      if (!validateForm()) return;

      try {
        const token = localStorage.getItem('token')
        if (editMode.value) {
          await axios.put(`http://localhost:5000/users/${form.value.id}`, form.value, {
            headers: { Authorization: `Bearer ${token}` },
          })
        } else {
          await axios.post('http://localhost:5000/users', form.value, {
            headers: { Authorization: `Bearer ${token}` },
          })
        }
        resetForm()
        fetchUsers()
      } catch (err) {
        errors.value = { general: (err as any).response?.data?.message || 'Gagal menyimpan pengguna' };
      }
    }

    const editUser = (user: User) => {
      editMode.value = true
      form.value = { id: user.id, username: user.username, password: '', role: user.role as 'admin' | 'editor' | 'viewer' }
    }

    const deleteUser = async (id: number) => {
      if (confirm('Yakin ingin menghapus pengguna ini?')) {
        try {
          const token = localStorage.getItem('token')
          await axios.delete(`http://localhost:5000/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          fetchUsers()
        } catch (err) {
          console.error('Gagal menghapus pengguna:', err)
        }
      }
    }

    const resetForm = () => {
      editMode.value = false
      errors.value = {}
      form.value = { id: 0, username: '', password: '', role: 'viewer' }
    }

    const cancelEdit = () => {
      resetForm()
    }

    onMounted(fetchUsers)

    return { users, loading, editMode, form, errors, submitUser, editUser, deleteUser, cancelEdit }
  },
})
</script>
