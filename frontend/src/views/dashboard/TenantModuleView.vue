<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { getTenantModuleContent } from '@/utils/tenant-navigation'

const route = useRoute()
const authStore = useAuthStore()

const moduleContent = computed(() => getTenantModuleContent(route.meta.moduleKey))

const scopeLabel = computed(() =>
  authStore.user?.congregationId ? 'Congregacao vinculada' : 'Sede / tenant completo'
)
</script>

<template>
  <section class="tenant-module-view">
    <div class="module-hero">
      <div>
        <span class="eyebrow">{{ moduleContent.eyebrow }}</span>
        <h1>{{ route.meta.title }}</h1>
        <p>{{ moduleContent.description }}</p>
      </div>

      <div class="module-badges">
        <span class="badge">{{ authStore.user?.churchName || 'Igreja sede' }}</span>
        <span class="badge">{{ scopeLabel }}</span>
      </div>
    </div>

    <section class="module-card">
      <h2>Como este modulo entra na evolucao do painel</h2>
      <ul>
        <li v-for="item in moduleContent.nextSteps" :key="item">
          {{ item }}
        </li>
      </ul>
    </section>

    <section class="module-card empty-state">
      <h2>Etapa atual</h2>
      <p>
        O modulo ja tem rota, contexto de tenant e controle de acesso por permissao. A operacao
        completa sera implementada nas proximas etapas sem quebrar a arquitetura existente.
      </p>
    </section>
  </section>
</template>

<style scoped>
.tenant-module-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.module-hero,
.module-card {
  padding: 1.3rem;
  border-radius: 24px;
  border: 1px solid #dbe3f3;
  background: rgba(255, 255, 255, 0.92);
}

.eyebrow {
  display: inline-block;
  margin-bottom: 0.55rem;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.module-hero h1,
.module-card h2 {
  margin: 0 0 0.4rem;
  color: #0f172a;
}

.module-hero p,
.module-card p,
.module-card li {
  color: #475569;
  line-height: 1.6;
}

.module-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.65rem 0.9rem;
  background: #ecfeff;
  color: #155e75;
  font-size: 0.82rem;
  font-weight: 700;
}

.module-card ul {
  margin: 0;
  padding-left: 1.1rem;
}

.empty-state {
  background:
    linear-gradient(180deg, rgba(240, 249, 255, 0.92) 0%, rgba(255, 255, 255, 0.92) 100%);
}
</style>
