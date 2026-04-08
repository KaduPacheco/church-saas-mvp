export const tenantNavigationItems = [
  {
    name: 'dashboard',
    label: 'Visao geral',
    description: 'Resumo da igreja sede e proximos passos do admin inicial.',
    permission: 'dashboard:read',
    accent: 'overview',
  },
  {
    name: 'tenant-members',
    label: 'Membros',
    description: 'Cadastro, busca e acompanhamento da comunidade da igreja.',
    permission: 'members:read',
    accent: 'members',
  },
  {
    name: 'tenant-congregations',
    label: 'Congregacoes',
    description: 'Visao da sede e das futuras unidades vinculadas ao tenant.',
    permission: 'churches:read',
    accent: 'congregations',
  },
  {
    name: 'tenant-roles',
    label: 'Cargos ministeriais',
    description: 'Estrutura ministerial separada das permissoes tecnicas.',
    permission: 'roles:read',
    accent: 'roles',
  },
  {
    name: 'tenant-profiles',
    label: 'Perfis tecnicos',
    description: 'Perfis de acesso e governanca do painel do tenant.',
    permission: 'profiles:read',
    accent: 'profiles',
  },
  {
    name: 'tenant-financial',
    label: 'Financeiro',
    description: 'Categorias, movimentacoes e relatorios do tenant.',
    permission: 'financial:read',
    accent: 'financial',
  },
]

export function getTenantModuleContent(moduleKey) {
  const contentMap = {
    members: {
      eyebrow: 'Modulo planejado',
      description: 'O admin inicial da sede vai gerir o cadastro de membros por aqui, mantendo separado o cadastro tecnico de usuarios do tenant.',
      nextSteps: [
        'Listar membros da igreja sede e das congregacoes vinculadas ao tenant.',
        'Cadastrar e editar membros sem transformar isso em contas de acesso automaticamente.',
        'Preparar vinculo opcional entre membro e usuario tecnico em etapa futura.',
      ],
    },
    congregations: {
      eyebrow: 'Estrutura do tenant',
      description: 'A sede administra o tenant completo. As restricoes futuras por escopo vao diferenciar usuarios da sede e usuarios de congregacao.',
      nextSteps: [
        'Cadastrar congregacoes vinculadas a igreja sede.',
        'Visualizar status e dados operacionais de cada unidade.',
        'Preparar isolamento futuro para usuarios com `congregation_id` especifico.',
      ],
    },
    roles: {
      eyebrow: 'Dominio ministerial',
      description: 'Cargos ministeriais continuam representando funcao na igreja e nao substituem os perfis tecnicos do sistema.',
      nextSteps: [
        'Consultar os cargos padrao criados no onboarding.',
        'Adicionar e editar cargos ministeriais sem afetar permissoes tecnicas.',
        'Manter o dominio ministerial separado do acesso ao painel.',
      ],
    },
    profiles: {
      eyebrow: 'Governanca tecnica',
      description: 'Os perfis tecnicos governam acesso ao painel do tenant. O admin inicial nasce com `Administrador Geral` e deve usar este modulo para evoluir a delegacao depois.',
      nextSteps: [
        'Visualizar os perfis tecnicos padrao do tenant.',
        'Revisar permissoes granulares por modulo.',
        'Preparar a futura criacao de usuarios internos com perfil e escopo corretos.',
      ],
    },
    financial: {
      eyebrow: 'Operacao financeira',
      description: 'O onboarding cria as categorias financeiras padrao. Este modulo sera a base para movimentacoes e relatorios do tenant.',
      nextSteps: [
        'Visualizar categorias iniciais de entrada e saida.',
        'Registrar movimentacoes financeiras por tenant e, no futuro, por congregacao.',
        'Gerar indicadores e relatorios para a igreja sede.',
      ],
    },
  }

  return contentMap[moduleKey] || {
    eyebrow: 'Modulo em evolucao',
    description: 'Este modulo faz parte da evolucao incremental do painel do tenant.',
    nextSteps: [],
  }
}
