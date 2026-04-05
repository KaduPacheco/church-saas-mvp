import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

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

// Navigation Guard (Proteção de Rotas)
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Se está indo para uma rota restrita e não está autenticado
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login' })
  }

  // Se está indo para login (guest) e JÁ está autenticado
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  // Se estiver autenticado mas o objeto user estiver vazio, busca os dados da API
  if (authStore.isAuthenticated && !authStore.user) {
    const success = await authStore.fetchUser()
    if (!success) {
      // Se falhou (token inválido e refresh falhou), cai fora
      authStore.logout(true)
      return next({ name: 'login' })
    }
  }

  // Autorização via permission array (se a rota exigir auth extra)
  if (to.meta.permission && !authStore.hasPermission(to.meta.permission)) {
    // Para simplificar, desvia pro dashboard. Depois podemos ter uma tela de 403
    return next({ name: 'dashboard' })
  }

  next()
})

export default router
