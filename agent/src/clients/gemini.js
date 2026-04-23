import axios from 'axios';
import { config } from '../config/index.js';

const { apiKey, model, baseUrl } = config.gemini;

const geminiHttp = axios.create({
  baseURL: baseUrl,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Call Gemini API directly via axios.
 * @param {string} systemPrompt - System instruction
 * @param {string} userPrompt - User message
 * @param {object} opts - { json: boolean } — set true for structured JSON output
 * @returns {Promise<string|object>}
 */
export async function callGemini(systemPrompt, userPrompt, { json = false } = {}) {
  const { data } = await geminiHttp.post(
    `/models/${model}:generateContent?key=${apiKey}`,
    {
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        ...(json && { responseMimeType: 'application/json' }),
      },
    }
  );

  const text = data.candidates[0].content.parts[0].text;
  return json ? JSON.parse(text) : text;
}
