import { api } from './api'

export const rolesService = {
  list(params = {}) {
    return api.get('/roles', { params })
  },

  getById(id) {
    return api.get(`/roles/${id}`)
  },

  create(payload) {
    return api.post('/roles', payload)
  },

  update(id, payload) {
    return api.put(`/roles/${id}`, payload)
  },

  updateStatus(id, status) {
    return api.patch(`/roles/${id}/status`, { status })
  }
}
