const rolesService = require('./roles.service');
const response = require('../../utils/response');

async function listRoles(req, res, next) {
  try {
    const result = await rolesService.listRoles({
      churchId: req.churchId,
      actorCongregationId: req.congregationId,
      ...req.query,
    });

    return response.success(res, result.data, 200, result.meta, result.summary);
  } catch (error) {
    next(error);
  }
}

async function getRoleById(req, res, next) {
  try {
    const result = await rolesService.getRoleById({
      churchId: req.churchId,
      actorCongregationId: req.congregationId,
      roleId: req.params.id,
    });

    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function createRole(req, res, next) {
  try {
    const result = await rolesService.createRole({
      churchId: req.churchId,
      actorCongregationId: req.congregationId,
      ...req.body,
    });

    return response.created(res, result);
  } catch (error) {
    next(error);
  }
}

async function updateRole(req, res, next) {
  try {
    const result = await rolesService.updateRole({
      churchId: req.churchId,
      actorCongregationId: req.congregationId,
      roleId: req.params.id,
      ...req.body,
    });

    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function updateRoleStatus(req, res, next) {
  try {
    const result = await rolesService.updateRoleStatus({
      churchId: req.churchId,
      actorCongregationId: req.congregationId,
      roleId: req.params.id,
      status: req.body.status,
    });

    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  updateRoleStatus,
};
