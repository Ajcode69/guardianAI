const { Router } = require('express');
const { z } = require('zod');
const { handleScanController } = require('../controllers/scan.controller.js');
const { validate } = require('../middlewares/validate.middleware.js');

const scanInputSchema = z.object({
  link: z.string().url(),
});

const scanRoutes = Router();

// POST /api/scan — submit a blob link for piracy analysis
scanRoutes.post('/', validate(scanInputSchema), handleScanController);

module.exports = { scanRoutes };
