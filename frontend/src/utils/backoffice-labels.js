const STATUS_LABELS = {
  active: 'Ativo',
  inactive: 'Inativo',
  suspended: 'Suspenso',
}

const PLATFORM_ROLE_LABELS = {
  super_admin: 'Super Admin da Plataforma',
  operator: 'Operador',
  support: 'Suporte',
  analyst: 'Analista',
}

const PLATFORM_ROLE_NAME_LABELS = {
  'Super Admin': 'Super Admin da Plataforma',
  Operator: 'Operador',
  Support: 'Suporte',
  Analyst: 'Analista',
}

const PLATFORM_USER_NAME_LABELS = {
  'Platform Super Admin': 'Super Admin da Plataforma',
}

const AUDIT_TARGET_TYPE_LABELS = {
  tenant: 'Igreja cliente',
  tenant_user: 'Usuario da igreja cliente',
  platform_user: 'Usuario da plataforma',
}

export function getStatusLabel(status) {
  return STATUS_LABELS[status] || status
}

export function getPlatformRoleLabel(userOrRole) {
  if (!userOrRole) return 'Perfil nao informado'

  if (typeof userOrRole === 'string') {
    return PLATFORM_ROLE_LABELS[userOrRole] || PLATFORM_ROLE_NAME_LABELS[userOrRole] || userOrRole
  }

  return (
    PLATFORM_ROLE_LABELS[userOrRole.roleSlug] ||
    PLATFORM_ROLE_NAME_LABELS[userOrRole.roleName] ||
    userOrRole.roleName ||
    userOrRole.roleSlug ||
    'Perfil nao informado'
  )
}

export function getPlatformUserDisplayName(user) {
  if (!user?.name) return 'Usuario da plataforma'
  return PLATFORM_USER_NAME_LABELS[user.name] || user.name
}

export function getScopeLabel(scope) {
  if (!scope) return 'Escopo nao informado'

  if (scope.type === 'tenant') {
    return 'Sede / tenant completo'
  }

  if (scope.type === 'congregation') {
    return scope.congregationName
      ? `Congregacao: ${scope.congregationName}`
      : 'Congregacao especifica'
  }

  return scope.label || 'Escopo nao informado'
}

export function getAuditTenantLabel(tenant) {
  return tenant?.name || 'Plataforma'
}

export function getAuditTargetTypeLabel(targetType) {
  return AUDIT_TARGET_TYPE_LABELS[targetType] || targetType
}
