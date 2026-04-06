const backofficeTenantsService = require('./backoffice-tenants.service');
const response = require('../../../utils/response');

async function listTenants(req, res, next) {
  try {
    const result = await backofficeTenantsService.listTenants(req.query);
    return response.success(res, result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
}

async function getTenantById(req, res, next) {
  try {
    const result = await backofficeTenantsService.getTenantById(req.params.id);
    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function updateTenantStatus(req, res, next) {
  try {
    const result = await backofficeTenantsService.updateTenantStatus({
      tenantId: req.params.id,
      status: req.body.status,
      actorPlatformUserId: req.platformUser.userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function listTenantCongregations(req, res, next) {
  try {
    const result = await backofficeTenantsService.listTenantCongregations(req.params.id);
    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function listTenantUsers(req, res, next) {
  try {
    const result = await backofficeTenantsService.listTenantUsers(req.params.id);
    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function updateTenantUserStatus(req, res, next) {
  try {
    const result = await backofficeTenantsService.updateTenantUserStatus({
      tenantId: req.params.id,
      userId: req.params.userId,
      isActive: req.body.isActive,
      actorPlatformUserId: req.platformUser.userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listTenants,
  getTenantById,
  updateTenantStatus,
  listTenantCongregations,
  listTenantUsers,
  updateTenantUserStatus,
};
