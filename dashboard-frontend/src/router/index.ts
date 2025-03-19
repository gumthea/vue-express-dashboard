import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Dashboard from '../components/Dashboard.vue'
import AuditTrail from '../components/AuditTrail.vue'
import { isAuthenticated, hasRole } from '../utils/auth'

const routes = [
  { path: '/', name: 'Login', component: Login },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, roles: ['admin', 'editor', 'viewer'] }, // Semua role bisa akses
  },
  {
    path: '/admin-only',
    name: 'AdminOnly',
    component: () => import('../components/AdminOnly.vue'),
    meta: { requiresAuth: true, roles: ['admin'] }, // Hanya admin
  },
  {
    path: '/audit-trail',
    name: 'AuditTrail',
    component: AuditTrail,
    meta: { requiresAuth: true, roles: ['admin'] }, // Hanya admin
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
    next({ path: '/dashboard' }) // Redirect jika role tidak sesuai
  } else {
    next()
  }
})

export default router
