<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { tenantNavigationItems } from '@/utils/tenant-navigation'

const authStore = useAuthStore()

const availableModules = computed(() =>
  tenantNavigationItems.filter((item) => authStore.hasPermission(item.permission))
)

const summaryCards = computed(() => [
  {
    label: 'Igreja sede',
    value: authStore.user?.churchName || 'Nao identificada',
    tone: 'church',
  },
  {
    label: 'Escopo atual',
    value: authStore.user?.congregationId ? 'Congregacao vinculada' : 'Sede / tenant completo',
    tone: 'scope',
  },
  {
    label: 'Perfil tecnico',
    value: authStore.user?.profileName || 'Nao informado',
    tone: 'profile',
  },
  {
    label: 'Permissoes disponiveis',
    value: String(authStore.userPermissions.length),
    tone: 'permissions',
  },
])

const priorityActions = computed(() => [
  'Revisar os dados da igreja sede e confirmar o escopo inicial do tenant.',
  'Validar os perfis tecnicos e cargos ministeriais padrao criados no onboarding.',
  'Planejar a abertura dos modulos internos antes de distribuir acessos para outras pessoas.',
])
</script>

<template>
  <section class="dashboard-home">
    <div class="hero-card">
      <div>
        <span class="eyebrow">Admin inicial da sede</span>
        <h1>Painel operacional da igreja cliente</h1>
        <p>
          Este ambiente pertence ao tenant. Ele nao administra a plataforma e nao substitui o
          backoffice. Aqui o admin inicial da sede passa a organizar a operacao da propria igreja.
        </p>
      </div>

      <div class="hero-badges">
        <span class="hero-pill">Tenant separado do backoffice</span>
        <span class="hero-pill">Perfil tecnico governa acesso</span>
        <span class="hero-pill">Escopo inicial: sede</span>
      </div>
    </div>

    <section class="cards-grid">
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

    <section class="content-grid">
      <article class="panel-card">
        <h2>Primeiros passos do admin inicial</h2>
        <ul>
          <li v-for="step in priorityActions" :key="step">
            {{ step }}
          </li>
        </ul>
      </article>

      <article class="panel-card">
        <h2>Separacao de dominios</h2>
        <ul>
          <li>Usuario da plataforma opera o SaaS no backoffice.</li>
          <li>Usuario do tenant opera a igreja cliente neste painel.</li>
          <li>Membro continua separado de usuario tecnico.</li>
          <li>Cargo ministerial continua separado de perfil tecnico.</li>
        </ul>
      </article>
    </section>

    <section class="modules-card">
      <div class="section-header">
        <div>
          <h2>Modulos disponiveis para este acesso</h2>
          <p>
            A navegacao abaixo respeita `hasPermission()` e `isSuperAdmin`, preparando o painel
            para evolucao incremental por modulo.
          </p>
        </div>
      </div>

      <div class="modules-grid">
        <RouterLink
          v-for="module in availableModules"
          :key="module.name"
          class="module-link"
          :data-accent="module.accent"
          :to="{ name: module.name }"
        >
          <strong>{{ module.label }}</strong>
          <p>{{ module.description }}</p>
          <span>Abrir modulo</span>
        </RouterLink>
      </div>
    </section>
  </section>
</template>

<style scoped>
.dashboard-home {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hero-card,
.panel-card,
.modules-card,
.summary-card {
  border-radius: 24px;
  border: 1px solid #dbe3f3;
  background: rgba(255, 255, 255, 0.92);
}

.hero-card,
.modules-card,
.panel-card {
  padding: 1.4rem;
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
.modules-card h2 {
  margin: 0 0 0.45rem;
  color: #0f172a;
}

.hero-card p,
.modules-card p,
.panel-card li {
  color: #475569;
  line-height: 1.6;
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

.cards-grid,
.content-grid,
.modules-grid {
  display: grid;
  gap: 1rem;
}

.cards-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.content-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1.1rem;
}

.summary-card span {
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
}

.summary-card strong {
  color: #0f172a;
  font-size: 1.05rem;
}

.summary-card[data-tone='church'] {
  background: linear-gradient(180deg, #ecfeff 0%, #ffffff 100%);
}

.summary-card[data-tone='scope'] {
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
}

.summary-card[data-tone='profile'] {
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
}

.summary-card[data-tone='permissions'] {
  background: linear-gradient(180deg, #fefce8 0%, #ffffff 100%);
}

.panel-card ul {
  margin: 0;
  padding-left: 1.1rem;
}

.section-header {
  margin-bottom: 1rem;
}

.module-link {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 1.1rem;
  border-radius: 20px;
  text-decoration: none;
  border: 1px solid #dbe3f3;
  background: #ffffff;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.module-link:hover {
  transform: translateY(-2px);
  border-color: #7dd3fc;
}

.module-link strong {
  color: #0f172a;
}

.module-link p {
  margin: 0;
}

.module-link span {
  color: #0f766e;
  font-size: 0.84rem;
  font-weight: 700;
}

@media (max-width: 1120px) {
  .cards-grid,
  .content-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .cards-grid,
  .content-grid,
  .modules-grid {
    grid-template-columns: 1fr;
  }
}
</style>
