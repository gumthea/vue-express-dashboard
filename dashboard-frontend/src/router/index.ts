import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import AuditTrail from '../views/AuditTrail.vue'
import UserManagement from '../views/UserManagement.vue'
import RoleManagement from '../views/RoleManagement.vue'
import MainLayout from '../layouts/MainLayout.vue'
import { useAuthStore } from '../stores/auth'
import { useRoleStore } from '../stores/roles'

const routes = [
  { path: '/', name: 'Login', component: Login },
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: 'dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true, roles: ['admin', 'editor', 'viewer'] } },
      { path: 'users', name: 'UserManagement', component: UserManagement, meta: { requiresAuth: true, roles: ['admin'] } },
      { path: 'audit-trail', name: 'AuditTrail', component: AuditTrail, meta: { requiresAuth: true, roles: ['admin'] } },
      { path: 'roles', name: 'RoleManagement', component: RoleManagement, meta: { requiresAuth: true, requiresRole: 'admin' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to: any, from, next) => {
  const authStore = useAuthStore()
  const roleStore = useRoleStore()
  await authStore.checkAuth()
  if (!roleStore.roles.length) await roleStore.fetchRoles()

  if (to.path === '/' && authStore.isAuthenticated) {
    next({ name: 'Dashboard' })
  } else if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login' })
  } else if (to.meta.requiresRole && !roleStore.hasRole(to.meta.requiresRole as string)) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
