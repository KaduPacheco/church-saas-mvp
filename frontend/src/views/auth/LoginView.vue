<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Preencha e-mail e senha'
    return
  }
  
  errorMessage.value = ''
  loading.value = true
  
  try {
    await authStore.login(email.value, password.value)
    router.push({ name: 'dashboard' })
  } catch (error) {
    errorMessage.value = error.message || 'Falha no login. Verifique suas credenciais.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-box">
    <h1 class="title">Acesse sua conta</h1>
    <p class="subtitle">Bem-vindo de volta ao sistema</p>

    <div v-if="errorMessage" class="error-alert">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleLogin" class="form">
      <div class="input-group">
        <label for="email">E-mail</label>
        <input 
          id="email" 
          type="email" 
          v-model="email" 
          placeholder="seu@email.com" 
          required 
          :disabled="loading"
        />
      </div>

      <div class="input-group">
        <label for="password">Senha</label>
        <input 
          id="password" 
          type="password" 
          v-model="password" 
          placeholder="••••••••" 
          required 
          :disabled="loading"
        />
      </div>

      <button type="submit" class="btn-primary" :disabled="loading">
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  text-align: center;
}

.subtitle {
  color: #6b7280;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 0.875rem;
}

.error-alert {
  background-color: #fef2f2;
  color: #b91c1c;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  text-align: center;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.input-group label {
  font-weight: 500;
  font-size: 0.875rem;
  color: #374151;
}

.input-group input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 1rem;
}

.input-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
