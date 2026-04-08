<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { rolesService } from '@/services/roles.service'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()

const loading = ref(true)
const listLoading = ref(false)
const detailLoading = ref(false)
const saving = ref(false)
const statusSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const roles = ref([])
const selectedRoleId = ref(null)
const selectedRole = ref(null)

const meta = ref({
  page: 1,
  perPage: 6,
  total: 0,
  totalPages: 1
})

const summary = ref({
  total: 0,
  active: 0,
  inactive: 0,
  system: 0,
  custom: 0,
  linkedMembers: 0,
  scopeLabel: 'Sede / tenant completo'
})

const filters = reactive({
  search: '',
  status: '',
  page: 1,
  perPage: 6
})

const filterDraft = reactive({
  search: '',
  status: ''
})

const form = reactive({
  name: '',
  description: ''
})

const formMode = ref('create')

const isScopedUser = computed(() => !!authStore.user?.congregationId)
const canManageWrite = computed(() =>
  authStore.hasPermission('roles:write') && !authStore.user?.congregationId
)
const canManageStatus = computed(() =>
  authStore.hasPermission('roles:delete') && !authStore.user?.congregationId
)

const summaryCards = computed(() => [
  {
    label: 'Cargos visiveis',
    value: String(summary.value.total),
    tone: 'total'
  },
  {
    label: 'Ativos',
    value: String(summary.value.active),
    tone: 'active'
  },
  {
    label: 'Padrao do onboarding',
    value: String(summary.value.system),
    tone: 'system'
  },
  {
    label: 'Membros vinculados',
    value: String(summary.value.linkedMembers),
    tone: 'members'
  }
])

async function loadRoles(options = {}) {
  const preserveSelection = options.preserveSelection ?? true
  listLoading.value = true
  errorMessage.value = ''

  try {
    const response = await rolesService.list(filters)
    roles.value = response.data
    meta.value = response.meta || meta.value
    summary.value = response.summary || summary.value

    const hasSelection = preserveSelection && selectedRoleId.value
    const selectedStillVisible = roles.value.some((role) => role.id === selectedRoleId.value)

    if (hasSelection && selectedStillVisible) {
      await loadRoleDetail(selectedRoleId.value)
      return
    }

    if (roles.value.length > 0) {
      await selectRole(roles.value[0].id)
      return
    }

    selectedRoleId.value = null
    selectedRole.value = null

    if (canManageWrite.value) {
      openCreateMode()
    }
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel carregar os cargos ministeriais.'
    roles.value = []
    selectedRoleId.value = null
    selectedRole.value = null
  } finally {
    listLoading.value = false
  }
}

async function loadRoleDetail(id) {
  if (!id) return

  detailLoading.value = true
  errorMessage.value = ''

  try {
    const response = await rolesService.getById(id)
    selectedRole.value = response.data
    selectedRoleId.value = response.data.id
    formMode.value = 'edit'
    populateForm(response.data)
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel carregar o detalhe do cargo ministerial.'
  } finally {
    detailLoading.value = false
  }
}

async function selectRole(id) {
  selectedRoleId.value = id
  await loadRoleDetail(id)
}

function populateForm(role) {
  form.name = role.name || ''
  form.description = role.description || ''
}

function resetForm() {
  form.name = ''
  form.description = ''
}

function openCreateMode() {
  if (!canManageWrite.value) return

  formMode.value = 'create'
  selectedRoleId.value = null
  selectedRole.value = null
  resetForm()
}

async function handleSubmitFilters() {
  filters.search = filterDraft.search.trim()
  filters.status = filterDraft.status
  filters.page = 1
  await loadRoles({ preserveSelection: false })
}

async function handleClearFilters() {
  filterDraft.search = ''
  filterDraft.status = ''
  filters.search = ''
  filters.status = ''
  filters.page = 1
  await loadRoles({ preserveSelection: false })
}

async function handleChangePage(nextPage) {
  if (nextPage < 1 || nextPage > meta.value.totalPages || nextPage === filters.page) {
    return
  }

  filters.page = nextPage
  await loadRoles()
}

async function handleSave() {
  if (!canManageWrite.value || saving.value) {
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  const payload = {
    name: form.name,
    description: form.description || null
  }

  try {
    if (formMode.value === 'create') {
      const response = await rolesService.create(payload)
      successMessage.value = 'Cargo ministerial criado com sucesso.'
      filterDraft.search = ''
      filterDraft.status = ''
      filters.search = ''
      filters.status = ''
      filters.page = 1
      selectedRoleId.value = response.data.id
      await loadRoles()
      await loadRoleDetail(response.data.id)
    } else if (selectedRoleId.value) {
      const response = await rolesService.update(selectedRoleId.value, payload)
      selectedRole.value = response.data
      successMessage.value = 'Cargo ministerial atualizado com sucesso.'
      await loadRoles()
    }
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel salvar o cargo ministerial.'
  } finally {
    saving.value = false
  }
}

async function handleToggleStatus() {
  if (!canManageStatus.value || !selectedRole.value || selectedRole.value.isSystem || statusSaving.value) {
    return
  }

  const nextStatus = selectedRole.value.status === 'active' ? 'inactive' : 'active'

  statusSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await rolesService.updateStatus(selectedRole.value.id, nextStatus)
    selectedRole.value = response.data
    successMessage.value = `Cargo ministerial ${nextStatus === 'active' ? 'ativado' : 'inativado'} com sucesso.`
    await loadRoles()
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel atualizar o status do cargo ministerial.'
  } finally {
    statusSaving.value = false
  }
}

function getStatusLabel(status) {
  if (status === 'active') return 'Ativo'
  if (status === 'inactive') return 'Inativo'
  return status
}

function getRoleOriginLabel(role) {
  return role.isSystem ? 'Padrao do onboarding' : 'Cargo customizado'
}

function formatDate(value) {
  if (!value) return 'Nao informado'
  return new Date(value).toLocaleDateString('pt-BR')
}

function formatDateTime(value) {
  if (!value) return 'Nao informado'
  return new Date(value).toLocaleString('pt-BR')
}

onMounted(async () => {
  try {
    await loadRoles()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="roles-page">
    <div class="hero-card">
      <div>
        <span class="eyebrow">Dominio ministerial</span>
        <h1>Cargos ministeriais</h1>
        <p>
          Estruture os cargos da igreja sem misturar o dominio ministerial com perfis tecnicos e
          permissoes do sistema.
        </p>
      </div>

      <div class="hero-badges">
        <span class="hero-pill">{{ authStore.user?.churchName || 'Igreja sede' }}</span>
        <span class="hero-pill">{{ summary.scopeLabel }}</span>
        <span class="hero-pill">Cargo nao concede acesso tecnico</span>
        <span v-if="isScopedUser" class="hero-pill hero-pill-warning">
          Catalogo visivel, gestao restrita a usuarios da sede
        </span>
      </div>
    </div>

    <div v-if="errorMessage" class="feedback error">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="feedback success">
      {{ successMessage }}
    </div>

    <section class="summary-grid">
      <article
        v-for="card in summaryCards"
        :key="card.label"
        class="summary-card"
        :data-tone="card.tone"
      >
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
      </article>
    </section>

    <section class="context-card">
      <div>
        <h2>Como este modulo opera no tenant</h2>
        <p>
          O catalogo de cargos ministeriais pertence ao dominio da igreja e pode ser referenciado
          por membros no futuro, mas nao substitui perfis tecnicos nem concede permissao de acesso.
        </p>
      </div>

      <div class="context-chips">
        <span class="context-chip">Leitura por `roles:read`</span>
        <span class="context-chip">Edicao por `roles:write`</span>
        <span class="context-chip">Status por `roles:delete`</span>
      </div>
    </section>

    <section class="workspace-grid">
      <article class="panel-card">
        <div class="section-header">
          <div>
            <h2>Catalogo ministerial do tenant</h2>
            <p>Busque e acompanhe os cargos ministeriais disponiveis para a estrutura da igreja.</p>
          </div>

          <button
            v-if="canManageWrite"
            class="primary-button"
            type="button"
            @click="openCreateMode"
          >
            Novo cargo
          </button>
        </div>

        <form class="filters-form" @submit.prevent="handleSubmitFilters">
          <label class="field">
            <span>Buscar por nome</span>
            <input v-model="filterDraft.search" type="text" placeholder="Ex.: Pastor auxiliar" />
          </label>

          <label class="field">
            <span>Status</span>
            <select v-model="filterDraft.status">
              <option value="">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </label>

          <div class="filters-actions">
            <button class="primary-button" type="submit" :disabled="listLoading">
              {{ listLoading ? 'Filtrando...' : 'Aplicar filtros' }}
            </button>

            <button class="secondary-button" type="button" :disabled="listLoading" @click="handleClearFilters">
              Limpar
            </button>
          </div>
        </form>

        <div v-if="loading || listLoading" class="inline-feedback">
          Carregando cargos ministeriais...
        </div>

        <div v-else-if="roles.length === 0" class="inline-feedback">
          Nenhum cargo ministerial encontrado para os filtros atuais.
        </div>

        <div v-else class="list-grid">
          <button
            v-for="role in roles"
            :key="role.id"
            class="list-card"
            type="button"
            :class="{ active: role.id === selectedRoleId && formMode === 'edit' }"
            @click="selectRole(role.id)"
          >
            <div class="list-card-top">
              <strong>{{ role.name }}</strong>
              <span class="status-pill" :data-status="role.status">
                {{ getStatusLabel(role.status) }}
              </span>
            </div>

            <div class="list-chip-row">
              <span class="inline-chip">{{ getRoleOriginLabel(role) }}</span>
              <span class="inline-chip">{{ role.counts.members }} membros</span>
            </div>

            <p>{{ role.description || 'Descricao nao informada' }}</p>
            <small>Atualizado em {{ formatDate(role.updatedAt || role.createdAt) }}</small>
          </button>
        </div>

        <div v-if="meta.totalPages > 1" class="pagination">
          <button
            class="secondary-button"
            type="button"
            :disabled="filters.page === 1 || listLoading"
            @click="handleChangePage(filters.page - 1)"
          >
            Pagina anterior
          </button>

          <span>Pagina {{ meta.page }} de {{ meta.totalPages }}</span>

          <button
            class="secondary-button"
            type="button"
            :disabled="filters.page === meta.totalPages || listLoading"
            @click="handleChangePage(filters.page + 1)"
          >
            Proxima pagina
          </button>
        </div>
      </article>

      <article class="panel-card detail-panel">
        <div v-if="detailLoading" class="inline-feedback">
          Carregando detalhes do cargo ministerial...
        </div>

        <template v-else-if="selectedRole">
          <div class="section-header">
            <div>
              <h2>{{ selectedRole.name }}</h2>
              <p>{{ getRoleOriginLabel(selectedRole) }}</p>
            </div>

            <div class="detail-pill-group">
              <span class="inline-chip">{{ summary.scopeLabel }}</span>
              <span class="status-pill" :data-status="selectedRole.status">
                {{ getStatusLabel(selectedRole.status) }}
              </span>
            </div>
          </div>

          <section class="detail-stats">
            <article class="mini-stat">
              <span>Membros vinculados</span>
              <strong>{{ selectedRole.counts.members }}</strong>
            </article>

            <article class="mini-stat">
              <span>Origem</span>
              <strong>{{ selectedRole.isSystem ? 'Padrao' : 'Customizado' }}</strong>
            </article>
          </section>

          <dl class="definition-list">
            <div>
              <dt>Descricao</dt>
              <dd>{{ selectedRole.description || 'Nao informada' }}</dd>
            </div>

            <div>
              <dt>Status</dt>
              <dd>{{ getStatusLabel(selectedRole.status) }}</dd>
            </div>

            <div>
              <dt>Criado em</dt>
              <dd>{{ formatDateTime(selectedRole.createdAt) }}</dd>
            </div>

            <div>
              <dt>Atualizado em</dt>
              <dd>{{ formatDateTime(selectedRole.updatedAt) }}</dd>
            </div>

            <div>
              <dt>Escopo atual</dt>
              <dd>{{ summary.scopeLabel }}</dd>
            </div>
          </dl>

          <div v-if="selectedRole.isSystem" class="inline-feedback subtle-feedback">
            Cargos padrao do onboarding permanecem bloqueados para edicao e inativacao nesta etapa.
          </div>
        </template>

        <div v-else class="inline-feedback">
          Selecione um cargo para ver detalhes ou use o formulario ao lado para cadastrar um novo.
        </div>

        <div v-if="canManageWrite" class="divider"></div>

        <form v-if="canManageWrite" class="form-card" @submit.prevent="handleSave">
          <div class="section-header compact">
            <div>
              <h3>{{ formMode === 'create' ? 'Novo cargo ministerial' : 'Editar cargo ministerial' }}</h3>
              <p>O catalogo ministerial permanece separado de perfis tecnicos e permissoes do painel.</p>
            </div>
          </div>

          <label class="field">
            <span>Nome</span>
            <input v-model="form.name" type="text" maxlength="100" required />
          </label>

          <label class="field">
            <span>Descricao</span>
            <textarea v-model="form.description" rows="5" maxlength="65535" />
          </label>

          <div class="form-actions">
            <button
              class="primary-button"
              type="submit"
              :disabled="saving || (formMode === 'edit' && selectedRole?.isSystem)"
            >
              {{ saving ? 'Salvando...' : formMode === 'create' ? 'Criar cargo' : 'Salvar alteracoes' }}
            </button>

            <button
              v-if="formMode === 'edit'"
              class="secondary-button"
              type="button"
              :disabled="saving"
              @click="openCreateMode"
            >
              Novo cargo
            </button>

            <button
              v-if="formMode === 'edit' && selectedRole && canManageStatus && !selectedRole.isSystem"
              class="secondary-button danger-button"
              type="button"
              :disabled="statusSaving"
              @click="handleToggleStatus"
            >
              {{ statusSaving ? 'Salvando...' : selectedRole.status === 'active' ? 'Inativar' : 'Ativar' }}
            </button>
          </div>
        </form>
      </article>
    </section>
  </section>
</template>

<style scoped>
.roles-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hero-card,
.panel-card,
.summary-card,
.feedback,
.context-card {
  padding: 1.35rem;
  border-radius: 24px;
  border: 1px solid #dbe3f3;
  background: rgba(255, 255, 255, 0.92);
}

.eyebrow {
  display: inline-block;
  margin-bottom: 0.55rem;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.hero-card h1,
.panel-card h2,
.panel-card h3 {
  margin: 0 0 0.4rem;
  color: #0f172a;
}

.hero-card p,
.panel-card p,
.summary-card span,
.field span,
.definition-list dt,
.context-card p,
.mini-stat span {
  color: #64748b;
}

.hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1rem;
}

.hero-pill {
  border-radius: 999px;
  padding: 0.65rem 0.9rem;
  background: #ecfeff;
  color: #155e75;
  font-size: 0.82rem;
  font-weight: 700;
}

.hero-pill-warning {
  background: #fff7ed;
  color: #c2410c;
}

.feedback.error {
  color: #b91c1c;
  border-color: #fecaca;
  background: #fff1f2;
}

.feedback.success {
  color: #0f766e;
  border-color: #99f6e4;
  background: #f0fdfa;
}

.summary-grid,
.workspace-grid,
.list-grid,
.detail-stats {
  display: grid;
  gap: 1rem;
}

.summary-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.workspace-grid {
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  align-items: start;
}

.detail-stats {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 1rem;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.summary-card strong,
.mini-stat strong,
.definition-list dd {
  color: #0f172a;
}

.summary-card[data-tone='total'] {
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
}

.summary-card[data-tone='active'] {
  background: linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%);
}

.summary-card[data-tone='system'] {
  background: linear-gradient(180deg, #f5f3ff 0%, #ffffff 100%);
}

.summary-card[data-tone='members'] {
  background: linear-gradient(180deg, #fefce8 0%, #ffffff 100%);
}

.context-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.context-card h2 {
  margin: 0 0 0.35rem;
  color: #0f172a;
}

.context-card p {
  margin: 0;
  line-height: 1.6;
}

.context-chips,
.detail-pill-group,
.list-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.context-chip,
.inline-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.78rem;
  font-weight: 700;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-header.compact {
  margin-bottom: 0.75rem;
}

.filters-form,
.form-card {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  min-height: 46px;
  padding: 0.8rem 0.95rem;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
}

.field textarea {
  min-height: 120px;
  resize: vertical;
}

.filters-actions,
.form-actions,
.pagination {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.primary-button,
.secondary-button {
  border-radius: 999px;
  padding: 0.8rem 1rem;
  font-weight: 700;
  cursor: pointer;
}

.primary-button {
  border: none;
  background: #0f172a;
  color: #ffffff;
}

.secondary-button {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
}

.danger-button {
  border-color: #fecaca;
  color: #b91c1c;
}

.primary-button:disabled,
.secondary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.inline-feedback,
.mini-stat {
  padding: 1rem;
  border-radius: 18px;
  background: #f8fafc;
  color: #475569;
}

.subtle-feedback {
  margin-top: 1rem;
}

.list-card {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 1rem;
  border-radius: 20px;
  border: 1px solid #dbe3f3;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
}

.list-card.active {
  border-color: #0ea5e9;
  background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%);
}

.list-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.list-card strong,
.mini-stat strong {
  font-size: 1rem;
}

.list-card p,
.list-card small {
  margin: 0;
  color: #64748b;
  line-height: 1.5;
}

.status-pill {
  display: inline-flex;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
}

.status-pill[data-status='active'] {
  background: #ecfdf5;
  color: #047857;
}

.status-pill[data-status='inactive'] {
  background: #fff7ed;
  color: #c2410c;
}

.definition-list {
  display: grid;
  gap: 0.8rem;
}

.definition-list dd {
  margin: 0.2rem 0 0;
  word-break: break-word;
}

.divider {
  height: 1px;
  margin: 1.15rem 0;
  background: #e2e8f0;
}

@media (max-width: 1120px) {
  .summary-grid,
  .workspace-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 780px) {
  .context-card,
  .summary-grid,
  .workspace-grid,
  .detail-stats {
    grid-template-columns: 1fr;
  }

  .context-card {
    flex-direction: column;
  }
}
</style>
