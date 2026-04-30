import { callGemini } from '../clients/gemini.js';
import { searchWeb } from '../tools/search/web-search.js';
import { LEGAL_ANALYZER_PROMPT } from '../prompts/legal.js';

/**
 * Build targeted search queries for jurisdiction-specific copyright law research.
 */
function buildLegalQueries(country, contentType, contentHints) {
  const queries = [];
  const region = country || 'international';

  // Core copyright query
  queries.push(`${region} copyright law ${contentType} unauthorized distribution`);

  // Category-specific query
  if (contentHints?.category) {
    const categoryTerms = {
      sports: 'broadcast rights sports streaming piracy law',
      music: 'music copyright infringement streaming law',
      film: 'movie piracy copyright infringement law',
      tv: 'television broadcast copyright law',
      news: 'news content copyright fair use law',
      other: 'digital content copyright law',
    };
    queries.push(`${region} ${categoryTerms[contentHints.category] || categoryTerms.other}`);
  }

  // Fair use / fair dealing query
  queries.push(`${region} fair use fair dealing copyright exceptions ${contentType}`);

  return queries.slice(0, 3); // Cap at 3 searches
}

/**
 * Legal Analyzer node: Researches jurisdiction-specific copyright laws
 * via web search and assesses whether the content violates local regulations.
 *
 * Inserted between analyzer and reporter in the pipeline.
 * Returns partial state update.
 */
export async function legalAnalyzer(state) {
  // Skip if no country provided
  if (!state.country) {
    console.log('[LegalAnalyzer] No country provided — skipping jurisdiction analysis.');
    return {
      jurisdictionAnalysis: {
        skipped: true,
        reason: 'No country/jurisdiction was provided for legal analysis.',
      },
    };
  }

  console.log(`[LegalAnalyzer] Researching copyright laws for: ${state.country}`);

  // Step 1: Search for jurisdiction-specific copyright laws
  const queries = buildLegalQueries(state.country, state.contentType, state.contentHints);

  const searchSettled = await Promise.allSettled(
    queries.map(q => searchWeb(q, 5))
  );

  const legalSearchResults = searchSettled.flatMap(r =>
    r.status === 'fulfilled' ? (r.value || []) : []
  );

  // Deduplicate
  const seen = new Set();
  const uniqueResults = legalSearchResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  // Step 2: Build the prompt with all context
  const userPrompt = `Country/Jurisdiction: ${state.country}
Content Type: ${state.contentType}
Content Category: ${state.contentHints?.category || 'unknown'}
Content Description: ${state.contentDescription}
Likely Owner: ${state.likelyOwner} (confidence: ${state.ownerConfidence})
Is Pirated (from analysis): ${state.isPirated}
Piracy Score: ${state.piracyScore}
Percentage of Original Used: ${state.percentageUsed}%

Video Match: ${state.hasVideoMatch ? 'YES' : 'NO'}
Audio Match: ${state.hasAudioMatch ? 'YES' : 'NO'}
Content Match: ${state.hasContentMatch ? 'YES' : 'NO'}

Legal Research Results:
${uniqueResults.map((r, i) => `${i + 1}. [${r.title}](${r.url})\n   ${r.content}`).join('\n\n')}

Based on the above legal research and content analysis, provide your jurisdiction-specific legal assessment.`;

  // Step 3: Get Gemini's legal analysis
  const result = await callGemini(LEGAL_ANALYZER_PROMPT, userPrompt, { json: true });

  // Attach the legal search sources for transparency
  result.legalSources = uniqueResults.map(r => ({
    url: r.url,
    title: r.title,
    snippet: r.content?.slice(0, 200),
  }));

  console.log(`[LegalAnalyzer] Done — violates: ${result.violatesLocalLaw}, risk: ${result.riskLevel}`);

  return { jurisdictionAnalysis: result };
}
