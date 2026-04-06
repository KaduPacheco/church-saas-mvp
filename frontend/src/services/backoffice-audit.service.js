import { backofficeApi } from './backoffice-api'

export const backofficeAuditService = {
  list(params = {}) {
    return backofficeApi.get('/audit', { params })
  }
}
