# Sukari KPI Experiment Plan

## North Star

**Weekly Adherent Patients (WAP):** enrolled patients who complete at least one real-world mission and at least one rehearsal in a week.

This reflects the product thesis: adherence per minute of attention should improve over time.

## Funnel

| Step | Event |
|------|-------|
| Value screen completed | `value_proposition_completed` |
| Role selected after value screen | `value_to_role_completed` |
| Role captured | `role_selected` |
| Mission accepted | `role_to_mission_accepted` |
| Rehearsal started | `mission_accepted_to_rehearsal_started` |
| Real-world action completed or deferred | `rehearsal_to_real_world_completion` |
| Measured response shown | `completion_to_measured_response` |
| Care-team exception created | `measured_response_to_care_team_exception` |
| Care panel opened | `care_panel_opened` |
| Outreach rationale reviewed | `care_outreach_reviewed` |

## Patient Metrics

- value screen completion rate;
- role selection distribution;
- signal import vs labelled demo pattern use;
- mission accept/ease/swap/decline rate;
- rehearsal start rate after mission acceptance;
- rehearsal completion rate;
- done-now vs later-today split;
- later-today eventual completion rate;
- weekly mission completion frequency.

## Operator Metrics

- exceptions per enrolled patient per week;
- outreach suggestions reviewed;
- outreach suggestions dismissed;
- time from exception to review;
- weekly outcomes visible per reviewed patient;
- staff minutes per enrolled patient.

## Experiments

### 1. Value Proposition Clarity

Hypothesis: naming the user pain before role selection improves role completion and mission acceptance.

Primary metric: value screen -> role selection.

### 2. Demo Pattern Honesty

Hypothesis: clearly labelling demo evidence increases trust without reducing rehearsal start.

Primary metric: role -> mission accepted.

### 3. Mission Friction

Hypothesis: accept/easier/another/not practical controls increase overall mission commitment by making refusal dignified.

Primary metric: mission accepted or adapted.

### 4. Transfer Beat

Hypothesis: the done/later choice drives real-world completion better than ending at rehearsal results.

Primary metric: rehearsal -> real-world completion/later.

### 5. Care-Team Exception Value

Hypothesis: operators care about concise exception rationale more than raw dashboards.

Primary metric: care-team exception -> outreach reviewed.

## Pilot Guardrails

- No clinical efficacy claims before pilot evidence.
- No dosing or diagnosis.
- Demo and synthetic data must remain labelled.
- Care-team cohort access requires authenticated backend, consent, and audit logs before external deployment.
