import { defineStore } from 'pinia'
import axios from 'axios'
import type { Permission } from '../types/authTypes'
import { useAuthStore } from './auth'
import { useRoleStore } from './roles'

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    permissions: [] as Permission[],
  }),

  actions: {
    async fetchPermissions() {
      const authStore = useAuthStore()
      if (!authStore.token) return

      try {
        const response = await axios.get('http://localhost:5000/api/permissions', {
          headers: { Authorization: `Bearer ${authStore.token}` },
        })
        this.permissions = response.data
      } catch (err) {
        console.error('Failed to fetch permissions:', err)
      }
    },

    clearPermissions() {
      this.permissions = []
    },

    hasPermission(permissionName: string): boolean {
      const authStore = useAuthStore()
      const roleStore = useRoleStore()

      if (!authStore.user?.roleId) return false;
      
      const userRole = roleStore.roles.find(role => role.id === authStore.user?.roleId)
      if (!userRole) return false;
      
      const permission = this.permissions.find(p => p.name === permissionName)
      return permission !== undefined && userRole.permissions.includes(permission.id)
    },
  },

  getters: {
    userPermissions: (state) => {
      const authStore = useAuthStore()
      const roleStore = useRoleStore()

      if (!authStore.user?.roleId) return []
      
      const userRole = roleStore.roles.find(role => role.id === authStore.user?.roleId)
      if (!userRole) return []
      
      return state.permissions.filter(p => userRole.permissions.includes(p.id)).map(p => p.name)
    },
    availablePermissions: (state) => state.permissions,
  },
})
