import axios from 'axios';
import { callGemini } from '../clients/gemini.js';
import { TRAVERSER_PROMPT } from '../prompts/index.js';

/**
 * Traverser node: Fetches the blob link, grabs metadata,
 * and asks Gemini to describe + classify the content.
 * Returns partial state update (LangGraph pattern).
 */
export async function traverser(state) {
  const headRes = await axios.head(state.link);
  const contentType = headRes.headers['content-type'] || 'unknown';
  const contentLength = headRes.headers['content-length'] || 'unknown';

  let bodyPreview = '';
  if (contentType.includes('text') || contentType.includes('html') || contentType.includes('json')) {
    const { data } = await axios.get(state.link, { responseType: 'text' });
    bodyPreview = typeof data === 'string' ? data.slice(0, 5000) : JSON.stringify(data).slice(0, 5000);
  }

  const userPrompt = `Link: ${state.link}
Content-Type: ${contentType}
Content-Length: ${contentLength}
${bodyPreview ? `\nBody Preview:\n${bodyPreview}` : ''}

Analyze this content and provide your assessment.`;

  const result = await callGemini(TRAVERSER_PROMPT, userPrompt, { json: true });

  return {
    contentDescription: result.description,
    contentType: result.contentType,
    identifiers: result.identifiers || [],
    searchKeywords: result.searchKeywords || [],
  };
}
