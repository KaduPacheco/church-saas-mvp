import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'

// Cria instância do axios configurada para o backend
export const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request Interceptor: Injeta o token em todas as requisições
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

// Variáveis para controle de fila de refresh token
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

// Response Interceptor: Trata expiração do token (401)
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config

    // Verifica se o erro é 401 e a requisição ainda não foi reenviada
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Se a requisição que falhou era de login ou refresh, não tenta de novo
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
        return Promise.reject(error)
      }

      const authStore = useAuthStore()

      if (isRefreshing) {
        // Já existe um refresh acontecendo, enfileira essa request
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
        
        // Refaz a requisição original com novo token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return axios(originalRequest).then(res => res.data)
      } catch (refreshError) {
        // Refresh falhou, derruba a sessão
        processQueue(refreshError, null)
        authStore.logout(true) // força logout reativo
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Tratamento de erros padrão padronizando no formato do AppError do backend
    const apiError = error.response?.data?.error || {
      message: 'Ocorreu um erro inesperado',
      code: 'UNKNOWN_ERROR'
    }
    
    return Promise.reject(apiError)
  }
)
