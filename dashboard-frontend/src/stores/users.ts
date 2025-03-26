import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth'

interface User {
  id: number
  username: string
  role_id: number
}

export const useUserStore = defineStore('user', () => {
  const authStore = useAuthStore()
  const users = ref<User[]>([])
  const loading = ref(false)
  const errors = ref<{ [key: string]: string }>({})
  const form = ref({
    id: 0,
    username: '',
    password: '',
    roleId: 0,
  })
  const editMode = ref(false)

  const fetchUsers = async () => {
    loading.value = true
    try {
      const token = authStore.token
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
    const newErrors: { [key: string]: string } = {}
    if (!editMode.value) {
      if (!form.value.username) newErrors.username = 'Username tidak boleh kosong'
      if (!form.value.password) newErrors.password = 'Password tidak boleh kosong'
      if (!form.value.roleId) newErrors.roleId = 'Role tidak boleh kosong'
      if (form.value.password && form.value.password.length < 6) {
        newErrors.password = 'Password minimal 6 karakter'
      }
    } else {
      if (!form.value.username && !form.value.password && !form.value.roleId) {
        newErrors.general = 'Setidaknya satu field harus diisi'
      }
      if (form.value.password && form.value.password.length < 6) {
        newErrors.password = 'Password minimal 6 karakter'
      }
    }
    errors.value = newErrors
    return Object.keys(newErrors).length === 0
  }

  const submitUser = async () => {
    if (!validateForm()) return
    try {
      const token = authStore.token
      const payload = { username: form.value.username, password: form.value.password, role_id: form.value.roleId }

      if (editMode.value) {
        await axios.put(`http://localhost:5000/users/${form.value.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await axios.post('http://localhost:5000/users', payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }

      resetForm()
      fetchUsers()
    } catch (err) {
      errors.value = { general: (err as any).response?.data?.message || 'Gagal menyimpan pengguna' }
    }
  }

  const editUser = (user: User) => {
    editMode.value = true
    form.value = { id: user.id, username: user.username, password: '', roleId: user.role_id }
  }

  const deleteUser = async (id: number) => {
    if (confirm('Yakin ingin menghapus pengguna ini?')) {
      try {
        const token = authStore.token
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
    form.value = { id: 0, username: '', password: '', roleId: 0 }
  }

  return {
    users,
    loading,
    editMode,
    form,
    errors,
    fetchUsers,
    submitUser,
    editUser,
    deleteUser,
    resetForm,
  }
})
