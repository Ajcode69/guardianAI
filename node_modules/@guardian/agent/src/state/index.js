import { Annotation } from '@langchain/langgraph';

/**
 * AgentState — the shared state contract for the Guardian workflow.
 * Each node reads from and writes to this state.
 * Reducers define how each field is updated (overwrite by default).
 */
export const AgentState = Annotation.Root({
  // Input
  link: Annotation({ reducer: (_, b) => b, default: () => '' }),

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

  // Analyzer outputs
  isPirated: Annotation({ reducer: (_, b) => b, default: () => false }),
  piracyScore: Annotation({ reducer: (_, b) => b, default: () => 0 }),
  percentageUsed: Annotation({ reducer: (_, b) => b, default: () => 0 }),
  modifications: Annotation({ reducer: (_, b) => b, default: () => [] }),
  analysisReasoning: Annotation({ reducer: (_, b) => b, default: () => '' }),

  // Reporter output (final)
  report: Annotation({ reducer: (_, b) => b, default: () => null }),
});
