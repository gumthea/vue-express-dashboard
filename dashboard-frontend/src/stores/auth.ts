import { defineStore } from 'pinia'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import type { JwtPayload, AuthState } from '../types/authTypes'
import { useRoleStore } from './roles'
import { usePermissionStore } from './permissions'

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token') || null,
    user: null,
    isAuthenticated: false,
    roles: [],
    permissions: [],
  }),

  actions: {
    async login(username: string, password: string) {
      try {
        const { data } = await axios.post('http://localhost:5000/api/auth/login', { username, password })
        this.setToken(data.token)
      } catch (error) {
        console.error('Login failed:', error)
        throw error
      }
    },

    setToken(token: string) {
      this.token = token
      localStorage.setItem('token', token)
      this.user = jwtDecode<JwtPayload>(token)
      this.checkAuth()
      
      const roleStore = useRoleStore()
      roleStore.fetchRoles()
      const permissionStore = usePermissionStore()
      permissionStore.fetchPermissions()
    },

    async checkAuth() {
      if (!this.token) {
        this.clearAuth()
        return
      }

      this.user = jwtDecode<JwtPayload>(this.token)
      if (Date.now() >= this.user.exp * 1000) {
        this.logout()
        return
      }

      try {
        const response = await axios.get('http://localhost:5000/api/dashboard', {
          headers: { Authorization: `Bearer ${this.token}` },
        })
        this.isAuthenticated = response.status === 200
      } catch (error) {
        console.error('Auth check failed:', error)
        this.clearAuth()
      }
    },

    logout() {
      this.clearAuth()
    },

    clearAuth() {
      this.token = null
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('token')

      const roleStore = useRoleStore()
      roleStore.clearRoles()
      const permissionStore = usePermissionStore()
      permissionStore.clearPermissions()
    },
  },

  getters: {
    currentUser: (state): JwtPayload | null => state.user,
    isLoggedIn: (state): boolean => state.isAuthenticated,
  },
})
