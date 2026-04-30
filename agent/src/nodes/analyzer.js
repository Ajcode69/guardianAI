import { callGemini } from '../clients/gemini.js';
import { ANALYZER_PROMPT } from '../prompts/index.js';

/**
 * Analyzer node: Cross-references content against original sources
 * using multi-signal evidence (video, audio, content) and produces
 * structured piracy scoring with reasoning.
 * Returns partial state update.
 */
export async function analyzer(state) {
  // ── Build Video Evidence ────────────────────────────────────────────────
  let videoEvidence = 'No visual frame matches performed.';
  if (state.hasVideoMatch && state.videoMatchResults.length > 0) {
    videoEvidence = state.videoMatchResults.map((m, i) => {
      const segStr = m.segments.map(s =>
        `  - Suspect [${s.suspectRange.start}-${s.suspectRange.end}] matches Original [${s.originalRange.start}-${s.originalRange.end}] (avg sim: ${s.avgSimilarity})`
      ).join('\n');
      return `Match ${i + 1} with ${m.originalUrl} (${m.percentageMatched}% matched):\n${segStr}`;
    }).join('\n\n');
  }

  // ── Build Audio Evidence ────────────────────────────────────────────────
  let audioEvidence = 'No audio fingerprint matches performed.';
  if (state.hasAudioMatch && state.audioMatchResults.length > 0) {
    audioEvidence = state.audioMatchResults.map((m, i) => {
      const segStr = m.segments.map(s =>
        `  - Suspect [${s.suspectRange.start}-${s.suspectRange.end}] matches Original [${s.originalRange.start}-${s.originalRange.end}] (avg sim: ${s.avgSimilarity})`
      ).join('\n');
      return `Audio Match ${i + 1} with ${m.originalUrl} (${m.percentageMatched}% matched):\n${segStr}`;
    }).join('\n\n');
  }

  // ── Build Content Evidence ──────────────────────────────────────────────
  let contentEvidence = 'No content/metadata matches performed.';
  if (state.hasContentMatch && state.contentMatchResults.length > 0) {
    contentEvidence = state.contentMatchResults.map((m, i) =>
      `Content Match ${i + 1} with ${m.originalUrl}: similarity ${m.similarity}, details: ${m.details}`
    ).join('\n');
  }

  const userPrompt = `Content Description: ${state.contentDescription}
Content Type: ${state.contentType}
Likely Owner: ${state.likelyOwner} (confidence: ${state.ownerConfidence})

Original Sources Found:
${state.originalSources.map((s, i) => `${i + 1}. [${s.title}](${s.url}) - ${s.platform} - ${s.relevance}`).join('\n')}

═══ VIDEO MATCH EVIDENCE ═══
${videoEvidence}

═══ AUDIO MATCH EVIDENCE ═══
${audioEvidence}

═══ CONTENT/METADATA MATCH EVIDENCE ═══
${contentEvidence}

Analyze whether this content is pirated. Consider ALL evidence channels (video, audio, content) and provide your structured assessment with reasoning, justifications, and tradeoffs.`;

  const result = await callGemini(ANALYZER_PROMPT, userPrompt, { json: true });

  return {
    isPirated: result.isPirated,
    piracyScore: result.overallScore,
    percentageUsed: result.percentageUsed,
    modifications: result.modifications || [],
    analysisReasoning: result.reasoning,
  };
}
