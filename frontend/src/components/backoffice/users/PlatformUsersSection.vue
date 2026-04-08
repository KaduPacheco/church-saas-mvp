<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  backofficeUsersService,
  getBackofficeUsersErrorMessage,
} from '@/services/backoffice-users.service'
import { getPlatformRoleLabel } from '@/utils/backoffice-labels'
import { useBackofficeAuthStore } from '@/stores/backoffice-auth.store'

const backofficeAuthStore = useBackofficeAuthStore()

const loading = ref(true)
const saving = ref(false)
const togglingUserId = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const platformUsers = ref([])
const platformRoles = ref([])
const meta = ref({
  page: 1,
  perPage: 10,
  total: 0,
  totalPages: 1,
})

const filters = reactive({
  search: '',
  status: '',
  page: 1,
  perPage: 10,
})

const form = reactive({
  id: '',
  name: '',
  email: '',
  password: '',
  roleId: '',
})

const isEditMode = computed(() => !!form.id)
const canWrite = computed(() => backofficeAuthStore.hasPermission('platform:platform-users:write'))

async function loadPlatformUsers() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await backofficeUsersService.listPlatformUsers({
      search: filters.search || undefined,
      status: filters.status || undefined,
      page: filters.page,
      perPage: filters.perPage,
    })

    platformUsers.value = response.data
    meta.value = response.meta || meta.value
  } catch (error) {
    errorMessage.value = getBackofficeUsersErrorMessage(
      error,
      'Nao foi possivel carregar os usuarios da plataforma.'
    )
  } finally {
    loading.value = false
  }
}

async function loadPlatformRoles() {
  try {
    const response = await backofficeUsersService.listPlatformRoles()
    platformRoles.value = response.data

    if (!form.roleId && platformRoles.value.length > 0) {
      form.roleId = platformRoles.value[0].id
    }
  } catch (error) {
    errorMessage.value = getBackofficeUsersErrorMessage(
      error,
      'Nao foi possivel carregar os papeis da plataforma.'
    )
  }
}

function resetForm() {
  form.id = ''
  form.name = ''
  form.email = ''
  form.password = ''
  form.roleId = platformRoles.value[0]?.id || ''
}

function handleFilter() {
  filters.page = 1
  loadPlatformUsers()
}

function goToPage(page) {
  if (page < 1 || page > meta.value.totalPages) return
  filters.page = page
  loadPlatformUsers()
}

function startEdit(user) {
  form.id = user.id
  form.name = user.name
  form.email = user.email
  form.password = ''
  form.roleId = user.role.id
  successMessage.value = ''
  errorMessage.value = ''
}

async function handleSubmit() {
  if (!canWrite.value) {
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (isEditMode.value) {
      await backofficeUsersService.updatePlatformUser(form.id, {
        name: form.name,
        email: form.email,
        roleId: form.roleId,
      })

      successMessage.value = 'Usuario da plataforma atualizado com sucesso.'
    } else {
      await backofficeUsersService.createPlatformUser({
        name: form.name,
        email: form.email,
        password: form.password,
        roleId: form.roleId,
      })

      successMessage.value = 'Usuario da plataforma criado com sucesso.'
    }

    resetForm()
    await loadPlatformUsers()
  } catch (error) {
    errorMessage.value = getBackofficeUsersErrorMessage(
      error,
      'Nao foi possivel salvar o usuario da plataforma.'
    )
  } finally {
    saving.value = false
  }
}

async function handleToggleStatus(user) {
  if (!canWrite.value || togglingUserId.value) {
    return
  }

  togglingUserId.value = user.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await backofficeUsersService.updatePlatformUserStatus(user.id, !user.isActive)

    platformUsers.value = platformUsers.value.map((item) =>
      item.id === response.data.id ? response.data : item
    )

    successMessage.value = response.data.isActive
      ? 'Usuario da plataforma ativado com sucesso.'
      : 'Usuario da plataforma inativado com sucesso.'
  } catch (error) {
    errorMessage.value = getBackofficeUsersErrorMessage(
      error,
      'Nao foi possivel atualizar o status do usuario da plataforma.'
    )
  } finally {
    togglingUserId.value = ''
  }
}

function formatDateTime(value) {
  if (!value) return 'Nunca acessou'
  return new Date(value).toLocaleString('pt-BR')
}

onMounted(async () => {
  await loadPlatformRoles()
  await loadPlatformUsers()
})
</script>

<template>
  <section class="platform-users-section">
    <div class="section-header">
      <div>
        <h3>Usuarios da plataforma</h3>
        <p>
          Gerencie apenas as contas que acessam o backoffice e operam a plataforma SaaS,
          sem misturar este fluxo com usuarios internos das igrejas clientes.
        </p>
      </div>

      <button v-if="canWrite" class="secondary-button" type="button" @click="resetForm">
        Novo usuario
      </button>
    </div>

    <form class="filters-card" @submit.prevent="handleFilter">
      <div class="filters-grid">
        <div class="field">
          <label for="platform-user-search">Busca</label>
          <input
            id="platform-user-search"
            v-model="filters.search"
            type="text"
            placeholder="Nome ou e-mail"
          />
        </div>

        <div class="field">
          <label for="platform-user-status">Status</label>
          <select id="platform-user-status" v-model="filters.status">
            <option value="">Todos</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>
      </div>

      <div class="actions">
        <button class="primary-button" type="submit">Filtrar</button>
      </div>
    </form>

    <div v-if="errorMessage" class="feedback error">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="feedback success">
      {{ successMessage }}
    </div>

    <div v-if="loading" class="feedback">
      Carregando usuarios da plataforma...
    </div>

    <div v-else class="table-card">
      <div class="table-summary">
        <strong>{{ meta.total }}</strong> usuarios da plataforma encontrados
      </div>

      <div class="table-wrapper">
        <table class="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Status</th>
              <th>Perfil</th>
              <th>Permissoes</th>
              <th>Ultimo acesso</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="user in platformUsers" :key="user.id">
              <td>
                <div class="primary-text">{{ user.name }}</div>
                <div class="secondary-text">{{ user.email }}</div>
              </td>
              <td>
                <span class="status-pill" :data-status="user.isActive ? 'active' : 'inactive'">
                  {{ user.isActive ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td>{{ getPlatformRoleLabel(user.role.slug) }}</td>
              <td>
                <div class="permissions-list">
                  <span
                    v-for="permission in user.role.permissions"
                    :key="permission"
                    class="permission-chip"
                  >
                    {{ permission }}
                  </span>
                </div>
              </td>
              <td>{{ formatDateTime(user.lastLogin) }}</td>
              <td>
                <div class="row-actions">
                  <button
                    v-if="canWrite"
                    class="secondary-button"
                    type="button"
                    @click="startEdit(user)"
                  >
                    Editar
                  </button>

                  <button
                    v-if="canWrite"
                    class="secondary-button"
                    type="button"
                    :disabled="togglingUserId === user.id"
                    @click="handleToggleStatus(user)"
                  >
                    {{
                      togglingUserId === user.id
                        ? 'Salvando...'
                        : user.isActive
                          ? 'Inativar'
                          : 'Ativar'
                    }}
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="platformUsers.length === 0">
              <td colspan="6" class="empty-state">
                Nenhum usuario da plataforma foi encontrado com os filtros aplicados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button class="secondary-button" @click="goToPage(meta.page - 1)" :disabled="meta.page <= 1">
          Anterior
        </button>

        <span>Pagina {{ meta.page }} de {{ meta.totalPages }}</span>

        <button
          class="secondary-button"
          @click="goToPage(meta.page + 1)"
          :disabled="meta.page >= meta.totalPages"
        >
          Proxima
        </button>
      </div>
    </div>

    <section v-if="canWrite" class="form-card">
      <div class="section-header compact">
        <div>
          <h3>{{ isEditMode ? 'Editar usuario da plataforma' : 'Criar usuario da plataforma' }}</h3>
          <p>
            Use este formulario apenas para contas que acessam o backoffice da plataforma.
            O primeiro usuario tecnico do tenant nasce na aba de onboarding da igreja cliente.
          </p>
        </div>
      </div>

      <form class="form-grid" @submit.prevent="handleSubmit">
        <div class="field">
          <label for="platform-user-name">Nome</label>
          <input id="platform-user-name" v-model="form.name" type="text" placeholder="Nome completo" />
        </div>

        <div class="field">
          <label for="platform-user-email">E-mail</label>
          <input id="platform-user-email" v-model="form.email" type="email" placeholder="usuario@plataforma.com" />
        </div>

        <div v-if="!isEditMode" class="field">
          <label for="platform-user-password">Senha inicial</label>
          <input id="platform-user-password" v-model="form.password" type="password" placeholder="Digite a senha inicial" />
        </div>

        <div class="field">
          <label for="platform-user-role">Perfil da plataforma</label>
          <select id="platform-user-role" v-model="form.roleId">
            <option v-for="role in platformRoles" :key="role.id" :value="role.id">
              {{ getPlatformRoleLabel(role.slug) }}
            </option>
          </select>
        </div>

        <div class="form-actions">
          <button class="primary-button" type="submit" :disabled="saving">
            {{ saving ? 'Salvando...' : isEditMode ? 'Salvar alteracoes' : 'Criar usuario' }}
          </button>

          <button class="secondary-button" type="button" @click="resetForm">
            Cancelar
          </button>
        </div>
      </form>
    </section>
  </section>
</template>

<style scoped>
.platform-users-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.section-header.compact {
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0 0 0.3rem;
  color: #0f172a;
}

.section-header p {
  margin: 0;
  color: #64748b;
}

.filters-card,
.table-card,
.form-card,
.feedback {
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

.filters-grid,
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field label {
  color: #334155;
  font-size: 0.9rem;
  font-weight: 600;
}

.field input,
.field select {
  min-height: 46px;
  padding: 0.8rem 0.95rem;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
}

.actions,
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.75rem 1rem;
  font-size: 0.92rem;
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

.secondary-button:disabled,
.primary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.table-summary {
  margin-bottom: 1rem;
  color: #475569;
}

.table-wrapper {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  vertical-align: top;
}

.users-table th {
  color: #475569;
  font-size: 0.85rem;
}

.primary-text {
  font-weight: 700;
  color: #0f172a;
}

.secondary-text {
  margin-top: 0.25rem;
  color: #64748b;
  font-size: 0.88rem;
}

.permissions-list,
.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
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

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
}

.empty-state {
  text-align: center;
  color: #64748b;
}

@media (max-width: 920px) {
  .filters-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .section-header,
  .pagination,
  .form-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
