<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { congregationsService } from '@/services/congregations.service'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()

const loading = ref(true)
const listLoading = ref(false)
const detailLoading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const congregations = ref([])
const selectedCongregationId = ref(null)
const selectedCongregation = ref(null)

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
  linkedUsers: 0,
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
  address: ''
})

const formMode = ref('create')

const canManage = computed(() =>
  authStore.hasPermission('churches:write') && !authStore.user?.congregationId
)

const isScopedUser = computed(() => !!authStore.user?.congregationId)

const summaryCards = computed(() => [
  {
    label: 'Congregacoes visiveis',
    value: String(summary.value.total),
    tone: 'total'
  },
  {
    label: 'Ativas',
    value: String(summary.value.active),
    tone: 'active'
  },
  {
    label: 'Usuarios vinculados',
    value: String(summary.value.linkedUsers),
    tone: 'users'
  },
  {
    label: 'Membros vinculados',
    value: String(summary.value.linkedMembers),
    tone: 'members'
  }
])

async function loadCongregations(options = {}) {
  const preserveSelection = options.preserveSelection ?? true
  listLoading.value = true
  errorMessage.value = ''

  try {
    const response = await congregationsService.list(filters)
    congregations.value = response.data
    meta.value = response.meta || meta.value
    summary.value = response.summary || summary.value

    const hasSelectedCongregation = preserveSelection && selectedCongregationId.value
    const selectedStillVisible = congregations.value.some(
      (congregation) => congregation.id === selectedCongregationId.value
    )

    if (hasSelectedCongregation && selectedStillVisible) {
      await loadCongregationDetail(selectedCongregationId.value)
      return
    }

    if (congregations.value.length > 0) {
      await selectCongregation(congregations.value[0].id)
      return
    }

    selectedCongregationId.value = null
    selectedCongregation.value = null

    if (canManage.value) {
      openCreateMode()
    }
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel carregar as congregacoes.'
    congregations.value = []
    selectedCongregationId.value = null
    selectedCongregation.value = null
  } finally {
    listLoading.value = false
  }
}

async function loadCongregationDetail(id) {
  if (!id) return

  detailLoading.value = true
  errorMessage.value = ''

  try {
    const response = await congregationsService.getById(id)
    selectedCongregation.value = response.data
    selectedCongregationId.value = response.data.id
    formMode.value = 'edit'
    form.name = response.data.name || ''
    form.address = response.data.address || ''
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel carregar o detalhe da congregacao.'
  } finally {
    detailLoading.value = false
  }
}

async function selectCongregation(id) {
  selectedCongregationId.value = id
  await loadCongregationDetail(id)
}

function openCreateMode() {
  if (!canManage.value) return

  formMode.value = 'create'
  selectedCongregationId.value = null
  selectedCongregation.value = null
  form.name = ''
  form.address = ''
}

async function handleSubmitFilters() {
  filters.search = filterDraft.search.trim()
  filters.status = filterDraft.status
  filters.page = 1
  await loadCongregations({ preserveSelection: false })
}

async function handleClearFilters() {
  filterDraft.search = ''
  filterDraft.status = ''
  filters.search = ''
  filters.status = ''
  filters.page = 1
  await loadCongregations({ preserveSelection: false })
}

async function handleChangePage(nextPage) {
  if (nextPage < 1 || nextPage > meta.value.totalPages || nextPage === filters.page) {
    return
  }

  filters.page = nextPage
  await loadCongregations()
}

async function handleSave() {
  if (!canManage.value || saving.value) {
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  const payload = {
    name: form.name,
    address: form.address
  }

  try {
    if (formMode.value === 'create') {
      const response = await congregationsService.create(payload)
      successMessage.value = 'Congregacao criada com sucesso.'
      filterDraft.search = ''
      filterDraft.status = ''
      filters.search = ''
      filters.status = ''
      filters.page = 1
      selectedCongregationId.value = response.data.id
      await loadCongregations()
      await loadCongregationDetail(response.data.id)
    } else if (selectedCongregationId.value) {
      const response = await congregationsService.update(selectedCongregationId.value, payload)
      selectedCongregation.value = response.data
      successMessage.value = 'Congregacao atualizada com sucesso.'
      await loadCongregations()
    }
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel salvar a congregacao.'
  } finally {
    saving.value = false
  }
}

async function handleToggleStatus() {
  if (!canManage.value || !selectedCongregation.value || saving.value) {
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  const nextStatus = selectedCongregation.value.status === 'active' ? 'inactive' : 'active'

  try {
    const response = await congregationsService.updateStatus(selectedCongregation.value.id, nextStatus)
    selectedCongregation.value = response.data
    successMessage.value = `Congregacao ${nextStatus === 'active' ? 'ativada' : 'inativada'} com sucesso.`
    await loadCongregations()
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel atualizar o status da congregacao.'
  } finally {
    saving.value = false
  }
}

function getStatusLabel(status) {
  if (status === 'active') return 'Ativa'
  if (status === 'inactive') return 'Inativa'
  return status
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
    await loadCongregations()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="congregations-page">
    <div class="hero-card">
      <div>
        <span class="eyebrow">Estrutura do tenant</span>
        <h1>Congregacoes</h1>
        <p>
          A sede administra o tenant completo e cadastra as unidades vinculadas sem misturar
          congregacoes com a igreja sede.
        </p>
      </div>

      <div class="hero-badges">
        <span class="hero-pill">{{ authStore.user?.churchName || 'Igreja sede' }}</span>
        <span class="hero-pill">{{ summary.scopeLabel }}</span>
        <span v-if="isScopedUser" class="hero-pill hero-pill-warning">
          Visualizacao restrita a sua congregacao
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

    <section class="workspace-grid">
      <article class="panel-card">
        <div class="section-header">
          <div>
            <h2>Unidades vinculadas</h2>
            <p>Busque, filtre e acompanhe o status operacional das congregacoes do tenant atual.</p>
          </div>

          <button
            v-if="canManage"
            class="primary-button"
            type="button"
            @click="openCreateMode"
          >
            Nova congregacao
          </button>
        </div>

        <form class="filters-form" @submit.prevent="handleSubmitFilters">
          <label class="field">
            <span>Buscar por nome</span>
            <input v-model="filterDraft.search" type="text" placeholder="Ex.: Vila Mariana" />
          </label>

          <label class="field">
            <span>Status</span>
            <select v-model="filterDraft.status">
              <option value="">Todos</option>
              <option value="active">Ativas</option>
              <option value="inactive">Inativas</option>
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
          Carregando congregacoes...
        </div>

        <div v-else-if="congregations.length === 0" class="inline-feedback">
          Nenhuma congregacao encontrada para os filtros atuais.
        </div>

        <div v-else class="list-grid">
          <button
            v-for="congregation in congregations"
            :key="congregation.id"
            class="list-card"
            type="button"
            :class="{ active: congregation.id === selectedCongregationId && formMode === 'edit' }"
            @click="selectCongregation(congregation.id)"
          >
            <div class="list-card-top">
              <strong>{{ congregation.name }}</strong>
              <span class="status-pill" :data-status="congregation.status">
                {{ getStatusLabel(congregation.status) }}
              </span>
            </div>

            <p>{{ congregation.address || 'Endereco nao informado' }}</p>

            <div class="counts-row">
              <span>{{ congregation.counts.users }} usuarios</span>
              <span>{{ congregation.counts.members }} membros</span>
            </div>

            <small>Atualizada em {{ formatDate(congregation.updatedAt || congregation.createdAt) }}</small>
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
          Carregando detalhes da congregacao...
        </div>

        <template v-else-if="selectedCongregation">
          <div class="section-header">
            <div>
              <h2>{{ selectedCongregation.name }}</h2>
              <p>
                {{ canManage
                  ? 'Revise os dados da unidade e mantenha o cadastro consistente para o tenant.'
                  : 'Seu acesso esta restrito a visualizacao desta congregacao vinculada.' }}
              </p>
            </div>

            <span class="status-pill" :data-status="selectedCongregation.status">
              {{ getStatusLabel(selectedCongregation.status) }}
            </span>
          </div>

          <section class="detail-stats">
            <article class="mini-stat">
              <span>Usuarios</span>
              <strong>{{ selectedCongregation.counts.users }}</strong>
            </article>

            <article class="mini-stat">
              <span>Membros</span>
              <strong>{{ selectedCongregation.counts.members }}</strong>
            </article>
          </section>

          <dl class="definition-list">
            <div>
              <dt>Endereco</dt>
              <dd>{{ selectedCongregation.address || 'Nao informado' }}</dd>
            </div>

            <div>
              <dt>Criada em</dt>
              <dd>{{ formatDateTime(selectedCongregation.createdAt) }}</dd>
            </div>

            <div>
              <dt>Atualizada em</dt>
              <dd>{{ formatDateTime(selectedCongregation.updatedAt) }}</dd>
            </div>

            <div>
              <dt>Escopo atual</dt>
              <dd>{{ summary.scopeLabel }}</dd>
            </div>
          </dl>
        </template>

        <div v-else class="inline-feedback">
          Selecione uma congregacao para ver detalhes ou use o formulario ao lado para cadastrar uma
          nova unidade.
        </div>

        <div v-if="canManage" class="divider"></div>

        <form v-if="canManage" class="form-card" @submit.prevent="handleSave">
          <div class="section-header compact">
            <div>
              <h3>{{ formMode === 'create' ? 'Nova congregacao' : 'Editar congregacao' }}</h3>
              <p>
                {{
                  formMode === 'create'
                    ? 'Cadastre uma unidade vinculada a sede sem alterar a modelagem atual do tenant.'
                    : 'Atualize os dados cadastrais e o contexto operacional da unidade.'
                }}
              </p>
            </div>
          </div>

          <label class="field">
            <span>Nome</span>
            <input v-model="form.name" type="text" maxlength="150" required />
          </label>

          <label class="field">
            <span>Endereco</span>
            <textarea v-model="form.address" rows="4" maxlength="255" />
          </label>

          <div class="form-actions">
            <button class="primary-button" type="submit" :disabled="saving">
              {{ saving ? 'Salvando...' : formMode === 'create' ? 'Criar congregacao' : 'Salvar alteracoes' }}
            </button>

            <button
              v-if="formMode === 'edit'"
              class="secondary-button"
              type="button"
              :disabled="saving"
              @click="openCreateMode"
            >
              Nova congregacao
            </button>

            <button
              v-if="formMode === 'edit' && selectedCongregation"
              class="secondary-button danger-button"
              type="button"
              :disabled="saving"
              @click="handleToggleStatus"
            >
              {{ selectedCongregation.status === 'active' ? 'Inativar' : 'Ativar' }}
            </button>
          </div>
        </form>
      </article>
    </section>
  </section>
</template>

<style scoped>
.congregations-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hero-card,
.panel-card,
.summary-card,
.feedback {
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

.summary-card[data-tone='users'] {
  background: linear-gradient(180deg, #fefce8 0%, #ffffff 100%);
}

.summary-card[data-tone='members'] {
  background: linear-gradient(180deg, #fdf4ff 0%, #ffffff 100%);
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
  min-height: 110px;
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

.list-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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

.list-card-top,
.counts-row {
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
  .summary-grid,
  .workspace-grid,
  .detail-stats {
    grid-template-columns: 1fr;
  }
}
</style>
