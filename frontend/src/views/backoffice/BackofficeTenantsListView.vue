<script setup>
import { onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { backofficeTenantsService } from '@/services/backoffice-tenants.service'
import { getStatusLabel } from '@/utils/backoffice-labels'

const loading = ref(true)
const errorMessage = ref('')
const tenants = ref([])
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

async function loadTenants() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await backofficeTenantsService.list({
      search: filters.search || undefined,
      status: filters.status || undefined,
      page: filters.page,
      perPage: filters.perPage,
    })

    tenants.value = response.data
    meta.value = response.meta || meta.value
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel carregar a lista de igrejas clientes.'
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  filters.page = 1
  loadTenants()
}

function goToPage(page) {
  if (page < 1 || page > meta.value.totalPages) return
  filters.page = page
  loadTenants()
}

onMounted(() => {
  loadTenants()
})
</script>

<template>
  <section class="tenants-page">
    <div class="page-header">
      <div>
        <span class="eyebrow">Gestão de Igrejas Clientes</span>
        <h2>Igrejas clientes</h2>
        <p>Consulte as igrejas sede cadastradas e acompanhe seus dados principais.</p>
      </div>
    </div>

    <form class="filters-card" @submit.prevent="handleSearch">
      <div class="filters-grid">
        <div class="field">
          <label for="tenant-search">Busca</label>
          <input
            id="tenant-search"
            v-model="filters.search"
            type="text"
            placeholder="Nome, e-mail ou documento"
          />
        </div>

        <div class="field">
          <label for="tenant-status">Status</label>
          <select id="tenant-status" v-model="filters.status">
            <option value="">Todos</option>
            <option value="active">{{ getStatusLabel('active') }}</option>
            <option value="inactive">{{ getStatusLabel('inactive') }}</option>
            <option value="suspended">{{ getStatusLabel('suspended') }}</option>
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

    <div v-if="loading" class="feedback">
      Carregando igrejas clientes...
    </div>

    <div v-else class="table-card">
      <div class="table-summary">
        <strong>{{ meta.total }}</strong> igrejas clientes encontradas
      </div>

      <div class="table-wrapper">
        <table class="tenants-table">
          <thead>
            <tr>
              <th>Igreja sede</th>
              <th>Status</th>
              <th>Congregações</th>
              <th>Usuários</th>
              <th>Membros</th>
              <th>Criada em</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="tenant in tenants" :key="tenant.id">
              <td>
                <div class="tenant-name">{{ tenant.name }}</div>
                <div class="tenant-meta">{{ tenant.email || 'Sem e-mail' }}</div>
              </td>
              <td>
                <span class="status-pill" :data-status="tenant.status">
                  {{ getStatusLabel(tenant.status) }}
                </span>
              </td>
              <td>{{ tenant.counts.congregations }}</td>
              <td>{{ tenant.counts.users }}</td>
              <td>{{ tenant.counts.members }}</td>
              <td>{{ new Date(tenant.createdAt).toLocaleDateString('pt-BR') }}</td>
              <td>
                <RouterLink
                  class="detail-link"
                  :to="{ name: 'backoffice-tenant-detail', params: { id: tenant.id } }"
                >
                  Ver detalhe
                </RouterLink>
              </td>
            </tr>

            <tr v-if="tenants.length === 0">
              <td colspan="7" class="empty-state">
                Nenhuma igreja cliente foi encontrada com os filtros aplicados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button class="secondary-button" @click="goToPage(meta.page - 1)" :disabled="meta.page <= 1">
          Anterior
        </button>

        <span>Página {{ meta.page }} de {{ meta.totalPages }}</span>

        <button
          class="secondary-button"
          @click="goToPage(meta.page + 1)"
          :disabled="meta.page >= meta.totalPages"
        >
          Próxima
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tenants-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 0.55rem;
  color: #0f766e;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
}

.page-header h2 {
  margin: 0 0 0.35rem;
  color: #0f172a;
  font-size: 1.8rem;
}

.page-header p {
  margin: 0;
  color: #64748b;
}

.filters-card,
.table-card,
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

.filters-grid {
  display: grid;
  grid-template-columns: 1.6fr 0.8fr;
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

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.primary-button,
.secondary-button,
.detail-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-size: 0.92rem;
  font-weight: 700;
  text-decoration: none;
}

.primary-button {
  border: none;
  background-color: #0f172a;
  color: white;
  cursor: pointer;
}

.secondary-button {
  border: 1px solid #cbd5e1;
  background-color: white;
  color: #0f172a;
  cursor: pointer;
}

.secondary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.detail-link {
  color: #0f766e;
  border: 1px solid #99f6e4;
  background-color: #f0fdfa;
}

.table-summary {
  margin-bottom: 1rem;
  color: #475569;
}

.table-wrapper {
  overflow-x: auto;
}

.tenants-table {
  width: 100%;
  border-collapse: collapse;
}

.tenants-table th,
.tenants-table td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  vertical-align: middle;
}

.tenants-table th {
  color: #475569;
  font-size: 0.85rem;
}

.tenant-name {
  font-weight: 700;
  color: #0f172a;
}

.tenant-meta {
  margin-top: 0.25rem;
  color: #64748b;
  font-size: 0.88rem;
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

.empty-state {
  text-align: center;
  color: #64748b;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
}

@media (max-width: 920px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }

  .pagination {
    flex-direction: column;
  }
}
</style>
