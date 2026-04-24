import { spawn } from 'child_process';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let similarityProcess = null;
let isServerReady = false;
const SIMILARITY_PORT = 8100;
const SIMILARITY_HOST = '127.0.0.1';

/**
 * Ensures the Python similarity server is running.
 */
async function ensureServerRunning() {
  if (isServerReady) return;

  // Try to ping it first (in case it's already running)
  try {
    await axios.get(`http://${SIMILARITY_HOST}:${SIMILARITY_PORT}/health`, { timeout: 1000 });
    isServerReady = true;
    return;
  } catch (e) {
    // Not running, need to start it
  }

  return new Promise((resolve, reject) => {
    console.log('[SimilarityServer] Starting Python sidecar...');
    
    // Assuming python environment is set up and dependencies are installed.
    // In production, you'd use a docker container or proper venv management.
    // For local dev, we assume 'python' is in PATH.
    const serviceDir = path.resolve(__dirname, '../../../../services/similarity');
    
    similarityProcess = spawn('python', ['-m', 'app.main'], {
      cwd: serviceDir,
      env: { ...process.env, SIMILARITY_PORT, SIMILARITY_HOST }
    });

    similarityProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[SimilarityServer] ${output.trim()}`);
      // Wait for uvicorn to be ready
      if (output.includes('Application startup complete.')) {
        isServerReady = true;
        resolve();
      }
    });

    similarityProcess.stderr.on('data', (data) => {
      console.error(`[SimilarityServer Error] ${data.toString().trim()}`);
    });

    similarityProcess.on('error', (err) => {
      console.error('[SimilarityServer] Failed to start:', err);
      reject(err);
    });

    similarityProcess.on('close', (code) => {
      console.log(`[SimilarityServer] Process exited with code ${code}`);
      isServerReady = false;
      similarityProcess = null;
    });
    
    // Fallback timeout
    setTimeout(() => {
        if (!isServerReady) {
            reject(new Error("Timeout waiting for Python sidecar to start."));
        }
    }, 15000);
  });
}

/**
 * Compare two videos using the Python sidecar.
 */
export async function compareVideos(suspectUrl, originalUrl) {
  await ensureServerRunning();

  try {
    const res = await axios.post(`http://${SIMILARITY_HOST}:${SIMILARITY_PORT}/compare`, {
      suspect_url: suspectUrl,
      original_url: originalUrl,
      threshold: 0.80
    }, {
      timeout: 300000 // 5 minutes timeout for heavy ML processing
    });
    
    return {
       success: true,
       originalUrl,
       ...res.data
    };
  } catch (err) {
    console.error(`[SimilarityClient] Error comparing videos:`, err.message);
    return {
      success: false,
      originalUrl,
      hasMatch: false,
      error: err.response?.data?.detail || err.message
    };
  }
}

// Ensure process is killed when Node exits
process.on('exit', () => {
  if (similarityProcess) {
    similarityProcess.kill();
  }
});
