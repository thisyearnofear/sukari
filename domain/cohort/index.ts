/**
 * Cohort domain module — the programme-operator's view of their panel.
 *
 * Today, `getCohortOverview` returns a deterministic synthetic cohort.
 * When an authenticated care-team backend exists, this function becomes
 * the fetch boundary: it calls the remote cohort API, maps the response
 * to `CohortOverview`, and the view layer stays unchanged.
 */
import { buildSyntheticCohortOverview } from './synthetic';
import type { CohortOverview } from './types';

export * from './types';
export * from './workQueue';
export * from './miraFlags';
export * from './team';
export * from './teamReport';
export { buildSyntheticCohortOverview, computeArchetypeCompletion, computeArchetypeResponseRate, stampArchetypeContext, buildOutcomeSummary, stampOutcomeSummary } from './synthetic';

/**
 * Get the cohort overview for the current week.
 *
 * Returns a synthetic cohort today. A future implementation will accept
 * an authenticated provider token and fetch from a remote cohort API.
 */
export async function getCohortOverview(): Promise<CohortOverview> {
  return buildSyntheticCohortOverview();
}
