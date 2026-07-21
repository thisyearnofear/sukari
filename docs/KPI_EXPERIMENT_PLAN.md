# Sukari KPI Experiment Plan

## North Star

**Weekly Adherent Patients (WAP):** enrolled patients who complete at least one real-world mission in a week.

This reflects the product thesis: adherence per minute of attention should improve over time.

## Funnel

| Step | Event |
|------|-------|
| Value screen completed | `value_proposition_completed` |
| Role selected after value screen | `value_to_role_completed` |
| Role captured | `role_selected` |
| Signal path selected | `signal_path_selected` |
| Private check-in started / submitted | `manual_signal_started` / `manual_signal_submitted` |
| Mission accepted | `role_to_mission_accepted` |
| Mission response selected | `mission_response_selected` with `choice` and `input_source` |
| Mission made easier | `mission_made_easier` |
| Mission deferred | `mission_deferred` |
| Real-world action completed | `completion_to_measured_response` |
| Care-team exception created | `measured_response_to_care_team_exception` |
| Care panel opened | `care_panel_opened` |
| Outreach rationale reviewed | `care_outreach_reviewed` |

## Patient Metrics

- value screen completion rate;
- role selection distribution;
- signal import vs labelled demo pattern vs private check-in use;
- selected mission input vs current source changes;
- mission accept/ease/defer/decline rate;
- direct completion rate, segmented by input source;
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

Hypothesis: clearly labelling demo evidence increases trust without reducing mission acceptance.

Primary metric: role -> mission accepted.

### 3. Mission Friction

Hypothesis: do it now/easier/later/not practical controls increase overall mission commitment by making refusal dignified.

Primary metric: mission accepted or adapted.

### 4. First-Session Input Choice

Hypothesis: a private local check-in offers a more useful path than a generic mission when a live signal is unavailable.

Review after the first 5-10 sessions: `signal_path_selected`, `manual_signal_started`, `manual_signal_submitted`, and `mission_response_selected`, split by `input_source`. Do not use free-form check-in text in analytics.

### 5. Later-Today Recovery

Hypothesis: the later-today promise drives eventual completion better than a single do-now-or-drop choice.

Primary metric: mission deferred -> eventual completion within the week.

### 6. Care-Team Exception Value

Hypothesis: operators care about concise exception rationale more than raw dashboards.

Primary metric: care-team exception -> outreach reviewed.

## Pilot Guardrails

- No clinical efficacy claims before pilot evidence.
- No dosing or diagnosis.
- Demo and synthetic data must remain labelled.
- Care-team cohort access requires authenticated backend, consent, and audit logs before external deployment.
