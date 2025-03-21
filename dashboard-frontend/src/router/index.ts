import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import AuditTrail from '../views/AuditTrail.vue'
import UserManagement from '../views/UserManagement.vue'
import MainLayout from '../layouts/MainLayout.vue'
import { isAuthenticated, hasRole } from '../utils/auth'

const routes = [
  { path: '/', name: 'Login', component: Login },
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: 'dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true, roles: ['admin', 'editor', 'viewer'] } },
      { path: 'users', name: 'UserManagement', component: UserManagement, meta: { requiresAuth: true, roles: ['admin'] } },
      { path: 'audit-trail', name: 'AuditTrail', component: AuditTrail, meta: { requiresAuth: true, roles: ['admin'] } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to: any, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next({ name: 'Login' })
  } else if (to.meta.roles && !to.meta.roles.some((role: string) => hasRole(role))) {
    next({ path: '/dashboard' })
  } else {
    next()
  }
})

export default router
