# Sukari Launch Checklist

## Product

- [x] User-facing name changed to Sukari.
- [x] Conversation-first patient interface: Mira initiates, patient responds in natural language.
- [x] Intent parser maps natural language to mission intents (accept, easier, later, done, not_done, decline, report_outcome).
- [x] Conversation memory persists across sessions in AsyncStorage.
- [x] Conversation engine drives deterministic mission responses + LLM escalation for free-form chat.
- [x] "Adjusted for you" appears in conversation when patient says "that's too much."
- [x] Patient-reported outcome capture: after completion, Mira asks how it went; response parsed into PatientReportedOutcome + reflection.
- [x] Closed-loop adaptation: past outcomes inform mission selection (avoid templates reported "harder" 2+ times, prefer templates with positive signal).
- [x] Demo pattern is clearly labelled.
- [x] Measured response copy avoids causal overclaiming.
- [x] Care-team work queue with status lifecycle (open, contacted, snoozed, resolved), filter/sort, quick actions, and operator assignment to care team members.
- [x] Weekly team report with per-assignee breakdown, patients needing attention, Mira's top flags, and share/CSV export.
- [x] Mira proactive flags for care team (safety, completion drop, barrier, recovery, streak, re-engagement, outcome struggle, outcome positive, outcome barrier link).
- [x] Cohort evidence on operator surface: archetype completion rates + patient-reported response rates by mission type.
- [x] Longitudinal outcome trend in clinician digest.
- [x] Work queue state persists in AsyncStorage; expired snoozes auto-reopen.
- [x] Demo cohort is explicit, not disguised as real panel data.
- [x] Legacy Web3/NFT/leaderboard/challenge and combat/kingdom game surfaces removed.

## Instrumentation

- [x] Conversation opened (with phase and prior-context flag).
- [x] Conversation intent (with kind and phase).
- [x] Normalized mission-response event with input-source segmentation.
- [x] Settings control to change mission input without resetting programme progress.
- [x] Connection capability gate labels unavailable live signal access as preview.
- [x] Role -> mission accepted.
- [x] Mission easier/later adaptation.
- [x] Completion -> measurable response.
- [x] Patient-reported outcome captured (with felt_difficulty and noticed_difference).
- [x] Care-team work item status changes.
- [x] Care-team work item snooze.
- [x] Care-team work item assignment.
- [x] Team report view, share, and export.
- [x] Care-team exception/outreach.

## Engineering

- [x] Jest AsyncStorage mock.
- [x] TypeScript cleanup after legacy Web3 and game-layer removal.
- [x] Lint passes.
- [x] Jest passes.
- [x] TypeScript check passes.
- [x] Web export passes.
- [x] Runware mission-media worker deployed with privacy-bounded route.

## Before External Pilot

- [ ] Provider authentication.
- [ ] Patient consent and enrollment model.
- [ ] Role-based care-team access.
- [ ] Audit logs for digest views and outreach actions.
- [ ] HIPAA-ready storage and retention policy.
- [ ] Clinician-reviewed mission library.
- [ ] Pilot protocol and outcomes measurement plan.
