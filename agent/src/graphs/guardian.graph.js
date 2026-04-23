import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentState } from '../state/index.js';
import { traverser } from '../nodes/traverser.js';
import { researcher } from '../nodes/researcher.js';
import { analyzer } from '../nodes/analyzer.js';
import { reporter } from '../nodes/reporter.js';

/**
 * Guardian Agent — a LangGraph workflow.
 *
 * Pipeline: traverser → researcher → analyzer → reporter
 *
 * Import and invoke directly in any service:
 *   import { guardianAgent } from '@guardian/agent';
 *   const result = await guardianAgent.invoke({ link: 'https://...' });
 */
const workflow = new StateGraph(AgentState)
  .addNode('traverser', traverser)
  .addNode('researcher', researcher)
  .addNode('analyzer', analyzer)
  .addNode('reporter', reporter)
  .addEdge(START, 'traverser')
  .addEdge('traverser', 'researcher')
  .addEdge('researcher', 'analyzer')
  .addEdge('analyzer', 'reporter')
  .addEdge('reporter', END);

export const guardianAgent = workflow.compile();
