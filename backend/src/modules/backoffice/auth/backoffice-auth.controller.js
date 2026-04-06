const backofficeAuthService = require('./backoffice-auth.service');
const response = require('../../../utils/response');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await backofficeAuthService.login({
      email,
      password,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const result = await backofficeAuthService.getMe(req.platformUser.userId);
    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  getMe,
};
