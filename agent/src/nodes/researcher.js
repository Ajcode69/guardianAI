import { callGemini } from '../clients/gemini.js';
import { searchWeb } from '../tools/search/web-search.js';
import { RESEARCHER_PROMPT } from '../prompts/index.js';

/**
 * Researcher node: Takes the content description + keywords,
 * searches the web, and identifies original sources/owner.
 * Returns partial state update.
 */
export async function researcher(state) {
  const queries = state.searchKeywords.slice(0, 3);

  // Run up to 3 searches in parallel
  const settled = await Promise.allSettled(
    queries.map(q => searchWeb(q, 5))
  );

  const allResults = settled.flatMap(r =>
    r.status === 'fulfilled' ? (r.value || []) : []
  );

  // Deduplicate by URL
  const seen = new Set();
  const uniqueResults = allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  const userPrompt = `Content Description: ${state.contentDescription}
Content Type: ${state.contentType}
Identifiers: ${state.identifiers.join(', ')}

Web Search Results:
${uniqueResults.map((r, i) => `${i + 1}. [${r.title}](${r.url})\n   ${r.content}`).join('\n\n')}

Analyze these results and identify the likely original owner.`;

  const result = await callGemini(RESEARCHER_PROMPT, userPrompt, { json: true });

  return {
    searchResults: uniqueResults,
    likelyOwner: result.likelyOwner,
    ownerConfidence: result.ownerConfidence,
    originalSources: result.originalSources || [],
  };
}
