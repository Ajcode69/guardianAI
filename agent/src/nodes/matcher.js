import { compareVideos } from '../tools/analysis/video-compare.js';
import { compareAudio } from '../tools/analysis/audio-compare.js';
import { compareContent } from '../tools/analysis/content-compare.js';

/**
 * Matcher node: Runs video, audio, and content matching in parallel
 * against identified original sources.
 *
 * Each signal channel writes independently to the state so the
 * analyzer can weigh them separately.
 *
 * Returns partial state update.
 */
export async function matcher(state) {
  const noSources = state.originalSources.length === 0;

  // ── Video matching ────────────────────────────────────────────────────────
  async function matchVideo() {
    if (state.contentType !== 'video' || noSources) {
      return { results: [], hasMatch: false };
    }
    console.log(`[Matcher:Video] Comparing against ${state.originalSources.length} sources...`);

    const comparisons = await Promise.allSettled(
      state.originalSources.slice(0, 3).map(source =>
        compareVideos(state.link, source.url)
      )
    );

    const results = comparisons
      .filter(r => r.status === 'fulfilled' && r.value.success && r.value.hasMatch)
      .map(r => r.value);

    return { results, hasMatch: results.length > 0 };
  }

  // ── Audio matching ────────────────────────────────────────────────────────
  async function matchAudio() {
    if (!['video', 'audio'].includes(state.contentType) || noSources) {
      return { results: [], hasMatch: false };
    }
    console.log(`[Matcher:Audio] Comparing audio against ${state.originalSources.length} sources...`);

    const comparisons = await Promise.allSettled(
      state.originalSources.slice(0, 3).map(source =>
        compareAudio(state.link, source.url)
      )
    );

    const results = comparisons
      .filter(r => r.status === 'fulfilled' && r.value.success && r.value.hasMatch)
      .map(r => r.value);

    return { results, hasMatch: results.length > 0 };
  }

  // ── Content / metadata matching ───────────────────────────────────────────
  async function matchContent() {
    if (noSources) {
      return { results: [], hasMatch: false };
    }
    console.log(`[Matcher:Content] Comparing content metadata against ${state.originalSources.length} sources...`);

    const suspect = {
      link: state.link,
      contentType: state.contentType,
      description: state.contentDescription,
      identifiers: state.identifiers,
    };

    const comparisons = await Promise.allSettled(
      state.originalSources.slice(0, 3).map(source =>
        compareContent(suspect, source)
      )
    );

    const results = comparisons
      .filter(r => r.status === 'fulfilled' && r.value.success && r.value.hasMatch)
      .map(r => r.value);

    return { results, hasMatch: results.length > 0 };
  }

  // ── Run all matchers in parallel ──────────────────────────────────────────
  const [videoResult, audioResult, contentResult] = await Promise.allSettled([
    matchVideo(),
    matchAudio(),
    matchContent(),
  ]);

  const safeGet = (r) => r.status === 'fulfilled' ? r.value : { results: [], hasMatch: false };
  const video = safeGet(videoResult);
  const audio = safeGet(audioResult);
  const content = safeGet(contentResult);

  console.log(`[Matcher] Results — Video: ${video.hasMatch}, Audio: ${audio.hasMatch}, Content: ${content.hasMatch}`);

  return {
    videoMatchResults: video.results,
    audioMatchResults: audio.results,
    contentMatchResults: content.results,
    hasVideoMatch: video.hasMatch,
    hasAudioMatch: audio.hasMatch,
    hasContentMatch: content.hasMatch,
  };
}
