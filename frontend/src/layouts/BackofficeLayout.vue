<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBackofficeAuthStore } from '@/stores/backoffice-auth.store'
import { getPlatformRoleLabel, getPlatformUserDisplayName } from '@/utils/backoffice-labels'

const route = useRoute()
const backofficeAuthStore = useBackofficeAuthStore()

const pageTitle = computed(() => route.meta?.title || 'Backoffice')
const platformRoleLabel = computed(() => getPlatformRoleLabel(backofficeAuthStore.user))
const platformUserDisplayName = computed(() => getPlatformUserDisplayName(backofficeAuthStore.user))
const canAccessUsersPage = computed(() =>
  backofficeAuthStore.hasPermission('platform:platform-users:read') ||
  backofficeAuthStore.hasPermission('platform:platform-users:write') ||
  backofficeAuthStore.hasPermission('platform:tenant-initial-admin:write')
)

function handleLogout() {
  backofficeAuthStore.logout()
}
</script>

<template>
  <div class="backoffice-layout">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">CF</span>
        <div>
          <strong>ChurchFlow</strong>
          <p>Backoffice</p>
        </div>
      </div>

      <nav class="nav">
        <RouterLink :to="{ name: 'backoffice-home' }" class="nav-link">
          Visão Geral
        </RouterLink>
        <RouterLink
          v-if="backofficeAuthStore.hasPermission('platform:tenants:read')"
          :to="{ name: 'backoffice-tenants' }"
          class="nav-link"
        >
          Igrejas clientes
        </RouterLink>
        <RouterLink
          v-if="backofficeAuthStore.hasPermission('platform:audit:read')"
          :to="{ name: 'backoffice-audit' }"
          class="nav-link"
        >
          Auditoria
        </RouterLink>
        <RouterLink
          v-if="canAccessUsersPage"
          :to="{ name: 'backoffice-users' }"
          class="nav-link"
        >
          Usuarios
        </RouterLink>
      </nav>
    </aside>

    <div class="content-area">
      <header class="topbar">
        <div>
          <span class="section-label">Plataforma</span>
          <h1>{{ pageTitle }}</h1>
        </div>

        <div v-if="backofficeAuthStore.user" class="user-box">
          <div>
            <strong>{{ platformUserDisplayName }}</strong>
            <p>{{ platformRoleLabel }}</p>
          </div>

          <button class="logout-button" @click="handleLogout">Sair</button>
        </div>
      </header>

      <main class="page-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.backoffice-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  background:
    linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
}

.sidebar {
  padding: 1.5rem;
  background: linear-gradient(180deg, #0f172a 0%, #172554 100%);
  color: #dbeafe;
}

.brand {
  display: flex;
  gap: 0.85rem;
  align-items: center;
  margin-bottom: 2rem;
}

.brand-mark {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #14b8a6 0%, #22c55e 100%);
  color: #06202a;
  font-weight: 800;
}

.brand strong {
  display: block;
}

.brand p {
  margin: 0.15rem 0 0;
  color: #93c5fd;
  font-size: 0.875rem;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-link {
  color: #dbeafe;
  text-decoration: none;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  background-color: rgba(148, 163, 184, 0.08);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  background-color: rgba(20, 184, 166, 0.2);
  transform: translateX(2px);
}

.content-area {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #dbe3f3;
  background-color: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(10px);
}

.section-label {
  display: inline-block;
  color: #0f766e;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 0.3rem;
}

.topbar h1 {
  margin: 0;
  font-size: 1.6rem;
  color: #0f172a;
}

.user-box {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-box p {
  margin: 0.2rem 0 0;
  color: #64748b;
  font-size: 0.875rem;
}

.logout-button {
  border: none;
  border-radius: 999px;
  padding: 0.8rem 1rem;
  background-color: #0f172a;
  color: white;
  cursor: pointer;
}

.page-content {
  flex: 1;
  padding: 2rem;
}

@media (max-width: 920px) {
  .backoffice-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    padding-bottom: 1rem;
  }

  .topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-content {
    padding: 1.25rem;
  }
}
</style>
