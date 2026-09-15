// Components / Fleet controls - everything the #/fleet page brought into the
// system (Design System Lead rulings, 2026-09-05/06/07).
// Same convention as every other story here: markup lifted from app.js render
// functions, rendered against the production styles.css, no values re-typed.
//
//   .field__hint       EXTEND of .field  - quiet meta line under a control (char counter, +mic)
//   .chip--choice      EXTEND of .chip   - selectable chip on the control ladder (sm, 40px);
//                                          role="radio" for single-select, role="checkbox" for multi
//   .chip__logo        NEW atom          - 18px leading brand mark on a chip, currentColor only
//   .skel              NEW primitive     - loading skeleton line, opacity pulse, reduced-motion aware
//   .mic-btn            NEW atom          - 28px round voice-input control
//
// Canonical selection state for .chip--choice is [aria-checked="true"]. aria-pressed is NOT used on
// it (a radio/checkbox cannot be pressed; two selection attributes on one control is a bug).
//
// DSL, 2026-09-07: an earlier mic design (.chip--toggle + .field__head, added 2026-09-06) was
// superseded THE SAME DAY by the .field__hint--mic + .mic-btn pattern below - the real fleetQuestion()
// render function in app.js has zero references to .chip--toggle or .field__head. Both were dead CSS
// with a dead story documenting them; removed from styles.css, replaced here with the live pattern.

export default { title: 'Components/Fleet controls' };

export const FieldHint = () => `
  <div style="max-width:34rem">
    <div class="field">
      <label class="field__label" for="fh-demo">Your answer</label>
      <textarea class="reg__note" id="fh-demo" rows="4" maxlength="300" dir="auto">Every screen before it goes to dev.</textarea>
      <div class="field__hint"><span class="ltr-iso" dir="ltr">37/300</span></div>
    </div>
    <div class="field" style="margin-top:var(--space-5)">
      <label class="field__label" for="fh-max">At the limit (.is-max)</label>
      <textarea class="reg__note" id="fh-max" rows="2" maxlength="300" dir="auto"></textarea>
      <div class="field__hint is-max"><span class="ltr-iso" dir="ltr">300/300</span></div>
    </div>
    <p class="ss-note" style="margin-top:var(--space-5);text-align:start">
      Caption size (--text-caption, 500), --pl-fg-secondary, text-align:end so it sits at the
      reading-end edge in both directions. Numbers stay LTR via .ltr-iso. .is-max = --pl-stage-dropped.
    </p>
  </div>`;

export const ChipChoice = () => `
  <div class="cta-row" role="radiogroup" aria-label="Have you tried yet?" style="justify-content:center;max-width:34rem">
    <button type="button" class="chip chip--choice" role="radio" aria-checked="false">Chat</button>
    <button type="button" class="chip chip--choice" role="radio" aria-checked="false">No</button>
    <button type="button" class="chip chip--choice" role="radio" aria-checked="true">Claude Code, and something broke</button>
  </div>
  <p class="ss-note" style="margin-top:var(--space-5);text-align:start;max-width:34rem">
    Builds on .chip (surface, --pl-border-strong, 600, --text-sm). Height --ctl-sm (40px), min-width
    --ctl-sm, padding-inline --space-4. Hover border --pl-fg (= .btn--ghost:hover). Focus ring = .input:focus
    (accent 22%). Selected = accent 12% tint over --pl-surface, accent border, accent text - the same
    tint pill as .agentcard__tag / .pcrumb__chip--target. Single-select only; multi-select is a new variant, ask first.
  </p>`;

export const Skeleton = () => `
  <div class="grid grid--3">
    ${['', '', ''].map(() => `
    <div class="card" aria-hidden="true">
      <span class="skel skel--tag"></span><span class="skel skel--h"></span>
      <span class="skel"></span><span class="skel"></span><span class="skel skel--short"></span>
    </div>`).join('')}
  </div>
  <p class="ss-note" style="margin-top:var(--space-5);text-align:start">
    Shaped like the content it waits for (tag, heading, three lines). --pl-bg-alt, --radius-sm,
    opacity pulse 1.4s on --ease-pl, no gradient shimmer, animation:none under prefers-reduced-motion.
    Sizes: line 0.9em · --skel--tag height --space-5 · --skel--h height --text-h3 (both on tokens; the
    first build's raw 1.4rem/1.25rem values were fixed same day). Wrap in role="status" aria-live="polite" aria-busy="true".
  </p>`;

export const ChipLogo = () => `
  <div class="cta-row" role="group" aria-label="Which tool do you work with today?" style="justify-content:center;flex-wrap:wrap;max-width:34rem">
    <button type="button" class="chip chip--choice" role="checkbox" aria-checked="true"><span class="chip__logo chip__logo--initial" style="width:18px;height:18px;display:grid;place-items:center">C</span>Cursor</button>
    <button type="button" class="chip chip--choice" role="checkbox" aria-checked="false"><span class="chip__logo chip__logo--initial" style="width:18px;height:18px;display:grid;place-items:center">W</span>Windsurf</button>
    <button type="button" class="chip chip--choice" role="checkbox" aria-checked="false">None yet</button>
  </div>
  <p class="ss-note" style="margin-top:var(--space-5);text-align:start;max-width:34rem">
    18px, flex:none, currentColor only - brand colors never enter the palette. No mark exists for most
    tools yet, so .chip__logo--initial (the .quote__av recipe at chip scale) stands in: a disc with the
    tool's first letter, --pl-bg-alt at rest, accent-tint when the chip is selected. Same 18px as .mic-btn's
    icon. This is q5's multi-select group - role="checkbox" in a role="group", not radio.
  </p>`;

const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/></svg>';
export const MicButton = () => `
  <div class="field" style="max-width:34rem" dir="rtl">
    <textarea class="reg__note" id="mic-q" rows="4" placeholder="…">אפליקציה לניהול תורים לקליניקות</textarea>
    <div class="field__hint field__hint--mic">
      <span class="ltr-iso" dir="ltr">37/300</span>
      <button type="button" class="mic-btn" aria-pressed="false" aria-label="לדבר במקום להקליד"><span class="dot"></span>${MIC}</button>
    </div>
  </div>
  <div class="field" style="max-width:34rem;margin-top:var(--space-5)" dir="rtl">
    <textarea class="reg__note" id="mic-q2" rows="4" placeholder="…"></textarea>
    <div class="field__hint field__hint--mic">
      <span class="ltr-iso" dir="ltr">0/300</span>
      <button type="button" class="mic-btn" aria-pressed="true" aria-label="לדבר במקום להקליד"><span class="dot"></span>${MIC}</button>
    </div>
  </div>
  <p class="ss-note" style="margin-top:var(--space-5);text-align:start;max-width:34rem">
    Voice input on every #/fleet question. Same row as the character counter, below the field - not a
    label-row control (that was an earlier design, since retired). .field__hint--mic forces
    direction:ltr so the counter sits at the physical bottom-left and the mic at the physical
    bottom-right in EITHER language. 28px round, --pl-fg-secondary at rest, accent when
    aria-pressed="true" - the .dot (accent, skel pulse, none under reduced-motion) is the live signal.
  </p>`;
