import { backofficeApi } from './backoffice-api'

export const backofficeTenantsService = {
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
