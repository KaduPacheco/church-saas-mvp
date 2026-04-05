<script setup>
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
}
</script>

<template>
  <div class="dashboard-layout">
    <!-- Navbar simples MVP -->
    <header class="navbar">
      <div class="logo">
        Gestão Saudável
      </div>
      
      <div class="user-menu" v-if="authStore.user">
        <span class="user-name">Olá, {{ authStore.user.name }}</span>
        <button class="btn-logout" @click="handleLogout">Sair</button>
      </div>
    </header>

    <!-- Área principal rolável -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.navbar {
  height: 64px;
  background-color: #1f2937;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
}

.logo {
  font-weight: 700;
  font-size: 1.25rem;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-logout {
  background-color: transparent;
  border: 1px solid #4b5563;
  color: #d1d5db;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-logout:hover {
  background-color: #374151;
  color: white;
}

.main-content {
  flex: 1;
  padding: 2rem;
  background-color: #f3f4f6;
}
</style>
