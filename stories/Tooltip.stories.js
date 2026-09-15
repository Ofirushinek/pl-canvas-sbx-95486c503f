import { I } from "./_icons.js";

/**
 * UI / Tooltip — dark bubble for ICON-ONLY controls.
 * RULE: any button/link that shows only an icon MUST carry `data-tooltip="Label"`
 * (label matches its aria-label). Shows on hover AND keyboard focus.
 * Add `data-tip-pos="top"` to flip the bubble above.
 */
export default {
  title: "UI/Tooltip",
};

// A generic, always-visible icon button (the live nav icon buttons are
// conditionally shown, so we use a neutral one here to demo the tooltip).
const iconBtn = (label, svg, extra = "") =>
  `<button type="button" aria-label="${label}" data-tooltip="${label}" ${extra}
     style="width:40px;height:40px;display:grid;place-items:center;cursor:pointer;
            border:1px solid var(--pl-border-strong);border-radius:var(--radius-md);
            background:var(--pl-surface);color:var(--pl-fg)">
     <span style="width:20px;height:20px;display:inline-flex">${svg}</span>
   </button>`;

export const Bottom = {
  name: "Default (below)",
  render: () => `<div class="sb-pad" style="padding-top:24px">${iconBtn("Menu", I.menu)}</div>`,
};

export const Top = {
  name: "Above (data-tip-pos)",
  render: () => `<div class="sb-pad" style="padding-top:64px">${iconBtn("Menu", I.menu, 'data-tip-pos="top"')}</div>`,
};

export const IconOnlyControls = {
  name: "Icon-only controls (the rule)",
  render: () =>
    `<div class="sb-pad sb-row" style="padding-top:24px; gap:32px">
       ${iconBtn("Menu", I.menu)}
       ${iconBtn("Account", I.user)}
       ${iconBtn("Close", I.x)}
     </div>`,
};

export const AlwaysOpenPreview = {
  name: "Always open (docs)",
  parameters: {
    docs: { description: { story: "Forced-open so Chromatic/docs capture the bubble; not for production." } },
  },
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "sb-pad";
    wrap.style.paddingTop = "72px";
    wrap.innerHTML = iconBtn("LinkedIn", I.linkedin, 'data-tip-pos="top"');
    const style = document.createElement("style");
    style.textContent =
      '[data-tooltip]::after,[data-tooltip]::before{opacity:1 !important;transform:translateX(-50%) translateY(0)!important}';
    wrap.appendChild(style);
    return wrap;
  },
};

/* Light theme (EXTEND, DSL 2026-09-06): white bubble for CONTENT tooltips (who /
   what a thing is), not icon labels. Multi-line via a real newline (&#10;) in
   data-tooltip. Pinned = data-tip-open (touch), never aria-expanded. */
export const Light = {
  name: "Light theme (content, 2 lines)",
  render: () => `<div class="sb-pad" style="padding-top:72px">
    <button type="button" class="btn btn--ghost" data-tooltip="המעצב&#10;מעצב המוצר" data-tip-theme="light" data-tip-pos="top">hover me</button>
  </div>`,
};

export const LightPinned = {
  name: "Light theme, pinned (data-tip-open)",
  render: () => `<div class="sb-pad" style="padding-top:72px">
    <button type="button" class="btn btn--ghost" data-tooltip="המעצב&#10;מעצב המוצר" data-tip-theme="light" data-tip-pos="top" data-tip-open>pinned</button>
  </div>`,
};
