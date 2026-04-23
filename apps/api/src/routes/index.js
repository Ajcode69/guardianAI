const { Router } = require('express');
const { scanRoutes } = require('./scan.routes.js');

const router = Router();

// Mount all route modules here
router.use('/scan', scanRoutes);

module.exports = { router };
