import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import router from '@/router'
import { backofficeAuthService } from '@/services/backoffice-auth.service'

const BACKOFFICE_ACCESS_TOKEN_KEY = 'backoffice_access_token'
const BACKOFFICE_REFRESH_TOKEN_KEY = 'backoffice_refresh_token'

export const useBackofficeAuthStore = defineStore('backoffice-auth', () => {
  const user = ref(null)
  const accessToken = ref(localStorage.getItem(BACKOFFICE_ACCESS_TOKEN_KEY) || null)
  const refreshTokenVal = ref(localStorage.getItem(BACKOFFICE_REFRESH_TOKEN_KEY) || null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value)
  const userPermissions = computed(() => user.value?.permissions || [])
  const isPlatformSuperAdmin = computed(() => userPermissions.value.includes('platform:*'))

  function setTokens(access, refresh) {
    accessToken.value = access
    refreshTokenVal.value = refresh
    localStorage.setItem(BACKOFFICE_ACCESS_TOKEN_KEY, access)
    localStorage.setItem(BACKOFFICE_REFRESH_TOKEN_KEY, refresh)
  }

  function clearTokens() {
    accessToken.value = null
    refreshTokenVal.value = null
    user.value = null
    localStorage.removeItem(BACKOFFICE_ACCESS_TOKEN_KEY)
    localStorage.removeItem(BACKOFFICE_REFRESH_TOKEN_KEY)
  }

  function hasPermission(permission) {
    if (isPlatformSuperAdmin.value) return true
    return userPermissions.value.includes(permission)
  }

  async function login(email, password) {
    loading.value = true

    try {
      const response = await backofficeAuthService.login(email, password)
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
    if (!refreshTokenVal.value) {
      throw new Error('Sem refresh token do backoffice')
    }

    try {
      const response = await backofficeAuthService.refresh(refreshTokenVal.value)
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
      const response = await backofficeAuthService.getMe()
      user.value = response.data
      return true
    } catch (error) {
      return false
    }
  }

  async function logout(forced = false) {
    if (!forced && accessToken.value) {
      try {
        await backofficeAuthService.logout()
      } catch (_error) {
        // ignora erros no logout
      }
    }

    clearTokens()

    const currentRouteName = router.currentRoute.value.name
    if (!forced || currentRouteName !== 'backoffice-login') {
      router.push({ name: 'backoffice-login' })
    }
  }

  return {
    user,
    accessToken,
    refreshTokenVal,
    loading,
    isAuthenticated,
    userPermissions,
    isPlatformSuperAdmin,
    login,
    refreshToken,
    fetchUser,
    logout,
    hasPermission
  }
})
