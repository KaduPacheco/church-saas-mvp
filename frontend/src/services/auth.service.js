import { api } from './api'

export const authService = {
  login(email, password) {
    return api.post('/auth/login', { email, password })
  },
  
  register(data) {
    return api.post('/auth/register', data)
  },

  refresh(refreshToken) {
    return api.post('/auth/refresh', { refreshToken })
  },

  logout() {
    return api.post('/auth/logout')
  },

  getMe() {
    return api.get('/auth/me')
  }
}
