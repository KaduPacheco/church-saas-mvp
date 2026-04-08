const membersService = require('./members.service');
const response = require('../../utils/response');

async function listMembers(req, res, next) {
  try {
    const result = await membersService.listMembers({
      churchId: req.churchId,
      actorCongregationId: req.congregationId,
      ...req.query,
    });

    return response.success(res, result.data, 200, result.meta, result.summary);
  } catch (error) {
    next(error);
  }
}

async function getMemberById(req, res, next) {
  try {
    const result = await membersService.getMemberById({
      churchId: req.churchId,
      actorCongregationId: req.congregationId,
      memberId: req.params.id,
    });

    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function createMember(req, res, next) {
  try {
    const result = await membersService.createMember({
      churchId: req.churchId,
      actorCongregationId: req.congregationId,
      ...req.body,
    });

    return response.created(res, result);
  } catch (error) {
    next(error);
  }
}

async function updateMember(req, res, next) {
  try {
    const result = await membersService.updateMember({
      churchId: req.churchId,
      actorCongregationId: req.congregationId,
      memberId: req.params.id,
      ...req.body,
    });

    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function updateMemberStatus(req, res, next) {
  try {
    const result = await membersService.updateMemberStatus({
      churchId: req.churchId,
      actorCongregationId: req.congregationId,
      memberId: req.params.id,
      status: req.body.status,
    });

    return response.success(res, result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listMembers,
  getMemberById,
  createMember,
  updateMember,
  updateMemberStatus,
};
