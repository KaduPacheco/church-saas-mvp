<script setup>
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { backofficeTenantsService } from '@/services/backoffice-tenants.service'

const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const createdTenant = ref(null)

const form = reactive({
  churchName: '',
  churchEmail: '',
  churchPhone: '',
  churchDocument: '',
  initialAdminName: '',
  initialAdminEmail: '',
  initialAdminPassword: '',
})

function resetForm() {
  form.churchName = ''
  form.churchEmail = ''
  form.churchPhone = ''
  form.churchDocument = ''
  form.initialAdminName = ''
  form.initialAdminEmail = ''
  form.initialAdminPassword = ''
}

async function handleSubmit() {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await backofficeTenantsService.createOnboarding({
      churchName: form.churchName,
      churchEmail: form.churchEmail,
      churchPhone: form.churchPhone || undefined,
      churchDocument: form.churchDocument || undefined,
      initialAdminName: form.initialAdminName,
      initialAdminEmail: form.initialAdminEmail,
      initialAdminPassword: form.initialAdminPassword,
    })

    createdTenant.value = response.data
    successMessage.value = `Igreja cliente e admin inicial criados com sucesso para ${response.data.tenant.name}.`
    resetForm()
  } catch (error) {
    errorMessage.value =
      error.message || 'Nao foi possivel concluir o onboarding da igreja cliente.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="tenant-onboarding-section">
    <div class="section-header">
      <div>
        <h3>Onboarding do tenant</h3>
        <p>
          O backoffice cria primeiro a igreja sede e, na mesma operacao, cria o admin inicial
          vinculado ao tenant correto.
        </p>
      </div>
    </div>

    <section class="info-card">
      <h4>Fluxo adotado</h4>
      <ul>
        <li>A igreja cliente nasce em `churches` como sede do tenant.</li>
        <li>O admin inicial nasce junto, com perfil tecnico `Administrador Geral`.</li>
        <li>Membro e cargo ministerial nao fazem parte deste cadastro inicial.</li>
        <li>Depois do onboarding, a propria igreja passa a administrar os demais usuarios.</li>
      </ul>
    </section>

    <div v-if="errorMessage" class="feedback error">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="feedback success">
      <p>{{ successMessage }}</p>
      <RouterLink
        v-if="createdTenant?.tenant?.id"
        class="detail-link"
        :to="{ name: 'backoffice-tenant-detail', params: { id: createdTenant.tenant.id } }"
      >
        Abrir detalhe da igreja cliente
      </RouterLink>
    </div>

    <form class="onboarding-form" @submit.prevent="handleSubmit">
      <section class="form-card">
        <div class="card-header">
          <div>
            <h4>Igreja cliente</h4>
            <p>Dados minimos da igreja sede que dara origem ao tenant.</p>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label for="tenant-onboarding-name">Nome da igreja sede</label>
            <input
              id="tenant-onboarding-name"
              v-model="form.churchName"
              type="text"
              placeholder="Ex.: Igreja Comunidade da Graca"
            />
          </div>

          <div class="field">
            <label for="tenant-onboarding-email">E-mail institucional</label>
            <input
              id="tenant-onboarding-email"
              v-model="form.churchEmail"
              type="email"
              placeholder="contato@igreja.com"
            />
          </div>

          <div class="field">
            <label for="tenant-onboarding-phone">Telefone</label>
            <input
              id="tenant-onboarding-phone"
              v-model="form.churchPhone"
              type="text"
              placeholder="Opcional"
            />
          </div>

          <div class="field">
            <label for="tenant-onboarding-document">Documento</label>
            <input
              id="tenant-onboarding-document"
              v-model="form.churchDocument"
              type="text"
              placeholder="CNPJ opcional no MVP"
            />
          </div>

          <div class="field readonly-field">
            <label>Status inicial</label>
            <div class="readonly-value">Ativo</div>
          </div>

          <div class="field readonly-field">
            <label>Plano inicial</label>
            <div class="readonly-value">free</div>
          </div>
        </div>
      </section>

      <section class="form-card">
        <div class="card-header">
          <div>
            <h4>Admin inicial do tenant</h4>
            <p>
              Esta conta nasce ja vinculada a igreja sede criada acima e inaugura a gestao
              tecnica da propria igreja.
            </p>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label for="tenant-onboarding-admin-name">Nome do admin inicial</label>
            <input
              id="tenant-onboarding-admin-name"
              v-model="form.initialAdminName"
              type="text"
              placeholder="Nome completo"
            />
          </div>

          <div class="field">
            <label for="tenant-onboarding-admin-email">E-mail de acesso</label>
            <input
              id="tenant-onboarding-admin-email"
              v-model="form.initialAdminEmail"
              type="email"
              placeholder="admin@igreja.com"
            />
          </div>

          <div class="field">
            <label for="tenant-onboarding-admin-password">Senha inicial</label>
            <input
              id="tenant-onboarding-admin-password"
              v-model="form.initialAdminPassword"
              type="password"
              placeholder="Digite a senha inicial"
            />
          </div>

          <div class="field readonly-field">
            <label>Perfil tecnico criado</label>
            <div class="readonly-value">Administrador Geral</div>
          </div>

          <div class="field readonly-field">
            <label>Escopo inicial</label>
            <div class="readonly-value">Sede / tenant completo</div>
          </div>

          <div class="field readonly-field">
            <label>Regra de negocio</label>
            <div class="readonly-value">
              Membro e cargo ministerial permanecem separados do acesso tecnico.
            </div>
          </div>
        </div>
      </section>

      <div class="form-actions">
        <button class="primary-button" type="submit" :disabled="saving">
          {{ saving ? 'Criando onboarding...' : 'Criar igreja cliente e admin inicial' }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.tenant-onboarding-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header h3,
.info-card h4,
.form-card h4 {
  margin: 0 0 0.35rem;
  color: #0f172a;
}

.section-header p,
.card-header p {
  margin: 0;
  color: #64748b;
}

.info-card,
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

.feedback.success p {
  margin: 0;
}

.detail-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.85rem;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  color: #0f766e;
  border: 1px solid #99f6e4;
  background-color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-weight: 700;
}

.onboarding-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-header {
  margin-bottom: 1rem;
}

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

.field input {
  min-height: 46px;
  padding: 0.8rem 0.95rem;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 999px;
  padding: 0.85rem 1.1rem;
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

@media (max-width: 920px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .readonly-field {
    grid-column: span 1;
  }

  .form-actions {
    justify-content: stretch;
  }
}
</style>
