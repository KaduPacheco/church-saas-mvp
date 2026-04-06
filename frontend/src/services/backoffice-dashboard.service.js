import { backofficeApi } from './backoffice-api'

export const backofficeDashboardService = {
  getSummary() {
    return backofficeApi.get('/dashboard/summary')
  }
}
