import { backofficeApi } from './backoffice-api'

export const backofficeAuthService = {
  login(email, password) {
    return backofficeApi.post('/auth/login', { email, password })
  },

  getMe() {
    return backofficeApi.get('/auth/me')
  }
}
