import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useBackofficeAuthStore } from '@/stores/backoffice-auth.store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      component: () => import('@/layouts/AuthLayout.vue'),
      children: [
        {
          path: 'login',
          name: 'login',
          component: () => import('@/views/auth/LoginView.vue'),
          meta: { guestOnly: true }
        }
      ]
    },
    {
      path: '/backoffice/login',
      component: () => import('@/layouts/BackofficeAuthLayout.vue'),
      children: [
        {
          path: '',
          name: 'backoffice-login',
          component: () => import('@/views/backoffice/BackofficeLoginView.vue'),
          meta: { platformGuestOnly: true }
        }
      ]
    },
    {
      path: '/backoffice',
      component: () => import('@/layouts/BackofficeLayout.vue'),
      meta: { requiresPlatformAuth: true },
      children: [
        {
          path: '',
          name: 'backoffice-home',
          component: () => import('@/views/backoffice/BackofficeHomeView.vue'),
          meta: {
            title: 'Visão Geral',
            platformPermission: 'platform:dashboard:read'
          }
        },
        {
          path: 'tenants',
          name: 'backoffice-tenants',
          component: () => import('@/views/backoffice/BackofficeTenantsListView.vue'),
          meta: {
            title: 'Igrejas clientes',
            platformPermission: 'platform:tenants:read'
          }
        },
        {
          path: 'tenants/:id',
          name: 'backoffice-tenant-detail',
          component: () => import('@/views/backoffice/BackofficeTenantDetailView.vue'),
          meta: {
            title: 'Detalhe da igreja cliente',
            platformPermission: 'platform:tenants:read'
          }
        },
        {
          path: 'audit',
          name: 'backoffice-audit',
          component: () => import('@/views/backoffice/BackofficeAuditView.vue'),
          meta: {
            title: 'Auditoria',
            platformPermission: 'platform:audit:read'
          }
        },
        {
          path: 'users',
          name: 'backoffice-users',
          component: () => import('@/views/backoffice/BackofficeUsersView.vue'),
          meta: {
            title: 'Usuarios',
            platformPermissionsAny: [
              'platform:platform-users:read',
              'platform:platform-users:write',
              'platform:tenant-initial-admin:write'
            ]
          }
        }
      ]
    },
    {
      path: '/',
      component: () => import('@/layouts/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/dashboard/DashboardView.vue')
        }
      ]
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const backofficeAuthStore = useBackofficeAuthStore()

  if (to.meta.requiresPlatformAuth && !backofficeAuthStore.isAuthenticated) {
    return next({ name: 'backoffice-login' })
  }

  if (to.meta.platformGuestOnly && backofficeAuthStore.isAuthenticated) {
    return next({ name: 'backoffice-home' })
  }

  if (to.meta.requiresPlatformAuth && backofficeAuthStore.isAuthenticated && !backofficeAuthStore.user) {
    const success = await backofficeAuthStore.fetchUser()

    if (!success) {
      backofficeAuthStore.logout(true)
      return next({ name: 'backoffice-login' })
    }
  }

  if (to.meta.platformPermission && !backofficeAuthStore.hasPermission(to.meta.platformPermission)) {
    return next({ name: 'backoffice-home' })
  }

  if (to.meta.platformPermissionsAny) {
    const requiredPermissions = Array.isArray(to.meta.platformPermissionsAny)
      ? to.meta.platformPermissionsAny
      : []

    const hasAnyPermission = requiredPermissions.some((permission) =>
      backofficeAuthStore.hasPermission(permission)
    )

    if (!hasAnyPermission) {
      return next({ name: 'backoffice-home' })
    }
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login' })
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  if (to.meta.requiresAuth && authStore.isAuthenticated && !authStore.user) {
    const success = await authStore.fetchUser()

    if (!success) {
      authStore.logout(true)
      return next({ name: 'login' })
    }
  }

  if (to.meta.permission && !authStore.hasPermission(to.meta.permission)) {
    return next({ name: 'dashboard' })
  }

  next()
})

export default router
