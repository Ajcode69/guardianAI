import { callGemini } from '../clients/gemini.js';
import { ANALYZER_PROMPT } from '../prompts/index.js';

/**
 * Analyzer node: Cross-references content against original sources
 * and produces piracy scoring.
 * Returns partial state update.
 */
export async function analyzer(state) {
  const userPrompt = `Content Description: ${state.contentDescription}
Content Type: ${state.contentType}
Likely Owner: ${state.likelyOwner} (confidence: ${state.ownerConfidence})

Original Sources Found:
${state.originalSources.map((s, i) => `${i + 1}. [${s.title}](${s.url}) - ${s.platform} - ${s.relevance}`).join('\n')}

Analyze whether this content is pirated and provide your assessment.`;

  const result = await callGemini(ANALYZER_PROMPT, userPrompt, { json: true });

  return {
    isPirated: result.isPirated,
    piracyScore: result.overallScore,
    percentageUsed: result.percentageUsed,
    modifications: result.modifications || [],
    analysisReasoning: result.reasoning,
  };
}
