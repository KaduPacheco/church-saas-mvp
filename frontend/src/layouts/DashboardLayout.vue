<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { tenantNavigationItems } from '@/utils/tenant-navigation'

const authStore = useAuthStore()
const route = useRoute()

const availableNavigation = computed(() =>
  tenantNavigationItems.filter((item) => authStore.hasPermission(item.permission))
)

const scopeLabel = computed(() =>
  authStore.user?.congregationId ? 'Congregacao vinculada' : 'Sede / tenant completo'
)

const roleLabel = computed(() =>
  authStore.isSuperAdmin ? 'Administrador Geral' : authStore.user?.profileName || 'Perfil tecnico'
)

function handleLogout() {
  authStore.logout()
}
</script>

<template>
  <div class="dashboard-shell">
    <aside class="sidebar">
      <div class="brand-block">
        <span class="eyebrow">Painel do tenant</span>
        <h1>{{ authStore.user?.churchName || 'Igreja sede' }}</h1>
        <p>
          Ambiente operacional da igreja cliente. O backoffice continua separado e nao aparece
          aqui.
        </p>
      </div>

      <div class="identity-card" v-if="authStore.user">
        <strong>{{ authStore.user.name }}</strong>
        <span>{{ roleLabel }}</span>
        <span>{{ scopeLabel }}</span>
      </div>

      <nav class="nav-list" aria-label="Modulos do tenant">
        <RouterLink
          v-for="item in availableNavigation"
          :key="item.name"
          class="nav-link"
          :class="{ active: route.name === item.name }"
          :data-accent="item.accent"
          :to="{ name: item.name }"
        >
          <strong>{{ item.label }}</strong>
          <small>{{ item.description }}</small>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <button class="logout-button" type="button" @click="handleLogout">
          Sair do painel
        </button>
      </div>
    </aside>

    <div class="content-area">
      <header class="topbar">
        <div>
          <span class="topbar-eyebrow">{{ authStore.user?.churchName || 'Tenant' }}</span>
          <h2>{{ route.meta.title || 'Painel da igreja sede' }}</h2>
        </div>

        <div class="status-group">
          <span class="status-pill" data-kind="scope">{{ scopeLabel }}</span>
          <span class="status-pill" data-kind="profile">{{ roleLabel }}</span>
        </div>
      </header>

      <main class="main-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.dashboard-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(280px, 320px) 1fr;
  background:
    radial-gradient(circle at top left, rgba(14, 116, 144, 0.14), transparent 28%),
    linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%);
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.97) 0%, rgba(17, 24, 39, 0.94) 100%);
  color: #e2e8f0;
}

.eyebrow,
.topbar-eyebrow {
  display: inline-block;
  margin-bottom: 0.55rem;
  color: #67e8f9;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.brand-block h1,
.topbar h2 {
  margin: 0 0 0.4rem;
}

.brand-block p {
  margin: 0;
  color: #94a3b8;
  line-height: 1.6;
}

.identity-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem;
  border-radius: 20px;
  background: rgba(15, 118, 110, 0.16);
  border: 1px solid rgba(103, 232, 249, 0.18);
}

.identity-card strong {
  color: #f8fafc;
}

.identity-card span {
  color: #bae6fd;
  font-size: 0.92rem;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.nav-link {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  color: #e2e8f0;
  text-decoration: none;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(30, 41, 59, 0.55);
  transition: transform 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
}

.nav-link:hover {
  transform: translateX(2px);
  border-color: rgba(103, 232, 249, 0.35);
}

.nav-link.active {
  border-color: rgba(103, 232, 249, 0.52);
  background: rgba(8, 145, 178, 0.18);
}

.nav-link small {
  color: #94a3b8;
  line-height: 1.5;
}

.sidebar-footer {
  margin-top: auto;
}

.logout-button {
  width: 100%;
  min-height: 46px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 999px;
  background: transparent;
  color: #e2e8f0;
  font-weight: 700;
  cursor: pointer;
}

.content-area {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem 1.75rem 0.75rem;
}

.topbar h2 {
  color: #0f172a;
  font-size: 1.8rem;
}

.status-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.6rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.65rem 0.95rem;
  font-size: 0.82rem;
  font-weight: 700;
}

.status-pill[data-kind='scope'] {
  background: #e0f2fe;
  color: #075985;
}

.status-pill[data-kind='profile'] {
  background: #ecfccb;
  color: #3f6212;
}

.main-content {
  flex: 1;
  padding: 0 1.75rem 1.75rem;
}

@media (max-width: 980px) {
  .dashboard-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    padding-bottom: 1rem;
  }

  .topbar {
    flex-direction: column;
  }

  .status-group {
    justify-content: flex-start;
  }
}
</style>
