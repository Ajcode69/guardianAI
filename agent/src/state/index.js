import { Annotation } from '@langchain/langgraph';

/**
 * AgentState — the shared state contract for the Guardian workflow.
 * Each node reads from and writes to this state.
 * Reducers define how each field is updated (overwrite by default).
 */
export const AgentState = Annotation.Root({
  // Input
  link: Annotation({ reducer: (_, b) => b, default: () => '' }),
  country: Annotation({ reducer: (_, b) => b, default: () => '' }),
  contentHints: Annotation({ reducer: (_, b) => b, default: () => ({}) }),

  // Traverser outputs
  contentDescription: Annotation({ reducer: (_, b) => b, default: () => '' }),
  contentType: Annotation({ reducer: (_, b) => b, default: () => '' }),
  identifiers: Annotation({ reducer: (_, b) => b, default: () => [] }),
  searchKeywords: Annotation({ reducer: (_, b) => b, default: () => [] }),

  // Researcher outputs
  searchResults: Annotation({ reducer: (_, b) => b, default: () => [] }),
  likelyOwner: Annotation({ reducer: (_, b) => b, default: () => '' }),
  ownerConfidence: Annotation({ reducer: (_, b) => b, default: () => 0 }),
  originalSources: Annotation({ reducer: (_, b) => b, default: () => [] }),

  // Matcher outputs — separate channels per signal type
  videoMatchResults: Annotation({ reducer: (_, b) => b, default: () => [] }),
  audioMatchResults: Annotation({ reducer: (_, b) => b, default: () => [] }),
  contentMatchResults: Annotation({ reducer: (_, b) => b, default: () => [] }),
  hasVideoMatch: Annotation({ reducer: (_, b) => b, default: () => false }),
  hasAudioMatch: Annotation({ reducer: (_, b) => b, default: () => false }),
  hasContentMatch: Annotation({ reducer: (_, b) => b, default: () => false }),

  // Analyzer outputs
  isPirated: Annotation({ reducer: (_, b) => b, default: () => false }),
  piracyScore: Annotation({ reducer: (_, b) => b, default: () => 0 }),
  percentageUsed: Annotation({ reducer: (_, b) => b, default: () => 0 }),
  modifications: Annotation({ reducer: (_, b) => b, default: () => [] }),
  analysisReasoning: Annotation({ reducer: (_, b) => b, default: () => '' }),

  // Legal analysis outputs
  jurisdictionAnalysis: Annotation({ reducer: (_, b) => b, default: () => null }),

  // Reporter output (final)
  report: Annotation({ reducer: (_, b) => b, default: () => null }),
});
