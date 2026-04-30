import { callGemini } from '../clients/gemini.js';
import { REPORTER_PROMPT } from '../prompts/index.js';

/**
 * Reporter node: Generates the final structured piracy report
 * incorporating multi-signal matching, structured reasoning,
 * and jurisdiction analysis.
 * Returns partial state update.
 */
export async function reporter(state) {
  // ── Build video matching summary ─────────────────────────────────────────
  let videoSummary = 'No video matching performed.';
  if (state.videoMatchResults.length > 0) {
    const topMatch = state.videoMatchResults[0];
    videoSummary = `${state.videoMatchResults.length} source(s) matched. Top: ${topMatch.percentageMatched}% matched with ${topMatch.originalUrl}`;
  }

  // ── Build audio matching summary ─────────────────────────────────────────
  let audioSummary = 'No audio matching performed.';
  if (state.audioMatchResults.length > 0) {
    const topMatch = state.audioMatchResults[0];
    audioSummary = `${state.audioMatchResults.length} source(s) matched. Top: ${topMatch.percentageMatched}% matched with ${topMatch.originalUrl}`;
  }

  // ── Build content matching summary ───────────────────────────────────────
  let contentSummary = 'No content/metadata matching performed.';
  if (state.contentMatchResults.length > 0) {
    const topMatch = state.contentMatchResults[0];
    contentSummary = `${state.contentMatchResults.length} source(s) matched. Top: similarity ${topMatch.similarity} with ${topMatch.originalUrl}`;
  }

  // ── Build jurisdiction summary ───────────────────────────────────────────
  let jurisdictionSummary = 'No jurisdiction analysis performed.';
  if (state.jurisdictionAnalysis && !state.jurisdictionAnalysis.skipped) {
    const ja = state.jurisdictionAnalysis;
    jurisdictionSummary = `Jurisdiction: ${ja.jurisdiction || state.country}. Violates local law: ${ja.violatesLocalLaw}. Risk: ${ja.riskLevel}. Laws: ${(ja.applicableLaws || []).map(l => l.name).join(', ')}`;
  }

  const userPrompt = `Original Link: ${state.link}
Content Type: ${state.contentType}
Content Description: ${state.contentDescription}
Content Category: ${state.contentHints?.category || 'unknown'}
Country: ${state.country || 'not specified'}
Likely Owner: ${state.likelyOwner} (confidence: ${state.ownerConfidence})
Is Pirated: ${state.isPirated}
Piracy Score: ${state.piracyScore}
Percentage Used: ${state.percentageUsed}%
Modifications: ${state.modifications.join(', ') || 'none'}
Analysis Reasoning: ${JSON.stringify(state.analysisReasoning)}

Original Sources:
${state.originalSources.map((s, i) => `${i + 1}. [${s.title}](${s.url}) - ${s.platform}`).join('\n')}

═══ MATCHING RESULTS ═══
Video: ${state.hasVideoMatch ? 'MATCH' : 'NO MATCH'} — ${videoSummary}
Audio: ${state.hasAudioMatch ? 'MATCH' : 'NO MATCH'} — ${audioSummary}
Content: ${state.hasContentMatch ? 'MATCH' : 'NO MATCH'} — ${contentSummary}

═══ JURISDICTION ANALYSIS ═══
${jurisdictionSummary}

Generate the final comprehensive piracy report with a natural language summary and legal disclaimer.`;

  const report = await callGemini(REPORTER_PROMPT, userPrompt, { json: true });
  report.scannedAt = new Date().toISOString();

  return { report };
}
