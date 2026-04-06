<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBackofficeAuthStore } from '@/stores/backoffice-auth.store'

const router = useRouter()
const backofficeAuthStore = useBackofficeAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')

async function handleLogin() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Informe e-mail e senha.'
    return
  }

  errorMessage.value = ''

  try {
    await backofficeAuthStore.login(email.value, password.value)
    router.push({ name: 'backoffice-home' })
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel acessar o backoffice.'
  }
}
</script>

<template>
  <section class="login-view">
    <div class="header">
      <h2>Acessar backoffice</h2>
      <p>Use sua conta de plataforma para entrar na area administrativa.</p>
    </div>

    <div v-if="errorMessage" class="error-alert">
      {{ errorMessage }}
    </div>

    <form class="form" @submit.prevent="handleLogin">
      <div class="input-group">
        <label for="backoffice-email">E-mail</label>
        <input
          id="backoffice-email"
          v-model="email"
          type="email"
          placeholder="seu-email@plataforma.com"
          :disabled="backofficeAuthStore.loading"
        />
      </div>

      <div class="input-group">
        <label for="backoffice-password">Senha</label>
        <input
          id="backoffice-password"
          v-model="password"
          type="password"
          placeholder="Digite sua senha"
          :disabled="backofficeAuthStore.loading"
        />
      </div>

      <button class="submit-button" type="submit" :disabled="backofficeAuthStore.loading">
        {{ backofficeAuthStore.loading ? 'Acessando...' : 'Acessar backoffice' }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.header {
  margin-bottom: 1.5rem;
}

.header h2 {
  margin: 0 0 0.4rem;
  font-size: 1.7rem;
  color: #0f172a;
}

.header p {
  margin: 0;
  color: #475569;
  line-height: 1.5;
}

.error-alert {
  margin-bottom: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  background-color: #fef2f2;
  color: #b91c1c;
  font-size: 0.925rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.input-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
}

.input-group input {
  min-height: 48px;
  padding: 0.85rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  font-size: 0.98rem;
}

.input-group input:focus {
  outline: none;
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.18);
}

.submit-button {
  margin-top: 0.5rem;
  min-height: 48px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #0f766e 0%, #1d4ed8 100%);
  color: white;
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
