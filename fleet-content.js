/* =============================================================================
   PRODUCT LAB — FLEET BLUEPRINT PAGE STRINGS (window.FLEET_CONTENT)
   -----------------------------------------------------------------------------
   Every visible word on the public #/fleet page (S0–S9), HE + EN, identical
   shape under `he` and `en`. app.js reads FLEET_CONTENT[lang] and never
   hard-codes a visible string. Same load pattern as content.js: a plain
   <script> in index.html BEFORE app.js, with a ?v= cache-bust — bump it when
   this file changes.

   ✅ FINAL COPY v2 (Copywriter, 2026-09-06) - Ofir's S0 clarity redo.
   v2 rule: no abstract nouns for the deliverable. "תוכנית" is gone everywhere;
   the thing the reader gets is "הרכב הצוות" / "the lineup", and S0 says in
   plain words what it contains. Questions name the product, never "what you do".
   v2 round 2 (Ofir): entry_sub is ONE sentence, no colon.
   [SUPERSEDED 2026-09-07, see v6 below - the outcome mini block/crew-avatar
   tooltips this round introduced are gone; entry_outcome_label/line/
   entry_crew_aria no longer exist.]
   v2 round 3 (Ofir): q1-q4 rewritten as questions a person asks someone
   sharing a project. Placeholders are ONE example written like a real answer,
   no "למשל:", no "או:", no colon anywhere on the question screens.

   v2 rounds 5-6 (Ofir): q2-q4 hold for idea-stage readers (future tense);
   SCREEN ORDER is q1, q5, q2, q3, q4 (array order = screen order, keys and
   chip values unchanged, the backend reads by key). q5 asks which tool is in
   their hands so q3 ("what you explain to it again and again") has context.
   v2 round 8 (Ofir): q5 is a MULTI-SELECT of tools (q5.tools, with logos) +
   tools_none / tools_other / tools_other_ph / q_choose_many; the old q5.choices
   stays as fallback. q_submit is a question, on purpose: the reader gets a
   lineup, not a working team, so the button asks instead of promising.
   v2 round 9 (Ofir): S6 loading is the three crew characters reading the
   answers. [SUPERSEDED 2026-09-07, see v6 below - S6 no longer shows three
   fixed characters; loading_lines is now 2 lines each, not 4.]
   Written against the UR brief (shared/research/briefs/fleet-blueprint-
   2026-09-05.md §2 to §4), curriculum-truth.md §14.5 (the page describes a PLAN;
   the working team appears only in the workshop CTA) and the CMO ban list
   (no "generate", "prompt", "בלי קוד", beginner framing, "team ready/working",
   permissions, MCP, autonomous; no English where Hebrew will do; no long
   dash). Register: reader addressed in plural / impersonal, same as the site
   and the cohort #2 launch post. LLM-written lines (spec §3) must match it.
   Length constraints that the layout depends on:
     - entry_title / q[n].title: one line at 390px → ≤ 34 Hebrew chars.
     - crew[n].line / lib labels: one line inside a 3-up card → ≤ 60 chars.
     - leave[n].t: ≤ 30 chars; leave[n].b: ≤ 120 chars.
     - result_cta (button label): ≤ 44 chars, it must not wrap at 390px.
   The specialist library keys (lib) are the CLOSED set of 6 from the spec;
   the key itself is shown as a small tag, the label is the human name.
   The crew block is STATIC copy (never LLM output) per spec §2/S7.

   ⛔ v5 (Ofir, 2026-09-07) - the v4 confirm/recap screen (S5.5) is REMOVED.
   Redundant: after the last question, the flow now goes straight to S6
   loading (fleetSubmit called directly from the last question submit).
   confirm_* keys deleted, fleetConfirm()/case "confirm"/confirm-submit/
   confirm-edit deleted from app.js, .fleet-confirm* CSS deleted.

   ⛔ v6 (Ofir, 2026-09-07) - S0 + S6 UX pass: the product must never look
   like "three specific agents sit behind the scenes and read your answers"
   when that is not what happens.
   S0: [SUPERSEDED by v7 below, same day - the top-of-card cluster this
   round introduced is reverted; entry_outcome_label/entry_outcome_line/
   entry_crew_aria/entry_hint/entry_meta no longer exist.]
   S6 (still current, untouched by v7): no longer "three crew reading your
   answers". One reader shown at a time, cycling through a pool that
   alternates a crew member (loading_lines, now 2 short generic-process
   lines each, not 4) with a library specialist (NEW loading_roles, one
   hedged "maybe/perhaps" hypothesis line per key in `lib`, initial-in-a-
   disc avatar since no portrait exists for them - never claims a real
   action happened, e.g. never "read your screens" if no screens were
   uploaded). loading_title + loading_note rewritten to match.

   ⛔ v7 (Ofir, 2026-09-07, same day) - S0 ONLY: reverted to a plain hero,
   avatars moved below the CTA. Ofir's read on v6: too far from the simple
   original. Top of card is eyebrow/title/description/CTA and NOTHING else
   (entry_meta line removed outright, not replaced). Below the CTA, a small
   supporting block: agents_title/agents_sub (NEW) + the avatar-stack again
   - but real crew photos ONLY, no initials, no "+" hint mark ("don't fake
   an avatar that has no real photo" - Ofir's words). Interactive again:
   hover/tap tooltip = crew[n].tag + crew[n].line, reused verbatim from the
   S7 crew section, no new copy for the tooltips themselves. S6 is untouched
   - still v6's one-reader-at-a-time pool, initials included there since
   that's the only place a library role (no portrait) still appears.

   ✅ v3 (Copywriter, 2026-09-06) - Ofir's post-survey-failure redo.
   Two changes: (1) tone on ANY failure screen is now warm/funny/human, never
   a cold "error" register - the reader just poured their answers into 5
   questions, the LAST thing they should meet is a corporate error message.
   (2) NO RETRY after the survey is complete. `error_title`/`error_sub`/
   `error_retry`/`error_manual` are DELETED - the whole `fleetError()` screen
   (retry once, then fall to the manual gate) is gone. `gate_manual_title`/
   `gate_manual_sub` now carry the ENTIRE failure message and ARE the only
   screen a post-survey failure ever shows: playful headline, then a body that
   says plainly (a) everything they wrote is saved and (b) we'll happily email
   the lineup once it's ready. ⚠️ PD ACTION OWED: in app.js, `fleetSubmit`'s
   catch block (~line 3049) must route EVERY non-rate-limited failure straight
   to `FLEET.gateMode="manual"; FLEET.step="gate"` - delete the `failures`
   counter's retry branch (`else FLEET.step="error"`), delete `case "error"`
   from `renderFleet`'s switch, and delete the now-dead `fleetError()`
   function + its `data-fleet="retry"` handler. `limited_*` (the rate-limit
   state) is UNCHANGED and untouched by this - different situation, different
   screen, not in scope.
   ========================================================================== */

window.FLEET_CONTENT = {
  he: {
    page_title: "איזה צוות סוכנים אתם צריכים | Product Lab",

    /* ---- S0 entry ---- */
    entry_eyebrow: "בונים את הצוות שמתאים לכם",
    entry_title: "אילו סוכני AI צריכים להיות בצוות שלכם?",
    entry_sub: "5 שאלות קצרות על העבודה שלכם. בסוף נמליץ עם מי כדאי להתחיל.",
    entry_cta: "להתחיל",

    /* ---- S0 "examples" block, below the CTA (2026-09-07, v8: one merged
       title instead of title+sub - Ofir: the two lines were redundant) ---- */
    agents_title: "דוגמאות לסוכנים שיכולים להצטרף לצוות שלכם.",
    agents_aria: "דוגמאות לסוכנים אפשריים",
    /* Full real-portrait roster (Marketing Designer inventory, 2026-09-07):
       10 characters with a real image today. `role` is the REAL professional
       title (tooltip's bold line, Ofir: "nobody knows the nicknames, I want
       known titles") - never the internal deck nickname. `line` is the
       tooltip's regular-weight description, same "does X, never Y alone"
       shape as the existing crew lines. CFO/Curator/Mentor/PA have no real
       portrait yet (confirmed absent fleet-wide) and are excluded on purpose. */
    agents: [
      { img: "crew-strategist", role: "מנהל מוצר", line: "מחדד מה בונים ולמה, עוזר לתעדף החלטות ומחבר בין צרכי המשתמש למטרות המוצר." },
      { img: "crew-designer", role: "מעצב מוצר", line: "מתרגם רעיונות לזרימות וממשקים ברורים, עקביים ונוחים לשימוש." },
      { img: "crew-architect", role: "מוביל טכני", line: "הופך רעיונות לפתרון טכני ישים, מפרק מורכבות ומכוון את דרך המימוש." },
      { img: "crew-cmo", role: "מוביל שיווק מוצר", line: "מחדד את המיצוב והמסר של המוצר ומחבר בין מה שבנינו לבין הערך שהמשתמש מבין." },
      { img: "crew-cso", role: "סמנכ\"ל אסטרטגיה", line: "עוזר לחדד כיוון, לזהות הזדמנויות ולחבר החלטות מוצר לתמונה העסקית הרחבה." },
      { img: "crew-dslead", role: "ראש מערכת עיצוב", line: "מפתח ושומר על מערכת העיצוב כך שפיצ׳רים ומסכים חדשים נשארים עקביים וקלים להרחבה." },
      { img: "crew-copywriter", role: "קופירייטר", line: "כותב את הטקסטים במוצר ובתקשורת סביבו כך שיהיו ברורים, מדויקים ונעימים לקריאה." },
      { img: "crew-mdesigner", role: "מעצב שיווק", line: "מתרגם את הסיפור של המוצר לשפה חזותית עבור השקה, עמודים וחומרים שמציגים אותו." },
      { img: "crew-userresearcher", role: "חוקר משתמשים", line: "בודק איך אנשים משתמשים במוצר, מזהה צרכים וחיכוכים ומביא תובנות שמחדדות החלטות." },
    ],

    /* ---- S0, returning visitor ---- */
    return_note: "כבר יש לכם הרכב צוות מהפעם הקודמת.",
    return_open: "לצוות שלי",
    return_reset: "להתחיל מחדש",

    /* ---- S1–S5 questions (UR brief §2, one per screen) ---- */
    q_counter: "שאלה {n} מתוך 5",
    q_answer_label: "התשובה שלכם",
    q_back: "חזרה",
    q_next: "הבא",
    q_submit: "לראות את הצוות שלי",
    q_short: "עוד כמה מילים. ככה ההרכב ידבר עליכם, ולא על כולם.",
    q_choose: "בחרו אפשרות אחת.",
    q_choose_many: "סמנו לפחות אחד. גם עדיין כלום זו תשובה.",
    q_other_ph: "הוסיפו משהו שהדוגמאות למעלה לא כיסו.",
    tools_none: "עדיין לא",
    tools_other: "כלי אחר",
    tools_other_ph: "איזה כלי? נשמח לדעת.",
    q_chars: "{n}/{max}",
    mic_start: "או פשוט לדבר",
    mic_stop: "מקשיבים...",
    mic_aria_start: "לדבר במקום להקליד",
    mic_aria_stop: "להפסיק להקשיב",
    mic_denied: "המיקרופון חסום בדפדפן. אפשר לאשר אותו, או להמשיך להקליד.",
    questions: [
      { key: "q1", title: "מה אתם בונים עכשיו?", hint: "ספרו בקצרה מה המוצר או הפרויקט, למי הוא מיועד ומה אתם רוצים להשיג.", ph: "כלי שעוזר לצוותי מוצר לרכז פידבק מלקוחות ולהחליט מה כדאי לבנות קודם.",
        choices: [
          { v: "site", l: "אתר" }, { v: "crm", l: "CRM" }, { v: "app", l: "אפליקציה" }, { v: "saas", l: "מוצר SaaS" },
          { v: "extension", l: "תוסף לדפדפן" }, { v: "internal", l: "כלי פנימי לצוות" }, { v: "other", l: "משהו אחר" },
        ] },
      { key: "q5", title: "עם אילו כלים כבר עבדתם?", hint: "סמנו כל מה שניסיתם - גם אם השתמשתם בו רק פעם או פעמיים.", ph: "",
        tools: [
          { v: "chatgpt", l: "ChatGPT" },
          { v: "claude", l: "Claude" },
          { v: "gemini", l: "Gemini" },
          { v: "copilot", l: "Copilot" },
          { v: "perplexity", l: "Perplexity" },
          { v: "notion_ai", l: "Notion AI" },
          { v: "cursor", l: "Cursor" },
          { v: "claude_code", l: "Claude Code" },
          { v: "lovable", l: "Lovable" },
          { v: "v0", l: "v0" },
          { v: "replit", l: "Replit" },
          { v: "bolt", l: "Bolt" },
        ],
        choices: [
          { v: "none", l: "עדיין כלום" },
          { v: "chat", l: "צ'אט, ChatGPT או Claude" },
          { v: "claude_code_broke", l: "Claude Code, Cursor, Lovable" },
        ] },
      { key: "q2", title: "איפה העבודה שלכם נתקעת?", hint: "מה לוקח יותר מדי זמן, נדחה שוב ושוב או תלוי בכם כדי להתקדם?", ph: "כל מסך חדש מתחיל כמעט מאפס, ואני חוזר שוב ושוב על החלטות שכבר קיבלתי.",
        choices: [
          { v: "qa", l: "QA" }, { v: "design", l: "עיצוב" }, { v: "new_page", l: "עמוד חדש" }, { v: "feedback", l: "פידבק מלקוחות" },
          { v: "blank_screen", l: "מסך חדש שמתחיל מאפס" }, { v: "repeat_decisions", l: "החלטות שחוזרות על עצמן" },
          { v: "repetitive", l: "תהליכים שחוזרים על עצמם" }, { v: "other", l: "משהו אחר" },
        ] },
      { key: "q3", title: "מה אתם מוצאים את עצמכם מסבירים שוב ושוב לכלי ה-AI שאתם בונים או עובדים איתו?", hint: "כללים, החלטות והעדפות שהייתם רוצים שכלי ה-AI שאתם בונים או עובדים איתו כבר יזכור לבד.", ph: "מי קהל היעד, איך אנחנו כותבים, אילו רכיבים כבר קיימים ומה החלטנו לא לבנות.",
        choices: [
          { v: "audience", l: "מי קהל היעד" }, { v: "writing_style", l: "איך אנחנו כותבים" },
          { v: "not_building", l: "מה החלטנו לא לבנות" }, { v: "components", l: "אילו רכיבים כבר קיימים" }, { v: "other", l: "משהו אחר" },
        ] },
      { key: "q4", title: "מה לא צריך לקרות בלי האישור שלכם?", hint: "אילו החלטות או פעולות אתם לא רוצים שכלי ה-AI יבצע לבד?", ph: "לפרסם משהו ללקוחות, לשנות מחיר, למחוק מידע או לשנות החלטה שכבר אושרה.",
        choices: [
          { v: "change_price", l: "לשנות מחיר" }, { v: "delete_data", l: "למחוק מידע" },
          { v: "publish_customers", l: "לפרסם משהו ללקוחות" }, { v: "change_decision", l: "לשנות החלטה שכבר אושרה" }, { v: "other", l: "משהו אחר" },
        ] },
    ],

    /* ---- S6 loading ---- */
    loading_title: "מרכיבים לכם צוות.",
    /* One line per agent, keyed by img - the SAME img keys as `agents` above.
       The pool is built from f.agents directly (fleetLoadingPool), so the
       role label shown here is always byte-identical to S0's - one source
       of truth, nothing to drift out of sync. Framing: each line is a lens
       on the answers already given, never a claim of seeing screens, code
       or research that was never provided (Ofir, 2026-09-07). */
    loading_agent_lines: {
      "crew-strategist": "מחדדים מה אתם מנסים לבנות ואיפה הכי נכון להתחיל.",
      "crew-designer": "מזהים איפה חוויית המוצר יכולה להרוויח עוד זוג עיניים.",
      "crew-architect": "מזהים איפה שותף טכני יכול להפוך רעיון למשהו שאפשר לבנות.",
      "crew-cmo": "בודקים איך הערך של המוצר מתחבר לאנשים שאמורים להשתמש בו.",
      "crew-cso": "בודקים איפה החלטות המוצר פוגשות את התמונה הגדולה.",
      "crew-dslead": "מזהים איפה עקביות בין מסכים ופיצ'רים יכולה לחסוך עבודה בהמשך.",
      "crew-copywriter": "בודקים איפה המילים במוצר יכולות להיות ברורות ומדויקות יותר.",
      "crew-mdesigner": "מזהים איפה הסיפור של המוצר צריך לקבל ביטוי חזותי חזק יותר.",
      "crew-userresearcher": "בודקים איפה חסר ידע על המשתמשים לפני שמקבלים החלטה.",
    },
    loading_note: "עוד רגע. ההמלצה כבר מתגבשת.",

    /* ---- S7 result (v7, 2026-09-07, fifth pass: FULL DELETE + rebuild of
       section 1 only - sections 2/3/footer untouched). ONE team board, not
       two disconnected sub-sections: a single container, a thin divider
       between the personalized cluster and the base cluster, no group
       description lines (label only), no connector, no quote, no notice.
       Index 0 of *_by_count is unused (1-based, matches MIN/MAX_SPECIALISTS
       1-3) - keeps the subtitle grammatically correct at any count instead
       of hardcoding "two." ---- */
    result_eyebrow: "הצוות שלכם",
    team_title: "זה הצוות שילך איתכם לבנות",
    team_sub: "אלה הסוכנים שהרכבנו עבורכם לפי מה שסיפרתם לנו - סוכנים ייחודיים לצרכים שלכם, יחד עם צוות הבסיס של כל סדנת מוצר.",
    personal_label: "הסוכנים הייחודיים שלכם",
    crew_label: "צוות הבסיס",
    crew: [
      { img: "crew-strategist", role: "מנהל מוצר", line: "מחדד מה בונים, למה זה חשוב ומה נכון לעשות קודם." },
      { img: "crew-designer", role: "מעצב מוצר", line: "הופך רעיונות לחוויות וממשקים ברורים, שימושיים וקונסיסטנטיים." },
      { img: "crew-architect", role: "מוביל טכני", line: "מתרגם את מה שרוצים לבנות להחלטות טכניות ולדרך ביצוע שאפשר להתקדם איתה." },
    ],
    lib: {
      "user-researcher": "חוקר משתמשים",
      "copywriter": "קופירייטר מוצר",
      "design-system-lead": "מוביל מערכת עיצוב",
      "reviewer": "בודק",
      "chief-of-staff": "ראש מטה",
      "marketing-designer": "מעצב שיווק",
      "product-analyst": "אנליסט מוצר",
      "content-curator": "אוצר תוכן",
      "qa-specialist": "בודק QA",
      "accessibility-specialist": "מומחה נגישות",
      "onboarding-specialist": "מומחה Onboarding",
      "technical-writer": "כותב תיעוד",
      "product-ops": "Product Ops",
      "localization-specialist": "מומחה לוקליזציה",
      "security-privacy-reviewer": "בודק אבטחה",
      "content-manager": "מנהל תוכן",
      "domain-expert": "מומחה דומיין",
      "product-growth-lead": "מוביל Growth למוצר",
      "market-researcher": "חוקר שוק ומוצר",
      "content-strategist": "אסטרטג תוכן למוצר",
    },
    /* ---- v5: ONE sentence per card, Ofir's exact wording for the 10 keys
       he gave examples for; the rest carried over from v4 in the same
       positive, boundary-free voice, collapsed to one sentence. Still
       PLACEHOLDER pending Copywriter's official pass. */
    spec_lines: {
      "user-researcher": "עוזר להבין צרכים, לזהות דפוסים ולבדוק החלטות לפני שמתקדמים רחוק מדי.",
      "copywriter": "מחדד מסרים וכותב חוויות מוצר כך שהמשתמש יבין מהר יותר מה קורה ומה לעשות.",
      "design-system-lead": "שומר על עקביות בממשק ועוזר להרחיב את המוצר בלי שכל מסך יתחיל מאפס.",
      "reviewer": "עובר על מה שנבנה ומוודא שהוא תואם למה שסוכם לפני שהוא ממשיך הלאה.",
      "chief-of-staff": "עוזר לעשות סדר, לרכז החלטות ולשמור שהעבודה מתקדמת בכיוון הנכון.",
      "marketing-designer": "מתרגם את המוצר לוויזואלים - לפוסט, למצגת, לעמוד - מתוך המותג שכבר יש לכם.",
      "product-analyst": "מחבר בין שימוש והתנהגות משתמשים לבין החלטות מוצר, כדי להבין מה עובד ומה כדאי לשפר.",
      "content-curator": "עוזר לארגן, לסווג ולנהל את התוכן שחי בתוך המוצר כך שיישאר שימושי ומסודר.",
      "qa-specialist": "עובר על המוצר לפני שחרור ומוצא בעיות לפני שהמשתמשים נתקלים בהן.",
      "accessibility-specialist": "עוזר למוצר להיות שימושי ליותר אנשים, כולל מי שמשתמש בכלי נגישות.",
      "onboarding-specialist": "עוזר לחדד את החוויה הראשונה של משתמש חדש כך שהוא יבין מהר את הערך וישאר.",
      "technical-writer": "כותב את מסכי העזרה וההנחיות בתוך המוצר כך שמשתמשים מבינים לבד מה לעשות.",
      "product-ops": "שומר על התהליך והכלים של הצוות עצמו מסודרים, כדי שהעבודה תזרום בלי כפילויות.",
      "localization-specialist": "מכין את המוצר לשפה או שוק חדש, כדי שיהיה מוכן להתרחב הלאה.",
      "security-privacy-reviewer": "עובר על המוצר ומוודא שמידע רגיש שמור ומוגן כמו שצריך.",
      "content-manager": "מתכנן ומנהל את התוכן שחי בתוך המוצר ודואג שהוא יישאר שימושי, עדכני ומסודר לאורך זמן.",
      "domain-expert": "מביא לצוות את הידע של התחום שבו המוצר פועל, כדי שהפתרון יהיה מחובר למציאות.",
      "product-growth-lead": "מחפש איפה אפשר לשפר אימוץ, שימוש וחזרה למוצר דרך שינויים בתוך החוויה עצמה.",
      "market-researcher": "עוזר להבין את השוק, המתחרים והפתרונות הקיימים כדי לחדד איפה המוצר שלכם צריך להיות שונה.",
      "content-strategist": "מחבר בין המוצר, המבנה והתוכן כדי שהמידע הנכון יופיע במקום הנכון ובזמן הנכון.",
    },
    broke_title: "למה זה נשבר בפעם הקודמת",
    /* v2: broke_because is now an enum (no_memory|no_boundary), fixed 2 lines. */
    broke_bank: {
      no_memory: "לא היה לו זיכרון בין שיחות. בכל צ'אט חדש הוא התחיל מאפס.",
      no_boundary: "לא היה כתוב לו מה אסור לו לשנות בלי האישור שלכם. בפעם השלישית הוא החליט לבד.",
    },
    /* v5 (2026-09-07, third pass): Ofir's exact copy, source of truth. */
    benefits_eyebrow: "מה מקימים בסדנה",
    benefits_title: "לא רק ממליצים על צוות. בסדנה אתם מקימים אותו.",
    benefits_sub: "במהלך הסדנה הסוכנים לא רק מוגדרים - הם מתחילים לעבוד יחד על משהו אמיתי שלכם.",
    benefits: [
      { t: "הצוות שלכם, מוכן לעבודה", b: "מגדירים את הסוכנים, התפקידים והדרך שבה הם עובדים יחד." },
      { t: "זיכרון משותף", b: "החלטות, הקשר וידע נשמרים במקום אחד, כך שכל הצוות עובד מאותה תמונה." },
      { t: "זיכרון מתמשך לכל סוכן", b: "כל סוכן ממשיך להכיר את התחום שלו ואת מה שכבר בניתם יחד." },
      { t: "ממשיכים גם אחרי הסדנה", b: "הצוות והסטאפ נשארים אצלכם, כדי שתוכלו להמשיך לעבוד בלי להתחיל מחדש." },
    ],
    positioning_line: "הכול בנוי סביב עבודה על מוצרים דיגיטליים - מהחלטות מוצר ועיצוב ועד הבנייה עצמה.",
    result_cta_title: "רוצים לצאת מהסדנה עם הצוות הזה עובד?",
    result_cta_sub: "נבנה אותו יחד על משהו אמיתי שלכם, נחבר לו זיכרון משותף, ותצאו עם מערכת שאפשר להמשיך לעבוד איתה גם אחרי הסדנה.",
    result_cta: "להרשמה לסדנה",
    result_cta_wa: "לדבר איתי בוואטסאפ",

    /* ---- S8 email gate (after the full result, never before) ---- */
    gate_title: "לאן לשלוח את ההרכב?",
    gate_sub: "באימייל: ההרכב הזה כמו שהוא, בקובץ שנשאר אצלכם, ומה הסדנה עושה איתו. הצוות של Product Lab קורא מה שכתבתם ועונה אישית תוך 24 שעות.",
    gate_manual_title: "ההרכב לא יצא הפעם.",
    gate_manual_sub: "כל מה שכתבתם שמור אצלנו מילה במילה. תשאירו אימייל, ונשמח לשלוח לכם אותו ברגע שהוא מוכן.",
    gate_limited_title: "יותר מדי בקשות היום מהרשת הזאת.",
    gate_limited_sub: "תשאירו אימייל, ונשלח לכם את ההרכב.",
    gate_name_label: "שם",
    gate_email_label: "אימייל",
    gate_email_ph: "you@email.com",
    gate_note_label: "משהו להוסיף? (לא חובה)",
    gate_note_ph: "שורה אחת. מה הייתם רוצים שהצוות הזה יוריד מכם קודם.",
    gate_submit: "לשלוח לי",
    gate_error: "משהו לא נשלח. אפשר לנסות שוב, או לכתוב לנו בוואטסאפ.",

    /* ---- S9 confirmation + cohort #2 ---- */
    done_title: "ההרכב בדרך אליכם.",
    done_sub: "הצוות של Product Lab קורא מה שכתבתם ועונה אישית תוך 24 שעות.",
    done_cohort_eyebrow: "הצעד הבא",
    done_cohort_title: "הצוות הזה קם בסדנה.",

    /* ---- rate-limited (the OTHER failure state - unrelated, unchanged) ---- */
    limited_title: "יותר מדי בקשות היום מהרשת הזאת.",
    limited_sub: "התשובות שלכם שמורות. תשאירו אימייל ונשלח לכם את ההרכב.",
    limited_cta: "להשאיר אימייל",
  },

  en: {
    page_title: "Which agent team do you need | Product Lab",

    entry_eyebrow: "Who will help you build",
    entry_title: "Which agent team do you need?",
    entry_sub: "5 short questions about your work. At the end, we recommend who to start with.",
    entry_cta: "Start",

    agents_title: "Examples of AI agents that could join your crew.",
    agents_aria: "Examples of possible agents",
    agents: [
      { img: "crew-strategist", role: "Product Manager", line: "Sharpens what to build and why, helps prioritize decisions, and connects user needs to product goals." },
      { img: "crew-designer", role: "Product Designer", line: "Turns ideas into clear, consistent, easy-to-use flows and interfaces." },
      { img: "crew-architect", role: "Lead Engineer", line: "Turns ideas into a workable technical solution, breaks down complexity, and guides how it gets built." },
      { img: "crew-cmo", role: "Product Marketing Lead", line: "Sharpens the product's positioning and message, connecting what was built to the value users see." },
      { img: "crew-cso", role: "Chief Strategy Officer", line: "Helps sharpen direction, spot opportunities, and connect product decisions to the bigger business picture." },
      { img: "crew-dslead", role: "Design System Lead", line: "Builds and maintains the design system so new features and screens stay consistent and easy to extend." },
      { img: "crew-copywriter", role: "Copywriter", line: "Writes the product's words and the communication around it so they're clear, precise, and pleasant to read." },
      { img: "crew-mdesigner", role: "Marketing Designer", line: "Turns the product's story into visuals for launches, pages, and materials that present it." },
      { img: "crew-userresearcher", role: "User Researcher", line: "Studies how people use the product, spots needs and friction, and brings insights that sharpen decisions." },
    ],

    return_note: "You already have a team lineup from last time.",
    return_open: "Show me my team",
    return_reset: "Start over",

    q_counter: "Question {n} of 5",
    q_answer_label: "Your answer",
    q_back: "Back",
    q_next: "Next",
    q_submit: "Who is on my dream team?",
    q_short: "A few more words. That is how the lineup speaks about you, not about everyone.",
    q_choose: "Pick one.",
    q_choose_many: "Tick at least one. Nothing yet counts too.",
    q_other_ph: "Add something the examples above didn't cover.",
    tools_none: "Nothing yet",
    tools_other: "Something else",
    tools_other_ph: "Which tool? We want to know.",
    q_chars: "{n}/{max}",
    mic_start: "Or just talk",
    mic_stop: "Listening...",
    mic_aria_start: "Talk instead of typing",
    mic_aria_stop: "Stop listening",
    mic_denied: "The browser blocked the microphone. Allow it, or keep typing.",
    questions: [
      { key: "q1", title: "What are you building that keeps you up at night?", hint: "What it is and who it is for. A sentence or two, your words.", ph: "A scheduling app for small clinics. I am alone on product, design and launch, and most of the time on support too.",
        choices: [
          { v: "app", l: "App" }, { v: "crm", l: "CRM" }, { v: "site", l: "Website" }, { v: "saas", l: "SaaS product" },
          { v: "extension", l: "Browser extension" }, { v: "internal", l: "Internal team tool" }, { v: "other", l: "Something else" },
        ] },
      { key: "q5", title: "Which AI tools have you already worked with?", hint: "Tick everything you have touched, even once.", ph: "",
        tools: [
          { v: "chatgpt", l: "ChatGPT" },
          { v: "claude", l: "Claude" },
          { v: "gemini", l: "Gemini" },
          { v: "copilot", l: "Copilot" },
          { v: "perplexity", l: "Perplexity" },
          { v: "notion_ai", l: "Notion AI" },
          { v: "cursor", l: "Cursor" },
          { v: "claude_code", l: "Claude Code" },
          { v: "lovable", l: "Lovable" },
          { v: "v0", l: "v0" },
          { v: "replit", l: "Replit" },
          { v: "bolt", l: "Bolt" },
        ],
        choices: [
          { v: "none", l: "Nothing yet" },
          { v: "chat", l: "Chat, ChatGPT or Claude" },
          { v: "claude_code_broke", l: "Claude Code, Cursor, Lovable" },
        ] },
      { key: "q2", title: "What gets stuck with you, or will?", hint: "Everything that waits until you are free. The team is built from this.", ph: "For now everything, because it is just me. Mostly the screens before dev, and every text that goes out to users.",
        choices: [
          { v: "qa", l: "QA" }, { v: "design", l: "Design" }, { v: "new_page", l: "A new page" }, { v: "feedback", l: "Customer feedback" },
          { v: "repetitive", l: "Repetitive processes" }, { v: "repeat_decisions", l: "Decisions that repeat" },
          { v: "blank_screen", l: "A new screen starting from zero" }, { v: "other", l: "Something else" },
        ] },
      { key: "q3", title: "What do you keep explaining in every chat?", hint: "What gets forgotten between one chat and the next. This goes into memory.", ph: "That the customer is the clinic manager, not the doctor, that the palette is locked, and no Android this year. Every new chat starts from zero.",
        choices: [
          { v: "writing_style", l: "How we write" }, { v: "audience", l: "Who the audience is" },
          { v: "not_building", l: "What we decided not to build" }, { v: "components", l: "Which components already exist" }, { v: "other", l: "Something else" },
        ] },
      { key: "q4", title: "What shouldn't happen without your approval?", hint: "Which decisions or actions you don't want the AI tool making without you.", ph: "Any message to a customer, an email to the whole list, a price change, and any update going live. Without my approval it does not move.",
        choices: [
          { v: "delete_data", l: "Delete data" }, { v: "change_price", l: "Change a price" },
          { v: "publish_customers", l: "Publish something to customers" }, { v: "change_decision", l: "Change a decision already approved" }, { v: "other", l: "Something else" },
        ] },
    ],

    /* ---- S6 loading ---- */
    loading_title: "Putting your team together.",
    loading_agent_lines: {
      "crew-strategist": "Sharpening what you're trying to build and where it makes sense to start.",
      "crew-designer": "Spotting where the product experience could use another pair of eyes.",
      "crew-architect": "Spotting where a technical partner could turn an idea into something buildable.",
      "crew-cmo": "Checking how the product's value connects to the people meant to use it.",
      "crew-cso": "Checking where product decisions meet the bigger picture.",
      "crew-dslead": "Spotting where consistency across screens and features could save work later.",
      "crew-copywriter": "Checking where the product's words could be clearer and more precise.",
      "crew-mdesigner": "Spotting where the product's story needs a stronger visual voice.",
      "crew-userresearcher": "Checking where there's a gap in user knowledge before a decision gets made.",
    },
    loading_note: "One more moment. The recommendation is coming together.",

    result_eyebrow: "Your team",
    team_title: "This is the team that'll go build with you",
    team_sub: "These are the agents we put together for you based on what you told us - specialists matched to your needs, alongside the base crew of every product workshop.",
    personal_label: "Your unique specialists",
    crew_label: "The base crew",
    crew: [
      { img: "crew-strategist", role: "Product manager", line: "Sharpens what gets built, why it matters, and what's right to do first." },
      { img: "crew-designer", role: "Product designer", line: "Turns ideas into clear, usable, consistent experiences and interfaces." },
      { img: "crew-architect", role: "Lead engineer", line: "Translates what you want to build into technical decisions and a way to make progress." },
    ],
    lib: {
      "user-researcher": "User researcher",
      "copywriter": "Product copywriter",
      "design-system-lead": "Design system lead",
      "reviewer": "Reviewer",
      "chief-of-staff": "Chief of staff",
      "marketing-designer": "Marketing designer",
      "product-analyst": "Product analyst",
      "content-curator": "Content curator",
      "qa-specialist": "QA specialist",
      "accessibility-specialist": "Accessibility specialist",
      "onboarding-specialist": "Onboarding specialist",
      "technical-writer": "Technical writer",
      "product-ops": "Product ops",
      "localization-specialist": "Localization specialist",
      "security-privacy-reviewer": "Security & privacy reviewer",
      "content-manager": "Content manager",
      "domain-expert": "Domain expert",
      "product-growth-lead": "Product growth lead",
      "market-researcher": "Market & product researcher",
      "content-strategist": "Product content strategist",
    },
    /* ---- v5: ONE sentence per card, translated from Ofir's exact Hebrew.
       Still PLACEHOLDER pending Copywriter's official pass. */
    spec_lines: {
      "user-researcher": "Helps understand needs, spot patterns, and test decisions before you go too far.",
      "copywriter": "Sharpens messages and writes the product experience so users understand faster what's happening and what to do.",
      "design-system-lead": "Keeps the interface consistent and helps the product grow without every screen starting from zero.",
      "reviewer": "Goes over what was built and makes sure it matches what was agreed before it moves on.",
      "chief-of-staff": "Helps bring order, centers decisions, and keeps the work moving in the right direction.",
      "marketing-designer": "Turns the product into visuals - for the post, the deck, the page - from the brand you already have.",
      "product-analyst": "Connects usage and user behavior to product decisions, to understand what's working and what's worth improving.",
      "content-curator": "Helps organize, classify and manage the content living inside the product so it stays useful and tidy.",
      "qa-specialist": "Goes over the product before release and catches issues before your users run into them.",
      "accessibility-specialist": "Helps the product work for more people, including those using accessibility tools.",
      "onboarding-specialist": "Helps sharpen a new user's first experience so they get the value fast and stay.",
      "technical-writer": "Writes the help screens and in-product guidance so users can figure things out on their own.",
      "product-ops": "Keeps the team's own process and tools organized, so work flows without duplication.",
      "localization-specialist": "Prepares the product for a new language or market, so it's ready to expand further.",
      "security-privacy-reviewer": "Goes over the product and makes sure sensitive data is kept and protected properly.",
      "content-manager": "Plans and manages the content living inside the product, keeping it useful, current, and organized over time.",
      "domain-expert": "Brings the team the knowledge of the domain the product operates in, so the solution stays grounded in reality.",
      "product-growth-lead": "Looks for where to improve adoption, usage, and return to the product through changes in the experience itself.",
      "market-researcher": "Helps understand the market, competitors, and existing solutions to sharpen where your product needs to be different.",
      "content-strategist": "Connects the product, its structure, and its content so the right information shows up in the right place at the right time.",
    },
    broke_title: "Why it broke last time",
    /* v2: broke_because is now an enum (no_memory|no_boundary), fixed 2 lines. */
    broke_bank: {
      no_memory: "It had no memory between chats. Every new one started from zero.",
      no_boundary: "Nothing told it what it may not change without your approval. The third time, it decided alone.",
    },
    /* v4 (2026-09-07, second pass): 4 benefit cards now, per Ofir's explicit
       split of shared vs. continuous memory. */
    benefits_eyebrow: "What you set up in the workshop",
    benefits_title: "We don't just recommend a team. You set it up in the workshop.",
    benefits_sub: "During the workshop the agents aren't just defined - they start working together on something real of yours.",
    benefits: [
      { t: "Your team, ready to work", b: "You define the agents, the roles, and how they work together." },
      { t: "Shared memory", b: "Decisions, context, and knowledge are kept in one place, so the whole team works off the same picture." },
      { t: "Continuous memory per agent", b: "Each agent keeps knowing its area and what you've already built together." },
      { t: "Keep going after the workshop", b: "The team and the setup stay with you, so you can keep working without starting over." },
    ],
    positioning_line: "It's all built around working on digital products - from product and design decisions through to the build itself.",
    result_cta_title: "Want to leave the workshop with this team working?",
    result_cta_sub: "We'll build it together on something real of yours, connect it to shared memory, and you'll leave with a system you can keep working with, even after the workshop.",
    result_cta: "Register for the workshop",
    result_cta_wa: "Talk to me on WhatsApp",

    gate_title: "Where should the lineup go?",
    gate_sub: "By email: this lineup as it is, in a file you keep, and what the workshop does with it. The Product Lab team reads what you wrote and replies personally within 24 hours.",
    gate_manual_title: "Your lineup did not make it out this time.",
    gate_manual_sub: "Everything you wrote is saved, word for word. Leave an email, and we will send you the lineup the moment it is ready.",
    gate_limited_title: "Too many requests today from this network.",
    gate_limited_sub: "Leave an email and we will send you the lineup.",
    gate_name_label: "Name",
    gate_email_label: "Email",
    gate_email_ph: "you@email.com",
    gate_note_label: "Anything to add? (optional)",
    gate_note_ph: "One line. What you would want this team to take off your plate first.",
    gate_submit: "Send it to me",
    gate_error: "That did not go through. Try again, or write to us on WhatsApp.",

    done_title: "Your lineup is on its way.",
    done_sub: "The Product Lab team reads what you wrote and replies personally within 24 hours.",
    done_cohort_eyebrow: "The next step",
    done_cohort_title: "The workshop is where this team gets built.",

    limited_title: "Too many requests today from this network.",
    limited_sub: "Your answers are saved. Leave an email and we will send you the lineup.",
    limited_cta: "Leave an email",
  },
};
