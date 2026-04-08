import { backofficeApi } from './backoffice-api'

export const backofficeAuthService = {
  login(email, password) {
    return backofficeApi.post('/auth/login', { email, password })
  },

  refresh(refreshToken) {
    return backofficeApi.post('/auth/refresh', { refreshToken })
  },

  logout() {
    return backofficeApi.post('/auth/logout')
  },

  getMe() {
    return backofficeApi.get('/auth/me')
  }
}
