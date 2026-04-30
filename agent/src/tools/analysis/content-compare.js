import { callGemini } from '../../clients/gemini.js';

const CONTENT_COMPARE_PROMPT = `You are a content similarity expert. You compare two pieces of content to determine if one is a copy or derivative of the other.

You will be given descriptions, metadata, and identifiers for both the suspect content and a potential original source.

Your job is to:
1. Assess textual/metadata similarity (title, description, tags, identifiers)
2. If image URLs are provided, compare their visual descriptions
3. Determine the likelihood that the suspect content is derived from the original
4. Identify any modifications or transformations

Respond in JSON with this structure:
{
  "hasMatch": true/false,
  "similarity": 0.0 to 1.0,
  "textualOverlap": 0.0 to 1.0,
  "visualSimilarity": 0.0 to 1.0 or null if no images,
  "modifications": ["list of detected modifications"],
  "details": "explanation of the comparison"
}`;

/**
 * Compare content metadata and visual elements using Gemini.
 * Handles text, metadata, and image-to-image comparison via multimodal API.
 *
 * @param {object} suspect - { description, identifiers, contentType, link }
 * @param {object} original - { url, title, platform, relevance }
 * @returns {Promise<object>} Content comparison result
 */
export async function compareContent(suspect, original) {
  try {
    const userPrompt = `Suspect Content:
- Link: ${suspect.link}
- Type: ${suspect.contentType}
- Description: ${suspect.description}
- Identifiers: ${(suspect.identifiers || []).join(', ')}

Potential Original Source:
- URL: ${original.url}
- Title: ${original.title}
- Platform: ${original.platform}
- Relevance: ${original.relevance}

Compare these two pieces of content and assess similarity.`;

    const result = await callGemini(CONTENT_COMPARE_PROMPT, userPrompt, { json: true });

    return {
      success: true,
      originalUrl: original.url,
      ...result,
    };
  } catch (err) {
    console.error(`[ContentCompare] Error comparing content:`, err.message);
    return {
      success: false,
      originalUrl: original.url,
      hasMatch: false,
      error: err.message,
    };
  }
}
