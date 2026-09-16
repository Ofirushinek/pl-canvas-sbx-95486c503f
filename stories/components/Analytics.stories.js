// Components / Analytics — the security-dashboard tab built 2026-09-16 for the
// Capture/Return (UI ⟷ canvas) round-trip experiment. Design System Lead pass,
// same day: markup lifted verbatim from app.js's anStackedBar()/anStatTile()/
// anSparkline()/anEventsTable(), rendered against the production styles.css,
// no values re-typed. Full ruling: design-system/product-lab/component-log.md
// (this vault, 2026-09-16).
//
// THE CANVAS-EDITABILITY RULE THIS PASS EXISTS TO SERVE: the Capture/Return
// canvas tool can only drag/resize a real HTML element (CSS position + size).
// A raw <svg> shape (x/y attributes) is one opaque blob to it, same as an
// icon glyph — fine for content nobody needs to edit piece-by-piece, wrong
// for anything meant to read as a real UI element in the canvas.
//
//   .barchart          NEW organism  — the hourly stacked-bar chart, DIV-BASED (not SVG).
//                       Every bar/gridline/label is its own positioned element, so each
//                       one is independently selectable/draggable in the canvas tool.
//                       Built only from existing tokens: --pl-border, --pl-fg-muted,
//                       --radius-sm, and the shared `.an-hit` hover-wash recipe
//                       (EXTENDED to also carry `background`, not just SVG `fill`, so
//                       one rule now serves both shape systems). Zero new hex.
//   .stat-tile         REUSE, unchanged — already real HTML (card/label/value/delta),
//                       already canvas-editable as-is.
//   .stat-tile__spark  KEPT AS SVG, deliberately — a 7-point sparkline is a decorative
//                       trend glyph, not a set of UI elements anyone drags individually.
//                       Same carve-out Ofir named for icons: the glyph's OWN outer <svg>
//                       still sits in normal flow and is fully draggable/resizable as one
//                       block; only its internal path stays non-editable, exactly like an
//                       icon's internal paths. anLineChart (the failed-attempts trend line)
//                       is the same case, same ruling, not converted — nobody was asking
//                       to drag a point on a 30-point line either.
//   .roster__table     REUSE, unchanged — the "recently flagged events" table is real
//                       <table>/<tr>/<td> markup already, zero SVG, already canvas-editable
//                       by construction. See Roster.stories.js for the canonical table
//                       story — FLAGGED STALE this same pass, see the note at the bottom
//                       of this file before trusting it.
//
// Tokens added: none.

export default { title: "Components/Analytics" };

const T = {
  en: {
    kicker: "Security", title: "Analytics",
    chart1_title: "Failed login attempts", chart1_sub: "Last 7 days",
    chart2_title: "Logins by hour of day", chart2_sub: "Daily average, yesterday",
    legend_success: "Succeeded", legend_failed: "Failed",
    kpi_failed: "Failed logins", kpi_failed_sub: "vs. yesterday",
    kpi_blocked: "Blocked (bot)", kpi_blocked_sub: "vs. yesterday",
    kpi_sessions: "Active sessions", kpi_sessions_sub: "right now",
    kpi_risk: "Avg. risk score", kpi_risk_sub: "0–10 scale",
    table_title: "Recently flagged events", table_sub: "Newest first",
    col_time: "Time", col_user: "User", col_location: "Location", col_device: "Device", col_status: "Status", col_risk: "Risk",
    status_success: "OK", status_mfa: "MFA", status_failed: "Failed", status_blocked: "Blocked",
  },
  he: {
    kicker: "אבטחה", title: "אנליטיקס",
    chart1_title: "ניסיונות התחברות כושלים", chart1_sub: "7 הימים האחרונים",
    chart2_title: "התחברויות לפי שעה ביום", chart2_sub: "ממוצע יומי, אתמול",
    legend_success: "הצליחו", legend_failed: "נכשלו",
    kpi_failed: "התחברויות כושלות", kpi_failed_sub: "לעומת אתמול",
    kpi_blocked: "נחסמו (בוט)", kpi_blocked_sub: "לעומת אתמול",
    kpi_sessions: "סשנים פעילים", kpi_sessions_sub: "כרגע",
    kpi_risk: "ציון סיכון ממוצע", kpi_risk_sub: "סולם 0–10",
    table_title: "אירועים שסומנו לאחרונה", table_sub: "החדשים ביותר קודם",
    col_time: "שעה", col_user: "משתמש", col_location: "מיקום", col_device: "מכשיר", col_status: "סטטוס", col_risk: "סיכון",
    status_success: "תקין", status_mfa: "MFA", status_failed: "נכשל", status_blocked: "נחסם",
  },
};

const ICON = {
  alertTriangle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z"/><path d="m9.5 12 2 2 3.5-4"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
};

// ---- anStackedBar(), lifted verbatim from app.js (2026-09-16 div-based version) ----
function anNiceMax(max) {
  if (max <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * p;
}
function escapeAttr(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;"); }
function anStackedBar(hours, success, failed, colorA, colorB, t) {
  const n = hours;
  const totals = success.map((v, i) => v + failed[i]);
  const max = anNiceMax(Math.max(...totals));
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  const grid = ticks.map((v) => {
    const topPct = (100 - (v / max) * 100).toFixed(2);
    return `<div class="barchart__gridline" style="top:${topPct}%"></div>
      <span class="barchart__gridlabel" style="top:${topPct}%">${v}</span>`;
  }).join("");
  const cols = [];
  for (let i = 0; i < n; i++) {
    const sPct = ((success[i] / max) * 100).toFixed(2);
    const fPct = ((failed[i] / max) * 100).toFixed(2);
    const tip = escapeAttr(`${String(i).padStart(2, "0")}:00 — ${t.legend_success}: ${success[i]}, ${t.legend_failed}: ${failed[i]}`);
    cols.push(`<div class="barchart__col">
        <div class="barchart__stack">
          ${success[i] > 0 ? `<div class="barchart__seg barchart__seg--success" style="height:${sPct}%;background:${colorA}"></div>` : ""}
          ${failed[i] > 0 ? `<div class="barchart__seg barchart__seg--failed" style="height:${fPct}%;background:${colorB}"></div>` : ""}
        </div>
        <div class="barchart__hit an-hit" data-tip="${tip}" tabindex="0" role="img" aria-label="${tip}"></div>
      </div>`);
  }
  const xlabels = Array.from({ length: n }, (_, h) =>
    `<span class="barchart__xlabel">${h % 6 === 0 ? String(h).padStart(2, "0") : ""}</span>`).join("");
  return `<div class="barchart" dir="ltr" data-an-bar>
    <div class="barchart__grid">${grid}</div>
    <div class="barchart__cols">${cols.join("")}</div>
    <div class="barchart__xlabels">${xlabels}</div>
  </div>`;
}
function anSparkline(values, endColorVar) {
  const W = 96, H = 28, pad = 3;
  const max = Math.max(...values), min = Math.min(...values);
  const span = max - min || 1;
  const x = (i) => pad + ((W - pad * 2) * i) / (values.length - 1);
  const y = (v) => H - pad - ((H - pad * 2) * (v - min)) / span;
  const path = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = [x(values.length - 1), y(values[values.length - 1])];
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="stat-tile__spark" aria-hidden="true">
    <path d="${path}" fill="none" stroke="var(--pl-fg-muted)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.5" fill="var(${endColorVar})"/>
  </svg>`;
}
function anStatTile(icon, label, sub, value, delta, deltaCls, spark) {
  return `<div class="card stat-tile">
    <div class="card__ico">${icon}</div>
    <span class="stat-tile__label">${label}</span>
    <div class="stat-tile__row">
      <span class="stat-tile__value">${value}</span>
      ${spark}
    </div>
    <div class="stat-tile__foot">
      <span class="stat-tile__delta ${deltaCls}">${delta}</span>
      <span class="stat-tile__sub">${sub}</span>
    </div>
  </div>`;
}

const SUCCESS = [3,2,1,1,1,2,6,14,22,28,31,30,27,29,31,30,26,22,18,14,11,8,6,4];
const FAILED  = [1,1,2,3,2,1,1,1,0,1,0,1,0,1,0,1,1,0,1,1,0,1,1,0];

function chartCard(t, lang) {
  const dir = lang === "he" ? "rtl" : "ltr";
  return `<div dir="${dir}" class="sb-pad" style="max-width:1160px">
    <div class="card chart-card">
      <div class="chart-card__head">
        <div><h3>${t.chart2_title}</h3><p class="chart-card__sub">${t.chart2_sub}</p></div>
        <div class="chart-legend">
          <span class="chart-legend__item"><span class="chart-legend__swatch" style="background:var(--pl-accent)"></span>${t.legend_success}</span>
          <span class="chart-legend__item"><span class="chart-legend__swatch" style="background:var(--pl-stage-dropped)"></span>${t.legend_failed}</span>
        </div>
      </div>
      <div class="chart-card__canvas">${anStackedBar(24, SUCCESS, FAILED, "var(--pl-accent)", "var(--pl-stage-dropped)", t)}</div>
    </div>
  </div>`;
}

export const BarChart = {
  name: "Bar chart — hourly logins (div-based)",
  render: () => chartCard(T.en, "en"),
};

export const BarChartHebrew = {
  name: "Bar chart — RTL page, chart pinned LTR",
  render: () => chartCard(T.he, "he"),
};

// Forced-open hover state (docs only) — same idiom as Tooltip.stories.js's
// AlwaysOpenPreview: inline the :hover recipe directly so the interaction is
// visible in a static capture instead of relying on a real mouseover.
export const BarChartHoverState = {
  name: "Bar chart — hover + tooltip (docs)",
  parameters: {
    docs: { description: { story: "Forced-open so docs/screenshots capture the hover wash + tooltip; not for production. Live behavior: pointerenter/focus on `.barchart__hit` shows the shared `.chart-tooltip` element and the same 8%-tint wash `.an-hit:hover` already used by the line chart's dots." } },
  },
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "sb-pad";
    wrap.style.maxWidth = "1160px";
    wrap.innerHTML = chartCard(T.he, "he");
    const hit = wrap.querySelectorAll(".barchart__hit")[10]; // 10:00
    hit.style.background = "color-mix(in srgb, var(--pl-fg) 8%, transparent)";
    const tip = document.createElement("div");
    tip.className = "chart-tooltip";
    tip.style.position = "absolute";
    tip.textContent = "10:00 — הצליחו: 31, נכשלו: 0";
    const col = hit.closest(".barchart__col");
    const rect = col.getBoundingClientRect();
    tip.style.top = "40%";
    tip.style.insetInlineStart = "44%";
    wrap.querySelector(".barchart").style.position = "relative";
    wrap.querySelector(".barchart").appendChild(tip);
    return wrap;
  },
};

export const KpiTiles = {
  name: "KPI tiles (stat-tile + sparkline)",
  render: () => `<div class="sb-pad" style="max-width:1160px">
    <div class="kpi-row">
      ${anStatTile(ICON.alertTriangle, T.en.kpi_failed, T.en.kpi_failed_sub, 47, "+6", "stat-tile__delta--bad", anSparkline([31,28,40,35,52,44,47], "--pl-stage-dropped"))}
      ${anStatTile(ICON.shield, T.en.kpi_blocked, T.en.kpi_blocked_sub, 12, "-3", "", anSparkline([18,15,14,16,12,13,12], "--pl-fg-secondary"))}
      ${anStatTile(ICON.users, T.en.kpi_sessions, T.en.kpi_sessions_sub, 214, "+19", "", anSparkline([180,190,175,205,198,220,214], "--pl-fg-secondary"))}
      ${anStatTile(ICON.check, T.en.kpi_risk, T.en.kpi_risk_sub, "3.2", "-0.4", "stat-tile__delta--good", anSparkline([4.1,3.9,3.6,3.8,3.4,3.3,3.2], "--pl-stage-confirmed"))}
    </div>
    <p class="ss-note" style="margin-top:var(--space-5);text-align:start">
      REUSE — .card + .stat-tile compose the existing card base; label/value/delta/sub are real HTML,
      already canvas-editable. The sparkline stays SVG on purpose (7-point decorative trend glyph,
      same carve-out as an icon's internal paths) — its own outer &lt;svg&gt; is still a normal,
      fully draggable/resizable block element.
    </p>
  </div>`,
};

const EVENTS = [
  { time: "23:41", user: "d.cohen@example.com", ip: "84.110.12.4", loc: "Tel Aviv, IL", device: "Chrome · Windows", status: "success", risk: 1.2 },
  { time: "22:03", user: "unknown", ip: "45.155.204.10", loc: "Unknown", device: "curl/8.4.0", status: "blocked", risk: 9.1 },
  { time: "19:57", user: "n.avraham@example.com", ip: "5.29.14.201", loc: "Haifa, IL", device: "Safari · macOS", status: "mfa", risk: 4.0 },
  { time: "18:22", user: "s.mizrahi@example.com", ip: "31.154.90.3", loc: "Ramat Gan, IL", device: "Chrome · Android", status: "failed", risk: 6.4 },
];
const STATUS_TOKEN = { success: "ok", mfa: "warn", failed: "danger", blocked: "danger" };

export const EventsTable = {
  name: "Recently flagged events (reuses .roster__table)",
  parameters: {
    docs: { description: { story: "REUSE, not a new component — this is `.roster__table` with a 6-column colgroup. Merged person/IP cell (`.roster__stack` + `.roster__person`) matches the sandbox's own live roster shape, NOT the productlab-site Roster.stories.js file, which is stale (9 columns, separate name/email cells) — see the file-level comment above. Fix that story before treating it as ground truth." } },
  },
  render: () => {
    const t = T.en;
    const body = EVENTS.map((e) => `<tr class="roster__row">
      <td data-label="${t.col_time}" dir="ltr">${e.time}</td>
      <td data-label="${t.col_user}" class="roster__stack">
        <span class="roster__person">
          <span class="roster__pname" dir="ltr">${e.user}</span>
          <span class="roster__pmail" dir="ltr">${e.ip}</span>
        </span>
      </td>
      <td data-label="${t.col_location}">${e.loc}</td>
      <td data-label="${t.col_device}">${e.device}</td>
      <td data-label="${t.col_status}"><span class="roster__badge roster__badge--${STATUS_TOKEN[e.status]}">${t["status_" + e.status]}</span></td>
      <td data-label="${t.col_risk}" dir="ltr" style="font-variant-numeric:tabular-nums">${e.risk.toFixed(1)}</td>
    </tr>`).join("");
    return `<div class="sb-pad" style="max-width:1160px">
      <div class="roster__scroll">
        <table class="roster__table roster__table--fixed">
          <colgroup><col style="width:9%"/><col style="width:26%"/><col style="width:20%"/><col style="width:20%"/><col style="width:14%"/><col style="width:11%"/></colgroup>
          <thead><tr>
            <th>${t.col_time}</th><th>${t.col_user}</th><th>${t.col_location}</th>
            <th>${t.col_device}</th><th>${t.col_status}</th><th>${t.col_risk}</th>
          </tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>`;
  },
};

/* ============================================================================
 * OPEN ITEM, NOT FIXED HERE — flagged, not silently left (2026-09-16):
 * productlab-site/stories/Roster.stories.js is CONFIRMED stale against the
 * real productlab-site/app.js renderRoster(): story has 9 columns (separate
 * name + email + status + "signed in?" cells, colspan=9 detail row), live is
 * 7 columns (merged .roster__stack/.roster__person name+email cell, merged
 * access+signed-in pill, colgroup+.roster__table--fixed, colspan=7, inline
 * textarea editing + a real notes-list widget instead of the story's plain
 * <input>/<textarea> fields). This is a different repo (productlab-site) from
 * this sandbox, out of scope to fix here per this session's "never touch
 * productlab-site" constraint — needs a session with that repo attached to
 * rewrite Roster.stories.js to match the live 7-column shape. Do not use the
 * current Roster.stories.js as a reference for any new table work until it's
 * fixed.
 * ========================================================================== */
