/**
 * Adherence OS public API — prefer importing from here or a subdomain.
 *
 * Layout:
 *   domain/programme  — daily missions, transfer, practice bias
 *   domain/signals    — CGM / simulated SignalSnapshot
 *   domain/patterns   — pattern → experiment framing
 *   domain/demo       — synthetic Maya timeline for demos
 *   domain/coach      — worker client + clinical scope
 *   domain/digest     — weekly care-team summary
 *   domain/invite     — caregiver support cards
 *   domain/config     — worker / app URL helpers
 */
export * from './programme';
export * from './signals';
export * from './patterns';
export * from './demo';
export * from './coach';
export * from './digest';
export * from './invite';
export * from './config';
