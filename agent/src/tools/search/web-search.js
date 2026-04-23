import axios from 'axios';
import { config } from '../../config/index.js';

const tavilyHttp = axios.create({
  baseURL: 'https://api.tavily.com',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Search the web using Tavily API.
 * @param {string} query - Search query
 * @param {number} maxResults - Max results to return
 * @returns {Promise<Array<{ title: string, url: string, content: string }>>}
 */
export async function searchWeb(query, maxResults = 5) {
  const { data } = await tavilyHttp.post('/search', {
    api_key: config.tavily.apiKey,
    query,
    max_results: maxResults,
    include_raw_content: false,
  });

  return data.results;
}
