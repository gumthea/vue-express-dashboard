import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from './auth'

interface Role {
  id: number
  name: string
  description: string
}

interface RoleState {
  roles: Role[]
}

export const useRoleStore = defineStore('roles', {
  state: (): RoleState => ({
    roles: [],
  }),

  actions: {
    async fetchRoles() {
      const authStore = useAuthStore()
      if (!authStore.token) return

      try {
        const response = await axios.get('http://localhost:5000/roles', {
          headers: { Authorization: `Bearer ${authStore.token}` },
        })
        this.roles = response.data
      } catch (err) {
        console.error('Failed to fetch roles:', err)
      }
    },

    async createRole(name: string, description: string) {
      const authStore = useAuthStore()
      if (!authStore.token) return

      try {
        await axios.post(
          'http://localhost:5000/roles',
          { name, description },
          { headers: { Authorization: `Bearer ${authStore.token}` } }
        )
        await this.fetchRoles()
        console.log('Role created:', name)
      } catch (err) {
        console.error('Failed to create role:', err)
        throw err
      }
    },

    async updateRole(id: number, name: string, description: string) {
      const authStore = useAuthStore()
      if (!authStore.token) return

      try {
        await axios.put(
          `http://localhost:5000/roles/${id}`,
          { name, description },
          { headers: { Authorization: `Bearer ${authStore.token}` } }
        )
        await this.fetchRoles()
        console.log('Role updated:', name)
      } catch (err) {
        console.error('Failed to update role:', err)
        throw err
      }
    },

    async deleteRole(id: number) {
      const authStore = useAuthStore()
      if (!authStore.token) return

      try {
        await axios.delete(`http://localhost:5000/roles/${id}`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        })
        await this.fetchRoles()
        console.log('Role deleted:', id)
      } catch (err) {
        console.error('Failed to delete role:', err)
        throw err
      }
    },

    clearRoles() {
      this.roles = []
    },

    hasRole(roleName: string): boolean {
      const authStore = useAuthStore()
      const userRole = this.roles.find(role => role.id === authStore.user?.roleId)
      return userRole?.name === roleName
    },
  },

  getters: {
    userRoleName: (state) => {
      const authStore = useAuthStore()
      const userRole = state.roles.find(role => role.id === authStore.user?.roleId)
      return userRole?.name || 'Unknown'
    },
    availableRoles: (state) => state.roles,
  },
})
