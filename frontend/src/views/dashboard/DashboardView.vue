<script setup>
</script>

<template>
  <div class="dashboard-home">
    <h1>Visão Geral</h1>
    <p>Seja bem-vindo ao sistema de gestão. Aqui entrarão os widgets e resumos em breve.</p>

    <!-- Exemplo de card vazio com design limpo e seguro -->
    <div class="empty-state-card">
      Em Desenvolvimento
    </div>
  </div>
</template>

<style scoped>
.dashboard-home h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.dashboard-home p {
  color: #6b7280;
  margin-bottom: 2rem;
}

.empty-state-card {
  width: 100%;
  max-width: 600px;
  height: 200px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-weight: 500;
  background-color: #fafafa;
}
</style>
