const { Router } = require('express');
const { z } = require('zod');
const { handleScanController } = require('../controllers/scan.controller.js');
const { validate } = require('../middlewares/validate.middleware.js');

const scanInputSchema = z.object({
  link: z.string().url(),
  country: z.string().length(2).toUpperCase().optional(),  // ISO 3166-1 alpha-2
  contentHints: z.object({
    title: z.string().optional(),
    artist: z.string().optional(),
    league: z.string().optional(),
    event: z.string().optional(),
    category: z.enum(['sports', 'music', 'film', 'tv', 'news', 'other']).optional(),
  }).optional(),
});

const scanRoutes = Router();

// POST /api/scan — submit a blob link for piracy analysis
scanRoutes.post('/', validate(scanInputSchema), handleScanController);

module.exports = { scanRoutes };
