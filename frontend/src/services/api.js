import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'

function buildLocalApiBaseUrl(pathname) {
  return `http://${window.location.hostname}:4000${pathname}`
}

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

  if (configuredBaseUrl) {
    return configuredBaseUrl
  }

  if (import.meta.env.DEV) {
    return buildLocalApiBaseUrl('/api')
  }

  return '/api'
}

// Cria instÃ¢ncia do axios configurada para o backend
export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request Interceptor: Injeta o token em todas as requisiÃ§Ãµes
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// VariÃ¡veis para controle de fila de refresh token
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Response Interceptor: Trata expiraÃ§Ã£o do token (401)
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config

    // Verifica se o erro Ã© 401 e a requisiÃ§Ã£o ainda nÃ£o foi reenviada
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Se a requisiÃ§Ã£o que falhou era de login ou refresh, nÃ£o tenta de novo
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
        return Promise.reject(error)
      }

      const authStore = useAuthStore()

      if (isRefreshing) {
        // JÃ¡ existe um refresh acontecendo, enfileira essa request
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token
          return axios(originalRequest).then(res => res.data)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Tenta renovar o token
        const newAccessToken = await authStore.refreshToken()
        
        // Retoma fila pendente
        processQueue(null, newAccessToken)
        
        // Refaz a requisiÃ§Ã£o original com novo token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return axios(originalRequest).then(res => res.data)
      } catch (refreshError) {
        // Refresh falhou, derruba a sessÃ£o
        processQueue(refreshError, null)
        authStore.logout(true) // forÃ§a logout reativo
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Tratamento de erros padrÃ£o padronizando no formato do AppError do backend
    const apiError = error.response?.data?.error || {
      message: 'Ocorreu um erro inesperado',
      code: 'UNKNOWN_ERROR'
    }
    
    return Promise.reject(apiError)
  }
)
