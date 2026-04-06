<script setup>
import { onMounted, reactive, ref } from 'vue'
import { backofficeAuditService } from '@/services/backoffice-audit.service'
import {
  getAuditTargetTypeLabel,
  getAuditTenantLabel,
  getPlatformUserDisplayName,
} from '@/utils/backoffice-labels'

const loading = ref(true)
const errorMessage = ref('')
const logs = ref([])
const meta = ref({
  page: 1,
  perPage: 20,
  total: 0,
  totalPages: 1,
})

const filters = reactive({
  action: '',
  targetType: '',
  churchId: '',
  page: 1,
  perPage: 20,
})

async function loadAuditLogs() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await backofficeAuditService.list({
      action: filters.action || undefined,
      targetType: filters.targetType || undefined,
      churchId: filters.churchId || undefined,
      page: filters.page,
      perPage: filters.perPage,
    })

    logs.value = response.data
    meta.value = response.meta || meta.value
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel carregar os registros de auditoria.'
  } finally {
    loading.value = false
  }
}

function handleFilter() {
  filters.page = 1
  loadAuditLogs()
}

function goToPage(page) {
  if (page < 1 || page > meta.value.totalPages) return
  filters.page = page
  loadAuditLogs()
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('pt-BR')
}

function formatMetadata(metadata) {
  const entries = Object.entries(metadata || {})
  if (entries.length === 0) {
    return 'Sem metadados adicionais'
  }

  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(' | ')
}

onMounted(() => {
  loadAuditLogs()
})
</script>

<template>
  <section class="audit-page">
    <div class="page-header">
      <div>
        <span class="eyebrow">Auditoria</span>
        <h2>Registros de auditoria</h2>
        <p>Acompanhe as ações críticas realizadas no backoffice da plataforma.</p>
      </div>
    </div>

    <form class="filters-card" @submit.prevent="handleFilter">
      <div class="filters-grid">
        <div class="field">
          <label for="audit-action">Ação</label>
          <input
            id="audit-action"
            v-model="filters.action"
            type="text"
            placeholder="Ex.: platform.auth.login"
          />
        </div>

        <div class="field">
          <label for="audit-target">Tipo do alvo</label>
          <input
            id="audit-target"
            v-model="filters.targetType"
            type="text"
            placeholder="Ex.: tenant_user"
          />
        </div>

        <div class="field">
          <label for="audit-tenant">Igreja cliente</label>
          <input
            id="audit-tenant"
            v-model="filters.churchId"
            type="text"
            placeholder="UUID da igreja cliente"
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

    <div v-if="loading" class="feedback">
      Carregando registros de auditoria...
    </div>

    <div v-else class="table-card">
      <div class="table-summary">
        <strong>{{ meta.total }}</strong> eventos encontrados
      </div>

      <div class="table-wrapper">
        <table class="audit-table">
          <thead>
            <tr>
              <th>Quando</th>
              <th>Ação</th>
              <th>Ator</th>
              <th>Alvo</th>
              <th>Igreja cliente</th>
              <th>Metadados</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>{{ formatDateTime(log.createdAt) }}</td>
              <td>
                <div class="primary-text">{{ log.action }}</div>
                <div class="secondary-text">{{ getAuditTargetTypeLabel(log.targetType) }}</div>
              </td>
              <td>
                <div class="primary-text">{{ log.actor ? getPlatformUserDisplayName(log.actor) : 'Sistema' }}</div>
                <div class="secondary-text">{{ log.actor?.email || 'Sem ator' }}</div>
              </td>
              <td>
                <div class="primary-text">{{ log.targetLabel || log.targetId || 'Sem alvo' }}</div>
                <div class="secondary-text">{{ log.targetId || '-' }}</div>
              </td>
              <td>
                <div class="primary-text">{{ getAuditTenantLabel(log.tenant) }}</div>
                <div class="secondary-text">{{ log.tenant?.id || '-' }}</div>
              </td>
              <td>
                <div class="metadata-text">{{ formatMetadata(log.metadata) }}</div>
              </td>
            </tr>

            <tr v-if="logs.length === 0">
              <td colspan="6" class="empty-state">
                Nenhum registro foi encontrado com os filtros aplicados.
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
.audit-page {
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

.field input {
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
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-size: 0.92rem;
  font-weight: 700;
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

.table-summary {
  margin-bottom: 1rem;
  color: #475569;
}

.table-wrapper {
  overflow-x: auto;
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
}

.audit-table th,
.audit-table td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  vertical-align: top;
}

.audit-table th {
  color: #475569;
  font-size: 0.85rem;
}

.primary-text {
  font-weight: 700;
  color: #0f172a;
}

.secondary-text,
.metadata-text {
  margin-top: 0.25rem;
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.5;
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
