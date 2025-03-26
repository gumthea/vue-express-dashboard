<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
      <h1 class="text-2xl font-bold mb-6">Login</h1>
      <form @submit.prevent="login">
        <div class="mb-4">
          <input
            v-model="username"
            type="text"
            placeholder="Username"
            class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="mb-4 relative">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password"
            class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 flex items-center pr-3"
            @click="togglePassword"
          >
            <EyeIcon v-if="showPassword" class="h-5 w-5 text-gray-500" />
            <EyeSlashIcon v-else class="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <button
          type="submit"
          class="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600"
        >
          Login
        </button>
        <p v-if="error" class="mt-2 text-red-500">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline' // Impor ikon

export default defineComponent({
  name: 'Login',
  components: {
    EyeIcon,
    EyeSlashIcon,
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const username = ref('')
    const password = ref('')
    const error = ref<string | null>(null)
    const showPassword = ref(false)

    const login = async () => {
      try {
        await authStore.login(username.value, password.value)
        router.push('/dashboard')
      } catch (err) {
        const errorMessage = (err as any).response?.data?.message || 'Terjadi kesalahan saat login'
        error.value = errorMessage
      }
    }

    // Fungsi untuk toggle show/hide password
    const togglePassword = () => {
      showPassword.value = !showPassword.value
    }

    return { username, password, error, login, showPassword, togglePassword }
  },
})
</script>
