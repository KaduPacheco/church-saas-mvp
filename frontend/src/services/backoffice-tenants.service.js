import { backofficeApi } from './backoffice-api'

export function getBackofficeTenantsErrorMessage(error, fallbackMessage) {
  if (error?.code === 'NOT_FOUND' || error?.message === 'Rota nao encontrada') {
    return 'Os endpoints de onboarding de tenants nao estao disponiveis no backend atual. Reinicie o servidor do backend e tente novamente.'
  }

  return error?.message || fallbackMessage
}

export const backofficeTenantsService = {
  createTenantOnboarding(payload) {
    return backofficeApi.post('/tenants', payload)
  },

  createOnboarding(payload) {
    return this.createTenantOnboarding(payload)
  },

  list(params = {}) {
    return backofficeApi.get('/tenants', { params })
  },

  getById(id) {
    return backofficeApi.get(`/tenants/${id}`)
  },

  updateStatus(id, status) {
    return backofficeApi.patch(`/tenants/${id}/status`, { status })
  },

  listCongregations(id) {
    return backofficeApi.get(`/tenants/${id}/congregations`)
  },

  listUsers(id) {
    return backofficeApi.get(`/tenants/${id}/users`)
  },

  updateUserStatus(tenantId, userId, isActive) {
    return backofficeApi.patch(`/tenants/${tenantId}/users/${userId}/status`, { isActive })
  }
}
