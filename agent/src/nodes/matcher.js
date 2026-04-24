import { compareVideos } from '../tools/analysis/video-compare.js';

/**
 * Matcher node: Computes semantic similarity between the suspect video
 * and the identified original sources using the Python sidecar.
 * Returns partial state update.
 */
export async function matcher(state) {
  // Only run for video content (for now)
  if (state.contentType !== 'video' || state.originalSources.length === 0) {
    return { matchResults: [], hasVideoMatch: false };
  }

  console.log(`[Matcher] Comparing suspect video against ${state.originalSources.length} sources...`);

  // Compare suspect against each original source (max 3 parallel)
  const comparisons = await Promise.allSettled(
    state.originalSources.slice(0, 3).map(source =>
      compareVideos(state.link, source.url)
    )
  );

  const matchResults = comparisons
    .filter(r => r.status === 'fulfilled' && r.value.success && r.value.hasMatch)
    .map(r => r.value);

  return {
    matchResults,
    hasVideoMatch: matchResults.length > 0,
  };
}
