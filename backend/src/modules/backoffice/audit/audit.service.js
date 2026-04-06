const { v4: uuidv4 } = require('uuid');
const db = require('../../../config/database');
const logger = require('../../../utils/logger');

async function register({
  actorPlatformUserId = null,
  churchId = null,
  action,
  targetType,
  targetId = null,
  targetLabel = null,
  metadata = {},
  ipAddress = null,
  userAgent = null,
}) {
  if (!action || !targetType) {
    logger.warn('Audit log ignorado por falta de action/targetType');
    return null;
  }

  const [auditLog] = await db('audit_logs')
    .insert({
      id: uuidv4(),
      actor_platform_user_id: actorPlatformUserId,
      church_id: churchId,
      action,
      target_type: targetType,
      target_id: targetId,
      target_label: targetLabel,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent,
    })
    .returning('*');

  return auditLog;
}

async function list({
  action,
  targetType,
  churchId,
  page = 1,
  perPage = 20,
}) {
  const currentPage = Number.parseInt(page, 10) || 1;
  const currentPerPage = Number.parseInt(perPage, 10) || 20;
  const offset = (currentPage - 1) * currentPerPage;

  const baseQuery = db('audit_logs as al')
    .leftJoin('platform_users as pu', 'pu.id', 'al.actor_platform_user_id')
    .leftJoin('churches as c', 'c.id', 'al.church_id')
    .modify((queryBuilder) => {
      if (action) {
        queryBuilder.where('al.action', action);
      }

      if (targetType) {
        queryBuilder.where('al.target_type', targetType);
      }

      if (churchId) {
        queryBuilder.where('al.church_id', churchId);
      }
    });

  const [{ total }] = await baseQuery.clone().countDistinct('al.id as total');

  const logs = await baseQuery
    .clone()
    .select(
      'al.id',
      'al.actor_platform_user_id',
      'al.church_id',
      'al.action',
      'al.target_type',
      'al.target_id',
      'al.target_label',
      'al.metadata',
      'al.ip_address',
      'al.user_agent',
      'al.created_at',
      'pu.name as actor_name',
      'pu.email as actor_email',
      'c.name as church_name'
    )
    .orderBy('al.created_at', 'desc')
    .limit(currentPerPage)
    .offset(offset);

  return {
    data: logs.map(formatAuditLog),
    meta: {
      page: currentPage,
      perPage: currentPerPage,
      total: parseCount(total),
      totalPages: Math.max(1, Math.ceil(parseCount(total) / currentPerPage)),
    },
  };
}

function formatAuditLog(log) {
  return {
    id: log.id,
    action: log.action,
    targetType: log.target_type,
    targetId: log.target_id,
    targetLabel: log.target_label,
    metadata: parseMetadata(log.metadata),
    createdAt: log.created_at,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    actor: log.actor_platform_user_id
      ? {
          id: log.actor_platform_user_id,
          name: log.actor_name,
          email: log.actor_email,
        }
      : null,
    tenant: log.church_id
      ? {
          id: log.church_id,
          name: log.church_name,
        }
      : null,
  };
}

function parseMetadata(metadata) {
  if (!metadata) return {};
  if (typeof metadata === 'string') return JSON.parse(metadata);
  return metadata;
}

function parseCount(value) {
  return Number.parseInt(value, 10) || 0;
}

module.exports = {
  register,
  list,
};
