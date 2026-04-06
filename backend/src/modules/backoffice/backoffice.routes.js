const { Router } = require('express');
const authRoutes = require('./auth/backoffice-auth.routes');
const auditRoutes = require('./audit/backoffice-audit.routes');
const dashboardRoutes = require('./dashboard/backoffice-dashboard.routes');
const tenantsRoutes = require('./tenants/backoffice-tenants.routes');
const usersRoutes = require('./users/backoffice-users.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/audit', auditRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/tenants', tenantsRoutes);
router.use('/users', usersRoutes);

module.exports = router;
