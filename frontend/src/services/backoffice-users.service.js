import { backofficeApi } from './backoffice-api'

export function getBackofficeUsersErrorMessage(error, fallbackMessage) {
  if (error?.code === 'NOT_FOUND' || error?.message === 'Rota nao encontrada') {
    return 'Os endpoints da aba de usuarios nao estao disponiveis no backend atual. Reinicie o servidor do backend e tente novamente.'
  }

  return error?.message || fallbackMessage
}

export const backofficeUsersService = {
  listPlatformUsers(params = {}) {
    return backofficeApi.get('/users/platform', { params })
  },

  listPlatformRoles() {
    return backofficeApi.get('/users/platform/roles')
  },

  createPlatformUser(payload) {
    return backofficeApi.post('/users/platform', payload)
  },

  updatePlatformUser(id, payload) {
    return backofficeApi.patch(`/users/platform/${id}`, payload)
  },

  updatePlatformUserStatus(id, isActive) {
    return backofficeApi.patch(`/users/platform/${id}/status`, { isActive })
  },

  listEligibleTenants(params = {}) {
    return backofficeApi.get('/users/tenant-initial-admin/eligible-tenants', { params })
  },

  listTenantInitialAdminProfiles(tenantId) {
    return backofficeApi.get(`/users/tenant-initial-admin/tenants/${tenantId}/profiles`)
  },

  provisionTenantInitialAdmin(payload) {
    return backofficeApi.post('/users/tenant-initial-admin', payload)
  }
}
