/**
 * Components / AgentCard — a crew member card from the "meet the team" section.
 * Structure: character illustration on top, then the body with the archetype
 * BADGE (tinted-purple pill, reuses the system accent-12% recipe), the role
 * TITLE beneath it, and the description. The badge/title split replaced the old
 * single "Archetype - Role" line (which wrapped inconsistently). 2026-08-12.
 *
 * DSL, 2026-09-07 (per Marketing Designer, consulted after Ofir flagged stale
 * Storybook visuals): this story pointed at agent-pd.png/agent-cpo.png/
 * agent-cto.png, the cast from before the 2026-08-22 redesign. Zero references
 * left in app.js or content.js; deleted the orphaned files from assets/. Live
 * markup uses crew-designer/crew-strategist/crew-architect.webp - swapped in,
 * copy refreshed to the live full bios (app.js's own were trimmed here before).
 */
export default {
  title: "Components/AgentCard",
};

const card = ({ img, tag, role, b }) =>
  `<div class="agentcard">
     <div class="agentcard__illo"><img src="assets/${img}.webp?v=2" alt="" /></div>
     <div class="agentcard__body">
       <span class="agentcard__tag">${tag}</span>
       <div class="agentcard__role">${role}</div>
       <p>${b}</p>
     </div>
   </div>`;

const HE = [
  { img: "crew-designer", tag: "המעצב", role: "מעצב המוצר", b: "כשמגיע הזמן לעצב, הוא השותף הראשון שלי. הוא עובד מתוך ה-Design System, שומר על עקביות, מציע פתרונות UX ומוודא שכל מסך ברור, שימושי ומוכן לבנייה." },
  { img: "crew-strategist", tag: "האסטרטג", role: "מנהל המוצר", b: "כשאני לא בטוח מה לבנות קודם, אני מתייעץ איתו. הוא עוזר לחדד רעיונות, לתעדף משימות, לאתגר הנחות יסוד ולשמור שכל החלטה מקדמת את המוצר בכיוון הנכון." },
  { img: "crew-architect", tag: "הארכיטקט", role: "המהנדס הראשי", b: "כשיש לי דילמה טכנית, אני מתחיל איתו. הוא עוזר לי לבחור את הגישה הנכונה, לחשוב על הארכיטקטורה ולוודא שכל פתרון שנבחר באמת ניתן למימוש, יציב ומוכן לגדול יחד עם המוצר." },
];

const EN = [
  { img: "crew-designer", tag: "The Designer", role: "The product designer", b: "When it's time to design, he's my first partner. He works from the Design System, keeps things consistent, suggests UX solutions, and makes sure every screen is clear, usable, and ready to build." },
  { img: "crew-strategist", tag: "The Strategist", role: "The product manager", b: "When I'm not sure what to build first, I check with him. He helps sharpen ideas, prioritize, challenge assumptions, and keep every decision moving the product in the right direction." },
  { img: "crew-architect", tag: "The Architect", role: "The lead engineer", b: "When I hit a technical dilemma, I start with him. He helps me choose the right approach, think through the architecture, and make sure every solution we pick is actually buildable, stable, and ready to grow with the product." },
];

const grid = (items, dir) =>
  `<div class="sb-pad" dir="${dir}"><div class="team__agents" style="max-width:960px;margin:auto">${items.map(card).join("")}</div></div>`;

export const Single = {
  render: () => `<div class="sb-pad" style="max-width:320px;margin:auto">${card(EN[2])}</div>`,
};

export const CrewEN = {
  name: "Crew — English",
  render: () => grid(EN, "ltr"),
};

export const CrewHE = {
  name: "Crew — Hebrew (RTL)",
  render: () => grid(HE, "rtl"),
};

/* Avatar stack — overlapping crew circles (molecule, DSL 2026-09-06). Buttons at
   --ctl-sm, --space-3 overlap via margin-inline-start (mirrors in RTL), light
   tooltip above (nickname / role), tap pins it with data-tip-open on touch.
   First use: #/fleet S0. */
const CREW = [
  { img: "crew-strategist", tag: "האסטרטג", role: "מנהל המוצר" },
  { img: "crew-designer", tag: "המעצב", role: "מעצב המוצר" },
  { img: "crew-architect", tag: "הארכיטקט", role: "המהנדס הראשי" },
];
const stack = (items, dir) =>
  `<div class="sb-pad" dir="${dir}" style="padding-top:72px;text-align:center">
     <div class="avatar-stack" role="group" aria-label="שלושת הסוכנים שבכל הרכב">
       ${items.map((c) => `<button type="button" class="avatar-stack__item" data-tooltip="${c.tag}&#10;${c.role}" data-tip-theme="light" data-tip-pos="top" aria-label="${c.tag}, ${c.role}"><img src="assets/${c.img}.webp?v=2" alt="" /></button>`).join("")}
     </div>
   </div>`;

export const AvatarStackHE = {
  name: "Avatar stack — Hebrew (RTL)",
  render: () => stack(CREW, "rtl"),
};

export const AvatarStackPinned = {
  name: "Avatar stack — pinned (touch)",
  render: () => stack(CREW, "rtl").replace('data-tip-pos="top" aria-label="המעצב', 'data-tip-pos="top" data-tip-open aria-label="המעצב'),
};
