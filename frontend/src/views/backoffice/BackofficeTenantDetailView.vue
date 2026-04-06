<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { backofficeTenantsService } from '@/services/backoffice-tenants.service'
import { useBackofficeAuthStore } from '@/stores/backoffice-auth.store'
import { getScopeLabel, getStatusLabel } from '@/utils/backoffice-labels'

const route = useRoute()
const backofficeAuthStore = useBackofficeAuthStore()

const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const tenant = ref(null)
const selectedStatus = ref('active')
const congregations = ref([])
const tenantUsers = ref([])

const sectionErrors = reactive({
  congregations: '',
  users: '',
})

const sectionLoading = reactive({
  congregations: false,
  users: false,
})

const userSavingState = reactive({})

const canUpdateStatus = computed(() => backofficeAuthStore.hasPermission('platform:tenants:write'))
const canViewCongregations = computed(() => backofficeAuthStore.hasPermission('platform:congregations:read'))
const canViewUsers = computed(() => backofficeAuthStore.hasPermission('platform:users:read'))
const canManageUsers = computed(() => backofficeAuthStore.hasPermission('platform:users:write'))

async function loadTenant() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await backofficeTenantsService.getById(route.params.id)
    tenant.value = response.data
    selectedStatus.value = response.data.status
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel carregar a igreja cliente.'
  } finally {
    loading.value = false
  }
}

async function loadCongregations() {
  if (!canViewCongregations.value) {
    congregations.value = []
    return
  }

  sectionLoading.congregations = true
  sectionErrors.congregations = ''

  try {
    const response = await backofficeTenantsService.listCongregations(route.params.id)
    congregations.value = response.data
  } catch (error) {
    sectionErrors.congregations = error.message || 'Nao foi possivel carregar as congregacoes vinculadas.'
  } finally {
    sectionLoading.congregations = false
  }
}

async function loadTenantUsers() {
  if (!canViewUsers.value) {
    tenantUsers.value = []
    return
  }

  sectionLoading.users = true
  sectionErrors.users = ''

  try {
    const response = await backofficeTenantsService.listUsers(route.params.id)
    tenantUsers.value = response.data
  } catch (error) {
    sectionErrors.users = error.message || 'Nao foi possivel carregar os usuarios administrativos.'
  } finally {
    sectionLoading.users = false
  }
}

async function handleStatusUpdate() {
  if (!tenant.value || selectedStatus.value === tenant.value.status) {
    return
  }

  saving.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const response = await backofficeTenantsService.updateStatus(tenant.value.id, selectedStatus.value)
    tenant.value = response.data
    selectedStatus.value = response.data.status
    successMessage.value = 'Status da igreja cliente atualizado com sucesso.'
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel atualizar o status da igreja cliente.'
  } finally {
    saving.value = false
  }
}

async function handleUserStatusUpdate(user) {
  if (!tenant.value || userSavingState[user.id] || !canManageUsers.value) {
    return
  }

  userSavingState[user.id] = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const response = await backofficeTenantsService.updateUserStatus(
      tenant.value.id,
      user.id,
      !user.isActive
    )

    tenantUsers.value = tenantUsers.value.map((item) =>
      item.id === response.data.id ? response.data : item
    )

    successMessage.value = `Usuario ${response.data.isActive ? 'ativado' : 'inativado'} com sucesso.`
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel atualizar o status do usuario.'
  } finally {
    userSavingState[user.id] = false
  }
}

function formatDateTime(value) {
  if (!value) return 'Nunca acessou'
  return new Date(value).toLocaleString('pt-BR')
}

onMounted(async () => {
  await loadTenant()

  if (!tenant.value) {
    return
  }

  await Promise.all([
    loadCongregations(),
    loadTenantUsers(),
  ])
})
</script>

<template>
  <section class="tenant-detail-page">
    <div class="page-header">
      <div>
        <RouterLink class="back-link" :to="{ name: 'backoffice-tenants' }">
          Voltar para igrejas clientes
        </RouterLink>
        <h2>Detalhe da igreja cliente</h2>
        <p>Consulte os dados da igreja sede e acompanhe seus acessos administrativos.</p>
      </div>
    </div>

    <div v-if="errorMessage" class="feedback error">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="feedback success">
      {{ successMessage }}
    </div>

    <div v-if="loading" class="feedback">
      Carregando igreja cliente...
    </div>

    <template v-else-if="tenant">
      <section class="hero-card">
        <div>
          <span class="status-pill" :data-status="tenant.status">
            {{ getStatusLabel(tenant.status) }}
          </span>
          <h3>{{ tenant.name }}</h3>
          <p>{{ tenant.email || 'Sem e-mail cadastrado' }}</p>
        </div>

        <div class="hero-meta">
          <div>
            <span>Plano</span>
            <strong>{{ tenant.plan }}</strong>
          </div>
          <div>
            <span>Criado em</span>
            <strong>{{ new Date(tenant.createdAt).toLocaleDateString('pt-BR') }}</strong>
          </div>
        </div>
      </section>

      <section class="detail-grid">
        <article class="detail-card">
          <h4>Dados principais</h4>
          <dl class="definition-list">
            <div>
              <dt>ID</dt>
              <dd>{{ tenant.id }}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{{ tenant.email || 'Nao informado' }}</dd>
            </div>
            <div>
              <dt>Telefone</dt>
              <dd>{{ tenant.phone || 'Nao informado' }}</dd>
            </div>
            <div>
              <dt>Documento</dt>
              <dd>{{ tenant.document || 'Nao informado' }}</dd>
            </div>
          </dl>
        </article>

        <article class="detail-card">
          <h4>Status da igreja cliente</h4>
          <p class="muted">
            Atualize o status da igreja cliente sem interferir nos perfis internos da igreja.
          </p>

          <div class="status-form">
            <select v-model="selectedStatus" :disabled="!canUpdateStatus || saving">
              <option value="active">{{ getStatusLabel('active') }}</option>
              <option value="inactive">{{ getStatusLabel('inactive') }}</option>
              <option value="suspended">{{ getStatusLabel('suspended') }}</option>
            </select>

            <button
              class="primary-button"
              @click="handleStatusUpdate"
              :disabled="!canUpdateStatus || saving || selectedStatus === tenant.status"
            >
              {{ saving ? 'Salvando...' : 'Atualizar status' }}
            </button>
          </div>
        </article>
      </section>

      <section class="stats-grid">
        <article class="stat-card">
          <span>Congregações</span>
          <strong>{{ tenant.counts.congregations }}</strong>
        </article>

        <article class="stat-card">
          <span>Usuários</span>
          <strong>{{ tenant.counts.users }}</strong>
        </article>

        <article class="stat-card">
          <span>Membros</span>
          <strong>{{ tenant.counts.members }}</strong>
        </article>
      </section>

      <section v-if="canViewCongregations" class="section-card">
        <div class="section-header">
          <div>
            <h4>Congregações vinculadas</h4>
            <p>Consulte as congregações vinculadas a esta igreja sede.</p>
          </div>
        </div>

        <div v-if="sectionErrors.congregations" class="inline-feedback error">
          {{ sectionErrors.congregations }}
        </div>

        <div v-else-if="sectionLoading.congregations" class="inline-feedback">
          Carregando congregações...
        </div>

        <div v-else class="list-grid">
          <article v-for="congregation in congregations" :key="congregation.id" class="list-card">
            <div class="list-card-top">
              <strong>{{ congregation.name }}</strong>
              <span class="status-pill" :data-status="congregation.status">
                {{ getStatusLabel(congregation.status) }}
              </span>
            </div>

            <p>{{ congregation.address || 'Endereco nao informado' }}</p>
            <small>Vinculada à sede {{ tenant.name }}</small>
          </article>

          <div v-if="congregations.length === 0" class="inline-feedback">
            Nenhuma congregação cadastrada para esta igreja cliente.
          </div>
        </div>
      </section>

      <section v-if="canViewUsers" class="section-card">
        <div class="section-header">
          <div>
            <h4>Usuários administrativos da igreja cliente</h4>
            <p>Consulte os acessos técnicos da igreja cliente sem entrar na gestão interna da igreja.</p>
          </div>
        </div>

        <div v-if="sectionErrors.users" class="inline-feedback error">
          {{ sectionErrors.users }}
        </div>

        <div v-else-if="sectionLoading.users" class="inline-feedback">
          Carregando usuários...
        </div>

        <div v-else class="users-table-wrapper">
          <table class="users-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Status</th>
                <th>Perfil técnico</th>
                <th>Escopo</th>
                <th>Permissões</th>
                <th>Último acesso</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="user in tenantUsers" :key="user.id">
                <td>
                  <div class="user-name">{{ user.name }}</div>
                  <div class="user-email">{{ user.email }}</div>
                </td>
                <td>
                  <span class="status-pill" :data-status="user.isActive ? 'active' : 'inactive'">
                    {{ user.isActive ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td>{{ user.profile.name || 'Sem perfil' }}</td>
                <td>{{ getScopeLabel(user.scope) }}</td>
                <td>
                  <div class="permissions-list">
                    <span
                      v-for="permission in user.profile.permissions"
                      :key="permission"
                      class="permission-chip"
                    >
                      {{ permission }}
                    </span>
                    <span v-if="user.profile.permissions.length === 0" class="permission-chip muted-chip">
                      Sem permissões
                    </span>
                  </div>
                </td>
                <td>{{ formatDateTime(user.lastLogin) }}</td>
                <td>
                  <button
                    class="secondary-button"
                    :disabled="!canManageUsers || userSavingState[user.id]"
                    @click="handleUserStatusUpdate(user)"
                  >
                    {{
                      userSavingState[user.id]
                        ? 'Salvando...'
                        : user.isActive
                          ? 'Inativar'
                          : 'Ativar'
                    }}
                  </button>
                </td>
              </tr>

              <tr v-if="tenantUsers.length === 0">
                <td colspan="7" class="empty-state">
                  Nenhum usuário administrativo encontrado para esta igreja cliente.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.tenant-detail-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.back-link {
  display: inline-flex;
  margin-bottom: 0.85rem;
  color: #0f766e;
  text-decoration: none;
  font-weight: 700;
}

.page-header h2 {
  margin: 0 0 0.35rem;
  color: #0f172a;
  font-size: 1.8rem;
}

.page-header p,
.muted {
  margin: 0;
  color: #64748b;
}

.feedback,
.hero-card,
.detail-card,
.stat-card,
.section-card {
  padding: 1.25rem;
  border-radius: 22px;
  background-color: rgba(255, 255, 255, 0.92);
  border: 1px solid #dbe3f3;
}

.feedback.error {
  color: #b91c1c;
  border-color: #fecaca;
  background-color: #fff1f2;
}

.feedback.success {
  color: #0f766e;
  border-color: #99f6e4;
  background-color: #f0fdfa;
}

.hero-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.hero-card h3 {
  margin: 0.9rem 0 0.35rem;
  color: #0f172a;
  font-size: 1.85rem;
}

.hero-card p {
  margin: 0;
  color: #64748b;
}

.hero-meta {
  display: grid;
  gap: 0.85rem;
}

.hero-meta span,
.stat-card span {
  display: block;
  color: #64748b;
  font-size: 0.88rem;
}

.hero-meta strong,
.stat-card strong {
  color: #0f172a;
  font-size: 1.1rem;
}

.detail-grid,
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.stats-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-header h4,
.detail-card h4 {
  margin: 0 0 0.3rem;
  color: #0f172a;
}

.section-header p {
  margin: 0;
  color: #64748b;
}

.detail-card h4 {
  margin-bottom: 0.9rem;
}

.definition-list {
  display: grid;
  gap: 0.85rem;
}

.definition-list dt {
  color: #64748b;
  font-size: 0.88rem;
  margin-bottom: 0.2rem;
}

.definition-list dd {
  margin: 0;
  color: #0f172a;
  word-break: break-word;
}

.status-form {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.status-form select {
  flex: 1;
  min-height: 46px;
  padding: 0.8rem 0.95rem;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
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
  background-color: #0f172a;
  color: white;
}

.secondary-button {
  border: 1px solid #cbd5e1;
  background-color: white;
  color: #0f172a;
}

.primary-button:disabled,
.secondary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.status-pill {
  display: inline-flex;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
}

.status-pill[data-status='active'] {
  background-color: #ecfdf5;
  color: #047857;
}

.status-pill[data-status='inactive'] {
  background-color: #fff7ed;
  color: #c2410c;
}

.status-pill[data-status='suspended'] {
  background-color: #fff1f2;
  color: #be123c;
}

.inline-feedback {
  padding: 1rem;
  border-radius: 16px;
  background-color: #f8fafc;
  color: #475569;
}

.inline-feedback.error {
  background-color: #fff1f2;
  color: #b91c1c;
}

.list-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.list-card {
  padding: 1rem;
  border-radius: 18px;
  border: 1px solid #dbe3f3;
  background-color: #f8fafc;
}

.list-card-top {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.list-card p,
.list-card small {
  margin: 0;
  color: #64748b;
  line-height: 1.5;
}

.list-card small {
  display: inline-block;
  margin-top: 0.75rem;
}

.users-table-wrapper {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 0.95rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
  text-align: left;
}

.users-table th {
  color: #475569;
  font-size: 0.85rem;
}

.user-name {
  color: #0f172a;
  font-weight: 700;
}

.user-email {
  margin-top: 0.2rem;
  color: #64748b;
  font-size: 0.88rem;
}

.permissions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  max-width: 320px;
}

.permission-chip {
  display: inline-flex;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  background-color: #eff6ff;
  color: #1d4ed8;
  font-size: 0.76rem;
  font-weight: 700;
}

.muted-chip {
  background-color: #f1f5f9;
  color: #64748b;
}

.empty-state {
  text-align: center;
  color: #64748b;
}

@media (max-width: 920px) {
  .hero-card,
  .detail-grid,
  .stats-grid,
  .status-form {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .list-grid {
    grid-template-columns: 1fr;
  }
}
</style>
