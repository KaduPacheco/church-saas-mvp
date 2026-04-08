<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useBackofficeAuthStore } from '@/stores/backoffice-auth.store'
import PlatformUsersSection from '@/components/backoffice/users/PlatformUsersSection.vue'
import TenantOnboardingSection from '@/components/backoffice/users/TenantOnboardingSection.vue'

const route = useRoute()
const router = useRouter()
const backofficeAuthStore = useBackofficeAuthStore()

const canManagePlatformUsers = computed(() =>
  backofficeAuthStore.hasPermission('platform:platform-users:read') ||
  backofficeAuthStore.hasPermission('platform:platform-users:write')
)

const canRunTenantOnboarding = computed(() =>
  backofficeAuthStore.hasPermission('platform:tenant-initial-admin:write')
)

function normalizeTab(value) {
  if (value === 'tenant-onboarding' && canRunTenantOnboarding.value) {
    return 'tenant-onboarding'
  }

  if (value === 'platform' && canManagePlatformUsers.value) {
    return 'platform'
  }

  if (canRunTenantOnboarding.value) {
    return 'tenant-onboarding'
  }

  return 'platform'
}

const activeTab = ref(normalizeTab(route.query.tab))

function setActiveTab(tab) {
  activeTab.value = normalizeTab(tab)
  router.replace({
    query: {
      ...route.query,
      tab: activeTab.value,
    },
  })
}

watch(
  () => route.query.tab,
  (tab) => {
    activeTab.value = normalizeTab(tab)
  }
)
</script>

<template>
  <section class="users-page">
    <div class="page-header">
      <div>
        <span class="eyebrow">Usuarios</span>
        <h2>Usuarios da plataforma e onboarding de tenant</h2>
        <p>
          Gerencie usuarios da plataforma e execute o onboarding controlado de novas igrejas
          clientes, sem transformar o backoffice em um CRUD comum de usuarios do tenant.
        </p>
      </div>
    </div>

    <section class="info-card">
      <h3>Separacao de responsabilidades</h3>
      <ul>
        <li>Usuarios da plataforma acessam o backoffice e operam o SaaS.</li>
        <li>Novas igrejas clientes nascem por onboarding: igreja sede primeiro, admin inicial junto.</li>
        <li>Usuarios da igreja acessam apenas o painel do tenant.</li>
        <li>Membros e cargos ministeriais nao definem acesso tecnico automaticamente.</li>
        <li>
          A gestao rotineira dos demais usuarios internos continua no painel da propria igreja.
        </li>
      </ul>
      <RouterLink class="detail-link" :to="{ name: 'backoffice-tenants' }">
        Abrir igrejas clientes
      </RouterLink>
    </section>

    <div class="tabs-card">
      <div class="tabs">
        <button
          v-if="canManagePlatformUsers"
          class="tab-button"
          :class="{ active: activeTab === 'platform' }"
          type="button"
          @click="setActiveTab('platform')"
        >
          Usuarios da plataforma
        </button>

        <button
          v-if="canRunTenantOnboarding"
          class="tab-button"
          :class="{ active: activeTab === 'tenant-onboarding' }"
          type="button"
          @click="setActiveTab('tenant-onboarding')"
        >
          Nova igreja cliente
        </button>
      </div>

      <div class="tab-content">
        <PlatformUsersSection v-if="activeTab === 'platform' && canManagePlatformUsers" />
        <TenantOnboardingSection
          v-else-if="activeTab === 'tenant-onboarding' && canRunTenantOnboarding"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.users-page {
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

.info-card,
.tabs-card {
  padding: 1.25rem;
  border-radius: 22px;
  background-color: rgba(255, 255, 255, 0.92);
  border: 1px solid #dbe3f3;
}

.info-card h3 {
  margin: 0 0 0.5rem;
  color: #0f172a;
}

.info-card ul {
  margin: 0 0 1rem;
  padding-left: 1.1rem;
  color: #475569;
  line-height: 1.7;
}

.detail-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  color: #0f766e;
  border: 1px solid #99f6e4;
  background-color: #f0fdfa;
  text-decoration: none;
  font-weight: 700;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.tab-button {
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  padding: 0.75rem 1rem;
  background-color: white;
  color: #0f172a;
  font-weight: 700;
  cursor: pointer;
}

.tab-button.active {
  border-color: #0f172a;
  background-color: #0f172a;
  color: white;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
