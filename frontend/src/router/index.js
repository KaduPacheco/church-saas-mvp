import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useBackofficeAuthStore } from '@/stores/backoffice-auth.store'
import { tenantNavigationItems } from '@/utils/tenant-navigation'

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
          component: () => import('@/views/dashboard/DashboardView.vue'),
          meta: {
            title: 'Painel da igreja sede',
            permission: 'dashboard:read'
          }
        },
        {
          path: 'members',
          name: 'tenant-members',
          component: () => import('@/views/dashboard/TenantMembersView.vue'),
          meta: {
            title: 'Membros',
            permission: 'members:read',
            moduleKey: 'members'
          }
        },
        {
          path: 'congregations',
          name: 'tenant-congregations',
          component: () => import('@/views/dashboard/TenantCongregationsView.vue'),
          meta: {
            title: 'Congregacoes',
            permission: 'churches:read',
            moduleKey: 'congregations'
          }
        },
        {
          path: 'roles',
          name: 'tenant-roles',
          component: () => import('@/views/dashboard/TenantModuleView.vue'),
          meta: {
            title: 'Cargos ministeriais',
            permission: 'roles:read',
            moduleKey: 'roles'
          }
        },
        {
          path: 'profiles',
          name: 'tenant-profiles',
          component: () => import('@/views/dashboard/TenantModuleView.vue'),
          meta: {
            title: 'Perfis tecnicos',
            permission: 'profiles:read',
            moduleKey: 'profiles'
          }
        },
        {
          path: 'financial',
          name: 'tenant-financial',
          component: () => import('@/views/dashboard/TenantModuleView.vue'),
          meta: {
            title: 'Financeiro',
            permission: 'financial:read',
            moduleKey: 'financial'
          }
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
    const firstAllowedTenantRoute = tenantNavigationItems.find((item) =>
      authStore.hasPermission(item.permission)
    )

    return next({ name: firstAllowedTenantRoute?.name || 'login' })
  }

  next()
})

export default router
