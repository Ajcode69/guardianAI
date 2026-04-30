import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentState } from '../state/index.js';
import { traverser } from '../nodes/traverser.js';
import { researcher } from '../nodes/researcher.js';
import { matcher } from '../nodes/matcher.js';
import { analyzer } from '../nodes/analyzer.js';
import { legalAnalyzer } from '../nodes/legalAnalyzer.js';
import { reporter } from '../nodes/reporter.js';

/**
 * Guardian Agent — a LangGraph workflow.
 *
 * Pipeline: traverser → researcher → matcher → analyzer → legalAnalyzer → reporter
 *
 * Import and invoke directly in any service:
 *   import { guardianAgent } from '@guardian/agent';
 *   const result = await guardianAgent.invoke({ link: 'https://...', country: 'US' });
 */
const workflow = new StateGraph(AgentState)
  .addNode('traverser', traverser)
  .addNode('researcher', researcher)
  .addNode('matcher', matcher)
  .addNode('analyzer', analyzer)
  .addNode('legalAnalyzer', legalAnalyzer)
  .addNode('reporter', reporter)
  .addEdge(START, 'traverser')
  .addEdge('traverser', 'researcher')
  .addEdge('researcher', 'matcher')
  .addEdge('matcher', 'analyzer')
  .addEdge('analyzer', 'legalAnalyzer')
  .addEdge('legalAnalyzer', 'reporter')
  .addEdge('reporter', END);

export const guardianAgent = workflow.compile();
