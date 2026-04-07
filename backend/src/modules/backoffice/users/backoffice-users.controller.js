const response = require('../../../utils/response');
const backofficeUsersService = require('./backoffice-users.service');

async function listPlatformUsers(req, res, next) {
  try {
    const result = await backofficeUsersService.listPlatformUsers(req.query);
    return response.success(res, result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
}

async function listPlatformRoles(req, res, next) {
  try {
    const result = await backofficeUsersService.listPlatformRoles();
    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function createPlatformUser(req, res, next) {
  try {
    const result = await backofficeUsersService.createPlatformUser({
      ...req.body,
      actorPlatformUserId: req.platformUser.userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return response.created(res, result);
  } catch (error) {
    next(error);
  }
}

async function updatePlatformUser(req, res, next) {
  try {
    const result = await backofficeUsersService.updatePlatformUser({
      platformUserId: req.params.id,
      ...req.body,
      actorPlatformUserId: req.platformUser.userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function updatePlatformUserStatus(req, res, next) {
  try {
    const result = await backofficeUsersService.updatePlatformUserStatus({
      platformUserId: req.params.id,
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
  listPlatformUsers,
  listPlatformRoles,
  createPlatformUser,
  updatePlatformUser,
  updatePlatformUserStatus,
};
