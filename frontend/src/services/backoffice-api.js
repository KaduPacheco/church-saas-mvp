import axios from 'axios'
import { useBackofficeAuthStore } from '@/stores/backoffice-auth.store'

function buildLocalApiBaseUrl(pathname) {
  return `http://${window.location.hostname}:4000${pathname}`
}

function resolveBackofficeApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_BACKOFFICE_API_BASE_URL?.trim()

  if (configuredBaseUrl) {
    return configuredBaseUrl
  }

  if (import.meta.env.DEV) {
    return buildLocalApiBaseUrl('/api/backoffice')
  }

  return '/api/backoffice'
}

export const backofficeApi = axios.create({
  baseURL: resolveBackofficeApiBaseUrl(),
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

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

backofficeApi.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config
    const backofficeAuthStore = useBackofficeAuthStore()

    if (
      error.response?.status === 401 &&
      backofficeAuthStore.isAuthenticated &&
      originalRequest &&
      !originalRequest._retry
    ) {
      const isAuthLoginRequest = originalRequest.url?.includes('/auth/login')
      const isAuthRefreshRequest = originalRequest.url?.includes('/auth/refresh')

      if (isAuthLoginRequest || isAuthRefreshRequest) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axios(originalRequest).then((response) => response.data)
        }).catch((queueError) => Promise.reject(queueError))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newAccessToken = await backofficeAuthStore.refreshToken()
        processQueue(null, newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return axios(originalRequest).then((response) => response.data)
      } catch (refreshError) {
        processQueue(refreshError, null)
        await backofficeAuthStore.logout(true)
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    const apiError = error.response?.data?.error || {
      message: 'Nao foi possivel concluir a solicitacao.',
      code: 'UNKNOWN_ERROR'
    }

    return Promise.reject(apiError)
  }
)
