import { api } from './api'

export const membersService = {
  list(params = {}) {
    return api.get('/members', { params })
  },

  getById(id) {
    return api.get(`/members/${id}`)
  },

  create(payload) {
    return api.post('/members', payload)
  },

  update(id, payload) {
    return api.put(`/members/${id}`, payload)
  },

  updateStatus(id, status) {
    return api.patch(`/members/${id}/status`, { status })
  }
}
