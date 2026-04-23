import { z } from 'zod';

export const PiracyReportSchema = z.object({
  asset: z.object({
    originalLink: z.string(),
    contentType: z.enum(['video', 'image', 'audio', 'document', 'other']),
    description: z.string(),
  }),
  ownership: z.object({
    likelyOwner: z.string(),
    confidence: z.number().min(0).max(1),
    evidenceSources: z.array(z.object({
      url: z.string(),
      title: z.string(),
      relevance: z.string(),
    })),
  }),
  piracy: z.object({
    isPirated: z.boolean(),
    overallScore: z.number().min(0).max(1),
    percentageUsed: z.number().min(0).max(100),
    modifications: z.array(z.string()),
    matchedSources: z.array(z.object({
      url: z.string(),
      platform: z.string(),
      matchPercentage: z.number(),
      description: z.string(),
    })),
  }),
  summary: z.string(),
  scannedAt: z.string(),
});
