/* =============================================================================
   PRODUCT LAB — one-pager render + EN/HE toggle + RTL.
   ALL copy lives in the I18N object below (final copy from Copywriter,
   productlab-onepager-copy.md, 2026-08-03). To update copy, edit strings here.
   OPEN: Section 7 bio ([X years]/role) + Section 8 testimonials are labeled
   placeholders for OFIR to fill. Contact is WhatsApp-only (no booking funnel);
   WA number is live: 054-2259730.
   ========================================================================== */

// WhatsApp only — no booking funnel. Ofir wants direct contact.
const WA_URL   = "https://wa.me/972542259730";                    // Ofir: 054-2259730
// Same relative target the gated #/prep kit tile already links to (content.js
// EN + HE, both `href: "assets/product-lab.zip", download: true`). #/kit
// (public, ungated) reuses the identical URL so there is exactly one zip
// target on the whole site, not a second one that can drift from the first.
const KIT_ZIP_URL = "assets/product-lab.zip";

// When a gated redirect bounces a signed-out visitor home, this asks wireStudent
// to auto-open the sign-in modal on the next render.
let pendingStudentOpen = false;

/* ---- Real auth: Supabase (Google sign-in) + Row-Level Security ----------- *
   The old client-side SHA-256 cohort gate is retired. Sign-in is now real
   Google OAuth via Supabase; the database (RLS) is the actual gate, not the UI.
   The anon key is a PUBLIC identifier and is safe to ship in this static file:
   what a browser can read/write is decided by RLS, not by hiding this string.
   NEVER put the service_role key or the DB password here.                     */
const SUPABASE_URL = "https://qyeacmmfrbqimjpbgcal.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZWFjbW1mcmJxaW1qcGJnY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NDczNjQsImV4cCI6MjEwMjAyMzM2NH0.WNLCixQe1XRnzddtjDtcWks4BnSVbIYZHStBiDBX8ho";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* Admin is gated by EMAIL — the same forge-proof gate RLS uses (it reads the
   signed JWT email), so the UI and the data gate always agree. This is NOT a
   security boundary (that's RLS); it only decides what the UI paints. The
   profile.role column ('superadmin') is future-proofing, not the gate. */
const ADMIN_EMAILS = ["ofr.rsnk@gmail.com"];

/* Local dev flag. Google OAuth can't return to localhost (its redirect is locked
   to productlab.studio), so on localhost we use a fake, Google-free sign-in for
   testing. This is INERT in production (hostname is never localhost there), where
   real Google OAuth + Supabase RLS are the only gate — so it's safe to ship. */
const IS_LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";
const LOCAL_TIER_KEY = "pl_local_tier";

/* ---- Analytics (GA4) ------------------------------------------------------
   Thin wrapper so every call site is one line and NOTHING here can ever throw
   or block the page: gtag may be undefined (blocked/failed to load) and
   IS_LOCAL traffic (dev/testing) is always skipped so it never pollutes real
   numbers. ga() is the generic event sender; gaPageview() is SPA-aware (see
   route() below) and dedupes so a re-render of the SAME route (auth refresh,
   a modal close) never double-counts a pageview. */
function ga(name, params) {
  if (IS_LOCAL) return;
  try { if (typeof gtag === "function") gtag("event", name, params || {}); } catch (e) {}
}
let GA_LAST_PATH = null;
function gaPageview(path, title) {
  if (GA_LAST_PATH === path) return;
  GA_LAST_PATH = path;
  ga("page_view", { page_path: path, page_title: title || document.title });
}

/* AUTH is the single source of truth for "who am I" this render.
   Access is INVITE-ONLY. After sign-in the DB function my_access() returns the
   tier; the client never computes it. AUTH.tier is one of:
   - 'admin'   = signed-in email is the admin (Ofir) → full content + users mgmt
   - 'student' = email is on the allowlist AND confirmed → full content vault
   - null      = signed out OR bounced (denied). When bounced, AUTH.denied=true
                 so the home page can show the "not registered" notice.
   The real wall is Supabase RLS (is_approved()); this only decides what to paint. */
let AUTH = { user: null, tier: null, denied: false };
// Sticky one-shot: a denied sign-in sets this true so the "not registered"
// notice survives the sign-out-triggered re-render (which resets AUTH.denied).
// wireNotices() shows it once, then clears it.
let deniedNotice = false;

/* Resolve the live session into AUTH via the my_access() RPC. Called before the
   first paint and again on every auth-state change (sign-in/out). A 'denied'
   result signs the user out and flags AUTH.denied for the notice. */
async function loadAuth() {
  // Local dev: fake, Google-free auth. Tier comes from ?tier=admin|student|denied
  // or, after you "sign in" via the modal, from localStorage. NO tier = signed
  // OUT, so the sign-in modal itself is reachable to review. Inert in production.
  if (IS_LOCAL) {
    const raw = new URLSearchParams(location.search).get("tier") || localStorage.getItem(LOCAL_TIER_KEY);
    if (raw === "denied") { AUTH = { user: null, tier: null, denied: true }; return AUTH; }
    AUTH = raw
      ? { user: { id: "local", email: ADMIN_EMAILS[0] }, tier: raw, denied: false }
      : { user: null, tier: null, denied: false };
    return AUTH;
  }
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { AUTH = { user: null, tier: null, denied: false }; return AUTH; }
    // One question to the database: "what may I see?" → admin | student | denied.
    const { data: tier, error } = await sb.rpc("my_access");
    if (error || tier === "denied") {
      deniedNotice = true;                  // sticky: outlives the sign-out re-render
      await sb.auth.signOut();              // global scope: clears + revokes the session
      AUTH = { user: null, tier: null, denied: true };
      return AUTH;                          // caller shows the "not registered" notice
    }
    AUTH = { user: session.user, tier, denied: false }; // 'student' | 'admin'
  } catch (e) {
    // On any failure, fall back to signed-out rather than leaking a wrong tier.
    AUTH = { user: null, tier: null, denied: false };
  }
  return AUTH;
}

/* ---- Icons (inline, currentColor) --------------------------------------- */
const I = {
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.02h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.24 8.24 0 0 1-1.26-4.05c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.79.97-.14.16-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.76-1.85-.2-.48-.4-.42-.56-.43l-.48-.01c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.16 1.73 2.64 4.19 3.7.58.25 1.04.4 1.4.51.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  // Destructive delete only - distinct from `x` (close/dismiss). DSL-confirmed
  // new icon, 2026-09-03 (roster row delete + confirm dialog).
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-.87 14.14A2 2 0 0 1 16.14 22H7.86a2 2 0 0 1-1.99-1.86L5 6M10 11v6M14 11v6"/></svg>',
  chev: '<svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.99.14 4 4 0 0 0-1.66 6.16A3.5 3.5 0 0 0 6 18a3 3 0 0 0 6 0V5ZM12 5a3 3 0 1 1 5.99.14 4 4 0 0 1 1.66 6.16A3.5 3.5 0 0 1 18 18a3 3 0 0 1-6 0"/></svg>',
  flow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18M7 15l4-4 3 3 5-6"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 16-9 5-9-5V8l9-5 9 5v8ZM3.3 7 12 12l8.7-5M12 22V12"/></svg>',
  repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3"/></svg>',
  laptop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9M2 20h20"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M5 12H1M23 12h-4M6.3 6.3 3.5 3.5M20.5 20.5l-2.8-2.8M17.7 6.3l2.8-2.8M3.5 20.5l2.8-2.8"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  seat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3M5 9a2 2 0 0 0-2 2v5h18v-5a2 2 0 0 0-2-2M5 16v3M19 16v3"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>',
  hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2a8 8 0 0 1-7.4-4.9L3 15"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  claude: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7v10l10 5 10-5V7L12 2ZM2 7l10 5 10-5M12 22V12"/></svg>',
  login: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.87l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z"/></svg>',
  slides: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3.2-5.6 7-5.6s7 2 7 5.6"/></svg>',
  // Puppet-shaped placeholder silhouette (Marketing Designer, 2026-09-07): the
  // egg-shaped head + rounded flared body reads as "one of the felt puppets,"
  // deliberately generic (no hat/beard/hair) so it never points at one named
  // character. Solid fill, no strokes, on purpose - Ofir wants a single flat
  // color that signals "placeholder," not a rendered character.
  puppetSilhouette: '<svg viewBox="0 0 24 24" fill="currentColor"><ellipse cx="12" cy="7" rx="4" ry="4.6"/><path d="M12 12.2c-3.4 0-6.2 1.9-7.4 4.6C4.2 17.7 4 18.7 4 19.8v.7c0 .8.6 1.5 1.5 1.5h13c.8 0 1.5-.7 1.5-1.5v-.7c0-1.1-.2-2.1-.6-3-1.2-2.7-4-4.6-7.4-4.6z"/></svg>',
  // Google "G" - brand colors are intentional (not tokenized: this is a third-party logo).
  google: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M23.52 12.27c0-.82-.07-1.6-.2-2.36H12v4.47h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.74Z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.11A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.28a12 12 0 0 0 0 10.75l3.99-3.11Z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.28 6.63l3.99 3.1C6.22 6.86 8.87 4.75 12 4.75Z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9s1.3-6.5 3.8-9Z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',
};

/* ---- COPY (final, Copywriter 2026-08-03) -------------------------------- */
const I18N = {
  he: {
    cta_wa: "דברו איתי",
    nav_student: "כניסת תלמידים",
    nav_signout: "יציאה",
    nav_account: "התפריט שלך",
    hero_chip: "בהזמנה בלבד. בקבוצות קטנות.",
    hero_title_a: "מרעיון למציאות. עולם חדש של עבודה עם ",
    hero_title_mark: "סוכני AI",
    hero_title_b: ".",
    hero_sub: "ב-3 שעות תקימו עם Claude צוות סוכני AI, עם זיכרון משותף, ותתחילו לבנות איתו. בזמן אמת.",
    hero_points: ["זיכרון משותף", "בלי קוד", "צוות שנשאר איתכם"],
    /* new one-view hero (2026-08-20): headline split into its two sentences,
       sub split into line units the design controls, register CTA */
    hero_t1: "מרעיון למציאות.",
    hero_t2a: "עולם חדש של עבודה עם ",
    hero_sub_lines: ["ב-3 שעות תקימו עם Claude צוות סוכני AI,", "עם זיכרון משותף, ותתחילו לבנות איתו.", "בזמן אמת."],
    hero_cta: "הרשמה למחזור הבא",
    hero_cta2: "איזה סוכנים מתאימים לי?",
    session: {
      badge: "המפגש האחרון",
      when_label: "מתי?",
      when_value: ["יום ה׳, 3 בספטמבר", "17:30-20:30", "מפגש יחיד, 3 שעות"],
      where_label: "איפה?",
      where_value: ["אונליין בזום", "מכל מקום בעולם"],
      cta: "הרשמה",
      limited_note: "אזל",
    },
    // Cohort #2, added 2026-08-31 (date+price decided by Ofir/CMO, shared-brain
    // IN FLIGHT 2026-08-31 [cmo]). Same shape as `session` above + a price column,
    // rendered directly beneath it — the ONLY place price appears on the page.
    session2: {
      badge: "המחזור הבא",
      when_label: "מתי?",
      when_value: ["יום ה׳, 15 באוקטובר", "17:30-20:30", "מפגש יחיד, 3 שעות"],
      where_label: "איפה?",
      where_value: ["אונליין בזום", "מכל מקום בעולם"],
      price_label: "מחיר",
      price_value: ["₪600", "לאדם"],
      cta: "הרשמה",
      limited_note: "מקומות מוגבלים",
    },

    why_eyebrow: "למה עכשיו",
    why_heading: "אדם אחד, יותר מעבודה אחת.",
    why_tiles: [
      { t: "הכול עליך", b: "מוצר, עיצוב והוצאה לאוויר, הכול עובר דרכך. צוות סוכנים הוא הדרך שבה אדם אחד מכסה עבודה של כמה אנשים, בלי להעביר שום דבר הלאה." },
      { t: "מיומנות, לא טריק", b: "עובדים ישירות מול Claude, עם היתרונות והמגבלות על השולחן. יוצאים עם שיטה עובדת לתזמור צוות סוכנים על עבודת מוצר ועיצוב אמיתית, לא עוד פרומפטים גנריים." },
      { t: "יתרון ההתחלה", b: "עולם הסטארטאפים נע לכיוון של אנשים וסוכנים שבונים זה לצד זה. כדאי להתרגל לעבוד ככה עכשיו, כל עוד זה עדיין יתרון ולא ברירת המחדל של כולם." },
    ],

    walk_eyebrow: "מה לוקחים הביתה",
    walk_title: "עם מה יוצאים מפה",
    walk_items: [
      { t: "צוות סוכני AI אישי, מותאם בדיוק אליכם", b: "יוצאים עם צוות שכבר מכיר את הפרויקט שלכם, ועם חבר צוות אחד שהגדרתם בעצמכם מאפס." },
      { t: "זיכרון משותף שכל הצוות עובד ממנו", b: "כל הסוכנים עובדים מאותו מקור ידע, מכירים את הפרויקט ומשתפים ביניהם הקשר ומידע לאורך כל העבודה." },
      { t: "הפרויקט הראשון שכבר התחלתם לבנות", b: "כבר במהלך הסדנה תתחילו לעבוד עם הצוות שבניתם על הפרויקט שלכם, במקום לצאת רק עם ידע תיאורטי." },
      { t: "שיטת עבודה שתמשיך איתכם גם אחרי הסדנה", b: "תצאו עם צוות, זיכרון ותהליך עבודה שתוכלו להמשיך לפתח ולהשתמש בהם גם בפרויקטים הבאים." },
    ],

    who_eyebrow: "למי זה מתאים",
    who_for_title: "אם אתם רוצים לבנות בעצמכם, אבל לא לבד.",
    who_intro: "לא משנה אם אתם אנשי מוצר ועיצוב, יזמים, בוני מוצרים או אנשי מקצוע שרוצים לעבוד אחרת. אם אתם רוצים להפוך את ה-AI לשותף אמיתי בתהליך העבודה שלכם, אתם במקום הנכון.",
    who_tiles: [
      { t: "אנשי מוצר ועיצוב", b: "בין אם אתם מעצבי מוצר, מובילי עיצוב או מנהלי מוצר, הסדנה תראה לכם איך לעבוד עם צוות סוכני AI שמרחיב את היכולות שלכם ומשאיר אתכם להתמקד במה שאף כלי לא עושה: לחשוב, להחליט ולהוביל." },
      { t: "בונים ויזמים", b: "יש לכם רעיון, מוצר או עסק שאתם רוצים לבנות או לקדם. בסדנה תבנו צוות סוכני AI שחושב איתכם, מתכנן, מאתגר רעיונות ועוזר להפוך אותם למוצר אמיתי." },
      { t: "מרחיבי אופקים", b: "אם אתם מרגישים שהדרך שבה עובדים משתנה, ורוצים להבין איך באמת עובדים עם AI, לא רק לשאול שאלות אלא לבנות תהליך עבודה שלם, הסדנה הזו בשבילכם." },
    ],
    who_not: "מתאים פחות למי שמחפש כפתור קסם. אם בא לך להפשיל שרוולים ולבנות בעצמך, יש לך מקום סביב השולחן.",

    agenda_eyebrow: "שלושה שלבים",
    agenda_title: "שלוש שעות. בסוף הסדנה תצאו עם צוות סוכני AI שעובד איתכם.",
    agenda_intro: "בשלושה שלבים נבנה יחד את מערכת העבודה החדשה שלכם, מהיכרות עם השיטה, דרך הקמת צוות סוכני AI אישי ועד לבניית הפרויקט הראשון שלכם.",
    agenda_phases: [
      { time: "שלב ראשון", t: "מתחילים", b: "מבינים את שיטת העבודה, מכירים את הכלים שנשתמש בהם ומניחים את היסודות לצוות שנבנה בהמשך." },
      { time: "שלב שני", t: "פוגשים את הצוות", b: "פותחים את הערכה ומגלים שהצוות כבר בפנים, מחובר לזיכרון משותף ומוכן לעבוד. משם בונים יחד." },
      { time: "שלב שלישי", t: "בונים עם הצוות", b: "מפעילים את הצוות שבניתם ומתחילים לעבוד יחד על הפרויקט הראשון שלכם." },
    ],
    agenda_toggle: "מה יש בפנים",
    agenda_p1_items: [
      { t: "מבינים את התמונה הגדולה", b: "מה השתנה בעולם ה-AI, למה סוכני AI הפכו לכלי עבודה אמיתי ואיך זה משפיע על הדרך שבה בונים מוצרים." },
      { t: "מכירים את כלי העבודה", b: "מתי משתמשים ב-Claude, מתי ב-ChatGPT, מתי ב-Gemini, ואיך כל כלי משתלב בתהליך העבודה." },
      { t: "חושבים כמו צוות", b: "למה מתחילים מתפקיד ברור, ממשיכים לכישורים ולכלים, ורק אחר כך בונים את הזיכרון המשותף." },
      { t: "מקימים את המוח המשותף", b: "יוצרים בסיס ידע משותף שמאפשר לכל הסוכנים לעבוד מאותו הקשר ולהשתפר לאורך הדרך." },
      { t: "מבינים את הדרך", b: "מכירים את שלבי הסדנה ומבינים איך כל חלק מתחבר לתהליך עבודה אחד." },
    ],
    agenda_p2_items: [
      { t: "מכירים את הצוות", b: "שלושה שותפים כבר בפנים: שותף טכני, מנהל מוצר ומעצב מוצר, כל אחד עם תפקיד ברור וכלים משלו." },
      { t: "רואים את המוח המשותף", b: "כל הידע, ההחלטות והתובנות נשמרים במקום אחד, וכל הצוות כבר קורא וכותב ממנו." },
      { t: "פותחים את הערכה", b: "מחברים את Claude לתיקיית הערכה שתלווה אתכם גם אחרי הסדנה, בלי שום התקנה נוספת." },
      { t: "רואים איך הם מתואמים", b: "כל שותף עובד בשיחה נפרדת משלו, וקודם קורא מה שהאחרים כתבו בזיכרון המשותף. ככה הם נשארים מסונכרנים בלי לדבר ישירות." },
      { t: "מריצים בדיקת התקנה", b: "מריצים `/check`, והמערכת מאשרת שהצוות מותקן ופעיל על המכונה שלכם." },
    ],
    agenda_p3_items: [
      { t: "נותנים בריף", b: "מסבירים למנהל המוצר מה רוצים לבנות, והוא מתחיל לתעדף, לכוון ולתזמר את העבודה." },
      { t: "רואים את הצוות בפעולה", b: "כל שותף בצוות עובד בשיחה משלו, אבל קורא קודם מה שהאחרים כתבו בזיכרון המשותף וממשיך משם." },
      { t: "בונים את הפרויקט הראשון", b: "הופכים את הרעיון שלכם לעמוד נחיתה עובד, יחד עם צוות סוכני ה-AI שכבר איתכם." },
      { t: "מוסיפים שותף משלכם", b: "עונים בהודעה אחת מי הוא, מה התפקיד שלו ומה האופי שלו, והמשימה הראשונה שלו היא לחוות דעה על העמוד שכבר בניתם." },
      { t: "ממשיכים גם אחרי הסדנה", b: "יוצאים עם צוות סוכני AI אישי שתוכלו להמשיך להתייעץ איתו, לבנות איתו ולהרחיב אותו גם אחרי שהמפגש מסתיים." },
    ],

    proof_eyebrow: "לא מצגת. מוצרים אמיתיים.",
    proof_title: "כל מה שאתם רואים כאן נבנה באותה הדרך.",
    proof_lead: "כל פרויקט בעמוד הזה נבנה בעזרת צוות סוכני AI, זיכרון משותף ותהליך העבודה שתלמדו בסדנה.",
    proof_self_tag: "הדף הזה",
    proof_self_t: "הדף הזה",
    proof_self_b: "את הדף הזה, ואת כל הסדנה, בניתי עם אותו סוג של צוות סוכני AI שתקימו בעצמכם.",
    proof_glimps_tag: "מוצר אמיתי",
    proof_glimps_t: "Glimps",
    proof_glimps_b: "מוצר אמיתי, שנבנה ככה. תראו בעצמכם.",
    proof_glimps_link: "לצפייה ב-Glimps",

    ofir_eyebrow: "מי תכירו בסדנה",
    roster_title: "אני, והצוות שאיתו אני בונה כל יום.",
    lead_label: "מוביל הסדנה",
    crew_label: "צוות סוכני ה-AI שלי",
    crew_title: "אלה השותפים שאיתם אני בונה כל מוצר.",
    crew_intro: "לכל אחד מהשותפים שלי יש תחום אחריות אחר. יחד הם עוזרים לי לחשוב, לקבל החלטות, לעצב ולבנות מוצרים. במהלך הסדנה תבנו גרסה משלכם לאותו צוות, שתותאם בדיוק לאופן שבו אתם עובדים.\n\nבסוף הסדנה, אלה כבר לא יהיו רק השותפים שלי. הם יהיו גם שלכם.",
    crew_close: "כשתצאו מכאן, יהיה גם לכם צוות כזה. וכבר לא תבנו לבד.",
    ofir_name: "אופיר רושינק",
    ofir_role: "ראש הצוות",
    agents: [
      { img: "crew-designer", tag: "המעצב", role: "מעצב המוצר", b: "כשמגיע הזמן לעצב, הוא השותף הראשון שלי. הוא עובד מתוך ה-Design System, שומר על עקביות, מציע פתרונות UX ומוודא שכל מסך ברור, שימושי ומוכן לבנייה." },
      { img: "crew-strategist", tag: "האסטרטג", role: "מנהל המוצר", b: "כשאני לא בטוח מה לבנות קודם, אני מתייעץ איתו. הוא עוזר לחדד רעיונות, לתעדף משימות, לאתגר הנחות יסוד ולשמור שכל החלטה מקדמת את המוצר בכיוון הנכון." },
      { img: "crew-architect", tag: "הארכיטקט", role: "המהנדס הראשי", b: "כשיש לי דילמה טכנית, אני מתחיל איתו. הוא עוזר לי לבחור את הגישה הנכונה, לחשוב על הארכיטקטורה ולוודא שכל פתרון שנבחר באמת ניתן למימוש, יציב ומוכן לגדול יחד עם המוצר." },
    ],
    ofir_bio: "במשך שנים בניתי מוצרים דיגיטליים והובלתי צוותי Product Design. אבל השינוי המשמעותי ביותר שעברתי לא היה תפקיד חדש, אלא דרך עבודה חדשה.\n\nהיום אני כבר לא בונה מוצרים לבד. אני עובד עם צוות סוכני AI שבניתי לעצמי - שותפים לחשיבה, לתכנון, לעיצוב ולבנייה. יחד בנינו את Product Lab, את Glimps, את האתר שאתם נמצאים בו עכשיו, ואפילו חלקים מהסדנה עצמה.",
    ofir_why: "עכשיו אני רוצה לעזור גם לכם לבנות לעצמכם צוות כזה.",

    quotes_eyebrow: "המלצות",
    quotes_title: "ממי שכבר עבר את זה",
    quotes: [
      { q: "יצאתי מצוידת עם אנשי צוות (agents) מקצועיים ברמה הכי גבוהה, הצלחתי ליצור תוצרים משלי ישר אחרי המפגש ולקבל אינפוט שלא הצלחתי לקבל לפני. ממליצה בחום.", n: "Ella Cohen", m: "Lead Product Designer", img: "testimonial-ella", li: "https://www.linkedin.com/in/ella-cohen-736698a8/" },
      { q: "אופיר לימד אותי לבנות ולנהל צוות של סוכני בינה מלאכותית (AI Agents) אוטונומיים, ללא צורך בכתיבת קוד. בעבודה משותפת הוא עזר לי לבנות בסיס עבודה מוצק לרעיון שליווה אותי הרבה זמן ולא הצלחתי להוציא לפועל, ומשם כבר יצאתי לדרך. ממליצה בחום למי שרוצה ללמוד איך באמת להשתמש ב-AI כדי לבנות דברים, לא רק לדבר עליהם.", n: "Rona Galezer", m: "Venture Builder & Impact Investor", img: "testimonial-rona", li: "https://www.linkedin.com/in/ronabenziongalezer/" },
      // Cohort #1 graduate, sent to Ofir via WhatsApp verbatim — do not reword.
      // Role/title TODO (CSO asked Ofir, pending); no img/li yet — Ofir adding
      // a LinkedIn link + photo LATER, component already supports both as optional.
      { q: "הסדנה הייתה מעולה בגלל החיבור בין Product, Design ו-AI. עזרה לי להבין בצורה פרקטית איך אפשר להשתמש בסוכני AI כדי לייעל תהליכים, לחלק משימות בין סוכנים עם התמחויות שונות, ולבנות תהליך עבודה שמאפשר להתקדם מפיצוח רעיון ועד בניית מוצר בצורה הרבה יותר מהירה ואפקטיבית.", n: "דקל הלל", m: "Product Designer", img: "testimonial-dekel", li: "https://www.linkedin.com/in/dekelhillel/" },
      // Sent to Ofir via WhatsApp verbatim on 2026-09-08, do not reword.
      // Role confirmed by Ofir off Ilya's real LinkedIn screenshot ("Ilya Boruhov · Product Designer ·
      // Mentor"). Photo sent by Ofir via Drive same day (440x440 headshot).
      { q: "סדנה מעולה וסופר פרקטית של אופיר! בסדנה צוללים לעומק של בניית סוכני AI ב-Claude ולומדים איך ליצור סוכנים בעלי אופי והגדרת תפקיד ספציפית שיודעים לתקשר זה עם זה, לשאול את השאלות הנכונות ולדייק את הביצוע מקצה לקצה. כלי חובה לעולמות הפרודקט לכל מנהל או מעצב מוצר שרוצה לבנות מוצרים איכותיים במינימום זמן.", n: "איליה בורוכוב", m: "Product Designer", img: "testimonial-ilya", li: "https://www.linkedin.com/in/ilyaboruhov/" },
      // Sent to Ofir via WhatsApp verbatim on 2026-09-08 (message opened with a plain
      // "היי בטח!!!!" greeting reply — stripped, not part of the testimonial, same trap
      // as the Ilya quote). Role confirmed off her real LinkedIn (linkedin.com/in/adi-lev/).
      // Photo: real headshot from Ofir (LinkedIn photo), cropped 440x440 to match the
      // Dekel/Ilya treatment. Source: campaign/assets/adi-lev-source.png.
      { q: "הסדנה של אופיר נתנה לי בסיס מצוין להתחיל לעבוד נכון עם AI Agents ולהכניס אותם לתהליכי העבודה שלי. אופיר העביר את התוכן בצורה מקצועית, מעמיקה ובגובה העיניים, משלב ההבנה הבסיסית ועד להתנסות פרקטית ועבודה אמיתית עם סוכנים. יצאתי עם בסיס של agents שאני יכולה כבר להתחיל לעבוד איתם ולשפר אותם, ובעיקר עם ההבנה שפשוט צריך להתחיל ולתרגם את הידע לעבודה מעשית. ממליצה בחום למעצבי ומנהלי מוצר שרוצים להתחיל להשתמש ב-AI בצורה פרקטית ולשלב אותו בעבודה היומיומית שלהם.", n: "עדי לב", m: "Product Designer at Onit Security", img: "testimonial-adi", li: "https://www.linkedin.com/in/adi-lev/" },
    ],

    // "יום בחייו של בוגר Product Lab" — copy v5 (Copywriter, 2026-08-21).
    // 3 flowing paragraphs, rendered with tight paragraph spacing (NOT standalone lines).
    grad_kicker: "כמה חודשים אחרי הסדנה",
    grad_title: "יום בחייו של בוגר Product Lab.",
    grad_paras: [
      "בוקר. עולה לו רעיון, ויש לו לאן ללכת איתו. הוא כותב לצוות שניים-שלושה משפטים וממשיך ביום שלו.",
      "האסטרטג כבר מבין את ההקשר ומצרף את מי שצריך. המעצב נותן לו צורה בשפת העיצוב של המוצר. הקופירייטר מנסח אותו בקול שהמוצר כבר מדבר בו, והארכיטקט מסמן דרך לבנות אותו ממה שהמערכת באמת יודעת לעשות.",
      "כשהוא חוזר לשולחן מחכים לו כיוון ומשהו אמיתי להגיב עליו. עד הערב יש כבר גרסה ראשונה. והשאלה שהוא קם איתה בבוקר השתנתה. כבר לא איך לבנות. מה לבנות.",
    ],

    incl_eyebrow: "הפרטים",
    incl_title: "כל מה שצריך לדעת",
    // ONE unified accordion. `open:true` = logistics facts shown by default.
    detail_items: [
      { ico: "video",    q: "איפה ואיך זה מתנהל?", a: "מפגש חי בזום, בקבוצה קטנה, כדי שלכל אחד תהיה תשומת לב אישית." },
      { ico: "clock",    q: "כמה זמן זה לוקח?", a: "כשלוש שעות רצופות עם הפסקה אחת. מגיעים בלי צוות סוכני AI, יוצאים עם אחד." },
      { ico: "hand",     q: "אני בונה בעצמי או צופה?", a: "בונה לאורך כל הדרך, לא צופה מהצד. יוצאים עם משהו אמיתי שבנית בעצמך." },
      { ico: "laptop",   q: "צריך לדעת לתכנת?", a: "לא. אם יודעים לכתוב בריף ברור, אפשר לעשות את זה. בונים על Claude, בשפה רגילה, בלי קוד." },
      { ico: "box",      q: "מה צריך להביא?", a: "לפטופ, חשבון Claude, וחיבור אינטרנט יציב. כדאי גם פינה שקטה שבה תוכלו להתרכז. נגיד לכם מה עוד להכין לפני המפגש." },
      { ico: "spark",    q: "זה באמת מפגש אחד?", a: "כן. יוצאים עם צוות סוכני AI עובד ועם משהו אמיתי שבניתם. לאן לוקחים את זה משם, כבר תלוי בכם." },
      { ico: "users",    q: "זה לצוותים או ליחידים?", a: "לשניהם. אפשר לבוא לבד, או להביא כמה אנשים מהצוות." },
      { ico: "calendar", q: "ומה אם התאריך לא מתאים לי?", a: "נדבר על זה בשיחה. הקבוצות קטנות והמפגשים חוזרים על עצמם, אז נמצא מועד שמתאים לכם." },
    ],

    final_chip: "בהזמנה בלבד. בקבוצות קטנות.",
    final_title: "בואו נבנה ביחד",
    final_sub: "אחר צהריים אחד, קבוצה קטנה, וצוות משלכם שבונה איתכם את הפרויקט הראשון שלכם, ונשאר שלכם גם אחרי. הצעד הראשון הוא שיחה איתי.",

    // Student area - real Google sign-in (Supabase). PLACEHOLDER HE copy 2026-08-11,
    // Copywriter to refine. The old access-code strings were retired with the gate.
    login_eyebrow: "אזור התלמידים",
    login_title: "כניסה לאזור התלמידים",
    login_sub: "האזור הזה נועד למשתתפי הסדנה. התחברו עם חשבון Google כדי להיכנס.",
    login_google: "המשך עם Google",
    login_register: "הרשמה",
    modal_close: "סגירה",
    // Denied sign-in notice (invite-only). PLACEHOLDER HE copy 2026-08-12, Copywriter to refine.
    denied_title: "עדיין אין לכם גישה",
    denied_body: "האזור הזה פתוח למשתתפי הסדנה שאושרו. נכנסתם עם Google אבל החשבון עדיין לא רשום. אם נרשמתם וזה לא עובד, דברו איתי ואפתח לכם גישה.",
    // Register-your-interest FORM (writes to register_lead). Copy from Copywriter 2026-08-13.
    reg_title: "לשמור מקום במפגש הקרוב",
    reg_sub: "המקומות מוגבלים והמפגשים בקבוצות קטנות. השאירו פרטים כדי לשמור מקום במפגש הקרוב, ואחזור אליכם באופן אישי עם כל מה שצריך לדעת.",
    reg_name_label: "שם מלא",
    reg_first_label: "שם פרטי",
    reg_last_label: "שם משפחה",
    reg_email_label: "אימייל",
    reg_email_ph: "you@email.com",
    reg_note_label: "משהו שתרצו לשתף (לא חובה)",
    reg_note_ph: "שורה עליכם, על מה שאתם בונים, או על מה שאתם מקווים לקבל מזה.",
    reg_submit: "לשמור מקום",
    reg_success: "אתם בפנים. אחזור אליכם באופן אישי עם כל הפרטים על המפגש הקרוב. נדבר בקרוב.",
    reg_error: "משהו לא נשלח. נסו שוב, או פשוט כתבו לי ישירות.",

    // Admin roster - visible only to admin. PLACEHOLDER HE copy 2026-08-12, Copywriter to refine.
    roster_kicker: "ניהול",
    admin_roster_title: "התלמידים שלי",
    roster_sub: "רשימת ההזמנות שלכם. הוסיפו אימייל, אשרו אותו כדי לפתוח גישה, וראו מי כבר נכנס.",
    roster_add_name_placeholder: "שם התלמיד",
    roster_add_placeholder: "אימייל (לא חובה)",
    roster_add_cta: "הוספת תלמיד",
    roster_add_hint: "אפשר להוסיף ליד עם שם בלבד; אימייל לא חובה. הוספה לא מאשרת גישה. אחרי ההוספה, לחצו \"אישור\" כדי לפתוח גישה.",
    roster_col_name: "שם",
    roster_col_email: "אימייל",
    roster_col_status: "גישה לאתר",
    // Explains the אישור/ביטול אישור button - Ofir's own confusion, 2026-09-03:
    // read it as "approve the student for the workshop," it actually grants/
    // revokes the gated site content. Copy reused verbatim from the CMO's
    // already-cleared `access_help` string, crm-status-ux-spec-2026-08-27.md.
    roster_access_help: "פותח לתלמיד/ה גישה לתוכן הסגור באתר. לא קשור לאישור ההרשמה לסדנה.",
    roster_col_signedin: "נכנס?",
    roster_col_stage: "שלב",
    roster_col_source: "מקור",
    roster_col_next: "צעד הבא",
    roster_col_actions: "פעולות",
    roster_col_notes: "הערות",
    roster_col_phone: "טלפון",
    roster_pill_confirmed: "מאושר",
    roster_pill_pending: "ממתין",
    roster_pill_uninvited: "לא מוזמן",
    roster_signedin_no: "עדיין לא",
    roster_confirm: "אישור",
    roster_unconfirm: "ביטול אישור",
    roster_remove: "הסרה",
    // Delete-confirm modal (Ofir, 2026-09-03: trash icon + "are you sure" before
    // an actual delete). PLACEHOLDER copy, same standing as the rest of this
    // roster section - Copywriter to refine.
    roster_remove_title: "למחוק תלמיד/ה?",
    roster_remove_body_pre: "הפעולה תמחק לצמיתות את ",
    roster_remove_body_post: " מהרשימה. אי אפשר לבטל.",
    roster_remove_cancel: "ביטול",
    roster_remove_confirm: "מחיקה",
    roster_add_to_list: "הוספה לרשימה",
    roster_empty: "עדיין אין תלמידים. הוסיפו שם למעלה כדי להתחיל.",
    roster_loading: "טוען...",
    roster_details: "פרטים",
    roster_save: "שמירה",
    roster_saved: "נשמר",
    roster_save_err: "השמירה נכשלה",
    roster_source_ph: "מאיפה הגיע/ה (LinkedIn, WhatsApp, הפניה...)",
    roster_next_ph: "הצעד הבא (התקשרות מחר 12:00...)",
    roster_notes_ph: "מה נאמר בשיחה, הקשר, פרטים...",
    roster_phone_ph: "טלפון",
    // Notes log (append-only, one dated line per fact). PLACEHOLDER HE copy
    // 2026-08-23, Copywriter to refine.
    roster_note_add: "הוספה",
    roster_note_read: "הערכה",
    roster_note_legacy: "ללא תאריך",
    roster_note_empty: "אין עדיין רשומות.",
    stages: {
      invited: "הוזמן",
      interested: "מתעניין",
      call_booked: "נקבעה שיחה",
      confirmed: "אושר",
      attended: "השתתף",
      dropped: "לא רלוונטי",
    },
    // Student-area tab bar. PLACEHOLDER HE copy 2026-08-12, Copywriter to refine.
    tab_content: "תוכן הסדנה",
    tab_students: "תלמידים",

    // ---- Student prep page (gated by AUTH.tier). Teaching copy lives in
    // content.js (WORKSHOP_CONTENT). These keys are the two used by the
    // defensive no-content fallback plus the bilingual Help/WhatsApp block.
    prep_page_title: "אזור התלמידים",
    prep_welcome_title: "אתם בפנים. ברוכים הבאים למחזור הראשון של Product Lab.",
    prep_help_title: "יש שאלה?",
    prep_help_body: "כתבו לי בוואטסאפ, אני כאן לכל מה שצריך.",

    // ---- Legal: Privacy (privacy_*) — copy Copywriter 2026-08-05
    privacy_title: "מדיניות פרטיות",
    privacy_intro: "בקצרה: אנחנו אוספים כמה שפחות, ולעולם לא מוכרים את המידע שלכם. הנה התמונה המלאה.",
    privacy_items: [
      { t: "מה אנחנו אוספים", b: "הכניסה לאזור התלמידים לא אוספת ממכם שום מידע אישי. אם נבקש מכם אימייל, בהרשמה או בשאלון קצר, תדעו בדיוק מתי אתם מוסרים אותו." },
      { t: "למה אנחנו משתמשים בו", b: "כל פרט שתמסרו משמש רק כדי להריץ את הסדנה: ליצור אתכם קשר לגבי המפגש, לשלוח חומרים, ולעקוב אחרי מה שצריך. זהו." },
      { t: "מה אנחנו לא עושים", b: "אנחנו לא מוכרים את המידע שלכם, ולא משתפים אותו עם אף אחד מחוץ לסדנה." },
      { t: "יצירת קשר", b: "שאלה לגבי המידע שלכם? כתבו לי בוואטסאפ ואענה." },
    ],
    privacy_updated: "עודכן לאחרונה: 5 באוגוסט 2026",

    // ---- Legal: Terms (terms_*) — copy Copywriter 2026-08-05
    terms_title: "תנאי שימוש",
    terms_intro: "בקצרה: זו סדנה בהזמנה בלבד, החומרים שלכם לשימוש אישי אבל לא להעברה, והתוכן הוא שלי. הנה הפירוט.",
    terms_items: [
      { t: "בהזמנה בלבד", b: "הגישה לסדנה ולאזור התלמידים היא בהזמנה. אל תשתפו את פרטי הכניסה שלכם." },
      { t: "החומרים", b: "הפרומפטים, התבניות והחומרים שנשתף הם לשימוש אישי שלכם. אל תפיצו, תמכרו או תפרסמו אותם מחדש." },
      { t: "התוכן", b: "כל תוכן הסדנה הוא © אופיר רושינק / Product Lab." },
      { t: "יצירת קשר", b: "משהו לא ברור? כתבו לי בוואטסאפ." },
    ],
    terms_updated: "עודכן לאחרונה: 5 באוגוסט 2026",

    // ---- #/kit — "here's your kit" landing page (branded, public, no auth).
    // Final copy, Copywriter pass 2026-08-31.
    kit_eyebrow: "ערכת הסדנה שלכם",
    kit_title: "מזל טוב, היא כאן!",
    kit_sub: "מורידים את הקובץ ומחלצים אותו (unzip). נתראה ביום חמישי, 3.9, בשעה 17:30.",
    kit_btn_download: "להוריד שוב",

    footer_privacy: "מדיניות פרטיות",
    footer_terms: "תנאי שימוש",

    footer_line: "סדנאות בהזמנה על עיצוב מוצר בהובלת AI.",
    footer_contact: "יצירת קשר",
  },

  en: {
    cta_wa: "Talk to me",
    nav_student: "Student entrance",
    nav_signout: "Sign out",
    nav_account: "Your menu",
    hero_chip: "Invite-only. Small groups.",
    hero_title_a: "From idea to reality. A new world of working with ",
    hero_title_mark: "AI agents",
    hero_title_b: ".",
    hero_sub: "In 3 hours, create your own AI agent team with Claude, and start building your first product with it. Live.",
    hero_points: ["Shared memory", "No code", "A team that stays with you"],
    hero_t1: "From idea to reality.",
    hero_t2a: "A new world of working with ",
    hero_sub_lines: ["In 3 hours, set up your own AI agent team with Claude,", "and start building your first product with it.", "In real time."],
    hero_cta: "Register for the next cohort",
    hero_cta2: "See which agents fit you",
    session: {
      badge: "Last session",
      when_label: "When?",
      when_value: ["Thursday, 3 September", "17:30-20:30", "One session, 3 hours"],
      where_label: "Where?",
      where_value: ["Online, over Zoom", "From anywhere"],
      cta: "Sign up",
      limited_note: "Sold out",
    },
    // Cohort #2, added 2026-08-31 (date+price decided by Ofir/CMO). Same shape
    // as `session` above + a price column, rendered directly beneath it — the
    // ONLY place price appears on the page.
    session2: {
      badge: "Next cohort",
      when_label: "When?",
      when_value: ["Thursday, 15 October", "17:30-20:30", "One session, 3 hours"],
      where_label: "Where?",
      where_value: ["Online, over Zoom", "From anywhere"],
      price_label: "Price",
      price_value: ["₪600", "per person"],
      cta: "Sign up",
      limited_note: "Spots are limited",
    },

    why_eyebrow: "Why now",
    why_heading: "One person, more than one job.",
    why_tiles: [
      { t: "You own all of it", b: "Product, design, and shipping all run through you. An agent team is how one person covers the work of several, without handing any of it off." },
      { t: "A skill, not a trick", b: "You work with Claude directly, its strengths and limits named straight. You leave with a working method for orchestrating an agent team on real product and design work, not generic AI prompting." },
      { t: "Get the head start", b: "Startups are shifting to people and agents building side by side. Get fluent while it's still an edge, before it becomes the baseline everyone has." },
    ],

    walk_eyebrow: "What you take home",
    walk_title: "What you leave with",
    walk_items: [
      { t: "A personal team of AI agents, tuned to exactly how you work", b: "You leave with a team that already knows your project, and one teammate you defined yourself, from scratch." },
      { t: "A shared memory the whole team works from", b: "Every agent works from the same source of knowledge, knows the project, and shares context and information across the entire process." },
      { t: "Your first project, already underway", b: "During the workshop itself you'll start working with the team you built on your own project, instead of leaving with only theory." },
      { t: "A way of working that stays with you after the workshop", b: "You'll leave with a team, a memory, and a workflow you can keep developing and using on your next projects too." },
    ],

    who_eyebrow: "Who it is for",
    who_for_title: "If you want to build on your own, but not alone.",
    who_intro: "It doesn't matter if you're in product and design, a founder, a product builder, or a professional who wants to work differently. If you want to make AI a real partner in the way you work, you're in the right place.",
    who_tiles: [
      { t: "Product and design people", b: "Whether you're a product designer, a design lead, or a product manager, the workshop shows you how to work with a team of AI agents that extends what you can do and frees you to focus on what no tool can: thinking, deciding, and leading." },
      { t: "Builders and founders", b: "You have an idea, a product, or a business you want to build or grow. In the workshop you'll build a team of AI agents that thinks with you, plans, challenges ideas, and helps turn them into a real product." },
      { t: "Horizon seekers", b: "If you feel the way we work is changing, and you want to understand how to really work with AI, not just ask it questions but build a whole way of working, this workshop is for you." },
    ],
    who_not: "Less of a fit for anyone after a magic button. If you'd rather roll up your sleeves and build it yourself, there's a chair at the table.",

    agenda_eyebrow: "Three stages",
    agenda_title: "Three hours. By the end you'll walk out with a team of AI agents that works with you.",
    agenda_intro: "In three stages we'll build your new way of working together, from learning the method, through setting up your own team of AI agents, to building your first project.",
    agenda_phases: [
      { time: "Stage one", t: "Getting started", b: "You'll understand the method, get to know the tools we'll use, and lay the foundations for the team you'll build next." },
      { time: "Stage two", t: "Meet the team", b: "Open the kit and find the team already inside, connected to shared memory and ready to work. From there, you build together." },
      { time: "Stage three", t: "Building with the team", b: "You'll put the team you built to work and start building your first project together." },
    ],
    agenda_toggle: "What's inside",
    agenda_p1_items: [
      { t: "See the big picture", b: "What's changed in the AI world, why AI agents became a real working tool, and how that shifts the way products get built." },
      { t: "Get to know the tools", b: "When to use Claude, when ChatGPT, when Gemini, and how each one fits into your workflow." },
      { t: "Think like a team", b: "Why you start from a clear role, move on to skills and tools, and only then build the shared memory." },
      { t: "Set up the shared brain", b: "You'll create a shared knowledge base that lets every agent work from the same context and improve along the way." },
      { t: "See the path ahead", b: "Get to know the stages of the workshop and how each part connects into one way of working." },
    ],
    agenda_p2_items: [
      { t: "Meet the team", b: "Three teammates already inside: a technical partner, a product manager, and a product designer, each with a clear role and their own tools." },
      { t: "See the shared brain", b: "All the knowledge, decisions, and insights live in one place, and the whole team already reads and writes to it." },
      { t: "Open the kit", b: "Point Claude at the kit folder that stays with you after the workshop, no extra install needed." },
      { t: "See how they stay in sync", b: "Each teammate works in their own conversation, and reads what the others wrote in shared memory first. That's how they stay aligned without talking directly." },
      { t: "Run the setup check", b: "Run `/check`, and the system confirms the team is installed and live on your machine." },
    ],
    agenda_p3_items: [
      { t: "Give the brief", b: "Tell your product manager what you want to build, and it starts prioritizing, steering, and orchestrating the work." },
      { t: "See the team at work", b: "Each teammate works in their own conversation, but reads what the others already wrote in the shared memory first, and builds from there." },
      { t: "Build your first project", b: "Turn your idea into a working landing page, together with the team of AI agents already with you." },
      { t: "Add your own agent", b: "Answer who it is, its one job, and its character, all in one message, and its first task is to weigh in on the page you just built." },
      { t: "Keep going after the workshop", b: "Walk out with your own team of AI agents you can keep consulting, building with, and expanding long after the session ends." },
    ],

    proof_eyebrow: "Not a slide deck. Real products.",
    proof_title: "Everything you see here was built the same way.",
    proof_lead: "Every project on this page was built with a team of AI agents, shared memory, and the workflow you'll learn in the workshop.",
    proof_self_tag: "This page",
    proof_self_t: "This page",
    proof_self_b: "This page, and the whole workshop, I built with a team of AI agents, the same kind you'll set up yourself.",
    proof_glimps_tag: "A real product",
    proof_glimps_t: "Glimps",
    proof_glimps_b: "A real product, built this way. See it for yourself.",
    proof_glimps_link: "See Glimps",

    ofir_eyebrow: "Who you'll meet in the workshop",
    roster_title: "Me, and the team I build with every day.",
    lead_label: "Leads the workshop",
    crew_label: "My AI agent team",
    crew_title: "These are the partners I build every product with.",
    crew_intro: "Each of my partners owns a different area. Together they help me think, make decisions, design, and build products. During the workshop you'll build your own version of this team, tuned to exactly how you work.\n\nBy the end, these won't just be my partners. They'll be yours too.",
    crew_close: "When you leave here, you'll have a team like this too. And you won't build alone anymore.",
    ofir_name: "Ofir Rushinek",
    ofir_role: "The operator",
    agents: [
      { img: "crew-designer", tag: "The Designer", role: "The product designer", b: "When it's time to design, he's my first partner. He works from the Design System, keeps things consistent, suggests UX solutions, and makes sure every screen is clear, usable, and ready to build." },
      { img: "crew-strategist", tag: "The Strategist", role: "The product manager", b: "When I'm not sure what to build first, I check with him. He helps sharpen ideas, prioritize, challenge assumptions, and keep every decision moving the product in the right direction." },
      { img: "crew-architect", tag: "The Architect", role: "The lead engineer", b: "When I hit a technical dilemma, I start with him. He helps me choose the right approach, think through the architecture, and make sure every solution we pick is actually buildable, stable, and ready to grow with the product." },
    ],
    ofir_bio: "For years I built digital products and led Product Design teams. But the biggest shift I went through wasn't a new title, it was a new way of working.\n\nToday I don't build products alone anymore. I work with a team of AI agents I built for myself - partners in thinking, planning, design, and building. Together we built Product Lab, Glimps, the site you're on right now, and even parts of the workshop itself.",
    ofir_why: "Now I want to help you build a team like that for yourself too.",

    quotes_eyebrow: "Testimonials",
    quotes_title: "From people who've done it",
    quotes: [
      { q: "I came away with a top-tier professional team (agents), created my own work right after the session, and got input I couldn't get before. Highly recommend.", n: "Ella Cohen", m: "Lead Product Designer", img: "testimonial-ella", li: "https://www.linkedin.com/in/ella-cohen-736698a8/" },
      { q: "Ofir taught me to build and manage a team of autonomous AI agents, with no code required. Working together, he helped me build a solid foundation for an idea I'd carried for a long time and hadn't managed to execute, and from there I was off and running. Highly recommend to anyone who wants to learn how to really use AI to build things, not just talk about them.", n: "Rona Galezer", m: "Venture Builder & Impact Investor", img: "testimonial-rona", li: "https://www.linkedin.com/in/ronabenziongalezer/" },
    ],

    // "A day in the life of a Product Lab graduate" — copy v5 (Copywriter, 2026-08-21).
    grad_kicker: "A few months after the workshop",
    grad_title: "A day in the life of a Product Lab graduate.",
    grad_paras: [
      "Morning. An idea shows up, and he has somewhere to take it. He writes his team two or three sentences and gets on with his day.",
      "The strategist already has the context and pulls in whoever's needed. The designer gives it shape in the product's own design language. The copywriter phrases it in the voice the product already speaks, and the architect maps a way to build it from what the existing system can actually do.",
      "By the time he's back at his desk there's a direction and something real to react to. By evening there's a first version. And the question he wakes up with has changed. Not how to build anymore. What to build.",
    ],

    incl_eyebrow: "The details",
    incl_title: "Everything you need to know",
    detail_items: [
      { ico: "video",    q: "Where and how does it run?", a: "A live session over Zoom, in a small group, so everyone gets real personal attention." },
      { ico: "clock",    q: "How long does it take?", a: "About three hours straight, with one break. You come in without a team of AI agents and leave with one." },
      { ico: "hand",     q: "Do I build it myself or watch?", a: "You build the whole way through, not watch from the side. You leave with something real you made yourself." },
      { ico: "laptop",   q: "Do I need to know how to code?", a: "No. If you can write a clear brief, you can do this. We build on Claude, in plain language, no code." },
      { ico: "box",      q: "What do I need to bring?", a: "A laptop, a Claude account, and a stable internet connection. A quiet spot to focus helps too. We'll tell you what else to set up before the session." },
      { ico: "spark",    q: "Is it really just one session?", a: "Yes. You leave with a working team of AI agents and something real you built. Where you take it from there is up to you." },
      { ico: "users",    q: "Is this for teams or individuals?", a: "Both. Come solo, or bring a couple of people from your team." },
      { ico: "calendar", q: "What if I can't make the date?", a: "Tell me on the call. The groups are small and sessions run regularly, so we'll find one that fits." },
    ],

    final_chip: "Invite-only. Small groups.",
    final_title: "Let's build together",
    final_sub: "One afternoon, a small group, and a team of your own that builds your first project with you, and stays yours long after. The first step is a call with me.",

    // Student area - real Google sign-in (Supabase). PLACEHOLDER EN copy 2026-08-11,
    // Copywriter to refine. The old access-code strings were retired with the gate.
    login_eyebrow: "Student area",
    login_title: "Enter the student area",
    login_sub: "This area is for workshop participants. Sign in with your Google account to enter.",
    login_google: "Continue with Google",
    login_register: "Register",
    modal_close: "Close",
    // Denied sign-in notice (invite-only). PLACEHOLDER EN copy 2026-08-12, Copywriter to refine.
    denied_title: "You don't have access yet",
    denied_body: "This area is for approved workshop participants. You're signed in with Google, but your account isn't registered yet. If you registered and it isn't working, talk to me and I'll open it up for you.",
    // Register-your-interest FORM (writes to register_lead). Copy from Copywriter 2026-08-13.
    reg_title: "Save your spot in the next session",
    reg_sub: "Spots are limited and go in small groups. Leave your details to hold your place in the next session, and I'll reach out personally with everything you need to know.",
    reg_name_label: "Full name",
    reg_first_label: "First name",
    reg_last_label: "Last name",
    reg_email_label: "Email",
    reg_email_ph: "you@email.com",
    reg_note_label: "Anything you'd like to share (optional)",
    reg_note_ph: "A line about you, what you're building, or what you're hoping to get out of it.",
    reg_submit: "Save my spot",
    reg_success: "You're in. I'll reach out personally with the details for the next session. Talk soon.",
    reg_error: "That didn't go through. Give it another try, or just message me directly.",

    // Admin roster - visible only to admin. PLACEHOLDER EN copy 2026-08-12, Copywriter to refine.
    roster_kicker: "Admin",
    admin_roster_title: "My students",
    roster_sub: "Your invite list. Add an email, confirm it to grant access, and see who has signed in.",
    roster_add_name_placeholder: "Student name",
    roster_add_placeholder: "Email (optional)",
    roster_add_cta: "Add user",
    roster_add_hint: "A lead can be added with a name only; email is optional. Adding does not grant access. After adding, hit \"Confirm\" to grant access.",
    roster_col_name: "Name",
    roster_col_email: "Email",
    roster_col_status: "Site access",
    roster_access_help: "Grants this student access to the gated site content. Unrelated to workshop registration approval.",
    roster_col_signedin: "Signed in?",
    roster_col_stage: "Stage",
    roster_col_source: "Source",
    roster_col_next: "Next action",
    roster_col_actions: "Actions",
    roster_col_notes: "Notes",
    roster_col_phone: "Phone",
    roster_pill_confirmed: "Confirmed",
    roster_pill_pending: "Pending",
    roster_pill_uninvited: "Not invited",
    roster_signedin_no: "Not yet",
    roster_confirm: "Confirm",
    roster_unconfirm: "Unconfirm",
    roster_remove: "Remove",
    roster_remove_title: "Delete student?",
    roster_remove_body_pre: "This permanently removes ",
    roster_remove_body_post: " from the list. This can't be undone.",
    roster_remove_cancel: "Cancel",
    roster_remove_confirm: "Delete",
    roster_add_to_list: "Add to list",
    roster_empty: "No students yet. Add a name above to get started.",
    roster_loading: "Loading...",
    roster_details: "Details",
    roster_save: "Save",
    roster_saved: "Saved",
    roster_save_err: "Save failed",
    roster_source_ph: "Where they came from (LinkedIn, WhatsApp, Referral...)",
    roster_next_ph: "The next step (Call tomorrow 12:00...)",
    roster_notes_ph: "What was discussed, context, details...",
    roster_phone_ph: "Phone",
    // Notes log (append-only, one dated line per fact). PLACEHOLDER EN copy
    // 2026-08-23, Copywriter to refine.
    roster_note_add: "Add",
    roster_note_read: "read",
    roster_note_legacy: "Undated",
    roster_note_empty: "No entries yet.",
    stages: {
      invited: "Invited",
      interested: "Interested",
      call_booked: "Call booked",
      confirmed: "Confirmed",
      attended: "Attended",
      dropped: "Dropped",
    },
    // Student-area tab bar. PLACEHOLDER EN copy 2026-08-12, Copywriter to refine.
    tab_content: "Course content",
    tab_students: "Students",

    // ---- Student prep page (gated by AUTH.tier). Teaching copy lives in
    // content.js (WORKSHOP_CONTENT). These keys are the two used by the
    // defensive no-content fallback plus the bilingual Help/WhatsApp block.
    prep_page_title: "Student area",
    prep_welcome_title: "You're in. Welcome to cohort #1 of Product Lab.",
    prep_help_title: "Got a question?",
    prep_help_body: "Message me on WhatsApp, I'm here for whatever comes up.",

    // ---- Legal: Privacy (privacy_*) — copy Copywriter 2026-08-05
    privacy_title: "Privacy Policy",
    privacy_intro: "Short version: we collect as little as possible, and we never sell your data. Here's the full picture.",
    privacy_items: [
      { t: "What we collect", b: "Signing in to the student area collects no personal information from you. If we ever ask for your email, whether to sign up or in a short survey, you'll know exactly when you're giving it." },
      { t: "How we use it", b: "Anything you share is used only to run the workshop: to reach you about your session, send materials, and follow up. That's it." },
      { t: "What we don't do", b: "We never sell your information, and we never share it with anyone outside the workshop." },
      { t: "Contact", b: "Questions about your data? Message me on WhatsApp and I'll answer." },
    ],
    privacy_updated: "Last updated: 5 August 2026",

    // ---- Legal: Terms (terms_*) — copy Copywriter 2026-08-05
    terms_title: "Terms of Use",
    terms_intro: "Short version: this is an invite-only workshop, the materials are yours to use but not to pass on, and the content is mine. Here's the detail.",
    terms_items: [
      { t: "Invite-only", b: "Access to the workshop and this student area is by invitation. Please don't share your sign-in details." },
      { t: "The materials", b: "The prompts, templates, and materials we share are for your personal use. Please don't redistribute, resell, or republish them." },
      { t: "The content", b: "All workshop content is © Ofir Rushinek / Product Lab." },
      { t: "Contact", b: "Anything unclear? Message me on WhatsApp." },
    ],
    terms_updated: "Last updated: 5 August 2026",

    // ---- #/kit — same final-copy note as the Hebrew block above.
    kit_eyebrow: "Your workshop kit",
    kit_title: "Congrats, it's here!",
    kit_sub: "Download the file and unzip it. See you Thursday, 3.9, at 17:30.",
    kit_btn_download: "Download again",

    footer_privacy: "Privacy Policy",
    footer_terms: "Terms of Use",

    footer_line: "Invite-only workshops on AI-led product design.",
    footer_contact: "Get in touch",
  },
};

/* ---- Templates ----------------------------------------------------------- */
// WhatsApp only — Ofir wants people to reach him directly, no booking funnel.
const ctaRow = (t) => `
  <div class="cta-row">
    <a class="btn btn--wa-solid" href="${WA_URL}" target="_blank" rel="noopener">${I.wa} ${t.cta_wa}</a>
  </div>`;

const ctaBand = (t, title, sub) => `
  <section class="section"><div class="wrap">
    <div class="ctaband reveal">
      <h2>${title}</h2>
      <p>${sub}</p>
      ${ctaRow(t)}
    </div>
  </div></section>`;

/* ---- Shared chrome (nav + student modal + footer), used on every page ----- */
// NAV — logo hidden for now (decide later); wordmark text + WhatsApp only.
// Brand links to "#/" (home route) so it works from sub-pages too.
// opts.account = true renders the SIGNED-IN student-area variant (only used by
// renderPrep, i.e. the #/prep path): the WhatsApp contact button is replaced by
// a user-avatar button that opens a Sign out dropdown, and the hamburger tray
// holds ONLY the language toggle. Everywhere else (main page, legal pages) the
// header is untouched (WhatsApp + full tray as today).
const navHeader = (t, lang, opts = {}) => {
  // Two language controls live in .nav__menu; CSS shows the right one per width.
  // DESKTOP: a secondary globe button (looks like Student entrance) that opens a
  // dropdown to pick English / עברית. MOBILE tray: the quiet text toggle that
  // flips language on each tap.
  const langLabel = lang === "he" ? "בחירת שפה" : "Choose language";
  const langSwitch = `
    <div class="langswitch" data-langswitch>
      <button class="btn btn--ghost btn--sm btn--icon langswitch__btn" type="button" data-langswitch-toggle aria-haspopup="menu" aria-expanded="false" aria-label="${langLabel}" data-tooltip="${langLabel}">${I.globe}</button>
      <div class="langswitch__menu" role="menu" aria-label="${langLabel}" data-langswitch-menu hidden>
        <button class="langswitch__item" type="button" role="menuitem" data-set-lang="en"${lang === "en" ? ' aria-current="true"' : ""}>English</button>
        <button class="langswitch__item" type="button" role="menuitem" data-set-lang="he"${lang === "he" ? ' aria-current="true"' : ""}>עברית</button>
      </div>
    </div>`;
  const langToggle = `<button class="langtoggle" data-toggle-lang aria-label="Switch language"><span class="lang-full">${lang === "he" ? "English" : "עברית"}</span><span class="lang-short">${lang === "he" ? "EN" : "עב"}</span></button>`;
  const langControls = `${langSwitch}${langToggle}`;

  if (opts.account) {
    // Student-area header: avatar (icon-only) opens a menu; on mobile the label
    // lives inside the menu since the avatar is icon-only in the bar.
    return `
  <header class="nav"><div class="wrap nav__in nav__in--account">
    <!-- MOBILE layout: avatar left · wordmark center · hamburger right.
         The hamburger tray below holds the language toggle only. -->
    <a class="nav__brand nav__brand--text" href="#/">Product Lab</a>
    <div class="nav__menu" id="navMenu">
      ${langControls}
    </div>
    <div class="nav__account" data-account>
      <button class="btn btn--ghost btn--sm btn--icon nav__avatar" type="button" data-account-toggle aria-haspopup="menu" aria-expanded="false" aria-label="${t.nav_account}" data-tooltip="${t.nav_account}">${I.user}</button>
      <div class="nav__accmenu" role="menu" aria-label="${t.nav_account}" data-account-menu hidden>
        <button class="nav__accmenu-item" type="button" role="menuitem" data-signout>${t.nav_signout}</button>
      </div>
    </div>
    <button class="nav__burger" type="button" data-nav-toggle aria-label="${lang === "he" ? "תפריט" : "Menu"}" data-tooltip="${lang === "he" ? "תפריט" : "Menu"}" aria-expanded="false" aria-controls="navMenu">${I.menu}</button>
  </div></header>`;
  }

  // Public / home header NEVER shows "Sign out" — signing out lives only inside
  // the student zone (the account-menu avatar on #/prep). The button here is
  // always "Student entrance": a signed-in user gets a link into the zone, a
  // signed-out user opens the sign-in modal.
  const studentBtn = AUTH.tier
    ? `<a class="btn btn--ghost btn--sm nav__student" href="#/prep" aria-label="${t.nav_student}"><span class="btn__label">${t.nav_student}</span></a>`
    : `<button class="btn btn--ghost btn--sm nav__student" type="button" data-student-open aria-label="${t.nav_student}"><span class="btn__label">${t.nav_student}</span></button>`;
  return `
  <header class="nav"><div class="wrap nav__in">
    <!-- MOBILE layout: WhatsApp left · wordmark center · hamburger right.
         The hamburger opens .nav__menu as a tray below (language + student). -->
    <a class="nav__brand nav__brand--text" href="#/">Product Lab</a>
    <div class="nav__menu" id="navMenu">
      ${langControls}
      <!-- Entrance gate when signed out; Sign out when signed in (AUTH.tier). Text-only, no icon. -->
      ${studentBtn}
    </div>
    <a class="btn btn--wa-solid btn--sm nav__book" href="${WA_URL}" target="_blank" rel="noopener" aria-label="${t.cta_wa}">${I.wa}<span class="btn__label">${t.cta_wa}</span></a>
    <button class="nav__burger" type="button" data-nav-toggle aria-label="${lang === "he" ? "תפריט" : "Menu"}" data-tooltip="${lang === "he" ? "תפריט" : "Menu"}" aria-expanded="false" aria-controls="navMenu">${I.menu}</button>
  </div></header>`;
};

// Student sign-in MODAL. Real Google OAuth via Supabase (the access-code field
// was retired with the SHA-256 gate). The button click hands off to
// sb.auth.signInWithOAuth and the page re-renders on return (see wireStudent).
// A reusable NOTICE popup (denied sign-in + "registration not open"). Reuses the
// documented .noacct callout as the modal panel and .modal for the overlay — no
// new component. `key` selects it (data-notice); WhatsApp CTA reuses WA_URL.
const noticeModal = (key, title, body, t) => `
  <div class="modal" data-notice="${key}" hidden>
    <div class="modal__overlay" data-notice-close></div>
    <div class="moment-card noacct" role="dialog" aria-modal="true" aria-label="${title}" style="position:relative; z-index:1; margin:0">
      <button class="modal__close" type="button" data-notice-close aria-label="${t.modal_close}" data-tooltip="${t.modal_close}">${I.x}</button>
      <div class="noacct__ico">${I.info}</div>
      <h2 class="noacct__title">${title}</h2>
      <p class="noacct__body">${body}</p>
      <div class="cta-row" style="margin-top:1.5rem">
        <a class="btn btn--wa-solid" href="${WA_URL}" target="_blank" rel="noopener">${I.wa} ${t.cta_wa}</a>
      </div>
    </div>
  </div>`;

// Delete-confirm dialog for the admin roster (Ofir, 2026-09-03: a trash icon
// should never delete on click alone). Reuses .modal/.modal__card verbatim
// (4th use of the same shell after student/notice/register) plus the
// .noacct__ico + .login__title/.login__sub sub-components noticeModal already
// uses - no new modal primitive, no new sub-component. The student name is
// filled in at open time (wireRemoveConfirm) into the empty <strong>, never
// baked into this static template. Admin-only, so only rendered when isAdmin.
const confirmRemoveModal = (t) => `
  <div class="modal" data-remove-modal hidden>
    <div class="modal__overlay" data-remove-cancel></div>
    <div class="modal__card" role="dialog" aria-modal="true" aria-label="${t.roster_remove_title}">
      <button class="modal__close" type="button" data-remove-cancel aria-label="${t.modal_close}" data-tooltip="${t.modal_close}">${I.x}</button>
      <div class="noacct__ico noacct__ico--danger">${I.trash}</div>
      <h2 class="login__title">${t.roster_remove_title}</h2>
      <p class="login__sub">${t.roster_remove_body_pre}<strong data-remove-name></strong>${t.roster_remove_body_post}</p>
      <div class="cta-row" style="margin-top:1.5rem; justify-content:center">
        <button class="btn btn--ghost" type="button" data-remove-cancel>${t.roster_remove_cancel}</button>
        <button class="btn btn--danger" type="button" data-remove-confirm>${t.roster_remove_confirm}</button>
      </div>
    </div>
  </div>`;

const studentModal = (t) => `
  <div class="modal" data-student-modal hidden>
    <div class="modal__overlay" data-student-close></div>
    <div class="modal__card" role="dialog" aria-modal="true" aria-label="${t.login_title}">
      <button class="modal__close" type="button" data-student-close aria-label="${t.modal_close}" data-tooltip="${t.modal_close}">${I.x}</button>
      <div class="login__ico">${I.login}</div>
      <span class="eyebrow">${t.login_eyebrow}</span>
      <h2 class="login__title">${t.login_title}</h2>
      <p class="login__sub">${t.login_sub}</p>
      <div class="login__form">
        <button class="btn btn--primary login__submit login__google" type="button" data-google-signin>
          ${I.google}<span>${t.login_google}</span>
        </button>
        <!-- Opens the register-your-interest form (writes a lead via register_lead). -->
        <button class="btn btn--ghost login__submit" type="button" data-register-open>${t.login_register}</button>
      </div>
    </div>
  </div>
  ${noticeModal("denied", t.denied_title, t.denied_body, t)}
  ${registerModal(t)}`;

// Register-your-interest FORM modal. Reuses .modal/.modal__card (the sign-in
// modal's shell) and the .field/.input form-control component — no new modal
// primitive. One card, two swapped views: the form and a success panel. Submit
// calls sb.rpc('register_lead', ...) (see wireRegister); the note is optional,
// the email is LTR-isolated. Framing = interest in an UPCOMING session with a
// personal 1:1 follow-up (no date, no seat language).
const registerModal = (t) => `
  <div class="modal" data-register-modal hidden>
    <div class="modal__overlay" data-register-close></div>
    <div class="modal__card modal__card--form" role="dialog" aria-modal="true" aria-label="${t.reg_title}">
      <button class="modal__close" type="button" data-register-close aria-label="${t.modal_close}" data-tooltip="${t.modal_close}">${I.x}</button>

      <div data-register-view="form">
        <div class="login__ico">${I.spark}</div>
        <h2 class="login__title">${t.reg_title}</h2>
        <p class="login__sub">${t.reg_sub}</p>
        <form class="reg__form" data-register-form novalidate>
          <div class="field">
            <label class="field__label" for="reg-name">${t.reg_name_label}</label>
            <input class="input" id="reg-name" name="fullname" type="text" autocomplete="name" required />
          </div>
          <div class="field">
            <label class="field__label" for="reg-email">${t.reg_email_label}</label>
            <input class="input ltr-iso" id="reg-email" name="email" type="email" inputmode="email" dir="ltr" autocomplete="email" placeholder="${t.reg_email_ph}" required />
          </div>
          <div class="field">
            <label class="field__label" for="reg-note">${t.reg_note_label}</label>
            <textarea class="reg__note" id="reg-note" name="note" rows="3" placeholder="${escapeAttr(t.reg_note_ph)}"></textarea>
          </div>
          <p class="reg__error" data-register-error hidden>${I.info}<span>${t.reg_error}</span></p>
          <button class="btn btn--primary login__submit reg__submit" type="submit" data-register-submit>
            <span class="reg__submit-spinner" aria-hidden="true"></span>
            <span class="reg__submit-label">${t.reg_submit}</span>
          </button>
        </form>
      </div>

      <div data-register-view="success" hidden>
        <div class="noacct__ico reg__success-ico">${I.check}</div>
        <p class="reg__success-body">${t.reg_success}</p>
        <div class="cta-row" style="margin-top:1.5rem; justify-content:center">
          <button class="btn btn--ghost" type="button" data-register-close>${t.modal_close}</button>
        </div>
      </div>
    </div>
  </div>`;

// FOOTER — now carries the Privacy + Terms routes alongside contact.
const siteFooter = (t, compact = false) => `
  <footer class="footer${compact ? " footer--compact" : ""}"><div class="wrap footer__in">
    <div class="footer__brand"><span class="footer__wordmark">Product Lab</span></div>
    <div class="footer__meta">${t.footer_line}</div>
    <nav class="footer__links">
      <a href="#/privacy">${t.footer_privacy}</a>
      <a href="#/terms">${t.footer_terms}</a>
      <a href="${WA_URL}" target="_blank" rel="noopener">${t.footer_contact}</a>
    </nav>
  </div></footer>`;

/* ---- "Working canvas" cursors for the WHY NOW section --------------------
   A few colorful collaborator cursors, each tagged with a tool logo, wander the
   section like a live multiplayer canvas — the visual story of one person with a
   whole team's output. They touch nothing (no grabbing/resizing); they drift on
   curved, hand-held paths, pause, and move on. Simulated (no backend). Honors
   prefers-reduced-motion and is cleaned up on every re-render. */
const CURSOR_TOOLS = [
  { id: "figma", color: "#F24E1E", logo:
    `<svg viewBox="0 0 38 57" width="13" height="13" aria-hidden="true">
      <path fill="#1abcfe" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"/>
      <path fill="#0acf83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"/>
      <path fill="#ff7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z"/>
      <path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"/>
      <path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"/>
    </svg>` },
  { id: "claude", color: "#CC785C", logo:
    `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#CC785C" stroke-width="1.7" stroke-linecap="round">
      <path d="M12 2.5V21.5M2.5 12H21.5M20.2 7.25 3.8 16.75M16.75 3.8 7.25 20.2M7.25 3.8 16.75 20.2M3.8 7.25 20.2 16.75"/>
    </svg>` },
  { id: "gdocs", color: "#4285F4", logo:
    `<svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M7 2h6.5L19 6.5V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
      <path fill="#A1C2FA" d="M13.5 2 19 6.5h-5.5z"/>
      <rect x="8" y="11" width="8" height="1.4" rx=".7" fill="#fff"/>
      <rect x="8" y="14" width="8" height="1.4" rx=".7" fill="#fff"/>
      <rect x="8" y="17" width="5.5" height="1.4" rx=".7" fill="#fff"/>
    </svg>` },
  { id: "lovable", color: "#FF4D67", logo:
    `<svg viewBox="0 0 24 24" fill="#FF4D67" aria-hidden="true">
      <path d="M12 21.35 3.55 12.9a5.4 5.4 0 1 1 7.64-7.64l.81.8.81-.8a5.4 5.4 0 1 1 7.64 7.64z"/>
    </svg>` },
  { id: "gemini", color: "#4F86F7", logo:
    `<svg viewBox="0 0 24 24" aria-hidden="true">
      <defs><linearGradient id="pcGemini" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#4285F4"/><stop offset=".55" stop-color="#7C6DF3"/><stop offset="1" stop-color="#A64CE0"/>
      </linearGradient></defs>
      <path fill="url(#pcGemini)" d="M12 2c.4 5.2 4.8 9.6 10 10-5.2.4-9.6 4.8-10 10-.4-5.2-4.8-9.6-10-10 5.2-.4 9.6-4.8 10-10z"/>
    </svg>` },
];

const whyCursorsMarkup = () =>
  `<div class="cursorfield" aria-hidden="true">` +
  CURSOR_TOOLS.map((tl) =>
    `<div class="pcursor" data-tool="${tl.id}" style="--pc:${tl.color}">
       <svg class="pcursor__arrow" viewBox="0 0 24 24" width="22" height="22"><path d="M5 2.5 5 20.5 9.7 16 12.7 22.5 15.5 21.2 12.5 14.8 19 14.8Z"/></svg>
       <span class="pcursor__tag">${tl.logo}</span>
     </div>`).join("") + `</div>`;

let _whyCursorRAF = 0;
function wireWhyCursors() {
  cancelAnimationFrame(_whyCursorRAF); _whyCursorRAF = 0;
  const field = document.querySelector(".cursorfield");
  if (!field) return;
  const els = [...field.querySelectorAll(".pcursor")];
  if (!els.length) return;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const MG = 8;                                   // inset so tags never clip
  /* The cursor's own box is 26x26, but .pcursor__tag hangs out of it: it sits at
     left:15px/top:17px and is 37x37, so the real painted extent from the cursor's
     origin is 15+37=52 wide and 17+37=54 tall. Bounding on the 26px arrow alone
     let the logo chip cross the field edge and get clipped by overflow:hidden at
     every viewport. Bound on the PAINTED extent, not the icon. */
  const TAG_W = 52, TAG_H = 54;
  const box = () => ({ w: field.clientWidth, h: field.clientHeight });
  const place = (el, x, y) => { el.style.transform = `translate(${x}px, ${y}px)`; };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const rawX = (b) => rnd(MG, Math.max(MG + 1, b.w - TAG_W - MG));
  const rawY = (b) => rnd(MG, Math.max(MG + 1, b.h - TAG_H - MG));

  /* Ofir's call (2026-08-20): the cursors roam the WHOLE section - over the
     cards, the title, everything. They are tiny, click-through decoration and
     the collisions ARE the charm ("a busy working canvas"), so there is no
     keep-out zone. Bounds = the painted extent against the field edges only. */
  const pick = (b) => ({ x: rawX(b), y: rawY(b) });

  const S = [];
  els.forEach((el) => {
    const b = box(), pt = pick(b);
    el.style.display = "";
    S.push({ el, ax: pt.x, ay: pt.y, bx: pt.x, by: pt.y, t: 1, dur: 1, curve: 0, mode: "pause", until: 0, seed: Math.random() * 1000 });
  });
  if (!S.length) return;
  S.forEach((s) => place(s.el, s.ax, s.ay));

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const b = box();                              // static, evenly scattered
    S.forEach((s) => { const q = pick(b); if (q) place(s.el, q.x, q.y); });
    return;
  }

  const t0 = performance.now();
  S.forEach((s, i) => { s.until = t0 + i * 260; });  // staggered start

  const segment = (s, now) => {
    const b = box();
    s.ax = s.bx; s.ay = s.by;
    const nxt = pick(b), curve = rnd(-0.3, 0.3);
    s.bx = nxt.x; s.by = nxt.y;
    s.dur = rnd(1600, 3400); s.curve = curve; s.t = 0; s.mode = "move"; s.start = now;
  };

  let last = 0;
  const frame = (now) => {
    if (!last) last = now;
    const dt = now - last; last = now;
    S.forEach((s) => {
      if (s.mode === "pause") {
        if (now >= s.until) { segment(s, now); return; }
        place(s.el, s.bx, s.by + Math.sin(now / 640 + s.seed) * 0.7);  // idle bob
        return;
      }
      s.t += dt / s.dur;
      const tt = Math.min(1, s.t), e = ease(tt);
      let x = s.ax + (s.bx - s.ax) * e, y = s.ay + (s.by - s.ay) * e;
      const dx = s.bx - s.ax, dy = s.by - s.ay, len = Math.hypot(dx, dy) || 1;
      const arc = Math.sin(Math.PI * tt) * s.curve * len;             // curved, not straight
      x += (-dy / len) * arc; y += (dx / len) * arc;
      x += Math.sin(now / 720 + s.seed) * 1.1;                        // hand-held wobble
      y += Math.cos(now / 840 + s.seed) * 1.1;
      place(s.el, x, y);
      if (s.t >= 1) { s.mode = "pause"; s.until = now + rnd(280, 1500); }
    });
    _whyCursorRAF = requestAnimationFrame(frame);
  };
  _whyCursorRAF = requestAnimationFrame(frame);
}

// SESSION STRIP — shared markup for the current cohort card and any future one
// (2026-08-31: cohort #2 added directly beneath it). `opts.disabled` renders a
// closed, non-clickable CTA (no href, aria-disabled, greyed via .btn--disabled);
// `opts.price` adds a price line under the CTA button (not a separate column —
// both strips stay the same 3-column width: when / where / cta). Do not
// duplicate this markup per-strip — edit once, both render.
function sessionStripHtml(s, opts = {}) {
  const cta = opts.disabled
    ? `<span class="btn btn--accent btn--disabled" aria-disabled="true">${s.cta}</span>`
    : `<button class="btn btn--accent" type="button" data-register-open>${s.cta}</button>`;
  const price = opts.price
    ? `<div class="ss-price"><strong>${s.price_value[0]}</strong><span>${s.price_value[1]}</span></div>`
    : "";
  return `
      <div class="session-strip reveal${opts.disabled ? " session-strip--closed" : ""}">
        <span class="ss-badge">${I.spark} ${s.badge}</span>
        <div class="ss-col ss-col--when">
          <div class="ss-label">${s.when_label}</div>
          <div class="ss-val">
            <strong>${s.when_value[0]}</strong>
            <span>${s.when_value[1]}, ${s.when_value[2]}</span>
          </div>
        </div>
        <div class="ss-div"></div>
        <div class="ss-col">
          <div class="ss-label">${s.where_label}</div>
          <div class="ss-val">
            <strong>${s.where_value[0]}</strong>
            <span>${s.where_value[1]}</span>
          </div>
        </div>
        <div class="ss-div"></div>
        <div class="ss-col ss-col--cta">
          ${cta}${price}${opts.price ? "" : `
          <div class="ss-note">${s.limited_note}</div>`}
        </div>
      </div>`;
}

function render(lang) {
  const t = I18N[lang];

  document.getElementById("app").innerHTML = `
  ${navHeader(t, lang)}

  <main id="top">
  <!-- 1 HERO — full-bleed COZY CAFE SCENE as the background (the visual IS the bg).
       Title sits over it, no separate graphic. Background photo is a PLACEHOLDER
       (warm gradient) until the generated cafe image lands (OpenAI billing gate). -->
  <section class="hero hero--oneview">
    <div class="hero__content">
      <h1 class="hero__title"><span class="ht1">${t.hero_t1}</span><span class="ht2">${t.hero_t2a}<span class="mark">${t.hero_title_mark}</span>${t.hero_title_b}</span></h1>
      <p class="hero__sub">${t.hero_sub_lines.map((l) => `<span class="sd">${l}</span>`).join("")}</p>
      <div class="hero__cta">
        <button class="btn btn--accent" type="button" data-register-open>${t.hero_cta}</button>
        <a class="btn btn--ghost" href="#/fleet">${t.hero_cta2}</a>
      </div>
    </div>
    <picture class="hero__bg">
      <source type="image/webp" media="(max-width: 760px)" srcset="assets/hero-room-mobile.webp?v=3" />
      <source type="image/webp" srcset="assets/hero-room.webp?v=1" />
      <img class="hero__img is-loaded" src="assets/hero-room.webp?v=1" alt="" width="2560" height="1440" fetchpriority="high" decoding="async" />
    </picture>
  </section>

  <!-- 1b SESSION STRIPS — flat full-width bands (like the site's other section
       bands), flush below the hero so a hint peeks above the fold. NOT floating/
       rounded cards. Current cohort stays on top, closed; cohort #2 goes directly
       beneath it, active, price shown (2026-08-31 — see sessionStripHtml above). -->
  <section class="session-strip-band">
    <div class="wrap">
      ${sessionStripHtml(t.session, { disabled: true })}
      <div class="ss-divider-full"></div>
      ${sessionStripHtml(t.session2, { price: true })}
    </div>
  </section>

  <!-- 6 PROOF OF CRAFT -->
  <section class="section section--alt"><div class="wrap">
    <div class="reveal">
      <span class="eyebrow">${t.proof_eyebrow}</span>
      <h2 class="section-title">${t.proof_title}</h2>
      <p class="section-lead">${t.proof_lead}</p>
    </div>
    <div class="proof" style="margin-top:2rem">
      <div class="proof__block reveal">
        <div class="proof__shot"><img src="assets/thispage-3.jpg" alt="" /></div>
        <div class="proof__body">
          <h3>${t.proof_self_t}</h3><p>${t.proof_self_b}</p>
        </div>
      </div>
      <div class="proof__block reveal">
        <div class="proof__shot"><img src="assets/glimps.png" alt="Glimps" /></div>
        <div class="proof__body">
          <h3>${t.proof_glimps_t}</h3><p>${t.proof_glimps_b}</p>
          <a class="linkline" href="https://glimps.design" target="_blank" rel="noopener">${t.proof_glimps_link} ${I.arrow}</a>
        </div>
      </div>
    </div>
  </div></section>

  <!-- 7 THE TEAM ROSTER — Ofir (operator) on top, his 3 AI agents beneath -->
  <section class="section"><div class="wrap">
    <div class="reveal">
      <span class="eyebrow">${t.ofir_eyebrow}</span>
      <h2 class="section-title">${t.roster_title}</h2>
    </div>
    <!-- ONE bounded panel: leader on top, the AI crew grouped in a band below -->
    <div class="team reveal">
      <div class="team__lead">
        <div class="team__photo"><img src="assets/ofir.jpeg" alt="${t.ofir_name}" /></div>
        <div class="team__leadtext">
          <span class="team__kicker">${t.lead_label}</span>
          <div class="team__name">${t.ofir_name}</div>
          ${t.ofir_bio.split("\n\n").map((p) => `<p>${p}</p>`).join("")}<p>${t.ofir_why}</p>
        </div>
      </div>
      <div class="team__crew">
        <span class="eyebrow">${t.crew_label}</span>
        <div class="team__name">${t.crew_title}</div>
        ${t.crew_intro.split("\n\n").map((p) => `<p class="section-lead">${p}</p>`).join("")}
        <div class="team__agents">
          ${t.agents.map((a) => `
            <div class="agentcard">
              <div class="agentcard__illo"><img src="assets/${a.img}.webp?v=2" alt="" /></div>
              <div class="agentcard__body">
                <span class="agentcard__tag">${a.tag}</span>
                <div class="agentcard__role">${a.role}</div>
                <p>${a.b}</p>
              </div>
            </div>`).join("")}
        </div>
        <p class="section-lead">${t.crew_close}</p>
      </div>
    </div>
  </div></section>

  <!-- 2 WHY NOW — three rounded tiles (bold numeral on top) -->
  <section class="section section--alt why-section">
    ${whyCursorsMarkup()}
    <div class="wrap why">
    <div class="reveal">
      <span class="eyebrow">${t.why_eyebrow}</span>
      <h2 class="section-title why__title">${t.why_heading}</h2>
    </div>
    <div class="grid grid--3" style="margin-top:2rem">
      ${t.why_tiles.map((x, i) => `
        <div class="card whytile reveal">
          <div class="whytile__num">${["01", "02", "03"][i]}</div>
          <h3>${x.t}</h3><p>${x.b}</p>
        </div>`).join("")}
    </div>
  </div></section>

  <!-- 3 WALK AWAY -->
  <section class="section"><div class="wrap">
    <div class="reveal">
      <span class="eyebrow">${t.walk_eyebrow}</span>
      <h2 class="section-title">${t.walk_title}</h2>
    </div>
    <div class="grid grid--2" style="margin-top:2rem">
      ${t.walk_items.map((d, i) => `
        <div class="card reveal">
          <div class="card__ico">${[I.users, I.brain, I.box, I.repeat][i] || I.check}</div>
          <h3>${d.t}</h3><p>${d.b}</p>
        </div>`).join("")}
    </div>
  </div></section>

  <!-- 4 WHO — three tiles (icon on top, like Three-hats cards) -->
  <section class="section section--alt"><div class="wrap">
    <div class="reveal">
      <span class="eyebrow">${t.who_eyebrow}</span>
      <h2 class="section-title">${t.who_for_title}</h2>
      <p class="section-lead">${t.who_intro}</p>
    </div>
    <div class="grid grid--3" style="margin-top:2rem">
      ${t.who_tiles.map((x, i) => `
        <div class="tilecard reveal">
          <div class="tilecard__illo"><img src="assets/${["who-designer", "who-builder", "who-horizon"][i]}.webp?v=2" alt="" /></div>
          <div class="tilecard__body"><h3>${x.t}</h3><p>${x.b}</p></div>
        </div>`).join("")}
    </div>
    <p class="who__not reveal">${t.who_not}</p>
  </div></section>

  <!-- 5 AGENDA -->
  <section class="section"><div class="wrap">
    <div class="reveal">
      <span class="eyebrow">${t.agenda_eyebrow}</span>
      <h2 class="section-title">${t.agenda_title}</h2>
      <p class="section-lead">${t.agenda_intro}</p>
    </div>
    <div class="agenda" style="margin-top:2rem">
      ${t.agenda_phases.map((p, i) => {
        const items = [t.agenda_p1_items, t.agenda_p2_items, t.agenda_p3_items][i] || [];
        return `
        <details class="aphase reveal" open>
          <summary class="aphase__head">
            <span class="phase__time">${p.time}</span>
            <div class="aphase__intro"><h3>${p.t}</h3><p>${p.b}</p></div>
            <span class="aphase__toggle">${t.agenda_toggle}${I.chev}</span>
          </summary>
          <div class="aphase__items">
            ${items.map((it) => `
            <div class="aphase__item"><h4>${it.t}</h4><p>${it.b}</p></div>`).join("")}
          </div>
        </details>`;
      }).join("")}
    </div>
  </div></section>

  <!-- 8 TESTIMONIALS — shown as intentional PLACEHOLDER cards (dashed) so people
       reviewing the page see where their quote will go. Swap q/n/m in I18N for real. -->
  <section class="section section--alt"><div class="wrap">
    <div class="reveal">
      <span class="eyebrow">${t.quotes_eyebrow}</span>
      <h2 class="section-title">${t.quotes_title}</h2>
    </div>
    <div class="quote-grid" style="margin-top:2rem">
      ${t.quotes.map((qt) => `
        <figure class="quote-card reveal">
          <figcaption class="quote-card__head">
            <span class="quote-card__avatarwrap">
              <span class="quote-card__avatar">${qt.img ? `<img src="assets/${qt.img}.jpg?v=1" alt="${qt.n}" loading="lazy" />` : I.user}</span>
              ${qt.li ? `<a class="quote-card__li" href="${qt.li}" target="_blank" rel="noopener" aria-label="${qt.n} on LinkedIn" data-tooltip="LinkedIn" data-tip-pos="top">${I.linkedin}</a>` : ""}
            </span>
            <span class="quote-card__who"><span class="quote-card__name"><strong>${qt.n}</strong></span><span class="quote-card__role">${qt.m}</span></span>
          </figcaption>
          <blockquote>${qt.q}</blockquote>
        </figure>`).join("")}
    </div>
  </div></section>

  <!-- 8b A DAY IN THE LIFE OF A GRADUATE — sits directly BELOW the last testimonial.
       Same --pl-bg-alt band as the section above it and NO top padding, so the two
       read as one continuous band rather than two stacked stripes.
       The photograph is the FULL 3:2 frame at every width — never cropped. -->
  <section class="section section--alt grad-section"><div class="grad-wrap">
    <div class="grad">
      <div class="grad__text reveal">
        <span class="eyebrow">${t.grad_kicker}</span>
        <h2 class="section-title grad__title">${t.grad_title}</h2>
        <div class="grad__paras">
          ${t.grad_paras.map((g) => `<p>${g}</p>`).join("")}
        </div>
      </div>
      <div class="grad__media reveal">
        <figure class="grad__frame">
          <span class="grad__pin" aria-hidden="true"></span>
          <img src="assets/grad-day.webp" alt="" loading="lazy" decoding="async" width="1536" height="1024" />
        </figure>
      </div>
    </div>
  </div></section>

  <!-- 9 DETAILS — ONE unified accordion (logistics + FAQ), icon on every row -->
  <section class="section"><div class="wrap narrow">
    <div class="reveal">
      <span class="eyebrow">${t.incl_eyebrow}</span>
      <h2 class="section-title">${t.incl_title}</h2>
    </div>
    <div class="faq" style="margin-top:1.75rem">
      ${t.detail_items.map((d) => `
        <details class="reveal"${d.open ? " open" : ""}>
          <summary><span class="faq__q">${I[d.ico] || I.check}${d.q}</span>${I.chev}</summary>
          <div class="faq__a">${d.a}</div>
        </details>`).join("")}
    </div>
  </div></section>

  <!-- 10 FINAL CTA -->
  ${ctaBand(t, t.final_title, t.final_sub)}

  </main>

  ${studentModal(t)}
  ${siteFooter(t)}`;

  afterRender();
}

/* ---- Student PREP page - gated by the live session tier (AUTH.tier) ------- */
/* The single guard: no tier (signed out) → bounce home and pop the sign-in
   modal. loadAuth() resolves the tier from the Supabase session + profile row.
   CONTENT: rendered from window.WORKSHOP_CONTENT (content.js). This is the
   POST-workshop content vault. Teaching copy is BILINGUAL: renderPrep reads
   WORKSHOP_CONTENT[lang] (fallback en) and sets the vault <main> direction to
   match the toggle (rtl for HE, ltr for EN). Prompts are technical and stay
   English in both toggle states; the copyable prompt body is forced dir="ltr"
   so the English prompt renders correctly even inside an RTL page. */

/* Copyable prompt card: label + intro in the head, then the monospace prompt
   frame. The Copy control is an ICON-ONLY, border-less button pinned to the
   top-right corner of the PROMPT frame itself (not the head) - the frame
   reserves a matching padding lane so no prompt line ever runs under it. */
function promptCard(p) {
  const src = (window.WORKSHOP_CONTENT && window.WORKSHOP_CONTENT.prompts) || {};
  const text = src[p.key] || "";
  return `
    <div class="prompt">
      <div class="prompt__head">
        <span class="prompt__label">${p.label}</span>
        <p class="prompt__intro">${p.intro}</p>
      </div>
      <div class="prompt__body">
        <pre class="prompt__text" data-prompt="${p.key}" dir="ltr">${escapeHtml(text)}</pre>
        <button type="button" class="prompt__copy" data-copy-key="${p.key}"
                aria-live="polite" aria-label="Copy" data-tooltip="Copy">${I.copy}</button>
      </div>
    </div>`;
}

/* Minimal HTML-escape so prompt text renders literally inside <pre>. */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* One collapsible plan step: number + title header over the body (checklist
   and/or copyable prompt cards). All steps collapsed by default. Native <details>. */
function planStep(step, open) {
  /* A fixed left-to-right breadcrumb of chips (e.g. the Windows Settings path).
     Forced dir="ltr" so the step order can never reorder inside RTL Hebrew. */
  const breadcrumb = (steps) => `
    <div class="pcrumb" dir="ltr">
      ${steps.map((s, i) => `${i ? '<span class="pcrumb__arrow" aria-hidden="true">→</span>' : ""}<span class="pcrumb__chip${i === steps.length - 1 ? " pcrumb__chip--target" : ""}">${s}</span>`).join("")}
    </div>`;
  /* One checklist row. Supports an optional grouped `sub` list (e.g. the merged
     Windows-only item) and an optional `steps` breadcrumb inside a sub-row. */
  const checklistItem = (c) => `
    <li class="pchecklist__item">
      <span class="pchecklist__dot" aria-hidden="true"></span>
      <div class="pchecklist__body">
        <div class="pchecklist__top">
          <span class="pchecklist__name">${c.name}</span>
          ${c.tag ? `<span class="pchecklist__tag">${c.tag}</span>` : ""}
        </div>
        ${c.note ? `<p class="pchecklist__note">${c.note}</p>` : ""}
        ${c.sub ? `
        <ul class="psub">
          ${c.sub.map((s) => `
          <li class="psub__item">
            <span class="psub__name">${s.name}</span>
            ${s.steps ? breadcrumb(s.steps) : ""}
            ${s.note ? `<p class="psub__note">${s.note}</p>` : ""}
          </li>`).join("")}
        </ul>` : ""}
      </div>
    </li>`;
  const checklist = step.checklist ? `
    <ul class="pchecklist">
      ${step.checklist.map(checklistItem).join("")}
    </ul>` : "";
  const note = step.note ? `
    <div class="pnote"><span class="pnote__dot" aria-hidden="true"></span><p>${step.note}</p></div>` : "";
  const prompts = step.prompts ? `
    <div class="prompts">${step.prompts.map(promptCard).join("")}</div>` : "";
  return `
    <details class="pstep reveal"${open ? " open" : ""}>
      <summary class="pstep__head">
        <span class="pstep__num">${step.n}</span>
        <span class="pstep__title">${step.title}</span>
        <span class="pstep__chev">${I.chev}</span>
      </summary>
      <div class="pstep__body">
        <p class="pstep__lead">${step.body}</p>
        ${note}
        ${checklist}
        ${prompts}
      </div>
    </details>`;
}

/* The media band inside a kit card. Both kit tiles get the SAME 16:9 frame
   (.card__media) so the pair reads as a matched set. Ofir's ask, 2026-08-27:
   "I want people to actually sense what it holds, not just the button."

   The deck tile: slide 1 as a STATIC IMAGE. Deliberately not an iframe - the
   deck stays private and will be shared by participant email after Sep 3, so a
   live embed would render a permanent Google "you need access" panel on the
   page. The button under it still opens the real deck; a student who is not on
   the file hits Google's own wall in a new tab, which is a state Ofir owns.

   The kit tile: the same frame carrying a figure for the FILE - the box glyph
   plus the REAL top-level entries of the zip as path chips, on the site's
   illustration wash so the two tiles carry comparable weight rather than one
   photograph beside one small icon. .pcrumb__chip is the chip the setup steps
   already use for a file path; dir="ltr" goes on each STRING (never on the row:
   these are paths whose internal order is at risk, the row follows the page). */
const KIT_ENTRIES = ["START-HERE.md", "agents/", "soul/", "memory/", "skills/", "shared/"];

function kitMedia(k) {
  /* A real photo/screenshot behind a play badge (the recording tile): same
     16:9 box as a plain poster, but with the actual frame as the background
     instead of the flat --pl-illo-bg fill. .card__media--photo-poster only
     re-centers the play badge (top/left/transform) — the generic
     `.card__media > *{inset:0}` rule would otherwise pin it top-left next to
     an explicit width/height, so it needs its own override, not just reuse
     of .card__media--poster's place-items:center (which only positions a
     child with no image sibling stretching the box). */
  if (k.image && k.poster) {
    return `
      <div class="card__media card__media--photo-poster">
        <img src="${k.image}" alt="${k.title}" loading="lazy" width="1440" height="810" />
        <span class="card__media-play" aria-hidden="true">${I[k.posterIcon] || I.play}</span>
      </div>`;
  }
  if (k.image) {
    return `
      <div class="card__media">
        <img src="${k.image}" alt="${k.title}" loading="lazy" width="1440" height="810" />
      </div>`;
  }
  /* One consistent poster treatment for any card with no real photo/screenshot:
     a large icon centered on --pl-illo-bg, 16:9, same box the recording uses.
     Replaced the six-pill "file tree" mock (Ofir, 2026-09-06: "embarrassing,
     not professional, replace this imagery, a nice icon or image of a file
     or kit") — .kitfile/.kitfile__paths retired, nothing else referenced them. */
  if (k.poster) {
    return `
      <div class="card__media card__media--poster">
        <span class="card__media-play" aria-hidden="true">${I[k.posterIcon] || I.play}</span>
      </div>`;
  }
  return "";
}

/* The shared-brain map: one shared-brain node (with the learning log as its
   caption) sits above the agents, each with its four files (role, character,
   skills, memory). A bus/spine line runs from the brain node to every agent
   card, so the connection reads as one system instead of separate tiles. The
   diagram floats directly on the page background (no card). Pure HTML/CSS on
   DS tokens, so RTL is free (logical layout) and it matches the site look
   with no new tokens. */
function sharedBrainDiagram(n) {
  const agentCard = () => `
    <div class="brainmap__agent">
      <span class="brainmap__agent-name">${n.agent}</span>
      <div class="brainmap__attrs">
        <span class="brainmap__attr">${n.role}</span>
        <span class="brainmap__attr">${n.character}</span>
        <span class="brainmap__attr">${n.skills}</span>
        <span class="brainmap__attr">${n.memory}</span>
      </div>
    </div>`;
  return `
    <div class="brainmap" role="group" aria-label="How the team connects: one shared brain, holding the rules and the roles, wired to every agent that has its own role, character, skills and memory">
      <div class="brainmap__hd">
        <span class="brainmap__coord brainmap__coord--primary">${I.doc}<span>${n.rules}</span></span>
        <span class="brainmap__coord brainmap__coord--primary">${I.repeat}<span>${n.sharedBrain}</span></span>
        <span class="brainmap__coord brainmap__coord--primary">${I.doc}<span>${n.roles}</span></span>
      </div>
      <div class="brainmap__agents">
        ${agentCard()}${agentCard()}${agentCard()}
      </div>
    </div>`;
}

/* Tier visibility: invite-only. Any signed-in tier (student or admin) sees every
   section; there is no visitor tier. `sec` is kept for signature stability (call
   sites pass a section) but no longer gates — the RLS-backed sign-in is the gate. */
function canSee(sec) {
  // Invite-only: any signed-in tier (student or admin) sees every section.
  // Denied users never reach here — they're signed out and bounced home.
  return AUTH.tier === "admin" || AUTH.tier === "student";
}

function renderPrep(lang) {
  const t = I18N[lang];
  // The real guard is Supabase RLS; this only decides what to paint. Any
  // non-null tier means signed in. Signed-out → bounce home + pop sign-in.
  if (!AUTH.tier) { pendingStudentOpen = true; location.hash = "#/"; return; }

  // Invite-only: there is no "visitor" tier anymore. A signed-in user is either
  // 'student' or 'admin' (both fall through to content). Anyone denied was signed
  // out in loadAuth() and never reaches this route.

  const W = window.WORKSHOP_CONTENT;
  // Defensive: if content.js failed to load, keep the page usable.
  if (!W) {
    document.getElementById("app").innerHTML = `
    ${navHeader(t, lang, { account: true })}
    <main id="top" class="page"><section class="section"><div class="wrap narrow">
      <span class="eyebrow">${t.prep_page_title}</span>
      <h1 class="section-title">${t.prep_welcome_title}</h1>
      <p class="section-lead">Content is loading. If this persists, refresh the page.</p>
    </div></section></main>
    ${studentModal(t)}${siteFooter(t)}`;
    afterRender();
    return;
  }
  // Bilingual content model: pick the toggled language, fall back to English.
  const C = W[lang] || W.en;

  const isAdmin = AUTH.tier === "admin";

  // Course-content panel — everything the student sees (title excluded; the
  // title stays above the tab bar, visible on every tab).
  const contentPanel = `
    <!-- 1b — The kit and the deck. Always first, never collapsed: a student who
         comes back months later on a new machine starts here. Built on the
         existing .grid/.card recipe. The only addition is .card--anchored /
         .card__foot, which pins both CTAs to one baseline at the card bottom —
         without it the shorter card left its button floating in dead space.
         The note sits ABOVE the foot on purpose so the two buttons still line up. -->
    ${canSee(C.kit) ? `<section class="section"><div class="wrap">
      <div class="reveal">
        <span class="eyebrow">${C.kit.kicker}</span>
        <h2 class="section-title">${C.kit.title}</h2>
        <p class="section-lead">${C.kit.subtitle}</p>
      </div>
      <div class="grid grid--3" style="margin-top:2rem">
        ${C.kit.items.map((k) => `
          <div class="card card--anchored ${k.featured ? "card--feature" : ""} reveal">
            <div class="card__ico">${I[k.icon] || I.box}</div>
            <div class="card__kicker-row">
              <span class="card__kicker">${k.kicker}</span>
              ${k.note ? `<button type="button" class="card__note-btn" data-tooltip="${escapeAttr(k.note)}" data-tip-theme="light" aria-label="${escapeAttr(k.note)}">${I.info}</button>` : ""}
            </div>
            <h3>${k.title}</h3>
            <p>${k.body}</p>
            <div class="card__foot">
              ${kitMedia(k)}
              <div class="cta-row">
                <a class="btn btn--primary btn--sm" href="${k.href}"${k.download ? ` download` : ` target="_blank" rel="noopener"`}>${k.cta}</a>
              </div>
            </div>
          </div>`).join("")}
      </div>
    </div></section>` : ""}

    <!-- 1c - How today runs (deck slide 3). Orientation before detail. Straight
         reuse of the .grid--3 + .card recipe the end and crew sections use; the
         only difference is that these cards carry no kicker and no foot. -->
    ${canSee(C.howToday) ? `<section class="section section--alt"><div class="wrap">
      <div class="reveal">
        <span class="eyebrow">${C.howToday.kicker}</span>
        <h2 class="section-title">${C.howToday.title}</h2>
        <p class="section-lead">${C.howToday.subtitle}</p>
      </div>
      <div class="grid grid--3" style="margin-top:2rem">
        ${C.howToday.tiles.map((tile) => `
          <div class="card reveal">
            <div class="card__ico">${I[tile.icon] || I.box}</div>
            <h3>${tile.title}</h3>
            <p>${tile.body}</p>
          </div>`).join("")}
      </div>
      <p class="tech__closing reveal">${C.howToday.closing}</p>
    </div></section>` : ""}

    <!-- 2 — By the end of today (three parts).
         PLAIN, not --alt: the panel alternates plain/tinted section by section,
         and inserting howToday above pushed end onto the same tint as it. -->
    ${canSee(C.end) ? `<section class="section"><div class="wrap">
      <div class="reveal">
        <span class="eyebrow">${C.end.kicker}</span>
        <h2 class="section-title">${C.end.title}</h2>
        <p class="section-lead">${C.end.subtitle}</p>
      </div>
      <div class="grid grid--3" style="margin-top:2rem">
        <div class="card reveal">
          <div class="card__ico">${I.users}</div>
          <span class="card__kicker">${C.end.team.kicker}</span>
          <h3>${C.end.team.title}</h3>
          <ul class="teammates">
            ${C.end.team.teammates.map((m) => `
              <li><span class="teammates__name">${m.name}</span> <span class="teammates__charter">${m.charter}</span><p>${m.body}</p></li>`).join("")}
          </ul>
        </div>
        <div class="card reveal">
          <div class="card__ico">${I.box}</div>
          <span class="card__kicker">${C.end.foundation.kicker}</span>
          <h3>${C.end.foundation.title}</h3>
          <p>${C.end.foundation.body}</p>
        </div>
        <div class="card card--feature reveal">
          <div class="card__ico">${I.repeat}</div>
          <span class="card__tag">${C.end.home.tag}</span>
          <h3>${C.end.home.title}</h3>
          <p>${C.end.home.body}</p>
        </div>
      </div>
    </div></section>` : ""}

    <!-- 3 - The agent anatomy (deck slides 7 + 8). Replaced the narrowing-focus
         section and its funnel figure on 2026-08-27: the deck teaches the anatomy
         in this slot, and the closing exercise asks each student to write an
         agent's job, character and skills, so this is now preparation for that.
         Same .tech grid and the same numbered .stage-list as before - the two
         groups are two clusters in the two existing columns. --groups only
         swaps align-items to start so both group headings share one baseline
         (the columns hold 4 items and 2, so centring them looked misaligned). -->
    ${canSee(C.technical) ? `<section class="section section--alt"><div class="wrap">
      <div class="reveal">
        <span class="eyebrow">${C.technical.kicker}</span>
        <h2 class="section-title">${C.technical.title}</h2>
        <p class="section-lead">${C.technical.subtitle}</p>
      </div>
      <div class="tech tech--groups" style="margin-top:2rem">
        ${(() => { let n = 0; return C.technical.groups.map((g) => `
          <div class="tech__group reveal">
            <span class="eyebrow">${g.heading}</span>
            <ol class="stage-list">
              ${g.stages.map((s) => `
                <li class="stage"><span class="stage__num">${++n}</span><div><h3>${s.title}</h3><p>${s.body}</p></div></li>`).join("")}
            </ol>
          </div>`).join(""); })()}
      </div>
      <p class="tech__closing reveal">${C.technical.closing.join("<br>")}</p>
    </div></section>` : ""}

    <!-- 4b - The shared brain (how the files connect) -->
    ${canSee(C.sharedBrain) ? `<section class="section"><div class="wrap">
      <div class="reveal">
        <span class="eyebrow">${C.sharedBrain.kicker}</span>
        <h2 class="section-title">${C.sharedBrain.title}</h2>
        <p class="section-lead">${C.sharedBrain.subtitle}</p>
      </div>
      <div class="brain" style="margin-top:2rem">
        <p class="brain__body reveal">${C.sharedBrain.body}</p>
        <div class="brain__figure reveal">${sharedBrainDiagram(C.sharedBrain.nodes)}</div>
      </div>
    </div></section>` : ""}

    <!-- 4c - Meet the team you will work with. Three agents ship inside the kit;
         the page introduced no cast at all before this, so a returning student met
         three named agents for the first time inside a prompt. Same .grid--3/.card
         recipe as the end section, plus .card--anchored/.card__foot so all three
         badge rows sit on one baseline however the body copy wraps. -->
    ${canSee(C.crew) ? `<section class="section section--alt"><div class="wrap">
      <div class="reveal">
        <span class="eyebrow">${C.crew.kicker}</span>
        <h2 class="section-title">${C.crew.title}</h2>
        <p class="section-lead">${C.crew.subtitle}</p>
      </div>
      <div class="grid grid--3" style="margin-top:2rem">
        ${C.crew.members.map((m) => `
          <div class="card card--anchored reveal">
            <div class="card__ico">${I[m.icon] || I.users}</div>
            <span class="card__kicker">${m.tag}</span>
            <h3>${m.role}</h3>
            <p>${m.body}</p>
            <div class="card__foot">
              <div class="card__badges">
                ${m.badges.map((b) => `<span class="card__badge">${b}</span>`).join("")}
              </div>
            </div>
          </div>`).join("")}
      </div>
      <p class="tech__closing reveal">${C.crew.closing}</p>
    </div></section>` : ""}

    <!-- 5 — The plan (numbered steps with copyable prompt cards).
         PLAIN, not --alt: this panel alternates plain/tinted section by section,
         and inserting kit + crew above pushed plan onto the same tint as crew —
         one continuous 2,300px tinted slab. The tint flips here and on the help
         section below so the alternation survives the two new sections. -->
    ${canSee(C.plan) ? `<section class="section"><div class="wrap narrow">
      <div class="reveal">
        <span class="eyebrow">${C.plan.kicker}</span>
        <h2 class="section-title">${C.plan.title}</h2>
        <p class="section-lead">${C.plan.subtitle}</p>
      </div>
      <div class="plan" style="margin-top:2rem">
        ${C.plan.steps.map((s) => planStep(s, false)).join("")}
      </div>
      <p class="tech__closing reveal">${C.plan.closing}</p>
    </div></section>` : ""}

    <!-- Help + WhatsApp (site copy - bilingual, inherits the main dir).
         --alt so it reads as its own block instead of running on from the very
         long plan section above it — see the tint note on plan. -->
    <section class="section section--alt"><div class="wrap narrow">
      <div class="reveal">
        <h2 class="prep__h">${t.prep_help_title}</h2>
        <p class="section-lead" style="margin-top:.5rem">${t.prep_help_body}</p>
        <div class="cta-row" style="margin-top:1.25rem">
          <a class="btn btn--wa-solid" href="${WA_URL}" target="_blank" rel="noopener">${I.wa} ${t.cta_wa}</a>
        </div>
      </div>
    </div></section>`;

  // Students panel — admin only. This is Ofir's invite list / CRM: add an email
  // (step 1), confirm it to grant access (step 2), remove, and see who's actually
  // signed in. The table is filled async by renderRoster() from admin_roster();
  // RLS is the real gate (non-admins get zero rows even if they force this open).
  const studentsPanel = `
    <section class="section" data-roster-section><div class="wrap roster-wrap">
      <div class="reveal">
        <span class="eyebrow">${t.roster_kicker}</span>
        <h2 class="section-title">${t.admin_roster_title}</h2>
        <p class="section-lead">${t.roster_sub}</p>
      </div>
      <form class="roster__add" data-roster-add style="margin-top:1.75rem">
        <input class="roster__input" type="text" name="sname" required
          placeholder="${t.roster_add_name_placeholder}" aria-label="${t.roster_add_name_placeholder}" autocomplete="off" />
        <input class="roster__input" type="email" name="email"
          placeholder="${t.roster_add_placeholder}" aria-label="${t.roster_add_placeholder}" autocomplete="off" />
        <button class="btn btn--primary roster__addbtn" type="submit">${I.check}<span>${t.roster_add_cta}</span></button>
      </form>
      <p class="roster__hint">${t.roster_add_hint}</p>
      <div class="roster" data-roster style="margin-top:1.5rem">
        <p class="roster__loading">${t.roster_loading}</p>
      </div>
    </div></section>`;

  // Data-driven tab set so more panels can be added later. Students is admin-only;
  // with a single tab we skip the bar entirely (students/visitors see content only).
  const tabs = [
    { id: "content", label: t.tab_content, panel: contentPanel },
    ...(isAdmin ? [{ id: "students", label: t.tab_students, panel: studentsPanel }] : []),
  ];
  // The tab you were on is where you come back to. Any re-render of this page
  // (language switch, hash route, an auth event) used to drop you back on the
  // first tab; on a CRM being worked row by row that loses your place.
  const activeTab = tabs.some((tb) => tb.id === prepTab()) ? prepTab() : tabs[0].id;
  // Tab bar aligns to the reading-start edge automatically (flex-start honors dir:
  // right in Hebrew RTL, left in English LTR) — no explicit side needed.
  const tabBar = tabs.length > 1 ? `
    <div class="wrap"><div class="tabs" role="tablist" data-tabs>
      ${tabs.map((tb) => `<button type="button" class="tabs__btn" role="tab"
        data-tab="${tb.id}" aria-selected="${tb.id === activeTab ? "true" : "false"}">${tb.label}</button>`).join("")}
    </div></div>` : "";
  const panelsHtml = tabs.length > 1
    ? tabs.map((tb) => `<div class="tabpanel" data-tab-panel="${tb.id}"${tb.id === activeTab ? "" : " hidden"}>${tb.panel}</div>`).join("")
    : contentPanel;

  document.getElementById("app").innerHTML = `
  ${navHeader(t, lang, { account: true })}

  <main id="top" class="page vault" dir="${lang === "he" ? "rtl" : "ltr"}">
    <!-- 1 — Full-bleed brand banner, stays above the tab bar on every tab.
         Full-bleed technique + accent tint reused verbatim from
         .ss-divider-full / .session-strip-band (styles.css) — no new pattern. -->
    <section class="prep-banner reveal">
      <h1 class="prep-banner__title">${C.hero.title}</h1>
    </section>

    ${tabBar}
    ${panelsHtml}
  </main>

  ${studentModal(t)}
  ${isAdmin ? confirmRemoveModal(t) : ""}
  ${siteFooter(t)}`;

  afterRender();
  initPrepTabs();
  // Admin only: bind the "Add user" form once, then fetch + draw the roster. RLS
  // returns zero rows to non-admins, so this is safe even if the div is forced open.
  if (isAdmin) { wireRosterAdd(lang); wireRemoveConfirm(); renderRoster(lang); }
}

/* Which student-area tab is open. Module state so it survives a re-render, and
   sessionStorage so it survives a reload / an OAuth round trip, per browser tab. */
const PREP_TAB_KEY = "pl_prep_tab";
let PREP_TAB = null;
function prepTab(next) {
  if (next !== undefined) {
    PREP_TAB = next;
    try { sessionStorage.setItem(PREP_TAB_KEY, next); } catch (e) {}
    return PREP_TAB;
  }
  if (PREP_TAB === null) { try { PREP_TAB = sessionStorage.getItem(PREP_TAB_KEY); } catch (e) {} }
  return PREP_TAB;
}

/* Student-area tab bar: switch which panel is visible. No-op when there's only
   one tab (no bar rendered). Panels stay in the DOM (hidden), so the async
   roster fetch into [data-roster] still lands even on the inactive tab. */
function initPrepTabs() {
  const bar = document.querySelector("[data-tabs]");
  if (!bar) return;
  const btns = [...bar.querySelectorAll("[data-tab]")];
  const panels = [...document.querySelectorAll("[data-tab-panel]")];
  btns.forEach((b) => b.addEventListener("click", () => {
    const id = b.getAttribute("data-tab");
    prepTab(id);
    btns.forEach((x) => x.setAttribute("aria-selected", x === b ? "true" : "false"));
    panels.forEach((p) => {
      const show = p.getAttribute("data-tab-panel") === id;
      p.hidden = !show;
      // A hidden panel's .reveal elements are never seen by the scroll observer,
      // so force them visible when the panel is switched in (else they stay at
      // opacity:0). The initial panel is handled by the observer as usual.
      if (show) p.querySelectorAll(".reveal").forEach((r) => r.classList.add("in"));
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }));
}

/* ---- Admin roster: the invite list / student CRM ------------------------- */
/* Admin-only. One call to admin_roster() merges the allowlist (who's invited +
   confirmed) with profiles (who actually signed in). Each row is one of:
   confirmed student · added-but-pending · a gate-crasher (signed in, not invited).
   Every write below succeeds only for the admin (RLS); after each one we re-fetch. */
/* ---- CONTENT DECIDES DIRECTION, THE SITE TOGGLE NEVER DOES ---------------
   Ofir 2026-08-23: "if it's in English, make it left to right, regardless of the
   language of the website." Every free-text value in this panel is dir-resolved
   from its OWN first strong character - the same rule the browser uses for
   dir="auto", computed here because the value also has to drive the direction of
   the wrapper around it (a note card, a quote span, a table cell). */
const RTL_CHARS = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
const LTR_CHARS = /[A-Za-z\u00C0-\u024F\u0370-\u058F\u1E00-\u1EFF]/;
function textDir(v, fallback) {
  const str = String(v == null ? "" : v);
  const r = str.search(RTL_CHARS);
  const l = str.search(LTR_CHARS);
  if (r === -1 && l === -1) return fallback || "auto";
  if (r === -1) return "ltr";
  if (l === -1) return "rtl";
  return r < l ? "rtl" : "ltr";
}

/* ---- Time, presented ----------------------------------------------------
   Nothing in this panel shows a raw timestamp. Every moment renders as HOW LONG
   AGO (the thing that is actually read) beside the moment itself, in the UI
   language, as TWO separate elements - a Hebrew word and a Latin numeral in one
   bidi run reorder unpredictably, two isolated spans never do. */
function localeOf(lang) { return lang === "he" ? "he-IL" : "en-GB"; }

function relAge(d, lang, dateOnly) {
  try {
    const rtf = new Intl.RelativeTimeFormat(localeOf(lang), { numeric: "auto" });
    const now = new Date();
    const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const days = Math.round((b - a) / 86400000);
    if (days === 0) {
      // A DD.MM entry is a DAY, not a moment - "8 hours ago" would be invented.
      if (dateOnly) return rtf.format(0, "day");
      const mins = Math.round((d - now) / 60000);
      if (Math.abs(mins) < 60) return rtf.format(mins, "minute");
      return rtf.format(Math.round((d - now) / 3600000), "hour");
    }
    if (Math.abs(days) < 31) return rtf.format(days, "day");
    if (Math.abs(days) < 365) return rtf.format(Math.round(days / 30), "month");
    return rtf.format(Math.round(days / 365), "year");
  } catch (e) { return ""; }
}

// A DB timestamp -> { stamp, rel, title }. Null when there is nothing to show.
function rosterWhen(v, lang) {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  const loc = localeOf(lang);
  let stamp = String(v);
  try {
    stamp = d.toLocaleDateString(loc, { day: "numeric", month: "short" })
      + " · " + d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
  } catch (e) {}
  let title = stamp;
  try { title = d.toLocaleString(loc, { dateStyle: "full", timeStyle: "short" }); } catch (e) {}
  return { stamp, rel: relAge(d, lang), title };
}

/* ---- Notes: an append-only log, one dated line per fact ------------------
   Convention (CMO 2026-08-23, shared brain "CRM NOTE CONVENTION"):
     `DD.MM - one fact` · newest on top · a line is NEVER edited or deleted (a
     correction is a NEW dated line) · "quoted text" is the candidate's own words
     · a line starting `הערכה:` / `read:` is our read, not a fact · and the next
     action never lives here, it lives in `צעד הבא` alone.
   STORAGE IS UNCHANGED - still the one `notes` text column, no DB work. What
   changed is the interface: an ADD box plus a READ-ONLY history, so "never
   destroy a line" is enforced structurally instead of by discipline at 11pm on a
   phone. Adding PREPENDS one stamped line to the raw string and rewrites not a
   single existing character, so the history is loss-proof by construction.
   Entry boundary is the CMO's parse contract. Anything that is not a dated line
   is LEGACY prose from before the convention - rendered as its own entry and
   labelled undated, never dropped and never a crash. Every row is legacy today,
   so that is the common path, not the edge case. */
const NOTE_LINE = /^\s*(\d{1,2})\.(\d{1,2})\s*-?\s*/;
const NOTE_OPINION = /^\s*(הערכה|read)\s*:\s*/i;

function noteStampToday() {
  const d = new Date();
  return String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0");
}

// DD.MM carries no year. Assume the current one; if that lands in the future a
// note about the past must belong to last year.
function noteDate(dd, mm) {
  const now = new Date();
  let d = new Date(now.getFullYear(), Number(mm) - 1, Number(dd));
  if (isNaN(d.getTime())) return null;
  if (d - now > 7 * 86400000) d = new Date(now.getFullYear() - 1, Number(mm) - 1, Number(dd));
  return isNaN(d.getTime()) ? null : d;
}

function parseNotes(raw) {
  const out = [];
  String(raw == null ? "" : raw).split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;
    const m = line.match(NOTE_LINE);
    if (m) out.push({ dd: m[1], mm: m[2], text: line.slice(m[0].length).trim(), legacy: false });
    else out.push({ dd: null, mm: null, text: line.trim(), legacy: true });
  });
  return out;
}

// A "..." span is THEIR words: quote-styled, and it resolves its OWN direction
// from its own first strong character even inside an opposite-direction line.
function noteBodyHtml(text) {
  return String(text).split(/("[^"]*"|\u201C[^\u201D]*\u201D)/g).map((p) => {
    if (!p) return "";
    const isQuote = /^"[^"]*"$/.test(p) || /^\u201C[^\u201D]*\u201D$/.test(p);
    return isQuote
      ? `<span class="rnote__q" dir="${textDir(p)}">${escapeHtml(p)}</span>`
      : escapeHtml(p);
  }).join("");
}

// One entry = one wrapper. That is Ofir's ask ("each item its own wrapper").
function noteEntryHtml(e, lang, t) {
  const opinion = NOTE_OPINION.test(e.text);
  const body = opinion ? e.text.replace(NOTE_OPINION, "") : e.text;
  let head;
  if (e.legacy) {
    head = `<span class="rnote__chip rnote__chip--legacy">${escapeHtml(t.roster_note_legacy)}</span>`;
  } else {
    const d = noteDate(e.dd, e.mm);
    const age = d ? relAge(d, lang, true) : "";
    head = `<span class="rnote__chip" dir="ltr">${escapeHtml(e.dd)}.${escapeHtml(e.mm)}</span>`
      + (age ? `<span class="rnote__age" dir="auto">${escapeHtml(age)}</span>` : "");
  }
  if (opinion) head += `<span class="rnote__tag">${escapeHtml(t.roster_note_read)}</span>`;
  const cls = "rnote" + (opinion ? " rnote--opinion" : "") + (e.legacy ? " rnote--legacy" : "");
  return `<article class="${cls}" dir="${textDir(body, "auto")}">
        <div class="rnote__head">${head}</div>
        <p class="rnote__body">${noteBodyHtml(body)}</p>
      </article>`;
}

function notesListHtml(raw, lang, t) {
  const entries = parseNotes(raw);
  if (!entries.length) return `<p class="rnotes__empty">${escapeHtml(t.roster_note_empty)}</p>`;
  return entries.map((e) => noteEntryHtml(e, lang, t)).join("");
}

/* `צעד הבא` is one short line by convention (`DD.MM - verb who`). Read at a
   glance in the collapsed row: the date becomes a chip with its age, the verb
   stays plain text, and it WRAPS - this field is the one Ofir called out for
   scrolling sideways, so it may never be a single-line box again. */
function nextActionHtml(v, lang) {
  const str = String(v == null ? "" : v).trim();
  if (!str) return `<span class="roster__none">—</span>`;
  const m = str.match(NOTE_LINE);
  if (!m) return `<span class="roster__next" dir="${textDir(str, "auto")}">${escapeHtml(str)}</span>`;
  const d = noteDate(m[1], m[2]);
  const age = d ? relAge(d, lang, true) : "";
  const rest = str.slice(m[0].length).trim();
  return `<span class="roster__next" dir="${textDir(rest, "auto")}">`
    + `<span class="rnote__chip" dir="ltr">${escapeHtml(m[1])}.${escapeHtml(m[2])}</span>`
    + (age ? `<span class="rnote__age" dir="auto">${escapeHtml(age)}</span>` : "")
    + `<span class="roster__nexttxt">${escapeHtml(rest)}</span></span>`;
}

/* A textarea that grows to fit instead of scrolling. Every free-text control in
   this panel is one of these; nothing here is a single-line input any more. */
function autoGrow(el) {
  if (!el) return;
  el.style.height = "auto";
  const h = el.scrollHeight;
  if (h <= 0) return;                       // hidden row: size it when it opens
  let extra = 0;
  try {
    const cs = getComputedStyle(el);        // scrollHeight excludes the border
    if (cs.boxSizing === "border-box") {
      extra = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
    }
  } catch (e) {}
  el.style.height = (h + extra) + "px";
}

// The 6 CRM funnel stages (order = funnel order). Labels live in I18N[lang].stages.
const CRM_STAGES = ["invited", "interested", "call_booked", "confirmed", "attended", "dropped"];

/* Which rows are expanded, keyed by the PERSON and not by their index - a
   re-fetch can reorder the list, and losing the row you were reading is exactly
   the complaint this panel already had. Survives every re-render of the table. */
const ROSTER_OPEN = new Set();
function rowKey(r) { return r.email ? "e:" + r.email : "i:" + (r.id == null ? "" : r.id); }

// Attribute-safe escape (escapeHtml does not touch quotes; input values need it).
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;"); }


// Clean standalone job-title label from a `role` field written for sentence
// context ("The product manager", "מנהל המוצר"): strips a leading English
// article and title-cases the rest, so it reads as a name/label on its own
// rather than a sentence fragment. Hebrew is unaffected (no article to
// strip, .toUpperCase() is a no-op on Hebrew letters).
function fleetRoleTitle(role) {
  return String(role || "").replace(/^(the|a|an)\s+/i, "").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Clamps a .avatar-tip so it never runs off either side of the viewport -
// it's centered on its avatar by default (CSS left:50% + transform), which
// goes off-screen for any avatar near the edge of the (wrapping) row. Shifts
// the bubble sideways and keeps the arrow (--tip-arrow-x) pointed at the
// avatar's own center, same technique any real popover library uses.
function fleetPositionTip(btn) {
  const tip = btn.querySelector(".avatar-tip");
  if (!tip) return;
  tip.style.left = "";
  tip.style.removeProperty("--tip-arrow-x");
  const margin = 12;
  const btnRect = btn.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  const btnCenterX = btnRect.left + btnRect.width / 2;
  const naturalLeft = btnCenterX - tipRect.width / 2;
  const naturalRight = btnCenterX + tipRect.width / 2;
  let shift = 0;
  if (naturalLeft < margin) shift = margin - naturalLeft;
  else if (naturalRight > window.innerWidth - margin) shift = (window.innerWidth - margin) - naturalRight;
  if (shift) {
    tip.style.left = (btnRect.width / 2 + shift) + "px";
    tip.style.setProperty("--tip-arrow-x", (tipRect.width / 2 - shift) + "px");
  }
}

// Bind the "Add user" form once per render (outside the re-fetched table body so
// listeners never stack). A lead can be added with a NAME ONLY (email is optional)
// (the migrated allowlist is id-keyed with nullable email). Adds confirmed=false.
function wireRosterAdd(lang) {
  const form = document.querySelector("[data-roster-add]");
  if (!form || form.dataset.bound) return;
  form.dataset.bound = "1";
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = form.querySelector("input[name=sname]");
    const emailInput = form.querySelector("input[name=email]");
    const name = (nameInput.value || "").trim();
    const email = (emailInput.value || "").trim().toLowerCase();
    if (!name && !email) return;
    await addUser({ name, email }, lang);
    nameInput.value = "";
    emailInput.value = "";
    nameInput.focus();
  });
}

// Accepts either { name, email } (new add form) or a bare email string (the
// gate-crasher "Add to list" button). Only sends columns that have a value so a
// name-only lead inserts cleanly; a missing `name` column can fail the ADD but
// never the READ/RENDER.
async function addUser(lead, lang) {
  if (typeof lead === "string") lead = { email: lead };
  const payload = { added_by: (AUTH.user && AUTH.user.email) || null };
  if (lead.email) payload.email = lead.email;
  if (lead.name) payload.name = lead.name;
  const { error } = await sb.from("allowlist").insert(payload);
  if (error) console.warn("addUser failed (add only; render unaffected):", error.message);
  // Ignore duplicate errors (already on the list); always re-draw.
  renderRoster(lang);
  return error;
}

// Save edited CRM fields for one row. Guarded so a missing RPC/column can never
// break the table: prefer admin_set_student(); on any failure fall back to a direct
// allowlist update keyed by id (name-only leads) or email. Never throws.
async function saveStudent(key, patch, statusEl, t) {
  const setStatus = (txt, ok) => {
    if (!statusEl) return;
    statusEl.textContent = txt;
    statusEl.classList.toggle("roster__savemsg--err", ok === false);
    statusEl.classList.toggle("roster__savemsg--ok", ok === true);
  };
  try {
    let ok = false;
    // (a) Preferred: the admin_set_student RPC (email-keyed; coalesce keeps old on null).
    if (key.email) {
      const { error } = await sb.rpc("admin_set_student", {
        p_email: key.email,
        p_source: patch.source ?? null,
        p_stage: patch.stage ?? null,
        p_notes: patch.notes ?? null,
        p_phone: patch.phone ?? null,
        p_next_action: patch.next_action ?? null,
        p_evidence_url: null,
      });
      ok = !error;
    }
    // (b) Fallback: direct update. Keyed by id when present (works for name-only
    // leads that the email-keyed RPC cannot reach), else by email.
    if (!ok) {
      let q = sb.from("allowlist").update(patch);
      q = key.id ? q.eq("id", key.id) : q.eq("email", key.email);
      const { error } = await q;
      if (error) throw error;
    }
    setStatus(t ? t.roster_saved : "Saved", true);
  } catch (e) {
    console.warn("saveStudent failed:", e && e.message);
    setStatus(t ? t.roster_save_err : "Save failed", false);
  }
}

async function confirmUser(email, next, lang) {
  await sb.from("allowlist").update({ confirmed: next }).eq("email", email);
  renderRoster(lang);
}

// Set by openRemoveConfirm() when a row's trash icon is clicked; read only by
// wireRemoveConfirm()'s own confirm handler - module state, not a DOM
// data-attribute, because `key` can be an {id, email} object, not a string.
let PENDING_REMOVE = null;

// Opens the delete-confirm modal (Ofir, 2026-09-03: a trash icon must never
// delete on click alone). Fills in the person's name, does not touch the row.
function openRemoveConfirm(key, name, lang) {
  const modal = document.querySelector("[data-remove-modal]");
  if (!modal) return;
  PENDING_REMOVE = { key, lang };
  const nameEl = modal.querySelector("[data-remove-name]");
  if (nameEl) nameEl.textContent = name || (lang === "he" ? "התלמיד/ה" : "this student");
  modal.hidden = false;
  document.body.classList.add("modal-open");
}

// Cancel / overlay click / Escape all close without acting. Only the confirm
// button ever calls removeUser() - same open/close mechanics as wireStudent().
function wireRemoveConfirm() {
  const modal = document.querySelector("[data-remove-modal]");
  if (!modal) return;
  const close = () => { modal.hidden = true; document.body.classList.remove("modal-open"); PENDING_REMOVE = null; };
  modal.querySelectorAll("[data-remove-cancel]").forEach((b) => b.addEventListener("click", close));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) close(); });
  modal.querySelector("[data-remove-confirm]")?.addEventListener("click", () => {
    if (!PENDING_REMOVE) return;
    const { key, lang } = PENDING_REMOVE;
    close();
    removeUser(key, lang);
  });
}

async function removeUser(key, lang) {
  // key may be a bare email (legacy) or { id, email }. Prefer id so name-only
  // leads (nullable email) can still be removed.
  if (typeof key === "string") key = { email: key };
  let q = sb.from("allowlist").delete();
  q = key.id ? q.eq("id", key.id) : q.eq("email", key.email);
  await q;
  renderRoster(lang);
}

async function renderRoster(lang) {
  const host = document.querySelector("[data-roster]");
  if (!host) return;
  const t = I18N[lang];
  const { data: rows, error } = await sb.rpc("admin_roster");
  if (error) { host.innerHTML = `<p class="roster__empty">${t.roster_empty}</p>`; return; }
  if (!rows || rows.length === 0) {
    host.innerHTML = `<p class="roster__empty">${t.roster_empty}</p>`;
    return;
  }
  // Per-row edit keys (id preferred so name-only leads with nullable email still
  // save/remove). Guarded: any of these CRM fields may be absent if the migration
  // has not run yet; every read defaults, so the table always renders.
  const keys = rows.map((r) => ({ id: r.id ?? null, email: r.email || null }));
  // Display name for the delete-confirm dialog only - falls back to the email
  // so a name-only-missing lead still reads as a specific person, not blank.
  const names = rows.map((r) => r.name || r.full_name || r.email || "");

  const stageSelect = (i, cur) => `<select class="roster__stage roster__stage--${escapeHtml(cur)}" data-stage-select data-field="stage" data-i="${i}" aria-label="${t.roster_col_stage}">
        ${CRM_STAGES.map((s) => `<option value="${s}"${s === cur ? " selected" : ""}>${escapeHtml(t.stages[s] || s)}</option>`).join("")}
      </select>`;

  const body = rows.map((r, i) => {
    // Access pill (can they sign in) is SEPARATE from the CRM stage (funnel).
    let pill;
    if (!r.on_list) pill = `<span class="roster__badge roster__badge--warn">${t.roster_pill_uninvited}</span>`;
    else if (r.confirmed) pill = `<span class="roster__badge roster__badge--ok">${t.roster_pill_confirmed}</span>`;
    else pill = `<span class="roster__badge">${t.roster_pill_pending}</span>`;

    const when = r.signed_in ? rosterWhen(r.first_signed_in_at, lang) : null;
    const signedIn = r.signed_in
      ? `<span class="roster__yes" title="${escapeAttr(when ? when.title : "")}">${I.check}
           <span class="roster__whenrel" dir="auto">${escapeHtml(when && when.rel ? when.rel : "")}</span>
           <span class="roster__whenabs" dir="auto">${escapeHtml(when ? when.stamp : "")}</span></span>`
      : `<span class="roster__no">${t.roster_signedin_no}</span>`;

    // CRM fields, all guarded (undefined -> default) so a missing column is safe.
    const stage = CRM_STAGES.includes(r.stage) ? r.stage : "invited";
    const source = r.source || "";
    const next = r.next_action || "";
    const notes = r.notes || "";
    const phone = r.phone || "";
    const name = r.name || r.full_name || "";

    // Actions: gate-crasher -> Add to list; on-list -> confirm (email only) + remove.
    let actions;
    if (!r.on_list) {
      actions = `<button type="button" class="btn btn--ghost btn--sm" data-add="${escapeAttr(r.email || "")}">${t.roster_add_to_list}</button>`;
    } else {
      const confirmBtn = r.email
        ? `<button type="button" class="btn ${r.confirmed ? "btn--ghost" : "btn--primary"} btn--sm" data-confirm="${escapeAttr(r.email)}" data-next="${r.confirmed ? "0" : "1"}">${r.confirmed ? t.roster_unconfirm : t.roster_confirm}</button>`
        : "";
      actions = `${confirmBtn}
         <button type="button" class="btn btn--ghost btn--danger btn--sm roster__remove" data-remove-ask="${i}" aria-label="${t.roster_remove}" data-tooltip="${t.roster_remove}">${I.trash}</button>`;
    }

    // Name and email are ONE cell (the email is a second line, not a column of
    // its own) and so are the access pill and the signed-in moment. Two fewer
    // columns is what buys `מקור` and `צעד הבא` enough width to be read without
    // clicking - which is the whole complaint.
    const person = `<span class="roster__person">
          <span class="roster__pname" dir="${textDir(name, "auto")}">${escapeHtml(name) || `<span class="roster__none">—</span>`}</span>
          ${r.email ? `<span class="roster__pmail" dir="ltr">${escapeHtml(r.email)}</span>` : ""}
        </span>`;

    const open = ROSTER_OPEN.has(rowKey(r));

    // Main row (scannable) + a detail row (edit source/next/phone + the note log).
    return `
      <tr class="roster__row">
        <td class="roster__expandcell">
          <button type="button" class="roster__expand${open ? " is-open" : ""}" data-expand="${i}" aria-expanded="${open ? "true" : "false"}" aria-label="${t.roster_details}" data-tooltip="${t.roster_details}">${I.chev}</button>
        </td>
        <td data-label="${t.roster_col_name}" class="roster__stack">${person}</td>
        <td data-label="${t.roster_col_status}"><span class="roster__access">${pill}${signedIn}</span></td>
        <td data-label="${t.roster_col_stage}">${stageSelect(i, stage)}</td>
        <td data-label="${t.roster_col_source}" class="roster__stack roster__free" dir="${textDir(source, "auto")}">${escapeHtml(source) || `<span class="roster__none">—</span>`}</td>
        <td data-label="${t.roster_col_next}" class="roster__stack roster__nextcell">${nextActionHtml(next, lang)}</td>
        <td class="roster__actions" data-label="${t.roster_col_actions}"><span class="roster__actionwrap">${actions}</span></td>
      </tr>
      <tr class="roster__detailrow" data-detail="${i}"${open ? "" : " hidden"}>
        <td colspan="7">
          <div class="roster__detail">
            <label class="roster__field">
              <span class="roster__fieldlbl">${t.roster_col_source}</span>
              <textarea class="roster__ta" data-field="source" data-i="${i}" data-grow rows="1" dir="auto" placeholder="${escapeAttr(t.roster_source_ph)}">${escapeHtml(source)}</textarea>
            </label>
            <label class="roster__field">
              <span class="roster__fieldlbl">${t.roster_col_next}</span>
              <textarea class="roster__ta" data-field="next_action" data-i="${i}" data-grow rows="1" dir="auto" placeholder="${escapeAttr(t.roster_next_ph)}">${escapeHtml(next)}</textarea>
            </label>
            <label class="roster__field">
              <span class="roster__fieldlbl">${t.roster_col_phone}</span>
              <input class="roster__input roster__input--sm" type="tel" data-field="phone" data-i="${i}" dir="ltr" value="${escapeAttr(phone)}" placeholder="${escapeAttr(t.roster_phone_ph)}" autocomplete="off" />
            </label>
            <div class="roster__field roster__field--wide rnotes">
              <span class="roster__fieldlbl">${t.roster_col_notes}</span>
              <div class="rnotes__add">
                <textarea class="roster__ta rnotes__new" data-note-new="${i}" data-grow rows="1" dir="${lang === "he" ? "rtl" : "ltr"}" placeholder="${escapeAttr(t.roster_notes_ph)}"></textarea>
                <button type="button" class="btn btn--ghost btn--sm rnotes__addbtn" data-note-add="${i}">${I.check}<span>${t.roster_note_add}</span></button>
              </div>
              <div class="rnotes__list" data-note-list="${i}">${notesListHtml(notes, lang, t)}</div>
              <textarea class="rnotes__raw" data-field="notes" data-i="${i}" hidden aria-hidden="true" tabindex="-1">${escapeHtml(notes)}</textarea>
            </div>
            <div class="roster__detailbar">
              <button type="button" class="btn btn--primary btn--sm" data-save="${i}">${t.roster_save}</button>
              <span class="roster__savemsg" data-savemsg="${i}" role="status" aria-live="polite"></span>
            </div>
          </div>
        </td>
      </tr>`;
  }).join("");

  // The colgroup + table-layout:fixed is what makes "nothing scrolls sideways"
  // a guarantee rather than a hope: no cell can widen the table, so long text
  // has nowhere to go but down. `צעד הבא` takes the leftover width on purpose.
  host.innerHTML = `
    <div class="roster__scroll">
      <table class="roster__table roster__table--crm roster__table--fixed">
        <colgroup>
          <col class="rc-chev" /><col class="rc-person" /><col class="rc-access" />
          <col class="rc-stage" /><col class="rc-source" /><col class="rc-next" />
          <col class="rc-actions" />
        </colgroup>
        <thead><tr>
          <th aria-hidden="true"></th>
          <th>${t.roster_col_name}</th>
          <th>${t.roster_col_status}<button type="button" class="roster__colhelp" data-tooltip="${t.roster_access_help}" data-tip-pos="top" aria-label="${t.roster_access_help}">${I.info}</button></th>
          <th>${t.roster_col_stage}</th>
          <th>${t.roster_col_source}</th>
          <th>${t.roster_col_next}</th>
          <th>${t.roster_col_actions}</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;

  // Expand/collapse the detail row. A textarea can only measure itself once it
  // is actually visible, so every grower in the panel is sized on open.
  host.querySelectorAll("[data-expand]").forEach((b) =>
    b.addEventListener("click", () => {
      const i = b.getAttribute("data-expand");
      const dr = host.querySelector(`[data-detail="${i}"]`);
      if (!dr) return;
      const opening = dr.hasAttribute("hidden");
      if (opening) dr.removeAttribute("hidden"); else dr.setAttribute("hidden", "");
      b.setAttribute("aria-expanded", opening ? "true" : "false");
      b.classList.toggle("is-open", opening);
      if (opening) ROSTER_OPEN.add(rowKey(rows[i])); else ROSTER_OPEN.delete(rowKey(rows[i]));
      if (opening) dr.querySelectorAll("textarea[data-grow]").forEach(autoGrow);
    }));

  // Free-text fields grow instead of scrolling. Rows that are already open when
  // the table paints get sized now; the rest are sized when they open.
  host.querySelectorAll("textarea[data-grow]").forEach((ta) => {
    ta.addEventListener("input", () => autoGrow(ta));
    autoGrow(ta);
  });

  /* Add one note entry. The date is stamped here, the line is PREPENDED to the
     raw value, and nothing already in it is touched - append-only is a property
     of the code path, not a rule anyone has to remember. It saves immediately:
     an entry that survives only until the admin remembers to press שמירה does
     not survive. */
  const addNote = (i) => {
    const ta = host.querySelector(`[data-note-new="${i}"]`);
    const raw = host.querySelector(`.rnotes__raw[data-i="${i}"]`);
    if (!ta || !raw) return;
    const typed = (ta.value || "").replace(/\s*\r?\n\s*/g, " ").trim();
    if (!typed) return;
    const line = NOTE_LINE.test(typed) ? typed : `${noteStampToday()} - ${typed}`;
    const prev = raw.value.replace(/^\s+|\s+$/g, "");
    raw.value = prev ? line + "\n" + prev : line;
    ta.value = "";
    autoGrow(ta);
    const list = host.querySelector(`[data-note-list="${i}"]`);
    if (list) list.innerHTML = notesListHtml(raw.value, lang, t);
    const patch = {};
    host.querySelectorAll(`[data-field][data-i="${i}"]`).forEach((el) => {
      patch[el.getAttribute("data-field")] = el.value;
    });
    saveStudent(keys[i], patch, host.querySelector(`[data-savemsg="${i}"]`), t);
  };
  host.querySelectorAll("[data-note-add]").forEach((b) =>
    b.addEventListener("click", () => addNote(b.getAttribute("data-note-add"))));
  host.querySelectorAll("[data-note-new]").forEach((ta) =>
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addNote(ta.getAttribute("data-note-new")); }
    }));

  // Stage change: recolor + save immediately (stage is the must-have field).
  host.querySelectorAll("[data-stage-select]").forEach((sel) =>
    sel.addEventListener("change", () => {
      const i = sel.getAttribute("data-i");
      sel.className = "roster__stage roster__stage--" + sel.value;
      const statusEl = host.querySelector(`[data-savemsg="${i}"]`);
      saveStudent(keys[i], { stage: sel.value }, statusEl, t);
    }));

  // Save the edited detail fields (source / next_action / phone / notes + stage).
  host.querySelectorAll("[data-save]").forEach((b) =>
    b.addEventListener("click", () => {
      const i = b.getAttribute("data-save");
      const patch = {};
      host.querySelectorAll(`[data-field][data-i="${i}"]`).forEach((el) => {
        patch[el.getAttribute("data-field")] = el.value;
      });
      const statusEl = host.querySelector(`[data-savemsg="${i}"]`);
      saveStudent(keys[i], patch, statusEl, t);
    }));

  host.querySelectorAll("[data-confirm]").forEach((b) =>
    b.addEventListener("click", () => confirmUser(b.getAttribute("data-confirm"), b.getAttribute("data-next") === "1", lang)));
  host.querySelectorAll("[data-remove-ask]").forEach((b) =>
    b.addEventListener("click", () => {
      const i = b.getAttribute("data-remove-ask");
      openRemoveConfirm(keys[i], names[i], lang);
    }));
  host.querySelectorAll("[data-add]").forEach((b) =>
    b.addEventListener("click", () => addUser(b.getAttribute("data-add"), lang)));
}

/* ---- Legal pages (Privacy / Terms) — shared template --------------------- */
function renderLegal(lang, kind) {
  const t = I18N[lang];
  const isP = kind === "privacy";
  const title = isP ? t.privacy_title : t.terms_title;
  const intro = isP ? t.privacy_intro : t.terms_intro;
  const items = isP ? t.privacy_items : t.terms_items;
  const updated = isP ? t.privacy_updated : t.terms_updated;
  const eyebrow = isP ? t.footer_privacy : t.footer_terms;

  document.getElementById("app").innerHTML = `
  ${navHeader(t, lang)}

  <main id="top" class="page">
    <section class="section"><div class="wrap narrow">
      <div class="reveal">
        <span class="eyebrow">${eyebrow}</span>
        <h1 class="section-title">${title}</h1>
        <p class="section-lead">${intro}</p>
      </div>
      <div class="legal reveal">
        ${items.map((x) => `<section class="legal__item"><h2>${x.t}</h2><p>${x.b}</p></section>`).join("")}
      </div>
      <p class="legal__updated reveal">${updated}</p>
    </div></section>
  </main>

  ${studentModal(t)}
  ${siteFooter(t)}`;

  afterRender();
}

/* ---- #/kit — the branded "here's your kit" landing page ------------------
   Ofir, 2026-08-31: a participant currently gets a raw zip URL
   (productlab.studio/assets/product-lab.zip) sent by hand. This route
   replaces the LINK they click; the direct zip stays the actual download
   target underneath (KIT_ZIP_URL, same one #/prep's kit tile already uses).
   Public, no auth gate — the people who reach this link already registered.

   FULL-BLEED direction, Ofir's own pick after comparing two mockups: no
   card, no boundary — character + text + button sit directly on the
   illustration's own cream background (var(--pl-intro-cream)), edge to
   edge, one continuous surface. Header stays (so the EN/HE toggle is
   reachable) but there is deliberately no footer or second button — Ofir's
   own words, "clean, no noise," and the header's own clickable wordmark
   already covers "back to the main site."

   ONE VIEWPORT, NO SCROLL (Ofir, 2026-08-31): this is a single moment, not
   a scrolling page — see .moment-page/.kitfull in styles.css, verified with
   real rendered heights at both 390x844 and 375x667.

   The character illustration is Marketing Designer's asset: Dean, the
   established host puppet, holding the kit as a wrapped gift, matted with a
   real alpha channel (2026-08-31) — no fill color of its own, so there is
   nothing to color-match against the page background. Recommendation + swap
   map: `projects/product-lab/brand/kit-landing/CAST.md` (this repo). */
function renderKit(lang) {
  const t = I18N[lang];
  document.getElementById("app").innerHTML = `
  ${navHeader(t, lang)}

  <main id="top" class="page moment-page kitfull reveal">
    <picture class="kitfull__illo">
      <source type="image/webp" srcset="assets/kit/kit-hero-dean.webp" />
      <img src="assets/kit/kit-hero-dean.png" alt="" width="1024" height="1536" decoding="async" />
    </picture>
    <div class="wrap narrow kitfull__body">
      <span class="eyebrow">${t.kit_eyebrow}</span>
      <h1 class="section-title">${t.kit_title}</h1>
      <p class="login__sub">${t.kit_sub}</p>
      <div class="cta-row kitfull__cta">
        <a class="btn btn--primary" href="${KIT_ZIP_URL}" download data-kit-download>${I.repeat}${t.kit_btn_download}</a>
      </div>
    </div>
  </main>

  ${studentModal(t)}`;

  afterRender();
  wireKitAutoDownload();
}

/* Auto-fires the download ONCE EVER PER BROWSER (localStorage flag
   "plKitAutoDownloaded") via a real, off-screen `<a download>` click — never
   a location redirect, so the tab is never navigated away from this page.
   A repeat visit to #/kit (bookmark, old email link, re-testing) does NOT
   re-fire the auto-download — it silently no-ops and the page renders
   normally. The visible "download again" button is the SAME href/download
   pair as a plain link, so it still works anywhere a script-fired click is
   blocked (iOS Safari, some in-app browsers), AND is the only way to get the
   zip again on purpose after the first visit.
   Timing: if the intro curtain (#pl-intro) is on screen, wait for it to lift
   (assets/intro.js's LIFT=2630ms) before firing, so the browser's download
   UI doesn't appear before the headline is even visible; skip the wait
   entirely when there's no curtain to wait for (repeat visit same session,
   reduced motion, or intro.js failed to load — this download must not
   depend on the veil, which is explicitly optional by its own contract).
   localStorage access is wrapped in try/catch: private browsing can throw. */
let kitAutoFired = false;
function wireKitAutoDownload() {
  kitAutoFired = false;
  let alreadyAutoDownloaded = false;
  try { alreadyAutoDownloaded = !!localStorage.getItem("plKitAutoDownloaded"); } catch (e) {}
  if (alreadyAutoDownloaded) return;
  const curtain = document.getElementById("pl-intro");
  const delay = curtain ? 2900 : 500;
  window.setTimeout(() => {
    if (kitAutoFired) return;
    kitAutoFired = true;
    try {
      const a = document.createElement("a");
      a.href = KIT_ZIP_URL;
      a.setAttribute("download", "");
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      window.setTimeout(() => { if (a.parentNode) a.parentNode.removeChild(a); }, 0);
      try { localStorage.setItem("plKitAutoDownloaded", "1"); } catch (e) {}
    } catch (e) { /* the visible "download again" button still works */ }
  }, delay);
}

/* ---- #/fleet — the Fleet Blueprint page (S0–S9) ---------------------------
   Spec: projects/product-lab/site/fleet-blueprint-spec-2026-09-05.md (CPO).
   Brief: shared/research/briefs/fleet-blueprint-2026-09-05.md (UR).
   Public, unlisted: no nav entry anywhere, and the whole site already ships
   <meta name="robots" content="noindex, nofollow"> so this route inherits it.
   HE default + EN toggle, hash route exactly like #/kit. Every visible string
   lives in fleet-content.js (window.FLEET_CONTENT[lang]) — PLACEHOLDER copy,
   marked there for the Copywriter; nothing visible is hard-coded here.

   REUSE LADDER (Product Designer, 2026-09-05 — Design System Lead ruling
   still owed, Task was unavailable this session):
     RUNG 1 (whole page/pattern): #/kit + legal shell (navHeader + main.page +
       .section > .wrap + studentModal + siteFooter). The home crew band
       (.team > .team__crew > .team__agents > .agentcard) reused whole for
       the fixed build crew. The register modal's form composition
       (.login__ico/.login__title/.login__sub + .reg__form/.field/.input/
       .reg__note/.reg__error/.reg__submit spinner) reused inline for the
       email gate and for every question screen. The cohort #2 session strip
       (sessionStripHtml + .session-strip-band, data-register-open → the
       existing register modal) reused whole on the confirmation.
     RUNG 2 (compose): .moment-card (every single-moment screen), .grid--2 +
       .card + .card__ico (specialists, shared brain, memory), .pchecklist
       (the three lines per specialist), .pnote (not-in-brain), .prep-note
       (why-it-broke), .deliv (what you leave with), .ctaband (result CTA),
       .ss-badge (start-with), .agentcard__tag (library key), .ss-note (meta).
     RUNG 3 (extend): .field__hint (char counter under a field),
       .chip--choice (a selectable .chip, role=radio + aria-checked). See styles.css.
     RUNG 4 (new): .skel — a loading skeleton line. The site had no loading
       primitive except the roster's dashed text box. Six lines, tokens only.

   v2 (2026-09-07, spec fleet-blueprint-spec-2026-09-07-v2.md): the model's
   output shrank to a pure classifier (specialists[]/start_with/broke_because
   enums, zero free text). ZERO new components for this change — same
   .pchecklist/.card/.pnote/.section-lead-q shapes, just re-sourced: the three
   specialist lines now read fleet-content.js's fixed `spec_bank[key]`
   (Copywriter template bank, placeholder pending their pass) instead of the
   model response; the per-specialist "why" .pnote is retired (that field left
   the schema); shared_brain_line/not_in_brain are now fixed `brain_line`/
   `brain_not`; broke_because is an enum resolved via `broke_bank`. The ONLY
   free text left on the screen is one verbatim quote pulled straight from
   FLEET.answers.q1 (v5, 2026-09-07: the second quote near the specialists
   was cut for density) — see fleetExcerpt. Design System Lead consult
   attempted, Task disabled this
   session — self-audited against component-log.md's own CONFIRMED entries
   for every class reused here; flag for their real sign-off next session.

   STATE MACHINE (client only, no login):
     entry -> q (qi 0..4) -> loading -> result -> gate -> done
                               |-> limited              -> gate (limited)
   Ofir's ruling 2026-09-06: once all 5 questions are answered, ANY generation
   failure (except rate_limited) goes straight to gate(manual) — no retry, no
   separate error screen. The old "error" step (retry once, then fall to the
   manual email gate) is gone; failures land on the manual gate in one hop.
   Answers persist in sessionStorage (survive a reload mid-questionnaire).
   The finished blueprint persists in localStorage, so a returning visitor
   gets S0's "your blueprint / start over" variant without a network call.

   TRANSPORT: everything that touches the backend is inside FLEET_API — the
   CTO owns the edge function (`projects/product-lab/site/fleet-blueprint-api-
   2026-09-05.md`, pending); swap the transport THERE only. Until it lands,
   localhost and `#/fleet?mock=ok|error|limited|broke` return FLEET_MOCK,
   the CTO's §6 mock, byte-shape identical to the live 200 body. */
const FLEET_STORE = { answers: "pl_fleet_answers", result: "pl_fleet_blueprint" };
/* Voice input (Ofir, 2026-09-06: "a microphone in every one of those questions,
   record himself thinking, not only type, and functional"). Browser speech-to-
   text via the Web Speech API: Chrome + Safari + Edge, he-IL / en-US, no
   backend, nothing recorded or stored by us. Firefox has no SpeechRecognition,
   so there the button simply does not render. */
const FLEET_SR = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition || null) : null;
const FLEET_LIB = ["user-researcher", "copywriter", "design-system-lead", "reviewer", "chief-of-staff", "marketing-designer",
  "product-analyst", "content-curator", "qa-specialist", "accessibility-specialist", "onboarding-specialist",
  "technical-writer", "product-ops", "localization-specialist", "security-privacy-reviewer",
  "content-manager", "domain-expert", "product-growth-lead", "market-researcher", "content-strategist"];
const FLEET_MAX = 300;      // spec §2: text ≤ 300 chars
const FLEET_MIN = 10;       // spec §2: < 10 chars on Q1–Q2 → inline nudge
const FLEET_Q5 = ["none", "chat", "claude_code_broke"];
/* Tool picker (Ofir, 2026-09-06: "which AI tools have they had the chance to
   work with; add more options, a logo for each, and a 'more' button, I want to
   learn"). Multi-select over a closed list + free-text "other". The backend
   still receives q5 as the derived enum (old contract), plus `tools` and
   `tools_other` which the CTO is wiring in. Brand marks: simple-icons paths
   (CC0) inlined as currentColor; Lovable and Bolt have no mark in that set,
   so an outline stand-in of the same size carries them. */
const FLEET_TOOLS = ["chatgpt", "claude", "gemini", "copilot", "perplexity", "notion_ai", "cursor", "claude_code", "lovable", "v0", "replit", "bolt"];
const FLEET_AGENT_TOOLS = ["claude_code", "cursor", "lovable", "v0", "replit", "bolt"];
const FLEET_OTHER_MAX = 80;
function fleetDeriveQ5(tools) {
  const t = Array.isArray(tools) ? tools : [];
  const real = t.filter((v) => FLEET_TOOLS.indexOf(v) !== -1 || v === "other");
  if (!real.length) return "none";
  return real.some((v) => FLEET_AGENT_TOOLS.indexOf(v) !== -1) ? "claude_code_broke" : "chat";
}
const FLEET_LOGOS = {
  chatgpt: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>',
  claude: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/></svg>',
  claude_code: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/></svg>',
  gemini: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"/></svg>',
  copilot: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.922 16.997C23.061 18.492 18.063 22.02 12 22.02 5.937 22.02.939 18.492.078 16.997A.641.641 0 0 1 0 16.741v-2.869a.883.883 0 0 1 .053-.22c.372-.935 1.347-2.292 2.605-2.656.167-.429.414-1.055.644-1.517a10.098 10.098 0 0 1-.052-1.086c0-1.331.282-2.499 1.132-3.368.397-.406.89-.717 1.474-.952C7.255 2.937 9.248 1.98 11.978 1.98c2.731 0 4.767.957 6.166 2.093.584.235 1.077.546 1.474.952.85.869 1.132 2.037 1.132 3.368 0 .368-.014.733-.052 1.086.23.462.477 1.088.644 1.517 1.258.364 2.233 1.721 2.605 2.656a.841.841 0 0 1 .053.22v2.869a.641.641 0 0 1-.078.256Zm-11.75-5.992h-.344a4.359 4.359 0 0 1-.355.508c-.77.947-1.918 1.492-3.508 1.492-1.725 0-2.989-.359-3.782-1.259a2.137 2.137 0 0 1-.085-.104L4 11.746v6.585c1.435.779 4.514 2.179 8 2.179 3.486 0 6.565-1.4 8-2.179v-6.585l-.098-.104s-.033.045-.085.104c-.793.9-2.057 1.259-3.782 1.259-1.59 0-2.738-.545-3.508-1.492a4.359 4.359 0 0 1-.355-.508Zm2.328 3.25c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm-5 0c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm3.313-6.185c.136 1.057.403 1.913.878 2.497.442.544 1.134.938 2.344.938 1.573 0 2.292-.337 2.657-.751.384-.435.558-1.15.558-2.361 0-1.14-.243-1.847-.705-2.319-.477-.488-1.319-.862-2.824-1.025-1.487-.161-2.192.138-2.533.529-.269.307-.437.808-.438 1.578v.021c0 .265.021.562.063.893Zm-1.626 0c.042-.331.063-.628.063-.894v-.02c-.001-.77-.169-1.271-.438-1.578-.341-.391-1.046-.69-2.533-.529-1.505.163-2.347.537-2.824 1.025-.462.472-.705 1.179-.705 2.319 0 1.211.175 1.926.558 2.361.365.414 1.084.751 2.657.751 1.21 0 1.902-.394 2.344-.938.475-.584.742-1.44.878-2.497Z"/></svg>',
  perplexity: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z"/></svg>',
  notion_ai: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/></svg>',
  cursor: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23"/></svg>',
  v0: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14.066 6.028v2.22h5.729q.075-.001.148.005l-5.853 5.752a2 2 0 0 1-.024-.309V8.247h-2.353v5.45c0 2.322 1.935 4.222 4.258 4.222h5.675v-2.22h-5.675q-.03 0-.059-.003l5.729-5.629q.006.082.006.166v5.465H24v-5.465a4.204 4.204 0 0 0-4.205-4.205zM0 8.245l8.28 9.266c.839.94 2.396.346 2.396-.914V8.245H8.19v5.44l-4.86-5.44Z"/></svg>',
  replit: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 1.5A1.5 1.5 0 0 1 3.5 0h7A1.5 1.5 0 0 1 12 1.5V8H3.5A1.5 1.5 0 0 1 2 6.5ZM12 8h8.5A1.5 1.5 0 0 1 22 9.5v5a1.5 1.5 0 0 1-1.5 1.5H12ZM2 17.5A1.5 1.5 0 0 1 3.5 16H12v6.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 2 22.5Z"/></svg>',
  none: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>',
};
let FLEET = { step: "entry", qi: 0, answers: {}, result: null, blueprintId: null, gateMode: "normal", busy: false };

/* Mock responses — one per language. v2 (spec fleet-blueprint-spec-2026-09-07-
   v2.md §3): the model's ONLY job is classification, so `blueprint` is now
   just `{ specialists:[{key}], start_with, broke_because }` — no product_line,
   no why_from_her_words, no shared_brain_line, no not_in_brain, no per-
   specialist prose. All display text for those now comes from fleet-
   content.js's fixed template bank (spec_bank/brain_line/brain_not/
   broke_bank) or straight from her own typed answers (the two verbatim
   quotes) — see fleetResult(). */
const FLEET_MOCK = {
  he: {
    ok: true,
    blueprint_id: "00000000-0000-4000-8000-0000000000aa",
    lang: "he",
    roster: {
      keys: ["chief-of-staff", "copywriter"],
      labels: ["ראש/ת מטה", "קופירייטר/ית"],
      start_with: "chief-of-staff",
      crew: ["product-manager", "product-designer", "technical-lead"],
    },
    blueprint: {
      specialists: ["chief-of-staff", "copywriter"],
      start_with: "chief-of-staff",
      broke_because: null,
    },
    meta: { model: "claude-sonnet-5", attempts: 1, input_tokens: 800, output_tokens: 60, cost_usd: 0.003 },
  },
  en: {
    ok: true,
    blueprint_id: "00000000-0000-4000-8000-0000000000ab",
    lang: "en",
    roster: {
      keys: ["chief-of-staff", "copywriter"],
      labels: ["Chief of staff", "Copywriter"],
      start_with: "chief-of-staff",
      crew: ["product-manager", "product-designer", "technical-lead"],
    },
    blueprint: {
      specialists: ["chief-of-staff", "copywriter"],
      start_with: "chief-of-staff",
      broke_because: null,
    },
    meta: { model: "claude-sonnet-5", attempts: 1, input_tokens: 800, output_tokens: 60, cost_usd: 0.003 },
  },
};

function fleetQuery() {
  // Query params can sit before the hash (?src=li) or inside it (#/fleet?mock=error).
  const q = new URLSearchParams(location.search);
  const i = location.hash.indexOf("?");
  if (i !== -1) new URLSearchParams(location.hash.slice(i + 1)).forEach((v, k) => q.set(k, v));
  return q;
}
function fleetMockMode() {
  const m = fleetQuery().get("mock");
  if (m) return m;
  return IS_LOCAL ? "ok" : null;
}
function fleetMock(mode, lang, answers) {
  const base = FLEET_MOCK[lang] || FLEET_MOCK.he;
  return new Promise((resolve, reject) => setTimeout(() => {
    if (mode === "error") { const e = new Error("mock error"); e.code = "error"; return reject(e); }
    if (mode === "limited") { const e = new Error("mock limited"); e.code = "rate_limited"; return reject(e); }
    const res = JSON.parse(JSON.stringify(base));
    const b = res.blueprint;
    // v2: broke_because is an enum, not a composed sentence — the render layer
    // looks it up in fleet-content.js's broke_bank.
    if (mode === "broke" || (answers && answers.q5 === "claude_code_broke")) b.broke_because = "no_memory";
    resolve({ id: res.blueprint_id, blueprint: b });
  }, 1400));
}
/* Turnstile runs invisibly on submit (spec §2/S6). The CTO adds the Cloudflare
   script + `window.FLEET_TURNSTILE_SITEKEY` in index.html; until then this
   resolves null and the edge function decides what to do with a missing token. */
function fleetTurnstile() {
  const key = window.FLEET_TURNSTILE_SITEKEY;
  if (!key || !window.turnstile) return Promise.resolve(null);
  return new Promise((resolve) => {
    let done = false;
    const finish = (tok) => { if (done) return; done = true; if (el.parentNode) el.parentNode.removeChild(el); resolve(tok || null); };
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
    try {
      window.turnstile.render(el, { sitekey: key, callback: finish, "error-callback": () => finish(null), "expired-callback": () => finish(null) });
    } catch (e) { finish(null); }
    setTimeout(() => finish(null), 8000);
  });
}
/* Contract = the CTO's edge function (projects/product-lab/crm/supabase/
   functions/fleet-blueprint/index.ts):
     POST fleet-blueprint       { lang, answers, turnstile_token, source }
                                -> 200 { ok, blueprint_id, lang, blueprint, roster, meta }
                                -> 429 { ok:false, error:"rate_limited" }   → limited state
                                -> 503 { ok:false, error:"capped"|"not_configured" } → manual gate
                                -> 4xx/5xx anything else                    → manual gate (no retry)
     POST fleet-blueprint/lead  { name, email, lang, status, blueprint_id, source:{channel,
                                  referrer, handoff_text, lang}, answers, blueprint, note }
                                -> 200 { ok, lead_id, duplicate } */
async function fleetErrorCode(error) {
  const status = error && error.context && error.context.status;
  let code = null;
  try { const j = await error.context.json(); code = j && j.error; } catch (e) {}
  if (status === 429 || code === "rate_limited") return "rate_limited";
  if (code === "capped" || code === "not_configured") return "capped";
  return "error";
}
const FLEET_API = {
  async blueprint(payload) {
    const mock = fleetMockMode();
    if (mock) return fleetMock(mock, payload.lang, payload.answers);
    const { data, error } = await sb.functions.invoke("fleet-blueprint", { body: payload });
    if (error) { const e = new Error(error.message || "fleet-blueprint failed"); e.code = await fleetErrorCode(error); throw e; }
    if (!data || data.ok === false) { const e = new Error((data && data.error) || "fleet-blueprint failed"); e.code = data && data.error === "rate_limited" ? "rate_limited" : "error"; throw e; }
    // CTO's live wire field is `classification` (index.ts 2026-09-07), not
    // `blueprint` — the model's output is a pure classification now. Kept as
    // `blueprint` in our own client-side state, matching every other var name
    // in this state machine (FLEET.result, FLEET_STORE, fleetSaveResult, ...).
    return { id: data.blueprint_id || null, blueprint: data.classification };
  },
  async lead(body) {
    if (fleetMockMode()) { await new Promise((r) => setTimeout(r, 600)); return; }
    const { data, error } = await sb.functions.invoke("fleet-blueprint/lead", { body });
    if (error) throw error;
    if (!data || data.ok === false) throw new Error((data && data.error) || "lead failed");
  },
};
/* v2 (spec fleet-blueprint-spec-2026-09-07-v2.md §3): the model is a
   CLASSIFIER only - its entire output is `{ specialists:[{key}], start_with,
   broke_because }`, zero free-text fields. product_line/why_from_her_words/
   shared_brain_line/not_in_brain no longer exist on the model response at
   all - they render from fleet-content.js's fixed template bank (spec_bank/
   brain_line/brain_not/broke_bank) keyed by enum, or straight from her own
   answers (the two verbatim quote blocks), never from `b`. */
const FLEET_BROKE_KEYS = ["no_memory", "no_boundary"];
/* Server validates enum + count (spec §3); this is the client's own guard so a
   malformed body can never paint half a result. */
function fleetValid(b) {
  if (!b || typeof b !== "object") return false;
  if (!Array.isArray(b.specialists) || b.specialists.length < 1 || b.specialists.length > 3) return false;
  // CTO's live schema (core.ts, CLASSIFICATION_SCHEMA): specialists is a plain
  // string[] of enum keys, not an array of {key} objects.
  for (const s of b.specialists) {
    if (typeof s !== "string" || FLEET_LIB.indexOf(s) === -1) return false;
  }
  if (typeof b.start_with !== "string" || FLEET_LIB.indexOf(b.start_with) === -1) return false;
  if (b.broke_because !== null && FLEET_BROKE_KEYS.indexOf(b.broke_because) === -1) return false;
  return true;
}
/* The one verbatim quote block on the result screen (spec §3, narrowed
   v5) - pulled straight from her own typed q1 (sessionStorage), NEVER from
   the model response and NEVER rephrased. This is the only free text on
   the screen. */
function fleetExcerpt(text, max) {
  const t = typeof text === "string" ? text.trim() : "";
  if (!t) return "";
  return t.length <= max ? t : t.slice(0, max).trim();
}

function fleetRestore() {
  if (!Object.keys(FLEET.answers).length) {
    try { FLEET.answers = JSON.parse(sessionStorage.getItem(FLEET_STORE.answers) || "{}") || {}; } catch (e) { FLEET.answers = {}; }
  }
}
function fleetSaveAnswers() {
  try { sessionStorage.setItem(FLEET_STORE.answers, JSON.stringify(FLEET.answers)); } catch (e) {}
}
function fleetSaved() {
  try { const s = JSON.parse(localStorage.getItem(FLEET_STORE.result) || "null"); return s && fleetValid(s.blueprint) ? s : null; } catch (e) { return null; }
}
function fleetSaveResult(id, blueprint, lang) {
  try { localStorage.setItem(FLEET_STORE.result, JSON.stringify({ id, blueprint, lang, answers: FLEET.answers, at: Date.now() })); } catch (e) {}
}
function fleetReset() {
  FLEET = { step: "entry", qi: 0, answers: {}, result: null, blueprintId: null, gateMode: "normal", failures: 0, busy: false };
  try { sessionStorage.removeItem(FLEET_STORE.answers); localStorage.removeItem(FLEET_STORE.result); } catch (e) {}
}
function fleetSource(lang) {
  const q = fleetQuery();
  return {
    channel: q.get("src") || q.get("utm_source") || q.get("ref") || "direct",
    referrer: document.referrer || null,
    handoff_text: null,
    lang,
  };
}
const fleetFmt = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

/* ---- screens ---- */
const fleetCard = (inner, mod = "") => `
  <section class="section"><div class="wrap narrow">
    <div class="moment-card fleet-card${mod ? " " + mod : ""}">${inner}</div>
  </div></section>`;

function fleetEntry(f, saved) {
  const actions = saved
    ? `<button class="btn btn--accent" type="button" data-fleet="open">${f.return_open}</button>
       <button class="btn btn--ghost" type="button" data-fleet="reset">${f.return_reset}</button>`
    : `<button class="btn btn--accent btn--lg" type="button" data-fleet="start">${f.entry_cta}</button>`;
  /* Ofir, 2026-09-07 (v3, reverting v2's top-of-card cluster): back to a
     plain eyebrow/title/description/CTA hero, nothing above or between it.
     The avatars move BELOW the CTA as a small supporting "examples" block.
     v4, same day: ONE merged title (no separate sub - was redundant); the
     FULL real-portrait roster (f.agents, 10 characters per the Marketing
     Designer's inventory - not just the 3 build-crew), wraps onto more than
     one row on narrow screens (.cta-row's own wrap+gap recipe, reused);
     tooltip shows the character's REAL job title in bold + the description
     in regular weight - a plain [data-tooltip] can't mix weights (CSS
     `content: attr()` is one run of uniform text), so this is a real DOM
     popover instead, built from the exact same light-tooltip recipe
     (surface/border/shadow/radius/arrow) - see .avatar-tip in styles.css. */
  const agents = saved ? "" : `
    <div class="fleet-agents">
      <p class="field__label">${f.agents_title || ""}</p>
      <div class="avatar-stack" role="group" aria-label="${escapeAttr(f.agents_aria || "")}">
        ${(f.agents || []).map((a) => `<button type="button" class="avatar-stack__item" aria-label="${escapeAttr(fleetRoleTitle(a.role) + ", " + a.line)}" data-fleet-avatar>
          <img src="assets/${a.img}.webp?v=2" alt="" loading="lazy" />
          <span class="avatar-tip" role="tooltip" aria-hidden="true"><strong>${escapeHtml(fleetRoleTitle(a.role))}</strong><span>${escapeHtml(a.line)}</span></span>
        </button>`).join("")}
      </div>
    </div>`;
  return fleetCard(`
    <span class="eyebrow">${f.entry_eyebrow}</span>
    <h1 class="login__title">${f.entry_title}</h1>
    <p class="login__sub">${f.entry_sub}</p>
    <div class="cta-row">${actions}</div>
    ${saved ? `<p class="login__note">${I.info}<span>${f.return_note}</span></p>` : ""}
    ${agents}`, "fleet-card--entry");
}

function fleetQuestion(f) {
  const q = f.questions[FLEET.qi];
  const last = FLEET.qi === f.questions.length - 1;
  const val = FLEET.answers[q.key] || "";
  const picked = Array.isArray(FLEET.answers.tools) ? FLEET.answers.tools : [];
  /* Multi-select chips + a combinable "other" free-text field (Ofir,
     2026-09-08: any combination of chips, plus the other field addable
     alongside them, not exclusive). Raw picked/typed state lives in
     `<key>_chips`/`<key>_other` (mirrors tools/tools_other); FLEET.answers
     [q.key] itself holds the synthesized display string (chip labels +
     other text) that fleetSubmit() sends as-is - the backend contract
     (one string per question) never changed. */
  const choicesPicked = Array.isArray(FLEET.answers[q.key + "_chips"]) ? FLEET.answers[q.key + "_chips"] : [];
  const choicesOtherOn = choicesPicked.indexOf("other") !== -1;
  const choicesOtherVal = FLEET.answers[q.key + "_other"] || "";
  const toolMark = (v, l) => v === "other" ? `<span class="chip__logo" aria-hidden="true">${I.plus}</span>`
    : FLEET_LOGOS[v] ? `<span class="chip__logo" aria-hidden="true">${FLEET_LOGOS[v]}</span>`
    : `<span class="chip__logo chip__logo--initial" aria-hidden="true">${escapeHtml(String(l || v).trim().charAt(0).toUpperCase())}</span>`;
  const toolChip = (v, l) => `<button type="button" class="chip chip--choice" role="checkbox" data-fleet-tool="${v}" aria-checked="${picked.indexOf(v) !== -1}"${v === "other" ? ' aria-controls="fleet-other"' : ""}>${toolMark(v, l)}<span>${l}</span></button>`;
  const control = q.tools
    ? `<div class="cta-row fleet-choices" role="group" aria-label="${escapeAttr(q.title)}">
        ${q.tools.map((c) => toolChip(c.v, c.l)).join("")}
        ${toolChip("none", f.tools_none || "")}
        ${toolChip("other", f.tools_other || "")}
       </div>
       <div class="field fleet-other" id="fleet-other" data-fleet-other-wrap ${picked.indexOf("other") === -1 ? "hidden" : ""}>
         <input class="input" type="text" maxlength="${FLEET_OTHER_MAX}" placeholder="${escapeAttr(f.tools_other_ph || "")}" aria-label="${escapeAttr(f.tools_other || "")}" value="${escapeAttr(FLEET.answers.tools_other || "")}" data-fleet-other />
       </div>`
    : q.choices
    ? `<div class="cta-row fleet-choices" role="group" aria-label="${escapeAttr(q.title)}">
        ${q.choices.map((c) => `<button type="button" class="chip chip--choice" role="checkbox" data-fleet-choice="${c.v}" aria-checked="${choicesPicked.indexOf(c.v) !== -1}">${c.l}</button>`).join("")}
       </div>
       <div class="field" data-fleet-choices-wrap ${choicesOtherOn ? "" : "hidden"}>
        <textarea class="reg__note" rows="4" dir="${document.documentElement.dir || "rtl"}" maxlength="${FLEET_MAX}" placeholder="${escapeAttr(f.q_other_ph || "")}" aria-label="${escapeAttr(f.q_answer_label || "")}" data-fleet-answer>${escapeHtml(choicesOtherVal)}</textarea>
        <div class="field__hint field__hint--mic">
          <span class="ltr-iso" dir="ltr" data-fleet-count>${fleetFmt(f.q_chars, { n: choicesOtherVal.length, max: FLEET_MAX })}</span>
          ${FLEET_SR ? `<button type="button" class="mic-btn" data-fleet-mic aria-pressed="false" aria-label="${escapeAttr(f.mic_aria_start || "")}"><span class="mic-btn__label" dir="${document.documentElement.dir || "rtl"}" data-fleet-mic-label>${escapeHtml(f.mic_start || "")}</span><span class="mic-btn__icon"><span class="dot"></span>${I.mic}</span></button>` : ""}
        </div>
        ${FLEET_SR ? `<p class="reg__error" data-fleet-mic-error hidden>${I.info}<span>${f.mic_denied || ""}</span></p>` : ""}
       </div>`
    : `<div class="field">
        <textarea class="reg__note" id="fleet-q" name="answer" rows="4" dir="${document.documentElement.dir || "rtl"}" maxlength="${FLEET_MAX}" placeholder="${escapeAttr(q.ph)}" aria-label="${escapeAttr(f.q_answer_label || "")}" data-fleet-answer>${escapeHtml(val)}</textarea>
        <div class="field__hint field__hint--mic">
          <span class="ltr-iso" dir="ltr" data-fleet-count>${fleetFmt(f.q_chars, { n: val.length, max: FLEET_MAX })}</span>
          ${FLEET_SR ? `<button type="button" class="mic-btn" data-fleet-mic aria-pressed="false" aria-label="${escapeAttr(f.mic_aria_start || "")}"><span class="mic-btn__label" dir="${document.documentElement.dir || "rtl"}" data-fleet-mic-label>${escapeHtml(f.mic_start || "")}</span><span class="mic-btn__icon"><span class="dot"></span>${I.mic}</span></button>` : ""}
        </div>
        ${FLEET_SR ? `<p class="reg__error" data-fleet-mic-error hidden>${I.info}<span>${f.mic_denied || ""}</span></p>` : ""}
       </div>`;
  return fleetCard(`
    <span class="eyebrow">${fleetFmt(f.q_counter, { n: FLEET.qi + 1 })}</span>
    <h1 class="login__title">${q.title}</h1>
    ${q.hint ? `<p class="login__sub">${q.hint}</p>` : ""}
    <form class="reg__form" data-fleet-form novalidate>
      ${control}
      <p class="reg__error" data-fleet-error hidden>${I.info}<span data-fleet-error-text>${(q.tools || q.choices) ? (f.q_choose_many || f.q_choose) : f.q_short}</span></p>
      <div class="cta-row fleet-nav">
        ${FLEET.qi > 0 ? `<button type="button" class="btn btn--ghost" data-fleet="back">${f.q_back}</button>` : ""}
        <button type="submit" class="btn btn--accent">${last ? f.q_submit : f.q_next}</button>
      </div>
    </form>`);
}

/* S6 v3 (Ofir, 2026-09-07): the rotation is built directly from f.agents -
   S0's real roster - so the role label shown here is always identical to
   S0's, and every entry always has a real photo (no initial-in-a-disc
   fallback). Each agent's line comes from f.loading_agent_lines, keyed by
   the same img id; an agent with no line is skipped rather than shown with
   empty text. */
function fleetLoadingPool(f) {
  const lines = f.loading_agent_lines || {};
  const pool = (f.agents || [])
    .map((a) => ({ img: a.img, role: a.role, line: lines[a.img] || "" }))
    .filter((s) => s.line);
  return pool.length ? pool : [{ role: "", line: f.loading_title || "" }];
}
/* 3 of S0's 9 roles only have a "-reading" image file on disk (no base pose
   was ever uploaded for them - a pre-existing S0 asset gap, out of this
   task's scope to fix). Use the file that actually exists for each. */
const FLEET_READING_ONLY = { "crew-strategist": 1, "crew-designer": 1, "crew-architect": 1 };
function fleetReaderAvatar(step) {
  const suffix = FLEET_READING_ONLY[step.img] ? "-reading" : "";
  return `<img src="assets/${step.img}${suffix}.webp?v=2" alt="" />`;
}
function fleetReaderItem(step) {
  return `
    <li class="reader">
      <span class="reader__bubble" aria-live="off">${escapeHtml(step.line || "")}</span>
      <span class="reader__av">${fleetReaderAvatar(step)}</span>
      <span class="reader__name">${escapeHtml(step.role || "")}</span>
    </li>`;
}
function fleetLoading(f) {
  const pool = fleetLoadingPool(f);
  return fleetCard(`
    <h1 class="login__title">${f.loading_title || f.loading_line || ""}</h1>
    <div class="fleet-loading" role="status" aria-live="polite" aria-busy="true">
      <ul class="readers" data-fleet-pool="${escapeAttr(JSON.stringify(pool))}">${fleetReaderItem(pool[0])}</ul>
      <div class="reader__bar" aria-hidden="true"><span></span></div>
      <p class="ss-note">${f.loading_note || ""}</p>
    </div>`, "fleet-card--loading");
}

function fleetResult(f, b) {
  /* v7 (Ofir, 2026-09-07, fifth pass): FULL delete + rebuild of section 1
     ONLY - sections 2/3 below are untouched. ONE team board (not two
     disconnected sub-sections): a single container, personalized cluster +
     a thin divider + base cluster, label-only (no group description text).
     Hero is eyebrow + title + one fixed subtitle line, nothing else.
     v9 (seventh pass): every card is now a full-width row, stacked one
     under another within its cluster (never side-by-side, at any width) —
     Ofir: "big, symmetric, ordered," not small scattered tiles. Real crew
     photos (Ofir's explicit call); personalized tiles get a generic
     silhouette (I.user, same icon the nav/quote-card fallback already
     uses elsewhere on the site — not a new character), sized up so it
     reads as deliberate, not a small placeholder. `text` is ALWAYS fixed
     template-bank copy, keyed by specialist enum — never model output. */
  const readingOnly = { "crew-strategist": 1, "crew-designer": 1, "crew-architect": 1 };
  const crewAvatar = (img) => `<img src="assets/${img}${readingOnly[img] ? "-reading" : ""}.webp?v=2" alt="" loading="lazy" />`;
  const specialistTile = (key) => `
      <article class="fleet-agent-tile">
        <span class="fleet-agent-tile__av fleet-agent-tile__av--silhouette">${I.puppetSilhouette}</span>
        <span class="fleet-agent-tile__body">
          <strong>${f.lib[key] || key}</strong>
          <span>${escapeHtml((f.spec_lines && f.spec_lines[key]) || "")}</span>
        </span>
      </article>`;
  const crewTile = (a) => `
      <article class="fleet-agent-tile">
        <span class="fleet-agent-tile__av">${crewAvatar(a.img)}</span>
        <span class="fleet-agent-tile__body">
          <strong>${a.role}</strong>
          <span>${a.line}</span>
        </span>
      </article>`;
  return `
  <section class="section"><div class="wrap">
    <div class="reveal">
      <span class="eyebrow">${f.result_eyebrow}</span>
      <h1 class="section-title">${f.team_title}</h1>
      ${f.team_sub ? `<p class="section-lead">${f.team_sub}</p>` : ""}
    </div>

    <div class="fleet-team-board reveal">
      <div class="fleet-team-cluster">
        <p class="fleet-team-label">${f.personal_label}</p>
        <div class="fleet-team-row">
          ${b.specialists.map(specialistTile).join("")}
        </div>
      </div>
      <div class="fleet-team-cluster">
        <p class="fleet-team-label">${f.crew_label}</p>
        <div class="fleet-team-row">
          ${f.crew.map(crewTile).join("")}
        </div>
      </div>
    </div>
  </div></section>

  <section class="section section--alt"><div class="wrap">
    <div class="reveal">
      <span class="eyebrow">${f.benefits_eyebrow}</span>
      <h2 class="section-title">${f.benefits_title}</h2>
      ${f.benefits_sub ? `<p class="section-lead">${f.benefits_sub}</p>` : ""}
    </div>
    <div class="deliv reveal fleet-benefits">
      ${f.benefits.map((d, i) => `
        <div class="deliv__item">
          <div class="deliv__num">${String(i + 1).padStart(2, "0")}</div>
          <div><h3>${d.t}</h3><p>${d.b}</p></div>
        </div>`).join("")}
    </div>
    ${f.positioning_line ? `<p class="section-lead fleet-positioning reveal">${f.positioning_line}</p>` : ""}
  </div></section>

  <section class="section"><div class="wrap">
    <div class="ctaband reveal">
      <h2>${f.result_cta_title}</h2>
      <p>${f.result_cta_sub}</p>
      <div class="cta-row fleet-cta-row">
        <a class="btn btn--wa-solid btn--lg" href="${WA_URL}" target="_blank" rel="noopener">${I.wa} ${f.result_cta_wa}</a>
        <button class="btn btn--primary btn--lg" type="button" data-register-open>${f.result_cta}</button>
      </div>
    </div>
  </div></section>`;
}

function fleetGate(f) {
  const m = FLEET.gateMode;
  const title = m === "manual" ? f.gate_manual_title : m === "limited" ? f.gate_limited_title : f.gate_title;
  const sub = m === "manual" ? f.gate_manual_sub : m === "limited" ? f.gate_limited_sub : f.gate_sub;
  return fleetCard(`
    <div class="login__ico">${I.spark}</div>
    <h1 class="login__title">${title}</h1>
    <p class="login__sub">${sub}</p>
    <form class="reg__form" data-fleet-gate novalidate>
      <div class="field">
        <label class="field__label" for="fleet-name">${f.gate_name_label}</label>
        <input class="input" id="fleet-name" name="name" type="text" autocomplete="name" required />
      </div>
      <div class="field">
        <label class="field__label" for="fleet-email">${f.gate_email_label}</label>
        <input class="input ltr-iso" id="fleet-email" name="email" type="email" inputmode="email" dir="ltr" autocomplete="email" placeholder="${f.gate_email_ph}" required />
      </div>
      <div class="field">
        <label class="field__label" for="fleet-note">${f.gate_note_label}</label>
        <textarea class="reg__note" id="fleet-note" name="note" rows="2" dir="${document.documentElement.dir || "rtl"}" placeholder="${escapeAttr(f.gate_note_ph)}"></textarea>
      </div>
      <p class="reg__error" data-fleet-gate-error hidden>${I.info}<span>${f.gate_error}</span></p>
      <button class="btn btn--primary login__submit reg__submit" type="submit" data-fleet-gate-submit>
        <span class="reg__submit-spinner" aria-hidden="true"></span>
        <span class="reg__submit-label">${f.gate_submit}</span>
      </button>
    </form>`);
}

function fleetDone(f, t) {
  return fleetCard(`
    <div class="noacct__ico reg__success-ico">${I.check}</div>
    <h1 class="login__title">${f.done_title}</h1>
    <p class="login__sub">${f.done_sub}</p>`) + `
  <div class="wrap fleet-done-cohort reveal">
    <span class="eyebrow">${f.done_cohort_eyebrow}</span>
    <h2 class="section-title">${f.done_cohort_title}</h2>
  </div>
  <section class="session-strip-band"><div class="wrap">
    ${sessionStripHtml(t.session2, { price: true })}
  </div></section>`;
}

function fleetLimited(f) {
  return fleetCard(`
    <div class="login__ico">${I.clock}</div>
    <h1 class="login__title">${f.limited_title}</h1>
    <p class="login__sub">${f.limited_sub}</p>
    <div class="cta-row">
      <button class="btn btn--primary" type="button" data-fleet="limited-gate">${f.limited_cta}</button>
    </div>`);
}

// DEV/TESTING ONLY (Ofir, 2026-09-07): #/fleet?view=entry|q|loading|result|
// gate|done|limited jumps straight to that screen without walking the real
// flow - this is a client-side wizard, so there is no other way to link to a
// mid-flow screen. &qi=N picks the question for view=q (default 0). &gate=
// normal|manual|limited picks the gate variant for view=gate. view=result
// fills FLEET.result from the same FLEET_MOCK the site's own mock=ok mode
// uses, so the screen has real content. Not gated to localhost on purpose -
// Ofir needs to use it on the live site.
function fleetApplyView(lang, f) {
  const view = fleetQuery().get("view");
  if (!view) return;
  if (view === "q") {
    const qi = parseInt(fleetQuery().get("qi") || "0", 10);
    FLEET.qi = Math.max(0, Math.min(f.questions.length - 1, isNaN(qi) ? 0 : qi));
    FLEET.step = "q";
  } else if (view === "result") {
    const base = FLEET_MOCK[lang] || FLEET_MOCK.he;
    FLEET.result = JSON.parse(JSON.stringify(base.blueprint));
    FLEET.step = "result";
  } else if (view === "gate") {
    const g = fleetQuery().get("gate");
    FLEET.gateMode = g === "manual" || g === "limited" ? g : "normal";
    FLEET.step = "gate";
  } else if (["entry", "loading", "done", "limited"].indexOf(view) !== -1) {
    FLEET.step = view;
  }
}
function renderFleet(lang) {
  const t = I18N[lang];
  const FC = window.FLEET_CONTENT || {};
  const f = FC[lang] || FC.he;
  if (!f) { render(lang); return; }   // strings failed to load: fall back to home, never a blank page
  fleetRestore();
  fleetApplyView(lang, f);
  const saved = fleetSaved();
  if (FLEET.step === "result" && !FLEET.result) { FLEET.step = "entry"; }
  let body = "";
  switch (FLEET.step) {
    case "q": body = fleetQuestion(f); break;
    case "loading": body = fleetLoading(f); break;
    case "result": body = fleetResult(f, FLEET.result); break;
    case "gate": body = fleetGate(f); break;
    case "done": body = fleetDone(f, t); break;
    case "limited": body = fleetLimited(f); break;
    default: body = fleetEntry(f, saved);
  }
  document.title = f.page_title;
  document.getElementById("app").innerHTML = `
  ${navHeader(t, lang)}

  <main id="top" class="page fleet${FLEET.step === "result" || FLEET.step === "done" ? "" : " moment-page"}" data-fleet-step="${FLEET.step}">${body}</main>

  ${studentModal(t)}
  ${FLEET.step === "entry" ? siteFooter(t, true) : FLEET.step === "result" || FLEET.step === "done" ? siteFooter(t) : ""}`;

  afterRender();
  wireFleet(lang, f);
  window.scrollTo(0, 0);
  // Funnel step view — deduped so an unrelated re-render (auth refresh, lang
  // toggle) on the SAME step/question never double-counts. Real "completion"
  // of the questionnaire itself is fired separately in fleetSubmit() below
  // (the moment all 5 are answered), not here — reaching "result"/"gate" is
  // an OUTCOME of that submission, tracked with its own event there.
  const fleetSig = FLEET.step + (FLEET.step === "q" ? ":" + FLEET.qi : "");
  if (GA_LAST_FLEET_SIG !== fleetSig) { GA_LAST_FLEET_SIG = fleetSig; ga("fleet_step_view", { step: FLEET.step, qi: FLEET.step === "q" ? FLEET.qi + 1 : undefined }); }
}
let GA_LAST_FLEET_SIG = null;

async function fleetSubmit(lang) {
  if (FLEET.busy) return;
  FLEET.busy = true;
  FLEET.step = "loading";
  // THE completion signal Ofir asked for: all 5 questions answered and the
  // submit actually fired — independent of what happens next (AI success,
  // rate limit, or the manual fallback below all still count as "went
  // through the questionnaire"). Outcome is tracked separately per branch.
  ga("fleet_questionnaire_complete");
  renderFleet(lang);
  try {
    const turnstile_token = await fleetTurnstile();
    const a = FLEET.answers;
    const res = await FLEET_API.blueprint({
      lang,
      answers: { q1: a.q1 || "", q2: a.q2 || "", q3: a.q3 || "", q4: a.q4 || "", q5: FLEET_Q5.indexOf(a.q5) === -1 ? "none" : a.q5,
        tools: Array.isArray(a.tools) ? a.tools.slice(0, 14) : [], tools_other: (a.tools_other || "").slice(0, FLEET_OTHER_MAX) },
      turnstile_token,
      source: fleetSource(lang),
    });
    if (!fleetValid(res.blueprint)) { const e = new Error("invalid blueprint"); e.code = "error"; throw e; }
    FLEET.result = res.blueprint;
    FLEET.blueprintId = res.id;
    fleetSaveResult(res.id, res.blueprint, lang);
    FLEET.step = "result";
    ga("fleet_result", { outcome: "ai_success" });
  } catch (err) {
    console.warn("fleet-blueprint failed:", err && err.message);
    if (err && err.code === "rate_limited") {
      FLEET.step = "limited";
      ga("fleet_result", { outcome: "rate_limited" });
    } else {
      // Ofir 2026-09-06: no retry, ever, once all 5 are answered — any other
      // failure (capped, network, invalid blueprint) goes straight to the
      // manual email gate, one hop, row tagged manual.
      FLEET.gateMode = "manual"; FLEET.step = "gate";
      ga("fleet_result", { outcome: "manual_gate" });
    }
  } finally {
    FLEET.busy = false;
  }
  renderFleet(lang);
}

function wireFleet(lang, f) {
  const root = document.querySelector("main.fleet");
  if (!root) return;
  const go = (step) => { if (FLEET.stopMic) { FLEET.stopMic(); FLEET.stopMic = null; } FLEET.step = step; renderFleet(lang); };

  root.querySelectorAll("[data-fleet]").forEach((b) => b.addEventListener("click", () => {
    const act = b.getAttribute("data-fleet");
    if (act === "start") { ga("fleet_start"); FLEET.qi = 0; go("q"); }
    else if (act === "back") { FLEET.qi = Math.max(0, FLEET.qi - 1); go("q"); }
    else if (act === "open") {
      const s = fleetSaved();
      if (!s) { fleetReset(); go("entry"); return; }
      FLEET.result = s.blueprint; FLEET.blueprintId = s.id; FLEET.answers = s.answers || FLEET.answers;
      go("result");
    }
    else if (act === "reset") { fleetReset(); go("entry"); }
    else if (act === "gate") { FLEET.gateMode = "normal"; go("gate"); }
    else if (act === "limited-gate") { FLEET.gateMode = "limited"; go("gate"); }
  }));

  // S6 loading: one real agent (S0's own roster) shown at a time; each tick
  // swaps to the next one (avatar + role + line together), so it reads as
  // the system looking at the answers through a different lens each time.
  const pool = root.querySelector("[data-fleet-pool]");
  if (pool) {
    if (FLEET.bubbleTimer) clearInterval(FLEET.bubbleTimer);
    let steps = [];
    try { steps = JSON.parse(pool.getAttribute("data-fleet-pool") || "[]"); } catch (e) {}
    let idx = 0;
    if (steps.length > 1) {
      FLEET.bubbleTimer = setInterval(() => {
        idx = (idx + 1) % steps.length;
        const li = pool.querySelector(".reader");
        const bubble = pool.querySelector(".reader__bubble");
        const av = pool.querySelector(".reader__av");
        const name = pool.querySelector(".reader__name");
        if (!li || !bubble || !av || !name) return;
        li.classList.add("is-swapping");
        setTimeout(() => {
          const step = steps[idx];
          bubble.textContent = step.line || "";
          av.innerHTML = fleetReaderAvatar(step);
          name.textContent = step.role || "";
          li.classList.remove("is-swapping");
        }, 180);
      }, 3400);
    }
  } else if (FLEET.bubbleTimer) { clearInterval(FLEET.bubbleTimer); FLEET.bubbleTimer = null; }

  // S0 "examples" avatars: hover/focus show the tooltip via CSS; touch has
  // neither, so a tap pins it (data-tip-open), a second tap or a tap
  // elsewhere clears it. Never aria-expanded (global rule hides tooltips on
  // expanded controls). Reinstated 2026-09-07 - v2 made these decorative,
  // Ofir's v3 wants them interactive again, just moved below the CTA.
  // v5: a centered tooltip near either edge of the row was going off-screen
  // - clamp its position (and keep the arrow pointed at the avatar) instead
  // of clipping it, which is what an overflow:hidden patch did in an
  // earlier push and Ofir caught live (real content cut off). Positioned
  // for EVERY avatar up front, not only on hover: even at opacity:0 an
  // absolutely-positioned tooltip at its unclamped default still counts
  // toward the page's real scrollWidth, so the page was horizontally
  // scrollable before anyone had hovered anything.
  // v6: hover only lifts the avatar (transform, styles.css) - tile size is
  // fixed regardless of hover, so nothing reflows any more and each avatar
  // only ever needs to reposition its own tooltip.
  const avatars = root.querySelectorAll("[data-fleet-avatar]");
  if (avatars.length) {
    avatars.forEach((a) => fleetPositionTip(a));
    avatars.forEach((a) => a.addEventListener("mouseenter", () => fleetPositionTip(a)));
    avatars.forEach((a) => a.addEventListener("focus", () => fleetPositionTip(a)));
    const clear = () => avatars.forEach((a) => a.removeAttribute("data-tip-open"));
    avatars.forEach((a) => a.addEventListener("click", (e) => {
      e.stopPropagation();
      const on = a.hasAttribute("data-tip-open");
      clear();
      if (!on) { fleetPositionTip(a); a.setAttribute("data-tip-open", ""); }
    }));
    document.addEventListener("click", clear, { once: false });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") clear(); });
  }

  // Question screen: live counter, chips, validate, next / submit.
  const form = root.querySelector("[data-fleet-form]");
  if (form) {
    const q = f.questions[FLEET.qi];
    const ta = form.querySelector("[data-fleet-answer]");
    const count = form.querySelector("[data-fleet-count]");
    const err = form.querySelector("[data-fleet-error]");
    const errText = form.querySelector("[data-fleet-error-text]");
    // Multi-select chips (q.choices, distinct from the tools picker below):
    // any combination, plus "other" combinable with them rather than
    // exclusive. syncChoices keeps `<key>_chips`/`<key>_other` (raw state,
    // read back on "back" navigation) and FLEET.answers[q.key] (the
    // synthesized display string fleetSubmit() sends) all in sync on every
    // toggle/keystroke - mirrors syncTools()/tools_other below exactly.
    const choiceBtns = form.querySelectorAll("[data-fleet-choice]");
    const choicesWrap = form.querySelector("[data-fleet-choices-wrap]");
    const syncChoices = () => {
      if (!q.choices) return;
      const on = [...choiceBtns].filter((b) => b.getAttribute("aria-checked") === "true").map((b) => b.getAttribute("data-fleet-choice"));
      FLEET.answers[q.key + "_chips"] = on;
      const otherOn = on.indexOf("other") !== -1;
      if (choicesWrap) choicesWrap.hidden = !otherOn;
      const labels = on.filter((v) => v !== "other").map((v) => (q.choices.find((c) => c.v === v) || {}).l).filter(Boolean);
      const otherText = (FLEET.answers[q.key + "_other"] || "").trim();
      if (otherOn && otherText) labels.push(otherText);
      FLEET.answers[q.key] = labels.join(", ");
      fleetSaveAnswers();
      if (err && on.length) err.hidden = true;
    };
    if (ta) {
      ta.addEventListener("input", () => {
        if (count) {
          count.textContent = fleetFmt(f.q_chars, { n: ta.value.length, max: FLEET_MAX });
          count.classList.toggle("is-max", ta.value.length >= FLEET_MAX);
        }
        if (q.choices) { FLEET.answers[q.key + "_other"] = ta.value; syncChoices(); }
        if (err && !err.hidden && ta.value.trim().length >= FLEET_MIN) err.hidden = true;
      });
      if (!q.choices) setTimeout(() => { try { ta.focus({ preventScroll: true }); } catch (e) {} }, 50);
    }
    // Voice: one toggle. Listening appends live transcript after whatever is
    // already typed; the counter and the max follow the same input event.
    const mic = form.querySelector("[data-fleet-mic]");
    if (mic && ta && FLEET_SR) {
      const micErr = form.querySelector("[data-fleet-mic-error]");
      const micLabel = mic.querySelector("[data-fleet-mic-label]");
      let rec = null;
      const setState = (on) => {
        mic.setAttribute("aria-pressed", on ? "true" : "false");
        if (micLabel) micLabel.textContent = on ? (f.mic_stop || "") : (f.mic_start || "");
      };
      const stop = () => { if (rec) { try { rec.stop(); } catch (e) {} } };
      FLEET.stopMic = stop;
      mic.addEventListener("click", () => {
        if (rec) { stop(); return; }
        let inserted = "";   // what recognition wrote last; anything else in the box is hers
        try {
          rec = new FLEET_SR();
          rec.lang = lang === "he" ? "he-IL" : "en-US";
          rec.continuous = true;
          rec.interimResults = true;
          rec.onresult = (e) => {
            let done = "", live = "";
            for (let i = 0; i < e.results.length; i++) {
              const r = e.results[i];
              if (r.isFinal) done += r[0].transcript + " "; else live += r[0].transcript;
            }
            const cur = ta.value;
            const base = (inserted && cur.endsWith(inserted) ? cur.slice(0, -inserted.length) : cur).replace(/\s+$/, "");
            inserted = ((base ? " " : "") + done + live).replace(/\s+/g, " ");
            ta.value = (base + inserted).slice(0, FLEET_MAX);
            inserted = ta.value.slice(base.length);
            ta.dispatchEvent(new Event("input", { bubbles: true }));
          };
          rec.onerror = (e) => {
            if (micErr && (e.error === "not-allowed" || e.error === "service-not-allowed")) micErr.hidden = false;
          };
          rec.onend = () => {
            rec = null; setState(false);
            if (q.choices) { FLEET.answers[q.key + "_other"] = (ta.value || "").trim().slice(0, FLEET_MAX); syncChoices(); }
            else { FLEET.answers[q.key] = (ta.value || "").trim().slice(0, FLEET_MAX); fleetSaveAnswers(); }
          };
          rec.start();
          setState(true);
          if (micErr) micErr.hidden = true;
        } catch (e) { rec = null; setState(false); }
      });
    }
    // Tool picker: any number of tools; "none" clears the rest; "other" opens
    // a small text field. q5 (the old enum) is derived on every change.
    const toolBtns = form.querySelectorAll("[data-fleet-tool]");
    const otherWrap = form.querySelector("[data-fleet-other-wrap]");
    const otherIn = form.querySelector("[data-fleet-other]");
    const syncTools = () => {
      const on = [...toolBtns].filter((b) => b.getAttribute("aria-checked") === "true").map((b) => b.getAttribute("data-fleet-tool"));
      FLEET.answers.tools = on;
      FLEET.answers.q5 = fleetDeriveQ5(on);
      if (otherWrap) otherWrap.hidden = on.indexOf("other") === -1;
      fleetSaveAnswers();
      if (err && on.length) err.hidden = true;
    };
    toolBtns.forEach((b) => b.addEventListener("click", () => {
      const v = b.getAttribute("data-fleet-tool");
      const now = b.getAttribute("aria-checked") !== "true";
      if (v === "none" && now) toolBtns.forEach((o) => o.setAttribute("aria-checked", "false"));
      else if (now) { const none = form.querySelector('[data-fleet-tool="none"]'); if (none) none.setAttribute("aria-checked", "false"); }
      b.setAttribute("aria-checked", now ? "true" : "false");
      syncTools();
      if (v === "other" && now && otherIn) setTimeout(() => { try { otherIn.focus({ preventScroll: true }); } catch (e) {} }, 30);
    }));
    if (otherIn) otherIn.addEventListener("input", () => { FLEET.answers.tools_other = otherIn.value.slice(0, FLEET_OTHER_MAX); fleetSaveAnswers(); });
    choiceBtns.forEach((c) => c.addEventListener("click", () => {
      const v = c.getAttribute("data-fleet-choice");
      const now = c.getAttribute("aria-checked") !== "true";
      c.setAttribute("aria-checked", now ? "true" : "false");
      syncChoices();
      if (v === "other" && now && ta) setTimeout(() => { try { ta.focus({ preventScroll: true }); } catch (e) {} }, 30);
    }));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (q.tools) {
        const on = Array.isArray(FLEET.answers.tools) ? FLEET.answers.tools : [];
        if (!on.length) { if (err) err.hidden = false; return; }
        FLEET.answers.q5 = fleetDeriveQ5(on);
        fleetSaveAnswers();
      } else if (q.choices) {
        const on = Array.isArray(FLEET.answers[q.key + "_chips"]) ? FLEET.answers[q.key + "_chips"] : [];
        if (!on.length) { if (errText) errText.textContent = f.q_choose_many || f.q_choose || ""; if (err) err.hidden = false; return; }
        if (on.length === 1 && on[0] === "other" && (FLEET.answers[q.key + "_other"] || "").trim().length < FLEET_MIN) {
          if (errText) errText.textContent = f.q_short || "";
          if (err) err.hidden = false;
          if (ta) ta.focus();
          return;
        }
      } else {
        const v = (ta.value || "").trim().slice(0, FLEET_MAX);
        const needs = q.key === "q1" || q.key === "q2" ? FLEET_MIN : 1;
        if (v.length < needs) { if (err) err.hidden = false; ta.focus(); return; }
        FLEET.answers[q.key] = v;
        fleetSaveAnswers();
      }
      if (FLEET.qi < f.questions.length - 1) { FLEET.qi += 1; go("q"); }
      else { if (FLEET.stopMic) { FLEET.stopMic(); FLEET.stopMic = null; } fleetSubmit(lang); }
    });
  }

  // Email gate: name + email required, note optional → one `leads` row.
  const gate = root.querySelector("[data-fleet-gate]");
  if (gate) {
    const errorEl = root.querySelector("[data-fleet-gate-error]");
    const submitBtn = root.querySelector("[data-fleet-gate-submit]");
    let submitting = false;
    const setLoading = (on) => { submitting = on; submitBtn.disabled = on; submitBtn.classList.toggle("is-loading", on); };
    gate.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (submitting) return;
      if (errorEl) errorEl.hidden = true;
      const name = gate.name.value.trim();
      const email = gate.email.value.trim();
      const note = gate.note.value.trim();
      if (!name || !EMAIL_RE.test(email)) { (!name ? gate.name : gate.email).focus(); return; }
      setLoading(true);
      try {
        const src = fleetSource(lang);
        src.handoff_text = note || null;
        await FLEET_API.lead({
          name, email, lang,
          status: FLEET.gateMode === "normal" ? "new" : "manual",
          blueprint_id: FLEET.blueprintId,
          source: src,
          answers: FLEET.answers,
          blueprint: FLEET.result,
          note: note || null,
        });
        ga("fleet_lead_submitted", { mode: FLEET.gateMode });
        go("done");
      } catch (err) {
        console.warn("fleet lead failed:", err && err.message);
        if (errorEl) errorEl.hidden = false;
      } finally {
        setLoading(false);
      }
    });
  }
}

/* ---- Mobile nav tray (hamburger) ---------------------------------------- */
function wireNav() {
  const burger = document.querySelector("[data-nav-toggle]");
  const menu = document.getElementById("navMenu");
  if (!burger || !menu) return;
  const setOpen = (o) => {
    menu.classList.toggle("is-open", o);
    burger.setAttribute("aria-expanded", o ? "true" : "false");
  };
  burger.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(!menu.classList.contains("is-open"));
  });
  // selecting student closes the tray (language switch re-renders, closing it)
  menu.querySelectorAll("[data-student-open]").forEach((b) =>
    b.addEventListener("click", () => setOpen(false)));
  // close on outside click / Escape
  document.addEventListener("click", (e) => {
    if (menu.classList.contains("is-open") && !menu.contains(e.target) && !burger.contains(e.target)) setOpen(false);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
}

/* ---- Copyable prompt cards (gated vault) --------------------------------- */
/* Each Copy button copies the raw prompt text from window.WORKSHOP_CONTENT
   (the single source of truth), then flips to a check glyph for 2s and resets.
   The button is icon-only, so the confirmation is the ICON plus the aria-label
   and tooltip - both move to "Copied" together, per the icon-only tooltip rule.
   Reads from the data model, not the DOM, so whitespace is preserved exactly. */
function wirePrompts() {
  const src = (window.WORKSHOP_CONTENT && window.WORKSHOP_CONTENT.prompts) || {};
  document.querySelectorAll("[data-copy-key]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = src[btn.getAttribute("data-copy-key")] || "";
      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add("is-copied");
        btn.innerHTML = I.check;
        btn.setAttribute("aria-label", "Copied");
        btn.setAttribute("data-tooltip", "Copied");
        setTimeout(() => {
          btn.classList.remove("is-copied");
          btn.innerHTML = I.copy;
          btn.setAttribute("aria-label", "Copy");
          btn.setAttribute("data-tooltip", "Copy");
        }, 2000);
      } catch (e) {
        /* clipboard blocked (e.g. non-secure context) — no-op */
      }
    });
  });
}

/* ---- Account menu (student-area avatar dropdown) ------------------------- */
/* Only present on the #/prep header variant. The avatar toggles a small menu
   whose single item is Sign out (wired separately via [data-signout]). Closes
   on outside-click and Escape; keeps aria-expanded in sync. */
function wireAccountMenu() {
  const wrap = document.querySelector("[data-account]");
  if (!wrap) return;
  const btn = wrap.querySelector("[data-account-toggle]");
  const menu = wrap.querySelector("[data-account-menu]");
  if (!btn || !menu) return;
  const setOpen = (o) => {
    menu.hidden = !o;
    wrap.classList.toggle("is-open", o);
    btn.setAttribute("aria-expanded", o ? "true" : "false");
  };
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(menu.hidden);
  });
  document.addEventListener("click", (e) => {
    if (!menu.hidden && !wrap.contains(e.target)) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) { setOpen(false); btn.focus(); }
  });
}

/* ---- Sign out ------------------------------------------------------------ */
/* Clears the Supabase session and returns to the main page. onAuthStateChange
   fires on sign-out and re-routes; we also navigate home so a signed-out user
   never sits on the gated prep page. */
function wireSignout() {
  document.querySelectorAll("[data-signout]").forEach((b) =>
    b.addEventListener("click", async () => {
      if (IS_LOCAL) {
        try { localStorage.removeItem(LOCAL_TIER_KEY); } catch (e) {}
        AUTH = { user: null, tier: null, denied: false };
      } else {
        await sb.auth.signOut();
      }
      if (location.hash === "#/" || location.hash === "") {
        route(document.documentElement.lang || "he");
      } else {
        location.hash = "#/";
      }
    }));
}

/* Post-render wiring shared by every page. */
/* A WebKit sticky-header fix (forcing a reflow on the nav after every render,
   plus a delayed retry and a `pageshow` listener) used to live here. .nav is
   `position: fixed` now (2026-08-31, styles.css), which has no sticky
   initialization state to ever need re-triggering — so this whole family of
   patches is gone, not just quieted. Keeping it would have meant flickering
   the header (display:none -> reflow -> "") on every render for a bug that
   no longer exists in the CSS underneath it. */
function afterRender() {
  wireLang();
  wireReveal();
  wireHeroImage();
  wireStudent();
  wireNotices();
  wireRegister();
  wireNav();
  wireAccountMenu();
  wireSignout();
  wirePrompts();
  wireWhyCursors();
  fitHeroSub();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHeroSub);
}


/* ---- Router — hash routes: #/prep, #/kit, #/fleet, #/privacy, #/terms, else home --- */
function currentRoute() {
  // Strip any query suffix (e.g. #/prep?lang=en) before matching the route.
  const h = (location.hash || "").replace(/^#\/?/, "").split("?")[0];
  if (h === "prep") return "prep";
  if (h === "kit") return "kit";
  if (h === "fleet") return "fleet";
  if (h === "privacy") return "privacy";
  if (h === "terms") return "terms";
  return "home";
}
/* The page repaints only when the ANSWER to "who is signed in" changes.
   supabase-js re-emits auth events when the window regains focus and when the
   token refreshes after a few minutes away; repainting on those threw the admin
   off the students tab, closed every expanded row and discarded anything typed
   but not saved. This gates the REPAINT only - loadAuth(), the my_access() call,
   the sign-out-on-denied path and RLS are untouched. */
/* The site title as shipped in index.html. #/fleet sets its own page title;
   every route entry restores this one so a sub-page title never leaks home. */
const SITE_TITLE = document.title;
let PAINTED_AUTH = null;
function authFingerprint() {
  return [AUTH.user ? AUTH.user.id : "", AUTH.tier || "", AUTH.denied ? "1" : "0"].join("|");
}

function route(lang) {
  PAINTED_AUTH = authFingerprint();
  /* The three modal systems (student sign-in, notices, register) all lock
     scroll via body.modal-open, and each only clears it from its OWN close()
     button. That class lives on <body>, outside the #app subtree every
     render()/renderPrep() call below replaces wholesale — so a modal left
     open across a route change (e.g. the denied-notice race in loadAuth()
     firing during a sign-out redirect: wireSignout's hashchange render can
     land before the async onAuthStateChange -> loadAuth() re-check finishes,
     so a stray "denied" classification opens the notice on one render and a
     later render never runs that notice's own close()) is ORPHANED: the
     visible modal is gone (fresh DOM, hidden by default) but the scroll lock
     survives, and only a hard reload clears it. Clearing it unconditionally
     on every route entry, before anything re-renders, makes that structurally
     impossible — a route change never inherits scroll lock from the page it
     left. Any render that legitimately needs the lock re-opens it itself
     (afterRender() -> wireStudent()'s pendingStudentOpen, etc.), same as always. */
  document.body.classList.remove("modal-open");
  document.title = SITE_TITLE;
  const r = currentRoute();
  if (r === "prep") renderPrep(lang);
  else if (r === "kit") renderKit(lang);
  else if (r === "fleet") renderFleet(lang);
  else if (r === "privacy") renderLegal(lang, "privacy");
  else if (r === "terms") renderLegal(lang, "terms");
  else render(lang);
  gaPageview(r === "home" ? "/" : "/" + r, document.title);
}

/* ---- Student sign-in (real Google OAuth via Supabase) -------------------- */
/* The modal's one button hands off to sb.auth.signInWithOAuth. The page
   re-renders on return via onAuthStateChange (see Boot). If a gated redirect
   asked for it, auto-open the modal on render. */
function wireStudent() {
  const modal = document.querySelector("[data-student-modal]");
  if (!modal) return;
  const open = () => { modal.hidden = false; document.body.classList.add("modal-open"); };
  const close = () => { modal.hidden = true; document.body.classList.remove("modal-open"); };
  document.querySelectorAll("[data-student-open]").forEach((b) => b.addEventListener("click", open));
  modal.querySelectorAll("[data-student-close]").forEach((b) => b.addEventListener("click", close));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) close(); });

  // Sign-in. PRODUCTION: hand off to Google via Supabase (full-page redirect back
  // to productlab.studio; onAuthStateChange re-routes on return). LOCAL: Google
  // can't return to localhost, so fake a sign-in (no Google) and go to the zone.
  modal.querySelector("[data-google-signin]")?.addEventListener("click", () => {
    if (IS_LOCAL) {
      try { localStorage.setItem(LOCAL_TIER_KEY, "admin"); } catch (e) {}
      close();
      loadAuth().then(() => {
        if (location.hash === "#/prep") route(document.documentElement.lang || "he");
        else location.hash = "#/prep";
      });
      return;
    }
    sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: location.origin + location.pathname },
    });
  });

  if (pendingStudentOpen) { pendingStudentOpen = false; open(); }
}

/* ---- Auth notice popups (denied sign-in + registration-not-open) --------- */
/* Two reusable notices share one open/close mechanism (data-notice). "Register"
   in the sign-in modal opens the placeholder note; a denied Google sign-in
   auto-opens the "not registered" note. deniedNotice stays TRUE (so async
   re-renders after sign-out keep re-opening it, not flashing it away) and is
   cleared only when the user actually closes the note. */
function wireNotices() {
  const notices = [...document.querySelectorAll("[data-notice]")];
  if (!notices.length) return;
  const openNotice = (key) => {
    const n = document.querySelector(`[data-notice="${key}"]`);
    if (!n) return;
    n.hidden = false;
    document.body.classList.add("modal-open");
  };
  const closeAll = () => {
    deniedNotice = false;               // user dismissed it → don't reopen on re-render
    notices.forEach((n) => (n.hidden = true));
    document.body.classList.remove("modal-open");
  };
  notices.forEach((n) =>
    n.querySelectorAll("[data-notice-close]").forEach((b) => b.addEventListener("click", closeAll)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && notices.some((n) => !n.hidden)) closeAll();
  });
  // Auto-open the "not registered" note after a denied sign-in; kept open across
  // the sign-out-triggered re-render until the user closes it.
  if (deniedNotice) openNotice("denied");
}

/* ---- Register-your-interest form ----------------------------------------- */
/* Opens from the "Register" button inside the sign-in modal. Validates first +
   last + a valid-looking email client-side (note optional), then writes a lead
   via sb.rpc('register_lead', ...) — which fires an instant email to Ofir
   server-side. Guards against double-submit (button disabled + spinner while in
   flight). On success swaps the card to the success view; on error shows the
   inline try-again note. LOCAL fakes the write (Google/OAuth can't return to
   localhost either) so QA never emails Ofir — production does the real RPC. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function wireRegister() {
  const modal = document.querySelector("[data-register-modal]");
  if (!modal) return;
  const form = modal.querySelector("[data-register-form]");
  const errorEl = modal.querySelector("[data-register-error]");
  const submitBtn = modal.querySelector("[data-register-submit]");
  const formView = modal.querySelector('[data-register-view="form"]');
  const successView = modal.querySelector('[data-register-view="success"]');
  let submitting = false;

  const open = () => { modal.hidden = false; document.body.classList.add("modal-open"); };
  const close = () => { modal.hidden = true; document.body.classList.remove("modal-open"); };

  // "Register" in the sign-in modal → close it, open the form.
  document.querySelectorAll("[data-register-open]").forEach((b) =>
    b.addEventListener("click", () => {
      const sm = document.querySelector("[data-student-modal]");
      if (sm) sm.hidden = true;
      open();
    }));
  modal.querySelectorAll("[data-register-close]").forEach((b) => b.addEventListener("click", close));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) close(); });

  const setLoading = (on) => {
    submitting = on;
    submitBtn.disabled = on;
    submitBtn.classList.toggle("is-loading", on);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitting) return;                         // hard guard against double-submit
    if (errorEl) errorEl.hidden = true;

    // One visible "full name" field (Ofir, 2026-09-08: merge first+last into
    // one input); register_lead still wants them split, so split on the
    // first run of whitespace - "Ilya Borukhov" -> first "Ilya", last
    // "Borukhov". A single word with no space becomes both (no blank
    // last_name against the DB).
    const fullname = form.fullname.value.trim();
    const nameParts = fullname.split(/\s+/).filter(Boolean);
    const first = nameParts[0] || "";
    const last = nameParts.slice(1).join(" ") || first;
    const email = form.email.value.trim();
    const note = form.note.value.trim();

    // Client-side: require a name + a valid-looking email (note optional).
    if (!first || !EMAIL_RE.test(email)) {
      const missing = !first ? form.fullname : form.email;
      missing.focus();
      return;
    }

    setLoading(true);
    try {
      if (IS_LOCAL) {
        // QA path: don't hit the live RPC (it emails Ofir). Fake the round-trip.
        await new Promise((r) => setTimeout(r, 600));
      } else {
        const { error } = await sb.rpc("register_lead", {
          first_name: first,
          last_name: last,
          email,
          note: note || null,
        });
        if (error) throw error;
      }
      formView.hidden = true;
      successView.hidden = false;
    } catch (err) {
      console.warn("register_lead failed:", err && err.message);
      if (errorEl) errorEl.hidden = false;
    } finally {
      setLoading(false);
    }
  });
}

/* ---- Language ------------------------------------------------------------ */
// A shareable ?lang=en / ?lang=he param forces the site to load in that
// language on first paint (overrides the saved pl_lang), so a link like
// productlab.studio/?lang=en opens in English. Works with the hash router too,
// reading either the query string or a query embedded in the hash route.
function urlLang() {
  try {
    const q = new URLSearchParams(location.search).get("lang");
    if (q === "en" || q === "he") return q;
    const i = location.hash.indexOf("?");
    if (i !== -1) {
      const hq = new URLSearchParams(location.hash.slice(i + 1)).get("lang");
      if (hq === "en" || hq === "he") return hq;
    }
  } catch (e) {}
  return null;
}
function setLang(lang) {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === "he" ? "rtl" : "ltr";
  try { localStorage.setItem("pl_lang", lang); } catch (e) {}
  route(lang);
}
function wireLang() {
  // Mobile tray: quiet text toggle that flips language on each tap.
  document.querySelectorAll("[data-toggle-lang]").forEach((lt) =>
    lt.addEventListener("click", () =>
      setLang(document.documentElement.lang === "he" ? "en" : "he")));

  // Desktop: globe button opens a dropdown to pick a specific language.
  const wrap = document.querySelector("[data-langswitch]");
  if (wrap) {
    const btn = wrap.querySelector("[data-langswitch-toggle]");
    const menu = wrap.querySelector("[data-langswitch-menu]");
    const setOpen = (o) => {
      menu.hidden = !o;
      wrap.classList.toggle("is-open", o);
      btn.setAttribute("aria-expanded", o ? "true" : "false");
    };
    btn.addEventListener("click", (e) => { e.stopPropagation(); setOpen(menu.hidden); });
    wrap.querySelectorAll("[data-set-lang]").forEach((item) =>
      item.addEventListener("click", () => { setOpen(false); setLang(item.getAttribute("data-set-lang")); }));
    document.addEventListener("click", (e) => { if (!wrap.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }
}

/* ---- Hero image fade-in -------------------------------------------------- */
/* The onload handler covers a fresh load; this catches the cached case, where
   the image is already complete before the handler is attached. The LQIP blur
   sits behind until .is-loaded fades the sharp image in (see styles.css). */
function wireHeroImage() {
  document.querySelectorAll(".hero__img").forEach((img) => {
    if (img.complete && img.naturalWidth > 0) img.classList.add("is-loaded");
  });
}

/* Hero sub always renders as exactly hero_sub_lines.length rows: each .sd is
   one row by design (display:block), but its own text can still wrap onto a
   second visual line once the line's real width runs out (long content,
   narrow phone, real font metrics). Rather than cap the copy to whatever
   fits at the smallest screen, shrink that one row's font-size down until it
   fits on its own line — the row count stays fixed, only the text scales. */
function fitHeroSub() {
  const lines = document.querySelectorAll(".hero__sub .sd");
  if (!lines.length) return;
  lines.forEach((el) => { el.style.fontSize = ""; });
  const MIN_PX = 9;
  const wrapped = (el) => el.scrollHeight > parseFloat(getComputedStyle(el).lineHeight) * 1.3;
  let size = parseFloat(getComputedStyle(lines[0]).fontSize);
  let guard = 0;
  // Shrink every row together (not just the overflowing one) so the three
  // rows keep one consistent size instead of one line looking mismatched.
  while (Array.from(lines).some(wrapped) && size > MIN_PX && guard < 60) {
    size -= 0.5;
    lines.forEach((el) => { el.style.fontSize = size + "px"; });
    guard++;
  }
}

/* ---- Reveal on scroll ---------------------------------------------------- */
function wireReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  els.forEach((e) => io.observe(e));
}

/* ---- Boot ---------------------------------------------------------------- */
// Re-fit the hero sub row-by-row on viewport/orientation changes (resize
// only fires on the window, so this lives here once rather than per-render).
let heroFitTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(heroFitTimer);
  heroFitTimer = setTimeout(fitHeroSub, 120);
});

// Re-render on hash route changes, scrolling to top on navigation.
window.addEventListener("hashchange", () => {
  // Ofir, 2026-09-08: clicking into /fleet (hero CTA, retyped URL, browser
  // back/forward) must always land on the entry screen, never resume
  // mid-questionnaire. FLEET.step/qi are in-memory only (never persisted),
  // so within the same tab they'd otherwise still read wherever the user
  // left off, since go()'s internal step changes never touch the hash and
  // so never reach this listener - only a REAL navigation does. Skipped for
  // ?view= dev deep links, which intentionally target a specific step.
  if (currentRoute() === "fleet" && !fleetQuery().get("view")) { FLEET.step = "entry"; FLEET.qi = 0; }
  route(document.documentElement.lang || "he");
  window.scrollTo(0, 0);
});
// Safety net so a hung Supabase call (getSession()/RPC) can never leave the
// page blank forever - the OAuth-return boot path deliberately skips the
// early signed-out paint (see below) so it can land the user straight in the
// vault, which means loadAuth() is the ONLY thing that ever paints anything
// on that path. If it stalls, this makes the boot proceed anyway after a
// bounded wait rather than hang indefinitely with nothing on screen (real
// 2026-09-08 incident: a stuck OAuth-return session left a real visitor on a
// blank white page for several minutes with no way forward but a reload).
function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))]);
}
(async function () {
  let lang = "he";
  try { lang = localStorage.getItem("pl_lang") || "he"; } catch (e) {}
  // A ?lang= param in the shareable URL wins over the saved preference, forcing
  // the requested language on first paint (default stays Hebrew when absent).
  const forcedLang = urlLang();
  if (forcedLang) lang = forcedLang;
  // Detect a fresh Google OAuth return (supabase-js will parse + clean these
  // params). Captured synchronously before loadAuth so we can land the user
  // straight in the vault instead of on the home page.
  const oauthReturn = /access_token|[?&#]code=|error_description/.test(location.hash + location.search);

  // Paint the signed-out shell immediately, before awaiting the network round
  // trip to Supabase below. Until this line, render()/route() only ran AFTER
  // `await loadAuth()` resolved, which left #app - and .nav inside it -
  // completely absent from the DOM for however long that request took
  // (worse on a slow mobile connection, e.g. a WhatsApp-shared link).
  // Painting on the very first tick the script runs, with AUTH still at its
  // safe signed-out default, removes that gap outright instead of racing to
  // patch it after the fact. loadAuth() below still repaints with the real
  // auth state once it resolves (existing behavior).
  if (!oauthReturn) setLang(lang);

  await withTimeout(loadAuth(), 8000);

  // React to later auth changes (sign-in, sign-out, token refresh, other tabs).
  // Keep the callback non-async (loadAuth().then) per supabase-js guidance.
  sb.auth.onAuthStateChange(() => {
    withTimeout(loadAuth(), 8000).then(() => {
      // Same person, same tier -> nothing on screen is stale, so leave the admin
      // exactly where he was (tab, open rows, scroll, half-typed note).
      if (PAINTED_AUTH !== null && authFingerprint() === PAINTED_AUTH) return;
      route(document.documentElement.lang || "he");
    });
  });

  if (oauthReturn && AUTH.tier) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    try { localStorage.setItem("pl_lang", lang); } catch (e) {}
    location.hash = "#/prep"; // triggers hashchange → renderPrep
    route(lang);
  } else {
    setLang(lang);
  }
})();
