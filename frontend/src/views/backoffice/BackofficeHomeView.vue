<script setup>
import { onMounted, ref } from 'vue'
import { useBackofficeAuthStore } from '@/stores/backoffice-auth.store'
import { backofficeDashboardService } from '@/services/backoffice-dashboard.service'
import {
  getPlatformRoleLabel,
  getPlatformUserDisplayName,
  getStatusLabel,
} from '@/utils/backoffice-labels'

const backofficeAuthStore = useBackofficeAuthStore()
const loading = ref(true)
const errorMessage = ref('')
const summary = ref({
  totals: {
    churches: 0,
    congregations: 0,
    users: 0,
    members: 0,
  },
  tenantsByStatus: {
    active: 0,
    inactive: 0,
    suspended: 0,
  }
})

async function loadSummary() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await backofficeDashboardService.getSummary()
    summary.value = response.data
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel carregar os indicadores da plataforma.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSummary()
})
</script>

<template>
  <section class="backoffice-home">
    <div class="hero-card">
      <div>
        <span class="eyebrow">Camada de Plataforma</span>
        <h2>Backoffice operacional</h2>
        <p>
          Painel administrativo da plataforma com sessão própria, controles dedicados
          e visão consolidada das igrejas clientes.
        </p>
      </div>

      <div class="identity-box" v-if="backofficeAuthStore.user">
        <strong>{{ getPlatformUserDisplayName(backofficeAuthStore.user) }}</strong>
        <span>{{ getPlatformRoleLabel(backofficeAuthStore.user) }}</span>
      </div>
    </div>

    <div v-if="errorMessage" class="error-card">
      {{ errorMessage }}
    </div>

    <div v-if="loading" class="loading-card">
      Carregando indicadores da plataforma...
    </div>

    <div v-else class="stats-grid">
      <article class="stat-card">
        <span class="stat-label">Igrejas clientes</span>
        <strong class="stat-value">{{ summary.totals.churches }}</strong>
      </article>

      <article class="stat-card">
        <span class="stat-label">Congregações</span>
        <strong class="stat-value">{{ summary.totals.congregations }}</strong>
      </article>

      <article class="stat-card">
        <span class="stat-label">Usuários</span>
        <strong class="stat-value">{{ summary.totals.users }}</strong>
      </article>

      <article class="stat-card">
        <span class="stat-label">Membros</span>
        <strong class="stat-value">{{ summary.totals.members }}</strong>
      </article>
    </div>

    <div v-if="!loading" class="status-grid">
      <article class="status-card status-active">
        <span>Status</span>
        <strong>{{ getStatusLabel('active') }}</strong>
        <p>{{ summary.tenantsByStatus.active }} clientes</p>
      </article>

      <article class="status-card status-inactive">
        <span>Status</span>
        <strong>{{ getStatusLabel('inactive') }}</strong>
        <p>{{ summary.tenantsByStatus.inactive }} clientes</p>
      </article>

      <article class="status-card status-suspended">
        <span>Status</span>
        <strong>{{ getStatusLabel('suspended') }}</strong>
        <p>{{ summary.tenantsByStatus.suspended }} clientes</p>
      </article>
    </div>

    <div class="grid">
      <article class="info-card">
        <h3>Sessão isolada</h3>
        <p>A sessão do backoffice usa chaves próprias no navegador e não interfere no acesso das igrejas.</p>
      </article>

      <article class="info-card">
        <h3>Controle de acesso</h3>
        <p>As rotas do backoffice exigem autenticação de plataforma e validam permissões específicas.</p>
      </article>

      <article class="info-card">
        <h3>Escopo atual</h3>
        <p>O MVP já cobre visão geral, igrejas clientes, congregações, usuários administrativos e auditoria.</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.backoffice-home {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.loading-card,
.error-card {
  padding: 1rem 1.2rem;
  border-radius: 18px;
  border: 1px solid #dbe3f3;
  background-color: rgba(255, 255, 255, 0.9);
  color: #334155;
}

.error-card {
  border-color: #fecaca;
  background-color: #fff1f2;
  color: #b91c1c;
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.75rem;
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(34, 197, 94, 0.18), transparent 24%),
    linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
  border: 1px solid #d9e4f5;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 0.8rem;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.hero-card h2 {
  margin: 0 0 0.5rem;
  font-size: 1.8rem;
  color: #0f172a;
}

.hero-card p {
  margin: 0;
  max-width: 640px;
  color: #475569;
  line-height: 1.65;
}

.identity-box {
  min-width: 220px;
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background-color: #0f172a;
  color: #f8fafc;
}

.identity-box span {
  color: #93c5fd;
  font-size: 0.9rem;
}

.stats-grid,
.status-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.status-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stat-card,
.status-card {
  padding: 1.25rem;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.92);
  border: 1px solid #dbe3f3;
}

.stat-label,
.status-card span {
  display: block;
  margin-bottom: 0.5rem;
  color: #64748b;
  font-size: 0.88rem;
}

.stat-value {
  color: #0f172a;
  font-size: 2rem;
  line-height: 1;
}

.status-card strong {
  display: block;
  margin-bottom: 0.45rem;
  font-size: 1.25rem;
  color: #0f172a;
}

.status-card p {
  margin: 0;
  color: #475569;
}

.status-active {
  background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%);
}

.status-inactive {
  background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%);
}

.status-suspended {
  background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.info-card {
  padding: 1.25rem;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.88);
  border: 1px solid #dbe3f3;
}

.info-card h3 {
  margin: 0 0 0.5rem;
  color: #0f172a;
}

.info-card p {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
}

@media (max-width: 920px) {
  .hero-card {
    flex-direction: column;
  }

  .stats-grid,
  .status-grid,
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
