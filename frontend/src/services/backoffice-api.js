import axios from 'axios'
import { useBackofficeAuthStore } from '@/stores/backoffice-auth.store'

export const backofficeApi = axios.create({
  baseURL: 'http://localhost:4000/api/backoffice',
  headers: {
    'Content-Type': 'application/json'
  }
})

backofficeApi.interceptors.request.use(
  (config) => {
    const backofficeAuthStore = useBackofficeAuthStore()

    if (backofficeAuthStore.accessToken) {
      config.headers.Authorization = `Bearer ${backofficeAuthStore.accessToken}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

backofficeApi.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config
    const backofficeAuthStore = useBackofficeAuthStore()

    if (
      error.response?.status === 401 &&
      backofficeAuthStore.isAuthenticated &&
      !originalRequest?.url?.includes('/auth/login')
    ) {
      backofficeAuthStore.logout(true)
    }

    const apiError = error.response?.data?.error || {
      message: 'Nao foi possivel concluir a solicitacao.',
      code: 'UNKNOWN_ERROR'
    }

    return Promise.reject(apiError)
  }
)
