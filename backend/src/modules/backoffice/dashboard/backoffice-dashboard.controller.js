const backofficeDashboardService = require('./backoffice-dashboard.service');
const response = require('../../../utils/response');

async function getSummary(req, res, next) {
  try {
    const result = await backofficeDashboardService.getSummary();
    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSummary,
};
