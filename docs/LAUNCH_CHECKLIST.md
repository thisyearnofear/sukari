# Sukari Launch Checklist

## Product

- [x] User-facing name changed to Sukari.
- [x] Conversation-first patient interface: Mira initiates, patient responds in natural language.
- [x] Intent parser maps natural language to mission intents (accept, easier, later, done, not_done, decline).
- [x] Conversation memory persists across sessions in AsyncStorage.
- [x] Conversation engine drives deterministic mission responses + LLM escalation for free-form chat.
- [x] "Adjusted for you" appears in conversation when patient says "that's too much."
- [x] Demo pattern is clearly labelled.
- [x] Measured response copy avoids causal overclaiming.
- [x] Care-team work queue with status lifecycle (open, contacted, snoozed, resolved), filter/sort, and quick actions.
- [x] Mira proactive flags for care team (safety, completion drop, barrier, recovery, streak, re-engagement).
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
- [x] Care-team work item status changes.
- [x] Care-team work item snooze.
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
