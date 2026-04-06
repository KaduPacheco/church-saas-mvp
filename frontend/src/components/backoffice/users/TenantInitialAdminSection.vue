<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  backofficeUsersService,
  getBackofficeUsersErrorMessage,
} from '@/services/backoffice-users.service'
import { getStatusLabel } from '@/utils/backoffice-labels'

const loadingTenants = ref(true)
const loadingProfiles = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const eligibleTenants = ref([])
const profiles = ref([])

const filters = reactive({
  search: '',
})

const form = reactive({
  tenantId: '',
  permissionProfileId: '',
  name: '',
  email: '',
  password: '',
})

const selectedTenant = computed(() =>
  eligibleTenants.value.find((tenant) => tenant.id === form.tenantId) || null
)

const selectedProfile = computed(() =>
  profiles.value.find((profile) => profile.id === form.permissionProfileId) || null
)

async function loadEligibleTenants() {
  loadingTenants.value = true
  errorMessage.value = ''

  try {
    const response = await backofficeUsersService.listEligibleTenants({
      search: filters.search || undefined,
    })

    eligibleTenants.value = response.data

    if (!eligibleTenants.value.find((tenant) => tenant.id === form.tenantId)) {
      form.tenantId = eligibleTenants.value[0]?.id || ''
    }
  } catch (error) {
    errorMessage.value = getBackofficeUsersErrorMessage(
      error,
      'Nao foi possivel carregar as igrejas elegiveis.'
    )
  } finally {
    loadingTenants.value = false
  }
}

async function loadProfiles(tenantId) {
  if (!tenantId) {
    profiles.value = []
    form.permissionProfileId = ''
    return
  }

  loadingProfiles.value = true
  errorMessage.value = ''

  try {
    const response = await backofficeUsersService.listTenantInitialAdminProfiles(tenantId)
    profiles.value = response.data

    const adminProfile = profiles.value.find((profile) => profile.name === 'Administrador Geral')
    form.permissionProfileId = adminProfile?.id || profiles.value[0]?.id || ''
  } catch (error) {
    profiles.value = []
    form.permissionProfileId = ''
    errorMessage.value = getBackofficeUsersErrorMessage(
      error,
      'Nao foi possivel carregar os perfis tecnicos da igreja cliente.'
    )
  } finally {
    loadingProfiles.value = false
  }
}

async function handleFilterTenants() {
  await loadEligibleTenants()
}

async function handleSubmit() {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await backofficeUsersService.provisionTenantInitialAdmin({
      tenantId: form.tenantId,
      permissionProfileId: form.permissionProfileId,
      name: form.name,
      email: form.email,
      password: form.password,
    })

    successMessage.value = `Admin inicial provisionado com sucesso para ${response.data.tenant.name}.`
    form.name = ''
    form.email = ''
    form.password = ''

    await loadEligibleTenants()
    await loadProfiles(form.tenantId)
  } catch (error) {
    errorMessage.value = getBackofficeUsersErrorMessage(
      error,
      'Nao foi possivel provisionar o admin inicial da igreja cliente.'
    )
  } finally {
    saving.value = false
  }
}

watch(
  () => form.tenantId,
  async (tenantId) => {
    await loadProfiles(tenantId)
  }
)

onMounted(async () => {
  await loadEligibleTenants()
  await loadProfiles(form.tenantId)
})
</script>

<template>
  <section class="tenant-initial-admin-section">
    <div class="section-header">
      <div>
        <h3>Provisionar admin inicial do tenant</h3>
        <p>
          Este fluxo existe apenas para a primeira conta administrativa da igreja cliente.
          A criacao dos demais usuarios internos acontece no painel da propria igreja.
        </p>
      </div>
    </div>

    <section class="info-card">
      <h4>Uso recomendado</h4>
      <ul>
        <li>Use este formulario apenas quando a igreja cliente ainda nao possuir usuarios.</li>
        <li>O admin inicial nasce vinculado a igreja sede.</li>
        <li>Cargo ministerial e vinculo com membro nao fazem parte deste fluxo.</li>
      </ul>
    </section>

    <form class="filters-card" @submit.prevent="handleFilterTenants">
      <div class="filters-grid">
        <div class="field">
          <label for="eligible-tenant-search">Buscar igreja cliente</label>
          <input
            id="eligible-tenant-search"
            v-model="filters.search"
            type="text"
            placeholder="Nome, e-mail ou documento"
          />
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

    <div v-if="loadingTenants" class="feedback">
      Carregando igrejas elegiveis...
    </div>

    <template v-else>
      <div v-if="eligibleTenants.length === 0" class="feedback">
        Nenhuma igreja cliente elegivel foi encontrada. No estado atual, este fluxo so se aplica a
        igrejas sem usuarios provisionados.
      </div>

      <div v-else class="content-grid">
        <section class="tenant-list-card">
          <h4>Igrejas elegiveis</h4>
          <div class="tenant-list">
            <button
              v-for="tenant in eligibleTenants"
              :key="tenant.id"
              class="tenant-button"
              :class="{ active: form.tenantId === tenant.id }"
              type="button"
              @click="form.tenantId = tenant.id"
            >
              <strong>{{ tenant.name }}</strong>
              <span>{{ tenant.email || 'Sem e-mail cadastrado' }}</span>
              <small>Status: {{ getStatusLabel(tenant.status) }}</small>
            </button>
          </div>
        </section>

        <section class="form-card">
          <h4>Dados do admin inicial</h4>

          <div v-if="selectedTenant" class="tenant-summary">
            <strong>{{ selectedTenant.name }}</strong>
            <span>{{ selectedTenant.email || 'Sem e-mail cadastrado' }}</span>
          </div>

          <form class="form-grid" @submit.prevent="handleSubmit">
            <div class="field">
              <label for="initial-admin-tenant">Igreja cliente</label>
              <select id="initial-admin-tenant" v-model="form.tenantId">
                <option v-for="tenant in eligibleTenants" :key="tenant.id" :value="tenant.id">
                  {{ tenant.name }}
                </option>
              </select>
            </div>

            <div class="field">
              <label for="initial-admin-profile">Perfil tecnico inicial</label>
              <select
                id="initial-admin-profile"
                v-model="form.permissionProfileId"
                :disabled="loadingProfiles || profiles.length === 0"
              >
                <option v-for="profile in profiles" :key="profile.id" :value="profile.id">
                  {{ profile.name }}
                </option>
              </select>
              <small v-if="selectedProfile">
                Perfil selecionado: {{ selectedProfile.name }}
              </small>
            </div>

            <div class="field">
              <label for="initial-admin-name">Nome do administrador</label>
              <input
                id="initial-admin-name"
                v-model="form.name"
                type="text"
                placeholder="Nome completo"
              />
            </div>

            <div class="field">
              <label for="initial-admin-email">E-mail de acesso</label>
              <input
                id="initial-admin-email"
                v-model="form.email"
                type="email"
                placeholder="admin@igreja.com"
              />
            </div>

            <div class="field">
              <label for="initial-admin-password">Senha inicial</label>
              <input
                id="initial-admin-password"
                v-model="form.password"
                type="password"
                placeholder="Digite a senha inicial"
              />
            </div>

            <div class="field readonly-field">
              <label>Escopo criado</label>
              <div class="readonly-value">Igreja sede / acesso inicial da igreja</div>
            </div>

            <div class="field readonly-field">
              <label>Conceito desta conta</label>
              <div class="readonly-value">Primeiro administrador da igreja cliente</div>
            </div>

            <div class="form-actions">
              <button class="primary-button" type="submit" :disabled="saving || !form.tenantId">
                {{ saving ? 'Provisionando...' : 'Provisionar admin inicial' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </template>
  </section>
</template>

<style scoped>
.tenant-initial-admin-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header h3,
.info-card h4,
.tenant-list-card h4,
.form-card h4 {
  margin: 0 0 0.35rem;
  color: #0f172a;
}

.section-header p {
  margin: 0;
  color: #64748b;
}

.info-card,
.filters-card,
.tenant-list-card,
.form-card,
.feedback {
  padding: 1.25rem;
  border-radius: 22px;
  background-color: rgba(255, 255, 255, 0.92);
  border: 1px solid #dbe3f3;
}

.info-card ul {
  margin: 0;
  padding-left: 1.1rem;
  color: #475569;
  line-height: 1.7;
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
.form-grid,
.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.content-grid {
  align-items: start;
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

.field small {
  color: #64748b;
}

.readonly-field {
  grid-column: span 2;
}

.readonly-value {
  min-height: 46px;
  display: flex;
  align-items: center;
  padding: 0.8rem 0.95rem;
  border: 1px solid #dbe3f3;
  border-radius: 14px;
  background-color: #f8fafc;
  color: #334155;
}

.actions,
.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 999px;
  padding: 0.75rem 1rem;
  background-color: #0f172a;
  color: white;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
}

.primary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.tenant-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tenant-button {
  width: 100%;
  text-align: left;
  padding: 1rem;
  border: 1px solid #dbe3f3;
  border-radius: 18px;
  background-color: #f8fafc;
  cursor: pointer;
}

.tenant-button.active {
  border-color: #0f172a;
  background-color: #eff6ff;
}

.tenant-button strong,
.tenant-summary strong {
  display: block;
  color: #0f172a;
}

.tenant-button span,
.tenant-button small,
.tenant-summary span {
  display: block;
  margin-top: 0.2rem;
  color: #64748b;
}

.tenant-summary {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 18px;
  background-color: #f8fafc;
  border: 1px solid #dbe3f3;
}

@media (max-width: 920px) {
  .filters-grid,
  .form-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .readonly-field {
    grid-column: span 1;
  }
}
</style>
