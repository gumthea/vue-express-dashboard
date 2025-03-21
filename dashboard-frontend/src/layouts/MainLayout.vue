<template>
    <div class="flex h-screen bg-gray-100">
      <!-- Sidebar -->
      <div
        :class="[
          'w-64 bg-white shadow-lg fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:translate-x-0'
        ]"
      >
        <div class="p-6 flex items-center space-x-2">
          <h1 class="text-2xl font-bold text-gray-800">App Name</h1>
        </div>
        <nav class="mt-6">
          <router-link
            to="/dashboard"
            class="flex items-center py-3 px-6 text-gray-700 hover:bg-blue-500 hover:text-white transition"
            active-class="bg-blue-500 text-white"
          >
            <HomeIcon class="h-5 w-5 mr-2" />
            Dashboard
          </router-link>
          <router-link
            v-if="hasRole('admin')"
            to="/users"
            class="flex items-center py-3 px-6 text-gray-700 hover:bg-blue-500 hover:text-white transition"
            active-class="bg-blue-500 text-white"
          >
            <UserIcon class="h-5 w-5 mr-2" />
            Manajemen Pengguna
          </router-link>
          <router-link
            v-if="hasRole('admin')"
            to="/audit-trail"
            class="flex items-center py-3 px-6 text-gray-700 hover:bg-blue-500 hover:text-white transition"
            active-class="bg-blue-500 text-white"
          >
            <DocumentTextIcon class="h-5 w-5 mr-2" />
            Audit Trail
          </router-link>
        </nav>
      </div>
  
      <!-- Overlay untuk mobile -->
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-black opacity-50 z-40 md:hidden"
        @click="toggleSidebar"
      ></div>
  
      <!-- Main Content -->
      <div class="flex-1 flex flex-col">
        <!-- Topbar -->
        <div class="bg-white shadow p-4 flex justify-between items-center">
          <div class="flex items-center">
            <button
              @click="toggleSidebar"
              class="md:hidden p-2 text-gray-700 hover:text-blue-500 focus:outline-none"
            >
              <Bars3Icon class="h-6 w-6" />
            </button>
            <h2 class="text-xl font-semibold text-gray-800 ml-2">{{ routeName }}</h2>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-gray-700">Selamat datang, {{ username }}</span>
            <button
              @click="logout"
              class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
  
        <!-- Page Content -->
        <div class="flex-1 p-6 overflow-y-auto w-full">
            <router-view />
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, computed, ref } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { getUserData, hasRole } from '../utils/auth'
  import axios from 'axios'
  import { HomeIcon, UserIcon, DocumentTextIcon, Bars3Icon } from '@heroicons/vue/24/outline'
  
  export default defineComponent({
    name: 'MainLayout',
    components: {
      HomeIcon,
      UserIcon,
      DocumentTextIcon,
      Bars3Icon,
    },
    setup() {
      const router = useRouter()
      const route = useRoute()
      const userData = getUserData()
      const username = computed(() => userData?.username || 'User')
      const routeName = computed(() => route.name?.toString() || 'Dashboard')
      const sidebarOpen = ref(false)
  
      const toggleSidebar = () => {
        sidebarOpen.value = !sidebarOpen.value
      }
  
      const logout = async () => {
        try {
          const token = localStorage.getItem('token')
          await axios.post('http://localhost:5000/logout', {}, {
            headers: { Authorization: `Bearer ${token}` },
          })
          localStorage.removeItem('token')
          router.push('/')
        } catch (err) {
          console.error('Gagal logout:', err)
          localStorage.removeItem('token')
          router.push('/')
        }
      }
  
      return { username, routeName, hasRole, logout, sidebarOpen, toggleSidebar }
    },
  })
</script>
