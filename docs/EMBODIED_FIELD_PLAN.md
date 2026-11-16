# Embodied Field — implementation plan

Companion to `docs/INTERFACE_DIFFERENTIATION.md` (moves 1 + 2). Goal for
this sprint: the ambient field stops being wallpaper — it carries live
signal and semantic state.

Status: phases A–C shipped and verified; phases D–F (circadian
character, semantic texture, dissolution moment) shipped in the second
pass. Remaining: distinct form per quality beyond texture parameters,
and the shared-field care surface.

## The build

### Phase A — signal channel into `MetabolicField`

Extend the field's props with an optional live signal:

```ts
signal?: {
  pulseBpm?: number;      // measured pulse → heartbeat shimmer
  breathPerMin?: number;  // measured breathing → slow swell
  gain?: number;          // 1 during measurement, ~0.35 as imprint
}
```

**Web (`MetabolicFieldWeb`)**: signal goes through a ref (like
`targetRef`) so the canvas loop reads it per-frame without re-mounting.
Inside `draw()`:

- `pulsePhase += dt * pulseBpm/60`; beat gain uses a sharpened waveform
  `pow(0.5 + 0.5·sin(2π·phase), 3)` — thump-and-decay, not a sine wobble —
  modulating stroke alpha (~+0.10) and amp (~+8%).
- `breathPhase += dt * breathPerMin/60`; slow amp swell `×(1 + 0.25·sin)`.
- `gain` scales both modulations; absent signal = today's behavior.
- `prefers-reduced-motion` → signal renders as a small static intensity
  lift only.

**Native (`MetabolicFieldNative`)**: same prop; implemented as two
`Animated.loop` overlays — opacity pulse at bpm, ±6px translateY breath —
guarded by `useReducedMotion`.

### Phase B — check-in drives the home field

`VitalsCheckIn` gets an `onReading?(reading)` prop called from its
provider handler. `ConversationHome` keeps `liveVitals` state and feeds
`signal` to the `MetabolicField` behind the whole screen:

- While the sheet is open and measuring: `gain: 1` — the field pulses
  with your pulse *behind* the consent/measuring/result stages.
- After "Back to Mira": the last reading persists as an **imprint**
  (`gain: 0.35`) for the session — the field absorbed your signal.
- Cleared on unmount/new day; simulated readings imprint identically but
  are already disclosed in the thread.

### Phase C — first semantic vocabulary (tempo)

`FieldVisual` gains `tempo` (lerped like rgb/intensity; drift-speed
multiplier). `fieldStateFromPattern` returns a `quality` alongside
band/intensity — first-pass mapping:

| quality | band | tempo | reads as |
|---|---|---|---|
| `steady` | in_range | 1.0 | calm, even drift |
| `charged` | high | 1.5 | faster, brighter agitation |
| `depleted` | low | 0.6 | slow, heavy, dim |
| `settling` | in_range | 0.75→ | mission done — decelerating to rest |
| `unknown` | unknown | 0.9 | quiet neutral |

Same render machinery, distinct feel — groundwork for the full semantic
states (texture/form per quality) later.

### Phase D — circadian character (shipped)

`domain/atmosphere/circadian.ts` resolves hour-of-day into a
`CircadianCharacter` (night / dawn / day / evening → lightness, tempo,
activity, warmth). `ConversationHome` computes it once per mount and
passes it to the field, which applies `tintedAccent` (warm bias into
red/green, out of blue), multiplies intensity by `activity`, and scales
drift tempo — the app keeps the patient's body clock.

### Phase E — semantic texture (shipped)

`FieldQuality` drives a lerped `FieldTexture` `{ waveK, jitter,
alphaMul }` in the web canvas renderer — wave spatial frequency,
high-frequency roughness, and line brightness. Charged reads tighter
and rougher; settling wider and calmer; depleted dims the lines.
Texture lerps through `SETTLE_STEP` alongside `FieldVisual`, so states
melt rather than cut.

### Phase F — dissolution moment (shipped)

On mission accept, `ConversationHome` sets a `releaseLine` flag:
`ReleaseLine` fades in under the posture label ("Go live it — I'll be
here."), holds ~3.4s, dissolves out, and unmounts. For the same window
the field exhales — intensity −0.12 (floored at 0.18), tempo ×0.8 —
lerped like every other channel, so the interface physically settles
as the patient is released back into the world. Ephemeral,
non-gamified, driven by the phase transition.

## Files

- `components/atmosphere/MetabolicField.tsx` — signal prop, web draw-loop
  channels (pulse shimmer, breath swell, texture lerp, circadian tint),
  native overlay loops, `tempo` in `FieldVisual` path
- `utils/fieldColor.ts` — `FieldVisual` gains `tempo`; `tintedAccent`
  applies circadian lightness/warmth
- `domain/patterns/fieldState.ts` — `quality` in `FieldState`
- `domain/atmosphere/circadian.ts` — time-of-day resolver
- `components/checkin/VitalsCheckIn.tsx` — `onReading` prop
- `components/home/ConversationHome.tsx` — `liveVitals` state, signal +
  quality + circadian wiring, `ReleaseLine` dissolution moment
- Tests: `__tests__/fieldState.test.ts` (quality mapping), tempo lerp in
  `fieldColor` test, `__tests__/circadian.test.ts`

## Verification

- `tsc`, `eslint`, jest, `expo export --platform web --clear`
- Screenshots: consent → measuring (field visibly pulsing behind sheet —
  capture two frames ~0.5s apart) → result → thread with field imprint
- Reduced-motion spot check (static field, no pulse)

## Demo beat this enables

Consent → "watch the screen behind the sheet" → the field begins pulsing
at the measured rate → result → back to Mira, the pulse stays faintly in
the field → mission strip. One continuous "your body entered the
interface" moment.
