import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref(null)
  const accessToken = ref(localStorage.getItem('access_token') || null)
  const refreshTokenVal = ref(localStorage.getItem('refresh_token') || null)
  const loading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value)
  const userPermissions = computed(() => user.value?.permissions || [])
  const isSuperAdmin = computed(() => userPermissions.value.includes('admin:full'))

  // Ações internas
  function setTokens(access, refresh) {
    accessToken.value = access
    refreshTokenVal.value = refresh
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  }

  function clearTokens() {
    accessToken.value = null
    refreshTokenVal.value = null
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  // Verificar permissão específica
  function hasPermission(permission) {
    if (isSuperAdmin.value) return true
    return userPermissions.value.includes(permission)
  }

  // Ações do ciclo de vida Auth
  async function login(email, password) {
    loading.value = true
    try {
      const response = await authService.login(email, password)
      setTokens(response.data.accessToken, response.data.refreshToken)
      user.value = response.data.user
      return true
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  async function refreshToken() {
    if (!refreshTokenVal.value) throw new Error('Sem refresh token')
    
    try {
      const response = await authService.refresh(refreshTokenVal.value)
      setTokens(response.data.accessToken, response.data.refreshToken)
      user.value = response.data.user
      return response.data.accessToken
    } catch (error) {
      clearTokens()
      throw error
    }
  }

  async function fetchUser() {
    if (!accessToken.value) return false
    
    try {
      const response = await authService.getMe()
      user.value = response.data
      return true
    } catch (error) {
      return false
    }
  }

  async function logout(forced = false) {
    // Se não for forçado, tenta avisar o backend
    if (!forced && accessToken.value) {
      try {
        await authService.logout()
      } catch (e) {
        // ignora erros no logout
      }
    }
    
    clearTokens()
    router.push({ name: 'login' })
  }

  return {
    // states
    user,
    accessToken,
    loading,
    // getters
    isAuthenticated,
    isSuperAdmin,
    userPermissions,
    // actions
    login,
    logout,
    fetchUser,
    refreshToken,
    hasPermission
  }
})
