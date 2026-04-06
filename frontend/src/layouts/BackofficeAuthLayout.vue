<template>
  <div class="backoffice-auth-layout">
    <section class="auth-panel">
      <div class="brand-block">
        <span class="eyebrow">Backoffice da Plataforma</span>
        <h1>Gestão administrativa da plataforma</h1>
        <p>
          Área restrita para acompanhar igrejas clientes, acessos e auditoria
          sem interferir na operação das igrejas.
        </p>
      </div>

      <main class="auth-card">
        <RouterView />
      </main>
    </section>
  </div>
</template>

<style scoped>
.backoffice-auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.18), transparent 28%),
    radial-gradient(circle at bottom right, rgba(249, 115, 22, 0.16), transparent 24%),
    linear-gradient(135deg, #0f172a 0%, #111827 48%, #1f2937 100%);
}

.auth-panel {
  width: 100%;
  max-width: 1080px;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 420px);
  gap: 2rem;
  align-items: center;
}

.brand-block {
  color: #e5eef7;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 1rem;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  background-color: rgba(148, 163, 184, 0.16);
  color: #99f6e4;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.brand-block h1 {
  margin: 0 0 1rem;
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1.05;
}

.brand-block p {
  max-width: 520px;
  margin: 0;
  color: #cbd5e1;
  font-size: 1rem;
  line-height: 1.7;
}

.auth-card {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
}

@media (max-width: 900px) {
  .auth-panel {
    grid-template-columns: 1fr;
  }

  .brand-block {
    text-align: center;
  }

  .brand-block p {
    margin: 0 auto;
  }
}
</style>
