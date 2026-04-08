const congregationsService = require('./congregations.service');
const response = require('../../utils/response');

async function listCongregations(req, res, next) {
  try {
    const result = await congregationsService.listCongregations({
      churchId: req.churchId,
      actorCongregationId: req.congregationId,
      ...req.query,
    });

    return response.success(res, result.data, 200, result.meta, result.summary);
  } catch (error) {
    next(error);
  }
}

async function getCongregationById(req, res, next) {
  try {
    const result = await congregationsService.getCongregationById({
      churchId: req.churchId,
      actorCongregationId: req.congregationId,
      congregationId: req.params.id,
    });

    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function createCongregation(req, res, next) {
  try {
    const result = await congregationsService.createCongregation({
      churchId: req.churchId,
      actorCongregationId: req.congregationId,
      ...req.body,
    });

    return response.created(res, result);
  } catch (error) {
    next(error);
  }
}

async function updateCongregation(req, res, next) {
  try {
    const result = await congregationsService.updateCongregation({
      churchId: req.churchId,
      actorCongregationId: req.congregationId,
      congregationId: req.params.id,
      ...req.body,
    });

    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function updateCongregationStatus(req, res, next) {
  try {
    const result = await congregationsService.updateCongregationStatus({
      churchId: req.churchId,
      actorCongregationId: req.congregationId,
      congregationId: req.params.id,
      status: req.body.status,
    });

    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCongregations,
  getCongregationById,
  createCongregation,
  updateCongregation,
  updateCongregationStatus,
};
