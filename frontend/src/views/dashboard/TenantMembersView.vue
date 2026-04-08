<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { membersService } from '@/services/members.service'
import { congregationsService } from '@/services/congregations.service'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()

const loading = ref(true)
const listLoading = ref(false)
const detailLoading = ref(false)
const saving = ref(false)
const statusSaving = ref(false)
const optionsLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const members = ref([])
const congregations = ref([])
const selectedMemberId = ref(null)
const selectedMember = ref(null)

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
  transferred: 0,
  deceased: 0,
  scopeLabel: 'Sede / tenant completo'
})

const filters = reactive({
  search: '',
  status: '',
  congregationId: '',
  page: 1,
  perPage: 6
})

const filterDraft = reactive({
  search: '',
  status: '',
  congregationId: ''
})

const form = reactive({
  name: '',
  congregationId: '',
  email: '',
  phone: '',
  document: '',
  gender: '',
  maritalStatus: '',
  birthDate: '',
  baptismDate: '',
  membershipDate: '',
  addressStreet: '',
  addressNumber: '',
  addressNeighborhood: '',
  addressCity: '',
  addressState: '',
  addressZipcode: ''
})

const formMode = ref('create')

const isScopedUser = computed(() => !!authStore.user?.congregationId)
const canWrite = computed(() => authStore.hasPermission('members:write'))
const canDelete = computed(() => authStore.hasPermission('members:delete'))
const canManageStatus = computed(() => canDelete.value)

const availableCongregationOptions = computed(() => {
  if (isScopedUser.value) {
    return congregations.value.filter((item) => item.id === authStore.user?.congregationId)
  }

  return congregations.value
})

const summaryCards = computed(() => [
  {
    label: 'Membros visiveis',
    value: String(summary.value.total),
    tone: 'total'
  },
  {
    label: 'Ativos',
    value: String(summary.value.active),
    tone: 'active'
  },
  {
    label: 'Inativos',
    value: String(summary.value.inactive),
    tone: 'inactive'
  },
  {
    label: 'Transferidos',
    value: String(summary.value.transferred),
    tone: 'transferred'
  },
  {
    label: 'Falecidos',
    value: String(summary.value.deceased),
    tone: 'deceased'
  }
])

async function loadCongregationOptions() {
  optionsLoading.value = true

  try {
    const response = await congregationsService.list({
      page: 1,
      perPage: 100
    })

    congregations.value = response.data || []

    if (isScopedUser.value) {
      filterDraft.congregationId = authStore.user?.congregationId || ''
      filters.congregationId = authStore.user?.congregationId || ''
    }
  } catch (_error) {
    congregations.value = []
  } finally {
    optionsLoading.value = false
  }
}

async function loadMembers(options = {}) {
  const preserveSelection = options.preserveSelection ?? true
  listLoading.value = true
  errorMessage.value = ''

  try {
    const response = await membersService.list({
      ...filters,
      congregationId: filters.congregationId || undefined
    })

    members.value = response.data
    meta.value = response.meta || meta.value
    summary.value = response.summary || summary.value

    const hasSelection = preserveSelection && selectedMemberId.value
    const selectedStillVisible = members.value.some((member) => member.id === selectedMemberId.value)

    if (hasSelection && selectedStillVisible) {
      await loadMemberDetail(selectedMemberId.value)
      return
    }

    if (members.value.length > 0) {
      await selectMember(members.value[0].id)
      return
    }

    selectedMemberId.value = null
    selectedMember.value = null

    if (canWrite.value) {
      openCreateMode()
    }
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel carregar os membros.'
    members.value = []
    selectedMemberId.value = null
    selectedMember.value = null
  } finally {
    listLoading.value = false
  }
}

async function loadMemberDetail(id) {
  if (!id) return

  detailLoading.value = true
  errorMessage.value = ''

  try {
    const response = await membersService.getById(id)
    selectedMember.value = response.data
    selectedMemberId.value = response.data.id
    formMode.value = 'edit'
    populateForm(response.data)
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel carregar o detalhe do membro.'
  } finally {
    detailLoading.value = false
  }
}

async function selectMember(id) {
  selectedMemberId.value = id
  await loadMemberDetail(id)
}

function populateForm(member) {
  form.name = member.name || ''
  form.congregationId = member.congregationId || ''
  form.email = member.email || ''
  form.phone = member.phone || ''
  form.document = member.document || ''
  form.gender = member.gender || ''
  form.maritalStatus = member.maritalStatus || ''
  form.birthDate = formatDateInput(member.birthDate)
  form.baptismDate = formatDateInput(member.baptismDate)
  form.membershipDate = formatDateInput(member.membershipDate)
  form.addressStreet = member.address?.street || ''
  form.addressNumber = member.address?.number || ''
  form.addressNeighborhood = member.address?.neighborhood || ''
  form.addressCity = member.address?.city || ''
  form.addressState = member.address?.state || ''
  form.addressZipcode = member.address?.zipcode || ''
}

function resetForm() {
  form.name = ''
  form.congregationId = isScopedUser.value ? authStore.user?.congregationId || '' : ''
  form.email = ''
  form.phone = ''
  form.document = ''
  form.gender = ''
  form.maritalStatus = ''
  form.birthDate = ''
  form.baptismDate = ''
  form.membershipDate = ''
  form.addressStreet = ''
  form.addressNumber = ''
  form.addressNeighborhood = ''
  form.addressCity = ''
  form.addressState = ''
  form.addressZipcode = ''
}

function openCreateMode() {
  if (!canWrite.value) return

  formMode.value = 'create'
  selectedMemberId.value = null
  selectedMember.value = null
  resetForm()
}

async function handleSubmitFilters() {
  filters.search = filterDraft.search.trim()
  filters.status = filterDraft.status
  filters.congregationId = filterDraft.congregationId
  filters.page = 1
  await loadMembers({ preserveSelection: false })
}

async function handleClearFilters() {
  filterDraft.search = ''
  filterDraft.status = ''
  filterDraft.congregationId = isScopedUser.value ? authStore.user?.congregationId || '' : ''
  filters.search = ''
  filters.status = ''
  filters.congregationId = filterDraft.congregationId
  filters.page = 1
  await loadMembers({ preserveSelection: false })
}

async function handleChangePage(nextPage) {
  if (nextPage < 1 || nextPage > meta.value.totalPages || nextPage === filters.page) {
    return
  }

  filters.page = nextPage
  await loadMembers()
}

async function handleSave() {
  if (!canWrite.value || saving.value) {
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  const payload = buildPayloadFromForm()

  try {
    if (formMode.value === 'create') {
      const response = await membersService.create(payload)
      successMessage.value = 'Membro criado com sucesso.'
      filters.page = 1
      selectedMemberId.value = response.data.id
      await loadMembers()
      await loadMemberDetail(response.data.id)
    } else if (selectedMemberId.value) {
      const response = await membersService.update(selectedMemberId.value, payload)
      selectedMember.value = response.data
      successMessage.value = 'Membro atualizado com sucesso.'
      await loadMembers()
    }
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel salvar o membro.'
  } finally {
    saving.value = false
  }
}

async function handleToggleStatus() {
  if (!canDelete.value || !selectedMember.value || statusSaving.value) {
    return
  }

  const nextStatus = selectedMember.value.status === 'active' ? 'inactive' : 'active'

  statusSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await membersService.updateStatus(selectedMember.value.id, nextStatus)
    selectedMember.value = response.data
    successMessage.value = `Membro ${nextStatus === 'active' ? 'ativado' : 'inativado'} com sucesso.`
    await loadMembers()
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel atualizar o status do membro.'
  } finally {
    statusSaving.value = false
  }
}

function buildPayloadFromForm() {
  return {
    name: form.name,
    congregationId: form.congregationId || null,
    email: form.email || null,
    phone: form.phone || null,
    document: form.document || null,
    gender: form.gender || null,
    maritalStatus: form.maritalStatus || null,
    birthDate: form.birthDate || null,
    baptismDate: form.baptismDate || null,
    membershipDate: form.membershipDate || null,
    addressStreet: form.addressStreet || null,
    addressNumber: form.addressNumber || null,
    addressNeighborhood: form.addressNeighborhood || null,
    addressCity: form.addressCity || null,
    addressState: form.addressState || null,
    addressZipcode: form.addressZipcode || null
  }
}

function getStatusLabel(status) {
  if (status === 'active') return 'Ativo'
  if (status === 'inactive') return 'Inativo'
  if (status === 'transferred') return 'Transferido'
  if (status === 'deceased') return 'Falecido'
  return status
}

function getStatusTone(status) {
  return status === 'active' ? 'active' : 'inactive'
}

function formatGenderLabel(value) {
  if (value === 'male') return 'Masculino'
  if (value === 'female') return 'Feminino'
  if (value === 'other') return 'Outro'
  return 'Nao informado'
}

function formatMaritalStatusLabel(value) {
  if (value === 'single') return 'Solteiro(a)'
  if (value === 'married') return 'Casado(a)'
  if (value === 'widowed') return 'Viuvo(a)'
  if (value === 'divorced') return 'Divorciado(a)'
  return 'Nao informado'
}

function formatDate(value) {
  if (!value) return 'Nao informado'
  return new Date(value).toLocaleDateString('pt-BR')
}

function formatDateTime(value) {
  if (!value) return 'Nao informado'
  return new Date(value).toLocaleString('pt-BR')
}

function formatDateInput(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function formatCongregationLabel(member) {
  if (member.congregation?.name) {
    return `Congregacao: ${member.congregation.name}`
  }

  return 'Sede / tenant completo'
}

onMounted(async () => {
  try {
    resetForm()
    await loadCongregationOptions()
    await loadMembers()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="members-page">
    <div class="hero-card">
      <div>
        <span class="eyebrow">Cadastro pastoral</span>
        <h1>Membros</h1>
        <p>
          Gerencie o cadastro da comunidade sem misturar membros com usuarios tecnicos do tenant.
        </p>
      </div>

      <div class="hero-badges">
        <span class="hero-pill">{{ authStore.user?.churchName || 'Igreja sede' }}</span>
        <span class="hero-pill">{{ summary.scopeLabel }}</span>
        <span class="hero-pill">Membro nao cria acesso tecnico</span>
        <span v-if="isScopedUser" class="hero-pill hero-pill-warning">
          Operacao restrita a sua congregacao
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
          O cadastro de membros pertence ao dominio da igreja. Ele nao cria usuarios do sistema e
          respeita o mesmo escopo de sede e congregacao ja aplicado no restante do painel.
        </p>
      </div>

      <div class="context-chips">
        <span class="context-chip">Leitura por `members:read`</span>
        <span class="context-chip">Edicao por `members:write`</span>
        <span class="context-chip">Status por `members:delete`</span>
      </div>
    </section>

    <section class="workspace-grid">
      <article class="panel-card">
        <div class="section-header">
          <div>
            <h2>Membresia do tenant</h2>
            <p>Busque e filtre os membros cadastrados respeitando o escopo atual do seu acesso.</p>
          </div>

          <button
            v-if="canWrite"
            class="primary-button"
            type="button"
            @click="openCreateMode"
          >
            Novo membro
          </button>
        </div>

        <form class="filters-form" @submit.prevent="handleSubmitFilters">
          <label class="field">
            <span>Buscar</span>
            <input v-model="filterDraft.search" type="text" placeholder="Nome, email, telefone ou documento" />
          </label>

          <label class="field">
            <span>Status</span>
            <select v-model="filterDraft.status">
              <option value="">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="transferred">Transferidos</option>
              <option value="deceased">Falecidos</option>
            </select>
          </label>

          <label class="field" v-if="!isScopedUser">
            <span>Congregacao</span>
            <select v-model="filterDraft.congregationId" :disabled="optionsLoading">
              <option value="">Todas</option>
              <option
                v-for="congregation in availableCongregationOptions"
                :key="congregation.id"
                :value="congregation.id"
              >
                {{ congregation.name }}
              </option>
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
          Carregando membros...
        </div>

        <div v-else-if="members.length === 0" class="inline-feedback">
          Nenhum membro encontrado para os filtros atuais.
        </div>

        <div v-else class="list-grid">
          <button
            v-for="member in members"
            :key="member.id"
            class="list-card"
            type="button"
            :class="{ active: member.id === selectedMemberId && formMode === 'edit' }"
            @click="selectMember(member.id)"
          >
            <div class="list-card-top">
              <strong>{{ member.name }}</strong>
              <span class="status-pill" :data-status="getStatusTone(member.status)">
                {{ getStatusLabel(member.status) }}
              </span>
            </div>

            <div class="list-chip-row">
              <span class="inline-chip">{{ formatCongregationLabel(member) }}</span>
              <span class="inline-chip" v-if="member.document">{{ member.document }}</span>
            </div>

            <p>{{ member.phone || member.email || 'Contato nao informado' }}</p>
            <small>Atualizado em {{ formatDate(member.updatedAt || member.createdAt) }}</small>
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
          Carregando detalhes do membro...
        </div>

        <template v-else-if="selectedMember">
          <div class="section-header">
            <div>
              <h2>{{ selectedMember.name }}</h2>
              <p>{{ formatCongregationLabel(selectedMember) }}</p>
            </div>

            <div class="detail-pill-group">
              <span class="inline-chip">{{ summary.scopeLabel }}</span>
              <span class="status-pill" :data-status="getStatusTone(selectedMember.status)">
                {{ getStatusLabel(selectedMember.status) }}
              </span>
            </div>
          </div>

          <section class="detail-sections">
            <article class="detail-card">
              <h3>Dados basicos</h3>
              <dl class="definition-list">
                <div>
                  <dt>E-mail</dt>
                  <dd>{{ selectedMember.email || 'Nao informado' }}</dd>
                </div>

                <div>
                  <dt>Telefone</dt>
                  <dd>{{ selectedMember.phone || 'Nao informado' }}</dd>
                </div>

                <div>
                  <dt>Documento</dt>
                  <dd>{{ selectedMember.document || 'Nao informado' }}</dd>
                </div>

                <div>
                  <dt>Genero</dt>
                  <dd>{{ formatGenderLabel(selectedMember.gender) }}</dd>
                </div>

                <div>
                  <dt>Estado civil</dt>
                  <dd>{{ formatMaritalStatusLabel(selectedMember.maritalStatus) }}</dd>
                </div>
              </dl>
            </article>

            <article class="detail-card">
              <h3>Historico</h3>
              <dl class="definition-list">
                <div>
                  <dt>Nascimento</dt>
                  <dd>{{ formatDate(selectedMember.birthDate) }}</dd>
                </div>

                <div>
                  <dt>Batismo</dt>
                  <dd>{{ formatDate(selectedMember.baptismDate) }}</dd>
                </div>

                <div>
                  <dt>Membresia</dt>
                  <dd>{{ formatDate(selectedMember.membershipDate) }}</dd>
                </div>

                <div>
                  <dt>Criado em</dt>
                  <dd>{{ formatDateTime(selectedMember.createdAt) }}</dd>
                </div>

                <div>
                  <dt>Atualizado em</dt>
                  <dd>{{ formatDateTime(selectedMember.updatedAt) }}</dd>
                </div>
              </dl>
            </article>

            <article class="detail-card">
              <h3>Endereco</h3>
              <dl class="definition-list">
                <div>
                  <dt>Endereco consolidado</dt>
                  <dd>{{ selectedMember.address?.label || 'Nao informado' }}</dd>
                </div>

                <div>
                  <dt>Logradouro</dt>
                  <dd>{{ selectedMember.address?.street || 'Nao informado' }}</dd>
                </div>

                <div>
                  <dt>Bairro</dt>
                  <dd>{{ selectedMember.address?.neighborhood || 'Nao informado' }}</dd>
                </div>

                <div>
                  <dt>Cidade / UF</dt>
                  <dd>
                    {{ [selectedMember.address?.city, selectedMember.address?.state].filter(Boolean).join(' / ') || 'Nao informado' }}
                  </dd>
                </div>
              </dl>
            </article>
          </section>
        </template>

        <div v-else class="inline-feedback">
          Selecione um membro para ver detalhes ou use o formulario ao lado para cadastrar um novo.
        </div>

        <div v-if="canWrite" class="divider"></div>

        <form v-if="canWrite" class="form-card" @submit.prevent="handleSave">
          <div class="section-header compact">
            <div>
              <h3>{{ formMode === 'create' ? 'Novo membro' : 'Editar membro' }}</h3>
              <p>O cadastro de membros continua separado de usuarios tecnicos e acessos do painel.</p>
            </div>
          </div>

          <section class="form-section">
            <div class="form-section-header">
              <h4>Dados basicos</h4>
              <p>Identificacao principal e posicionamento do membro dentro do tenant.</p>
            </div>

            <label class="field">
              <span>Nome</span>
              <input v-model="form.name" type="text" maxlength="150" required />
            </label>

            <label class="field" v-if="!isScopedUser">
              <span>Congregacao</span>
              <select v-model="form.congregationId" :disabled="optionsLoading">
                <option value="">Sede / tenant completo</option>
                <option
                  v-for="congregation in availableCongregationOptions"
                  :key="congregation.id"
                  :value="congregation.id"
                >
                  {{ congregation.name }}
                </option>
              </select>
            </label>

            <div class="field-grid">
              <label class="field">
                <span>E-mail</span>
                <input v-model="form.email" type="email" maxlength="100" />
              </label>

              <label class="field">
                <span>Telefone</span>
                <input v-model="form.phone" type="text" maxlength="20" />
              </label>
            </div>

            <div class="field-grid">
              <label class="field">
                <span>Documento</span>
                <input v-model="form.document" type="text" maxlength="20" />
              </label>

              <label class="field">
                <span>Genero</span>
                <select v-model="form.gender">
                  <option value="">Nao informado</option>
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                  <option value="other">Outro</option>
                </select>
              </label>
            </div>

            <label class="field">
              <span>Estado civil</span>
              <select v-model="form.maritalStatus">
                <option value="">Nao informado</option>
                <option value="single">Solteiro(a)</option>
                <option value="married">Casado(a)</option>
                <option value="widowed">Viuvo(a)</option>
                <option value="divorced">Divorciado(a)</option>
              </select>
            </label>
          </section>

          <section class="form-section">
            <div class="form-section-header">
              <h4>Historico</h4>
              <p>Datas relevantes para acompanhamento pastoral e administrativo.</p>
            </div>

            <div class="field-grid">
              <label class="field">
                <span>Nascimento</span>
                <input v-model="form.birthDate" type="date" />
              </label>

              <label class="field">
                <span>Batismo</span>
                <input v-model="form.baptismDate" type="date" />
              </label>
            </div>

            <label class="field">
              <span>Membresia</span>
              <input v-model="form.membershipDate" type="date" />
            </label>
          </section>

          <section class="form-section">
            <div class="form-section-header">
              <h4>Endereco</h4>
              <p>Campos opcionais mantidos no padrao atual do schema de membros.</p>
            </div>

            <label class="field">
              <span>Logradouro</span>
              <input v-model="form.addressStreet" type="text" />
            </label>

            <div class="field-grid field-grid-3">
              <label class="field">
                <span>Numero</span>
                <input v-model="form.addressNumber" type="text" maxlength="20" />
              </label>

              <label class="field">
                <span>Bairro</span>
                <input v-model="form.addressNeighborhood" type="text" maxlength="100" />
              </label>

              <label class="field">
                <span>CEP</span>
                <input v-model="form.addressZipcode" type="text" maxlength="20" />
              </label>
            </div>

            <div class="field-grid">
              <label class="field">
                <span>Cidade</span>
                <input v-model="form.addressCity" type="text" maxlength="100" />
              </label>

              <label class="field">
                <span>UF</span>
                <input v-model="form.addressState" type="text" maxlength="2" />
              </label>
            </div>
          </section>

          <div class="form-actions">
            <button class="primary-button" type="submit" :disabled="saving">
              {{ saving ? 'Salvando...' : formMode === 'create' ? 'Criar membro' : 'Salvar alteracoes' }}
            </button>

            <button
              v-if="formMode === 'edit'"
              class="secondary-button"
              type="button"
              :disabled="saving"
              @click="openCreateMode"
            >
              Novo membro
            </button>

            <button
              v-if="formMode === 'edit' && selectedMember && canManageStatus"
              class="secondary-button danger-button"
              type="button"
              :disabled="statusSaving"
              @click="handleToggleStatus"
            >
              {{ statusSaving ? 'Salvando...' : selectedMember.status === 'active' ? 'Inativar' : 'Ativar' }}
            </button>
          </div>
        </form>
      </article>
    </section>
  </section>
</template>

<style scoped>
.members-page {
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
.form-section-header p,
.context-card p {
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
.field-grid,
.detail-sections {
  display: grid;
  gap: 1rem;
}

.summary-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.workspace-grid {
  grid-template-columns: minmax(0, 1.2fr) minmax(340px, 0.8fr);
  align-items: start;
}

.field-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field-grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.summary-card strong,
.definition-list dd {
  color: #0f172a;
}

.summary-card[data-tone='total'] {
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
}

.summary-card[data-tone='active'] {
  background: linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%);
}

.summary-card[data-tone='inactive'] {
  background: linear-gradient(180deg, #fff7ed 0%, #ffffff 100%);
}

.summary-card[data-tone='transferred'] {
  background: linear-gradient(180deg, #fefce8 0%, #ffffff 100%);
}

.summary-card[data-tone='deceased'] {
  background: linear-gradient(180deg, #f5f3ff 0%, #ffffff 100%);
}

.context-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.context-card h2,
.detail-card h3,
.form-section-header h4 {
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

.form-section {
  padding: 1rem;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.form-section-header {
  margin-bottom: 0.85rem;
}

.form-section-header p {
  margin: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field input,
.field select {
  width: 100%;
  min-height: 46px;
  padding: 0.8rem 0.95rem;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
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

.inline-feedback {
  padding: 1rem;
  border-radius: 18px;
  background: #f8fafc;
  color: #475569;
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

.list-card strong {
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

.detail-card {
  padding: 1rem;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
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
  .field-grid,
  .field-grid-3 {
    grid-template-columns: 1fr;
  }

  .context-card {
    flex-direction: column;
  }
}
</style>
