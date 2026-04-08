import { api } from './api'

export const congregationsService = {
  list(params = {}) {
    return api.get('/congregations', { params })
  },

  getById(id) {
    return api.get(`/congregations/${id}`)
  },

  create(payload) {
    return api.post('/congregations', payload)
  },

  update(id, payload) {
    return api.put(`/congregations/${id}`, payload)
  },

  updateStatus(id, status) {
    return api.patch(`/congregations/${id}/status`, { status })
  }
}
