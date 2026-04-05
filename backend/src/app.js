// src/app.js
// Bootstrap do Express.
// Configura middlewares globais, monta rotas por módulo, e registra error handler.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const hpp = require('hpp');
const env = require('./config/env');
const errorHandler = require('./middlewares/errorHandler');

// Importar rotas dos módulos
const authRoutes = require('./modules/auth/auth.routes');

const app = express();

// ── MIDDLEWARES GLOBAIS (ordem importa!) ────────────────────────────

// Segurança: headers HTTP
app.use(helmet());

// CORS: permitir requests do frontend
app.use(cors({
  origin: env.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compressão gzip (reduz tamanho das respostas)
app.use(compression());

// Proteção contra HTTP Parameter Pollution
app.use(hpp());

// Parse de JSON no body
app.use(express.json({ limit: '10mb' }));

// Parse de URL-encoded
app.use(express.urlencoded({ extended: true }));

// Logger de requisições HTTP
if (!env.isProduction) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── HEALTH CHECK ───────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    },
  });
});

// ── ROTAS DOS MÓDULOS ──────────────────────────────────────────────

app.use('/api/auth', authRoutes);

// Futuros módulos serão montados aqui:
// app.use('/api/churches', churchesRoutes);
// app.use('/api/roles', rolesRoutes);
// app.use('/api/profiles', profilesRoutes);
// app.use('/api/members', membersRoutes);
// app.use('/api/financial', financialRoutes);
// app.use('/api/dashboard', dashboardRoutes);

// ── ROTA 404 (catch-all) ──────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Rota não encontrada',
    },
  });
});

// ── ERROR HANDLER GLOBAL (sempre por último!) ──────────────────────

app.use(errorHandler);

module.exports = app;
