// src/modules/auth/auth.controller.js
// Camada de controle: extrai dados da request, chama service, formata resposta.
// Toda lógica de negócio está no service — aqui é apenas tradução HTTP ↔ lógica.

const authService = require('./auth.service');
const response = require('../../utils/response');

async function register(req, res, next) {
  try {
    const { churchName, name, email, password } = req.body;
    const result = await authService.register({ churchName, name, email, password });
    return response.created(res, result);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh({ refreshToken });
    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.user.userId);
    return response.success(res, { message: 'Logout realizado com sucesso' });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.userId, req.user.churchId);
    return response.success(res, user);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};
