import axios from 'axios';

const SIMILARITY_PORT = 8100;
const SIMILARITY_HOST = '127.0.0.1';

/**
 * Compare audio tracks of two videos using the Python sidecar.
 * Assumes the similarity server is already running (started by video-compare.js).
 *
 * @param {string} suspectUrl - URL of the suspect video
 * @param {string} originalUrl - URL of the original video
 * @returns {Promise<object>} Audio comparison result
 */
export async function compareAudio(suspectUrl, originalUrl) {
  try {
    const res = await axios.post(`http://${SIMILARITY_HOST}:${SIMILARITY_PORT}/compare/audio`, {
      suspect_url: suspectUrl,
      original_url: originalUrl,
      threshold: 0.80,
    }, {
      timeout: 300000, // 5 minutes timeout for audio processing
    });

    return {
      success: true,
      originalUrl,
      ...res.data,
    };
  } catch (err) {
    console.error(`[AudioCompare] Error comparing audio:`, err.message);
    return {
      success: false,
      originalUrl,
      hasMatch: false,
      error: err.response?.data?.detail || err.message,
    };
  }
}
