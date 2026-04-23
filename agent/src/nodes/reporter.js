import { callGemini } from '../clients/gemini.js';
import { REPORTER_PROMPT } from '../prompts/index.js';

/**
 * Reporter node: Generates the final structured piracy report with summary.
 * Returns partial state update.
 */
export async function reporter(state) {
  const userPrompt = `Original Link: ${state.link}
Content Type: ${state.contentType}
Content Description: ${state.contentDescription}
Likely Owner: ${state.likelyOwner} (confidence: ${state.ownerConfidence})
Is Pirated: ${state.isPirated}
Piracy Score: ${state.piracyScore}
Percentage Used: ${state.percentageUsed}%
Modifications: ${state.modifications.join(', ') || 'none'}
Analysis Reasoning: ${state.analysisReasoning}

Original Sources:
${state.originalSources.map((s, i) => `${i + 1}. [${s.title}](${s.url}) - ${s.platform}`).join('\n')}

Generate the final piracy report with a natural language summary.`;

  const report = await callGemini(REPORTER_PROMPT, userPrompt, { json: true });
  report.scannedAt = new Date().toISOString();

  return { report };
}
