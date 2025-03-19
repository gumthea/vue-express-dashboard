<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
        <form @submit.prevent="login">
          <div class="mb-4">
            <input
              v-model="username"
              type="text"
              placeholder="Username"
              class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="mb-6">
            <input
              v-model="password"
              type="password"
              placeholder="Password"
              class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            class="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition"
          >
            Login
          </button>
          <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
        </form>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue'
  import axios from 'axios'
  import { useRouter } from 'vue-router'
  
  export default defineComponent({
    name: 'Login',
    setup() {
      const router = useRouter()
      const username = ref('')
      const password = ref('')
      const error = ref<string | null>(null)
  
      const login = async () => {
        try {
          const response = await axios.post('http://localhost:5000/login', {
            username: username.value,
            password: password.value,
          })
          localStorage.setItem('token', response.data.token)
          router.push('/dashboard')
        } catch (err) {
          console.log(err)
          error.value = err.response.data.message
        }
      }
  
      return { username, password, error, login }
    },
  })
</script>
