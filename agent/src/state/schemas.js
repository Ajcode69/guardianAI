import { z } from 'zod';

export const PiracyReportSchema = z.object({
  asset: z.object({
    originalLink: z.string(),
    contentType: z.enum(['video', 'image', 'audio', 'document', 'other']),
    description: z.string(),
    category: z.string().nullable().optional(),
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
  matching: z.object({
    video: z.object({
      hasMatch: z.boolean(),
      overallSimilarity: z.number().min(0).max(1),
      percentageMatched: z.number().min(0).max(100),
      segments: z.array(z.any()),
      summary: z.string(),
    }),
    audio: z.object({
      hasMatch: z.boolean(),
      overallSimilarity: z.number().min(0).max(1),
      percentageMatched: z.number().min(0).max(100),
      segments: z.array(z.any()),
      summary: z.string(),
    }),
    content: z.object({
      hasMatch: z.boolean(),
      similarity: z.number().min(0).max(1),
      details: z.string(),
    }),
  }),
  copyrightAssessment: z.object({
    isPirated: z.boolean(),
    overallScore: z.number().min(0).max(1),
    percentageUsed: z.number().min(0).max(100),
    modifications: z.array(z.string()),
    sources: z.array(z.object({
      url: z.string(),
      type: z.string(),
      confidence: z.number().min(0).max(1),
      description: z.string(),
    })),
    assumptions: z.array(z.string()),
    confidence: z.object({
      overall: z.number().min(0).max(1),
      breakdown: z.object({
        ownershipCertainty: z.number().min(0).max(1),
        videoMatchStrength: z.number().min(0).max(1),
        audioMatchStrength: z.number().min(0).max(1),
        contentMatchStrength: z.number().min(0).max(1),
        legalAssessmentConfidence: z.number().min(0).max(1).optional(),
      }),
    }),
    reasoning: z.object({
      conclusion: z.string(),
      justifications: z.array(z.string()),
      tradeoffs: z.array(z.string()),
      alternativeInterpretations: z.array(z.string()),
    }),
  }),
  jurisdictionAnalysis: z.object({
    country: z.string().optional(),
    violatesLocalLaw: z.boolean().optional(),
    applicableLaws: z.array(z.object({
      name: z.string(),
      relevance: z.string(),
    })).optional(),
    fairUseApplies: z.boolean().optional(),
    riskLevel: z.enum(['high', 'medium', 'low']).optional(),
    recommendations: z.array(z.string()).optional(),
    skipped: z.boolean().optional(),
    reason: z.string().optional(),
  }).nullable().optional(),
  summary: z.string(),
  disclaimer: z.string(),
  scannedAt: z.string(),
});
