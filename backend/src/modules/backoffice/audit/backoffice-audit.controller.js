const auditService = require('./audit.service');
const response = require('../../../utils/response');

async function listAuditLogs(req, res, next) {
  try {
    const result = await auditService.list(req.query);
    return response.success(res, result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listAuditLogs,
};
