# Sukari KPI Experiment Plan

## North Star

**Weekly Adherent Patients (WAP):** enrolled patients who complete at least one real-world mission in a week.

This reflects the product thesis: adherence per minute of attention should improve over time.

## Funnel

| Step | Event |
|------|-------|
| Conversation opened | `conversation_opened` with `phase` and `has_prior_context` |
| Intent parsed | `conversation_intent` with `kind` and `phase` |
| Mission accepted | `role_to_mission_accepted` |
| Mission response selected | `mission_response_selected` with `choice` and `input_source` |
| Mission made easier | `mission_made_easier` |
| Mission deferred | `mission_deferred` |
| Real-world action completed | `completion_to_measured_response` |
| Patient-reported outcome captured | `measured_response_captured` with `felt_difficulty` and `noticed_difference` |
| Care-team exception created | `measured_response_to_care_team_exception` |
| Care panel opened | `care_panel_opened` with `open_items` count |
| Work item status changed | `care_work_item_updated` with `patient` and `status` |
| Work item snoozed | `care_work_item_snoozed` with `patient` and `hours` |
| Outreach rationale reviewed | `care_outreach_reviewed` |

## Patient Metrics

- conversation open rate (returning vs first-session);
- intent distribution (accept, easier, later, decline, done, not_done, report_outcome, chat);
- mission accept/ease/defer/decline rate from parsed intents;
- direct completion rate, segmented by input source;
- done-now vs later-today split;
- later-today eventual completion rate;
- patient-reported outcome capture rate (of completed missions, how many have a reported outcome);
- outcome distribution (felt difficulty: easier/about_right/harder; noticed difference: yes/no/not_sure);
- free-form chat escalation rate (how often patients ask questions beyond mission actions);
- weekly mission completion frequency.

## Operator Metrics

- open items per enrolled patient per week;
- work item status distribution (open, contacted, snoozed, resolved);
- time from open to contacted;
- time from contacted to resolved;
- Mira flag volume by severity (urgent, worth_a_conversation, positive) and by kind (including outcome_struggle, outcome_positive, outcome_barrier_link);
- Mira flag accuracy (flagged patients who benefited from outreach);
- cohort response rate by archetype (of patients who reported, what fraction noticed a difference);
- snooze usage and re-open rate;
- staff minutes per enrolled patient.

## Experiments

### 1. Value Proposition Clarity

Hypothesis: naming the user pain before role selection improves role completion and mission acceptance.

Primary metric: value screen -> role selection.

### 2. Demo Pattern Honesty

Hypothesis: clearly labelling demo evidence increases trust without reducing mission acceptance.

Primary metric: role -> mission accepted.

### 3. Conversation Intent Friction

Hypothesis: natural language intent parsing increases overall mission commitment by making refusal dignified and reducing tap friction.

Primary metric: mission accepted or adapted (from parsed intents).

### 4. First-Session Input Choice

Hypothesis: a private local check-in offers a more useful path than a generic mission when a live signal is unavailable.

Review after the first 5-10 sessions: `signal_path_selected`, `manual_signal_started`, `manual_signal_submitted`, and `mission_response_selected`, split by `input_source`. Do not use free-form check-in text in analytics.

### 5. Later-Today Recovery

Hypothesis: the later-today promise drives eventual completion better than a single do-now-or-drop choice.

Primary metric: mission deferred -> eventual completion within the week.

### 6. Care-Team Work Queue Value

Hypothesis: operators work an active queue faster than they read a passive report. Mira's proactive flags narrow attention to the patients who benefit from outreach.

Primary metric: time from open to contacted; Mira flag accuracy (flagged patients who benefited from outreach).

### 7. Conversation Memory Continuity

Hypothesis: Mira referencing past context ("Last time you mentioned evenings were hard") increases returning-session open rate and mission acceptance.

Primary metric: returning-session open rate; mission accepted in returning sessions vs first sessions.

### 8. Outcome-Informed Mission Selection

Hypothesis: using past patient-reported outcomes to avoid templates reported "harder" 2+ times and prefer templates with positive signal improves weekly completion rate and reduces decline/relapse rate.

Primary metric: weekly completion rate for patients with 3+ reported outcomes vs. baseline; decline rate for templates previously reported "harder."

### 9. Patient-Reported Outcome Capture Rate

Hypothesis: asking "how did it go?" in conversation immediately after completion yields a high outcome capture rate without adding friction.

Primary metric: `measured_response_captured` / `mission_completed` ratio (capture rate); outcome distribution (easier/about_right/harder, yes/no/not_sure).

## Pilot Guardrails

- No clinical efficacy claims before pilot evidence.
- No dosing or diagnosis.
- Demo and synthetic data must remain labelled.
- Care-team cohort access requires authenticated backend, consent, and audit logs before external deployment.
