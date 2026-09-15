/* =============================================================================
   PRODUCT LAB — GATED WORKSHOP CONTENT (window.WORKSHOP_CONTENT)
   -----------------------------------------------------------------------------
   This is the POST-workshop content vault. It renders on the gated #/prep route,
   behind the cohort password gate. app.js reads from window.WORKSHOP_CONTENT
   (below) — it does NOT hard-code this content. Loaded by a plain <script> in
   index.html BEFORE app.js, with a ?v= cache-bust.

   OFIR: THIS FILE IS YOUR SINGLE SOURCE OF TRUTH for the gated content. Edit the
   strings here to change what students see. When you edit, bump the ?v= on the
   content.js <script> tag in index.html so browsers fetch the new version.

   PROMPTS: each prompt is a template-literal string (backticks). The prompt text
   has NO backticks and NO ${...} inside it — keep it that way so you can edit
   freely without escaping. Prompts are technical text: they stay ENGLISH in both
   the HE and EN toggle states. The prompt bodies are canonical in deck.json and
   must stay byte-identical to it. Reword there first, then here.

   SECURITY NOTE: content.js ships to the browser and is publicly
   fetchable regardless of the password gate. That is FINE for these prompts —
   students receive them anyway. Do NOT put anything truly secret in this file.

   LANGUAGE: the teaching copy is BILINGUAL. The content model exists twice, under
   `en` and `he`, with identical shape. app.js picks WORKSHOP_CONTENT[lang] from
   the site toggle (fallback `en`) and sets the prep <main> direction (ltr / rtl)
   to match. The prompt BODIES stay ENGLISH in both states (technical text); only
   the labels/intros around them are translated. EN and HE both authored/approved
   by the Copywriter (parity, dash-clean). Governed by curriculum-truth.md.
   ========================================================================== */

window.WORKSHOP_CONTENT = (function () {

  /* ---- The prompts, exactly as the deck shows them ----------------------
     CANONICAL SOURCE: projects/product-lab/workshop/deck.json, slides 14-18, plus
     the /check and /wrap commands the kit ships. These strings are BYTE-IDENTICAL
     to the deck placeholders on purpose: the student copies from this page while
     Ofir reads from the deck, so any drift runs two different prompts in one room.
     If a prompt needs rewording it changes in deck.json FIRST and this follows.
     Technical text: English in both language states. No backticks, no ${...}. */

  const CHECK = `/check`;

  const PM_OPEN = `/start product-manager`;
  const PM_BRIEF = `I want to build a waiting-list page for my project: [fill in: what your site/tool/app is and who it's for].`;

  const PD_OPEN = `/start product-designer`;
  const PD_BRIEF = `Check with the product manager about this project, then show me the three reference styles you've prepared for this - give me real clickable links so I can look at each one myself.`;

  const TL_OPEN = `/start technical-lead`;
  const TL_BUILD = `Please build the waiting-list page, guided by the product manager's plan and the product designer's direction.`;

  const RECRUIT_ASK = `I want to add a new teammate to this team. I have not written their job description yet - ask me what you need to know, all of it in one message, and I will answer in one go. Then build them from my answer, not from your own guess.`;

  const NEW_OPEN = `/start <the teammate you just built>`;
  const WEIGH_IN = `Look at what we built today - the page, and the decisions behind it in the shared brain. Before you suggest anything, ask each of your teammates what they see from where they sit. Then give me your own judgment: what would you change, and why. Say which teammate changed your mind. Fix what is yours to fix.`;

  const WRAP_UP = `/wrap`;

  /* ---- Prompts, keyed. Step cards reference these by key (shared HE + EN). */
  const PROMPTS = {
    check: CHECK,
    pmOpen: PM_OPEN,
    pmBrief: PM_BRIEF,
    pdOpen: PD_OPEN,
    pdBrief: PD_BRIEF,
    tlOpen: TL_OPEN,
    tlBuild: TL_BUILD,
    recruitAsk: RECRUIT_ASK,
    newOpen: NEW_OPEN,
    weighIn: WEIGH_IN,
    wrapup: WRAP_UP,
  };

  /* ---- ENGLISH content model ------------------------------------------- */
  const EN = {
    /* 1 — Plain functional page title (no hero: no kicker, no marketing body, no CTA). */
    hero: {
      title: "Your Product Lab workspace",
    },

    /* 1b — The kit and the deck. First on the page and never collapsed: this is
       what a student comes back for months later, on a new machine. */
    kit: {
      kicker: "Start here",
      title: "Your kit, and the deck",
      subtitle: "The two things you keep from the workshop. They stay on this page, so come back whenever you need them.",
      items: [
        {
          icon: "box",
          kicker: "Download",
          image: "assets/kit-page-cover.jpg",
          title: "The Product Lab kit",
          body: "Your three teammates, the shared brain they write to, and the skills they work from. Unzip it into your Documents folder and point Claude at it. It is the same file you got before the session.",
          href: "assets/product-lab.zip", download: true,
          cta: "Download product-lab.zip",
          note: "One exception: if your Documents folder sits inside OneDrive or iCloud, put the kit in your home folder instead.",
        },
        {
          icon: "slides",
          kicker: "Slide by slide",
          title: "The session deck",
          body: "Every slide from the workshop, in order. Open it when you want the shape of the day back, or the one line you half remember.",
          /* Slide 1 as a static image, NOT a live embed (Ofir, 2026-08-27): the
             deck stays private and will be shared by participant email after
             Sep 3, so an iframe would render a permanent "you need access"
             panel. The image is exported from the private file, needs no
             sharing change, and the button below still opens the real deck. */
          image: "assets/deck-cover.jpg",
          href: "https://docs.google.com/presentation/d/1HnbNtSQ8M8OR_GanBl3O87OhERgupUYj_mI7isHv90w/preview",
          cta: "Open the deck",
        },
        {
          icon: "video",
          kicker: "Watch it back",
          title: "The session recording",
          body: "All three hours, start to finish. Watch it when you want a part again, or to catch what you missed live.",
          image: "assets/recording-cover.png", poster: true, posterIcon: "play",
          href: "https://youtu.be/nrICIktkTO8",
          cta: "Watch the recording",
          note: "It's a private video. Open it signed in to the Google account we shared it with.",
        },
      ],
    },

    /* 1c — How today runs (deck slide 3). The orientation tiles: the shape of
       the session before any of the detail. Sits directly after the kit so a
       student gets the shape of the day early. Reuses the crew three-card
       recipe (.grid--3 + .card), no new component. */
    howToday: {
      kicker: "The shape of the session",
      title: "How the session is structured",
      subtitle: "Three parts, in this order.",
      tiles: [
        { icon: "brain", title: "Background",
          body: "Lining up on the words and what they mean, so nothing later needs explaining twice." },
        { icon: "users", title: "Meet your agents",
          body: "Opening the kit, meeting the three teammates inside, and seeing the shared brain that keeps them working from one picture." },
        { icon: "flow", title: "See it connect",
          body: "Building the first page, and watching the work move from one teammate to the next." },
      ],
      closing: "That is the whole session. What you build with the team after it stays yours.",
    },

    /* 2 — By the end of today (three parts). */
    end: {
      kicker: "The outcome",
      title: "What the workshop adds up to",
      subtitle:
        "Two things you walk away with, and one you take home to finish.",
      team: {
        kicker: "Put the team to work",
        title: "Three teammates you direct",
        teammates: [
          { name: "Your Technical Lead", charter: "Technical partner", body: "Makes the scary parts disappear." },
          { name: "Your Product Manager", charter: "Product partner", body: "Keeps you sharp and focused." },
          { name: "Your Product Designer", charter: "Design partner", body: "An extension of your own craft, growing with you." },
        ],
      },
      foundation: {
        kicker: "Your first landing page",
        title: "A first version, live in your browser",
        body:
          "A one-page landing that teases a product idea: a title, a description, a light visual touch, and a field that collects emails. Built in the design language you picked.",
      },
      home: {
        tag: "Home assignment",
        title: "Then, you take it home",
        body:
          "With your Technical Lead beside you, you finish the page, connect the email field to a real list, set up GitHub, get a domain and publish it.",
      },
    },

    /* 3 — The agent anatomy (deck slides 7 and 8). REPLACED the old narrowing-
       focus section 2026-08-27: the page taught "narrow the AI" while the deck
       teaches the anatomy in that slot, and the closing exercise now asks each
       student to WRITE an agent's job, character and skills. This section is
       where those words come from, so it is preparation, not background.
       Two groups, rendered as two clusters of the existing numbered stage list.
       Numbering runs 1..6 straight through both groups on purpose: it makes the
       point that Memory appears twice, once native and once ours. */
    technical: {
      kicker: "What an agent is",
      title: "The agent anatomy",
      subtitle: "What every agent already has, and the layers we add. You write these same lines yourself for a teammate of your own, in the recruiting step below.",
      groups: [
        {
          heading: "Native to the agent",
          stages: [
            { title: "Role", body: "the one job it does" },
            { title: "Memory", body: "what it keeps on its own" },
            { title: "Skills", body: "a playbook it can run" },
            { title: "Scheduling", body: "work that runs on a clock" },
          ],
        },
        {
          heading: "The layers we add",
          stages: [
            { title: "Soul", body: "who it is, not what it does" },
            { title: "Memory", body: "what we decide it remembers" },
          ],
        },
      ],
      closing: [
        "Take one away, and it is just a model again.",
        "Not the model. What it knows when you ask.",
      ],
    },

    /* 4b — The shared brain (M3): how the files connect (diagram section). */
    sharedBrain: {
      kicker: "The shared brain",
      title: "How your whole team works from one picture",
      subtitle:
        "Your agents are not separate chats. They share one memory, so the team always works from the same picture, and every decision stays saved.",
      body:
        "Every agent has its own files: a role that says what it does, a character that says who it is, the skills it can run, and a memory of its own. Above them all sits one shared brain that every agent reads and writes, and a learning log where the team records what worked. Here is how it all connects.",
      nodes: {
        agent: "Agent",
        role: "Role",
        character: "Character",
        skills: "Skills",
        memory: "Memory",
        sharedBrain: "Shared brain",
        rules: "Rules",
        roles: "Roles",
      },
    },

    /* 4c — The three agents that ship inside the kit. */
    crew: {
      kicker: "Your team",
      title: "Meet the team you will work with",
      subtitle: "Three in the kit. The same pattern adds a fourth whenever you need one.",
      members: [
        { icon: "laptop", role: "Technical Lead", tag: "Your technical partner",
          body: "Holds the tools, and is the only one that builds the other agents.",
          badges: ["DESCRIPTION", "SOUL", "MEMORY", "SKILLS"] },
        { icon: "flow", role: "Product Manager", tag: "Your product partner",
          body: "Decides what is in version one, and what waits.",
          badges: ["DESCRIPTION", "SOUL", "MEMORY", "SKILLS"] },
        { icon: "spark", role: "Product Designer", tag: "Your design partner",
          body: "Sets the look, and writes it down.",
          badges: ["DESCRIPTION", "SOUL", "MEMORY", "SKILLS"] },
      ],
      closing: "All three come inside the kit, already built. You direct them, and when a job starts repeating you add a fourth the same way.",
    },

    /* 5 — The session flow. REWRITTEN 2026-08-27 (Dean) from deck.json slides
       10 and 12 and 14-18, replacing the abandoned 10-step build-from-nothing
       sequence that named a CTO and a CPO. Every prompt body is byte-identical
       to its slide. Each step carries what should come back (`note`) so the page
       works when it is read alone, months later, with nobody to ask. */
    plan: {
      kicker: "The flow",
      title: "The whole session, start to finish",
      subtitle: "Open a new conversation before every step. That one habit prevents most of what goes wrong.",
      steps: [
        {
          n: "00",
          title: "Getting set up",
          body: "The tools the whole method runs on. About 15-20 minutes the first time. Worth re-checking if you are picking this up again on a new machine.",
          checklist: [
            { name: "Create a Claude Pro account", tag: "$20 / mo", note: 'Not optional: Claude Code does not run on the free plan. Sign up at <a class="plink" dir="ltr" href="https://claude.ai/upgrade" target="_blank" rel="noopener">claude.ai/upgrade</a>.' },
            { name: "Claude desktop app", note: 'Download from <a class="plink" dir="ltr" href="https://claude.com/download" target="_blank" rel="noopener">claude.com/download</a> and install it. The desktop app, not the terminal. No code.' },
            { name: "Download and unzip the kit", tag: "Above", note: "product-lab.zip is at the top of this page. Unzip it into your Documents folder. If your Documents sits inside OneDrive or iCloud, use your home folder instead." },
            { name: "Windows only: Git", tag: "Windows", note: 'Install from <a class="plink" dir="ltr" href="https://git-scm.com/downloads" target="_blank" rel="noopener">git-scm.com/downloads</a>, then close and reopen the Claude app. On a Mac, skip this one.' },
            { name: "Come with a fresh usage window", note: "Claude Pro caps usage weekly, shared across everything on your account, and there is no way to see your headroom in advance. Go easy on other Claude work the day before." },
          ],
        },
        {
          n: "01",
          title: "Open the kit and check your team",
          body: "Point Claude at the kit folder, then ask it whether the team is really there. One command, and you know whether the rest of the day will work.",
          note: "In Claude: the Code tab, then Local, then Select folder, and pick your product-lab folder. Say yes when it asks whether you trust it.",
          prompts: [
            { key: "check", label: "Type this", intro: "You should get back STATUS: PERFECT and three teammates. If you do not, stop here and message me instead of pushing on." },
          ],
        },
        {
          n: "02",
          title: "Brief your Product Manager",
          body: "Tell it what you want to build. It decides what belongs in version one, and what waits.",
          note: "What comes back: a short list of what the page needs (always an email capture, plus one or two more elements if they genuinely fit), and a line sending you on to the designer. No clarifying questions, no roadmap talk. It just answers.",
          prompts: [
            { key: "pmOpen", label: "1. Open a new conversation, then type", intro: "Click New first. Every step starts in its own conversation." },
            { key: "pmBrief", label: "2. Then, in the same conversation", intro: "Replace what is in the brackets with your own idea: what your site, tool or app is, and who it is for." },
          ],
        },
        {
          n: "03",
          title: "Your Designer shows you three real styles",
          body: "Three references, prepared in advance, so choosing a direction is a decision and not a shrug.",
          note: "What comes back: one short line confirming what is being built, then exactly three links - Arc, Cohere and Stripe x A24. Open all three, then reply with your pick. For example: I like Cohere.",
          prompts: [
            { key: "pdOpen", label: "1. New conversation, then type", intro: "Click New again." },
            { key: "pdBrief", label: "2. Then, in the same conversation", intro: "Deliberately explicit, so it shows you the three it prepared instead of inventing three new ones." },
          ],
        },
        {
          n: "04",
          title: "Your Technical Lead builds the page",
          body: "The one teammate that holds the tools. It reads the plan and the design direction, and builds.",
          note: "What comes back: a short report and a clickable link to your page, plus the plain file path as a fallback. Click it and the page opens in your browser.",
          prompts: [
            { key: "tlOpen", label: "1. New conversation, then type", intro: "Click New." },
            { key: "tlBuild", label: "2. Then, in the same conversation", intro: "You do not have to tell it the details. They are already in the shared brain, which is the whole point." },
          ],
        },
        {
          n: "05",
          title: "Recruit the teammate you are missing",
          body: "The pattern is the point. A job starts repeating, so you add a teammate for it, and your Technical Lead is the one that builds them. This one nobody writes for you.",
          note: "What comes back: one message with three questions - their one job, their character, and anything else they would need. Answer all three in a single reply, in your own words. What you wrote in the survey belongs here.",
          prompts: [
            { key: "tlOpen", label: "1. New conversation, then type", intro: "Back to your Technical Lead. It is the only one that can build another teammate." },
            { key: "recruitAsk", label: "2. Then, in the same conversation", intro: "Notice what it does not say: who they are. That part is yours." },
          ],
        },
        {
          n: "06",
          title: "Your new teammate weighs in on what you built",
          body: "Before it says anything of its own, it asks each of your other teammates what they see from where they sit. Only then does it form a view.",
          note: "What comes back: the calls firing one by one as it consults each teammate, then a single answer in its own voice - what it would change, why, and which teammate moved it. One thing to expect: a teammate answering as a helper does not stream its own thinking into your chat. You see the call and the answer, not the conversation in between.",
          prompts: [
            { key: "newOpen", label: "1. New conversation, then type", intro: "Use whatever name you gave them. This line is different for everyone." },
            { key: "weighIn", label: "2. Then, in the same conversation", intro: "It consults before it concludes. That is the part to watch." },
          ],
        },
        {
          n: "07",
          title: "Your team remembers",
          body: "At the end of a session, ask your agents to wrap up: what they did, what changed, what is next. Each one writes it into its own memory and into the shared brain. The decisions survive with it, including the design you chose and why.",
          note: "Close everything, come back next week, and they pick up where they stopped. You do not explain yourself twice. That is the difference between a chat you had and a team you have.",
          prompts: [
            { key: "wrapup", label: "Type this before you close", intro: "One command, at the end of any session. Without it, none of the rest carries over." },
          ],
        },
        {
          n: "08",
          title: "Take it home: make the page real",
          body: "Finish the checklist with your Product Manager. The next two items are already written down. Connect the email field to something real, so an address actually lands somewhere. Then put it online: an account, a page, and a domain when you want one.",
          note: "Ask your Technical Lead to walk you through each step. It holds the whole blueprint, and it still remembers the session.",
        },
      ],
      closing: "A page, and a team you keep. The page is an afternoon's work. The team is what stays with you.",
    },

  };

  /* ---- HEBREW content model (Copywriter, approved parity, dash-clean) --- */
  const HE = {
    /* 1 — כותרת עמוד פשוטה ופונקציונלית (ללא hero: בלי קיקר, בלי גוף שיווקי, בלי CTA). */
    hero: {
      title: "המרחב שלכם ב-Product Lab",
    },

    /* 1b — הערכה והמצגת. ראשונות בעמוד ולא מקופלות. */
    kit: {
      kicker: "מתחילים כאן",
      title: "הערכה שלכם, והמצגת",
      subtitle: "שני הדברים שנשארים לכם מהסדנה. שניהם יושבים כאן בעמוד, אז תחזרו אליהם מתי שתצטרכו.",
      items: [
        {
          icon: "box",
          kicker: "הורדה",
          image: "assets/kit-page-cover.jpg",
          title: "ערכת Product Lab",
          body: "שלושת חברי הצוות שלכם, המוח המשותף שהם כותבים אליו, והכישורים שהם עובדים לפיהם. פורסים את הקובץ לתיקיית Documents ומכוונים לשם את Claude. זה אותו קובץ שקיבלתם לפני המפגש.",
          href: "assets/product-lab.zip", download: true,
          cta: "הורדת product-lab.zip",
          note: "חריג אחד: אם תיקיית Documents שלכם יושבת בתוך OneDrive או iCloud, שימו את הערכה בתיקיית הבית במקום.",
        },
        {
          icon: "slides",
          kicker: "שקופית אחרי שקופית",
          title: "מצגת הסדנה",
          body: "כל השקופיות מהמפגש, לפי הסדר. פותחים אותה כשרוצים להיזכר במבנה של היום, או במשפט ההוא שנשאר לכם חצי בראש.",
          /* See the EN twin: slide 1 as a static image, never a live embed. */
          image: "assets/deck-cover.jpg",
          href: "https://docs.google.com/presentation/d/1HnbNtSQ8M8OR_GanBl3O87OhERgupUYj_mI7isHv90w/preview",
          cta: "פתיחת המצגת",
        },
        {
          icon: "video",
          kicker: "צפייה חוזרת",
          title: "הקלטת הסדנה",
          body: "שלוש השעות המלאות, מההתחלה ועד הסוף. צופים בה כשרוצים לראות חלק שוב, או לתפוס את מה שפספסתם בזמן אמת.",
          image: "assets/recording-cover.png", poster: true, posterIcon: "play",
          href: "https://youtu.be/nrICIktkTO8",
          cta: "צפייה בהקלטה",
          note: "זה סרטון פרטי. פותחים אותו כשמחוברים לחשבון Google שאיתו שיתפנו אותו.",
        },
      ],
    },

    /* 1c — איך היום עובד (שקופית 3 במצגת). */
    howToday: {
      kicker: "המבנה של הסדנה",
      title: "איך הסדנה בנויה",
      subtitle: "שלושה חלקים, בסדר הזה.",
      tiles: [
        { icon: "brain", title: "רקע",
          body: "מיישרים קו על המילים ועל מה שהן אומרות, כדי שבהמשך לא נצטרך להסביר שום דבר פעמיים." },
        { icon: "users", title: "מכירים את הסוכנים",
          body: "פותחים את הערכה, מכירים את שלושת חברי הצוות שבפנים, ורואים את המוח המשותף שמחזיק את כולם על אותה תמונה." },
        { icon: "flow", title: "רואים את זה מתחבר",
          body: "בונים את העמוד הראשון, ורואים את העבודה עוברת מחבר צוות אחד לשני." },
      ],
      closing: "זה כל הסדנה. מה שתבנו עם הצוות אחריה, כבר שלכם.",
    },

    /* 2 — עד סוף היום (שלושה חלקים). */
    end: {
      kicker: "התוצאה",
      title: "מה נשאר בסוף הסדנה",
      subtitle:
        "שני דברים שאתם לוקחים איתכם, ואחד שתסיימו בבית.",
      team: {
        kicker: "מפעילים את הצוות",
        title: "שלושה שותפים שאתם מנהלים",
        teammates: [
          { name: "ה-Technical Lead שלכם", charter: "שותף טכני", body: "גורם לחלקים המפחידים פשוט להיעלם." },
          { name: "ה-Product Manager שלכם", charter: "שותף למוצר", body: "שומר אתכם חדים וממוקדים." },
          { name: "ה-Product Designer שלכם", charter: "שותף לעיצוב", body: "המשך ישיר של האומנות שלכם, שממשיכה לצמוח יחד אתכם." },
        ],
      },
      foundation: {
        kicker: "דף הנחיתה הראשון שלכם",
        title: "גרסה ראשונה, חיה בדפדפן שלכם",
        body:
          "דף נחיתה אחד שמציג רעיון למוצר: כותרת, תיאור, נגיעה ויזואלית קטנה, ושדה שאוסף מיילים. בנוי בשפת העיצוב שבחרתם.",
      },
      home: {
        tag: "משימת בית",
        title: "ואז לוקחים את זה הביתה",
        body:
          "עם ה-Technical Lead שלכם לצידכם, תסיימו את הדף, תחברו את שדה המיילים לרשימה אמיתית, תקימו GitHub, תשיגו דומיין ותפרסמו אותו.",
      },
    },

    /* 3 — האנטומיה של סוכן (שקופיות 7 ו-8 במצגת). החליף את מקטע המיקוד הישן. */
    technical: {
      kicker: "מה זה סוכן",
      title: "האנטומיה של סוכן",
      subtitle: "מה שלכל סוכן כבר יש, והשכבות שאנחנו מוסיפים. את אותן שורות תכתבו בעצמכם לחבר צוות משלכם, בשלב הגיוס בהמשך.",
      groups: [
        {
          heading: "מובנה בסוכן",
          stages: [
            { title: "תפקיד", body: "העבודה האחת שהוא עושה" },
            { title: "זיכרון", body: "מה שהוא שומר לבד" },
            { title: "כישורים", body: "שיטת עבודה מוכנה שהוא מפעיל" },
            { title: "תזמון", body: "עבודה שרצה לפי שעון" },
          ],
        },
        {
          heading: "השכבות שאנחנו מוסיפים",
          stages: [
            { title: "נשמה", body: "מי הוא, לא מה הוא עושה" },
            { title: "זיכרון", body: "מה שאנחנו מחליטים שהוא יזכור" },
          ],
        },
      ],
      closing: [
        "מורידים אחד מהם, וזה שוב סתם מודל.",
        "לא המודל. מה שהוא יודע כשאתם שואלים.",
      ],
    },

    /* 4b — המוח המשותף (M3): איך הקבצים מתחברים (מקטע הדיאגרמה). */
    sharedBrain: {
      kicker: "המוח המשותף",
      title: "איך כל הצוות עובד מאותה תמונה",
      subtitle:
        "הסוכנים שלכם הם לא צ'אטים נפרדים. הם חולקים זיכרון אחד, כך שהצוות תמיד עובד מאותה תמונה, וכל החלטה נשמרת.",
      body:
        "לכל סוכן יש קבצים משלו: תפקיד שאומר מה הוא עושה, אופי שאומר מי הוא, הכישורים שהוא יכול להפעיל, וזיכרון משלו. מעל כולם יושב מוח משותף אחד שכל סוכן קורא וכותב בו, ויומן למידה שבו הצוות מתעד מה עבד. הנה איך הכול מתחבר.",
      nodes: {
        agent: "סוכן",
        role: "תפקיד",
        character: "אופי",
        skills: "כישורים",
        memory: "זיכרון",
        sharedBrain: "מוח משותף",
        rules: "חוקים",
        roles: "תפקידים",
      },
    },

    /* 4c — שלושת הסוכנים שמגיעים בתוך הערכה. */
    crew: {
      kicker: "הצוות שלכם",
      title: "הכירו את הצוות שתעבדו איתו",
      subtitle: "שלושה בערכה. באותה שיטה מוסיפים רביעי מתי שצריך.",
      members: [
        { icon: "laptop", role: "Technical Lead", tag: "השותף הטכני שלכם",
          body: "מחזיק את הכלים, והיחיד שבונה סוכנים נוספים.",
          badges: ["תיאור", "נשמה", "זיכרון", "כישורים"] },
        { icon: "flow", role: "Product Manager", tag: "השותף שלכם למוצר",
          body: "מחליט מה נכנס לגרסה הראשונה, ומה מחכה.",
          badges: ["תיאור", "נשמה", "זיכרון", "כישורים"] },
        { icon: "spark", role: "Product Designer", tag: "השותף שלכם לעיצוב",
          body: "קובע את המראה, ומעלה אותו על הכתב.",
          badges: ["תיאור", "נשמה", "זיכרון", "כישורים"] },
      ],
      closing: "כל השלושה כבר בנויים בתוך הערכה. אתם מנהלים אותם, וכשעבודה מתחילה לחזור על עצמה מוסיפים רביעי בדיוק באותה דרך.",
    },

    /* 5 — הזרימה של המפגש. נכתב מחדש 2026-08-27 (Dean) מתוך deck.json. */
    plan: {
      kicker: "המהלך",
      title: "כל המפגש, מההתחלה עד הסוף",
      subtitle: "פותחים שיחה חדשה לפני כל שלב. ההרגל האחד הזה מונע את רוב מה שמשתבש.",
      steps: [
        {
          n: "00",
          title: "מסדרים את הכלים",
          body: "הכלים שכל השיטה רצה עליהם. בערך 15-20 דקות בפעם הראשונה. שווה לבדוק שוב אם חוזרים לזה על מחשב חדש.",
          checklist: [
            { name: "פתיחת חשבון Claude Pro", tag: "20 דולר לחודש", note: 'לא אופציונלי: Claude Code לא רץ בגרסה החינמית. נרשמים ב-<a class="plink" dir="ltr" href="https://claude.ai/upgrade" target="_blank" rel="noopener">claude.ai/upgrade</a>.' },
            { name: "אפליקציית Claude לדסקטופ", note: 'מורידים מ-<a class="plink" dir="ltr" href="https://claude.com/download" target="_blank" rel="noopener">claude.com/download</a> ומתקינים. אפליקציית הדסקטופ, לא הטרמינל. בלי קוד.' },
            { name: "הורדה ופריסה של הערכה", tag: "למעלה", note: "product-lab.zip נמצא בראש העמוד. פורסים אותו לתיקיית Documents. אם ה-Documents שלכם יושב בתוך OneDrive או iCloud, השתמשו בתיקיית הבית במקום." },
            { name: "Windows בלבד: Git", tag: "Windows", note: 'מתקינים מ-<a class="plink" dir="ltr" href="https://git-scm.com/downloads" target="_blank" rel="noopener">git-scm.com/downloads</a>, ואז סוגרים ופותחים מחדש את אפליקציית Claude. על Mac, מדלגים על זה.' },
            { name: "להגיע עם חלון שימוש פנוי", note: "ל-Claude Pro יש תקרת שימוש שבועית, משותפת לכל מה שקורה בחשבון, ואין דרך לראות מראש כמה נשאר. אז ביום שלפני, כדאי ללכת בקטנה עם Claude." },
          ],
        },
        {
          n: "01",
          title: "פותחים את הערכה ובודקים את הצוות",
          body: "מכוונים את Claude לתיקיית הערכה, ואז שואלים אותו אם הצוות באמת שם. פקודה אחת, ואתם יודעים אם כל השאר יעבוד.",
          note: "בתוך Claude: לשונית Code, ואז Local, ואז Select folder, ובוחרים את תיקיית product-lab. כששואלים אם אתם סומכים על התיקייה, עונים כן.",
          prompts: [
            { key: "check", label: "מקלידים את זה", intro: "אמורים לחזור אליכם STATUS: PERFECT ושלושה חברי צוות. אם לא, עוצרים כאן וכותבים לי במקום להמשיך הלאה." },
          ],
        },
        {
          n: "02",
          title: "מתדרכים את ה-Product Manager",
          body: "מספרים לו מה אתם רוצים לבנות. הוא מחליט מה נכנס לגרסה הראשונה, ומה מחכה.",
          note: "מה אמור לחזור: רשימה קצרה של מה שהעמוד צריך לכלול (תמיד איסוף אימייל, ועוד אלמנט או שניים אם הם באמת מתאימים), ושורה ששולחת אתכם למעצב. בלי שאלות הבהרה, בלי רודמאפ. פשוט תשובה.",
          prompts: [
            { key: "pmOpen", label: "1. פותחים שיחה חדשה, ומקלידים", intro: "קודם לוחצים New. כל שלב מתחיל בשיחה משלו." },
            { key: "pmBrief", label: "2. ואז, באותה שיחה", intro: "מחליפים את מה שבסוגריים ברעיון שלכם: מה האתר, הכלי או האפליקציה שלכם, ולמי הם מיועדים." },
          ],
        },
        {
          n: "03",
          title: "המעצב שלכם מציג שלושה סגנונות אמיתיים",
          body: "שלושה רפרנסים, שהוכנו מראש, כדי שבחירת כיוון תהיה החלטה ולא משיכת כתפיים.",
          note: "מה אמור לחזור: שורה קצרה שמאשרת מה נבנה, ואז בדיוק שלושה קישורים - Arc, Cohere ו-Stripe x A24. פותחים את שלושתם, ואז עונים עם הבחירה שלכם. למשל: I like Cohere.",
          prompts: [
            { key: "pdOpen", label: "1. שיחה חדשה, ומקלידים", intro: "לוחצים New שוב." },
            { key: "pdBrief", label: "2. ואז, באותה שיחה", intro: "מפורט בכוונה, כדי שיראה לכם את שלושת הרפרנסים שהוא הכין ולא ימציא שלושה חדשים." },
          ],
        },
        {
          n: "04",
          title: "ה-Technical Lead בונה את העמוד",
          body: "חבר הצוות היחיד שמחזיק את הכלים. הוא קורא את התוכנית ואת כיוון העיצוב, ובונה.",
          note: "מה אמור לחזור: דוח קצר וקישור לחיץ לעמוד שלכם, ובנוסף הנתיב לקובץ כגיבוי. לוחצים, והעמוד נפתח בדפדפן.",
          prompts: [
            { key: "tlOpen", label: "1. שיחה חדשה, ומקלידים", intro: "לוחצים New." },
            { key: "tlBuild", label: "2. ואז, באותה שיחה", intro: "לא צריך לספר לו את הפרטים. הם כבר במוח המשותף, וזו כל הנקודה." },
          ],
        },
        {
          n: "05",
          title: "מגייסים את חבר הצוות שחסר לכם",
          body: "התבנית היא העיקר. יש עבודה שחוזרת על עצמה, אז מוסיפים בשבילה חבר צוות, וה-Technical Lead הוא זה שבונה אותו. את זה כבר אף אחד לא כותב בשבילכם.",
          note: "מה אמור לחזור: הודעה אחת עם שלוש שאלות - מה התפקיד האחד שלו, מה האופי שלו, ומה עוד הוא צריך. עונים על שלושתן בתשובה אחת, במילים שלכם. מה שכתבתם בשאלון שייך בדיוק לכאן.",
          prompts: [
            { key: "tlOpen", label: "1. שיחה חדשה, ומקלידים", intro: "חוזרים ל-Technical Lead. הוא היחיד שיכול לבנות חבר צוות נוסף." },
            { key: "recruitAsk", label: "2. ואז, באותה שיחה", intro: "שימו לב למה שלא כתוב שם: מי הוא. החלק הזה שלכם." },
          ],
        },
        {
          n: "06",
          title: "חבר הצוות החדש אומר את דעתו על מה שבניתם",
          body: "לפני שהוא אומר משהו משלו, הוא שואל כל אחד מחברי הצוות האחרים מה הוא רואה מהמקום שלו. רק אז הוא מגבש דעה.",
          note: "מה אמור לחזור: רואים את הקריאות יוצאות אחת אחרי השנייה כשהוא מתייעץ עם כל אחד, ואז תשובה אחת בקול שלו - מה הוא היה משנה, למה, ומי שינה לו את הדעה. כדאי לדעת מראש: חבר צוות שנקרא לעזור לא משדר את החשיבה שלו לצ׳אט שלכם. רואים את הקריאה ואת התשובה, לא את השיחה שביניהן.",
          prompts: [
            { key: "newOpen", label: "1. שיחה חדשה, ומקלידים", intro: "משתמשים בשם שנתתם לו. השורה הזאת שונה אצל כל אחד." },
            { key: "weighIn", label: "2. ואז, באותה שיחה", intro: "הוא מתייעץ לפני שהוא מסכם. זה החלק ששווה להסתכל עליו." },
          ],
        },
        {
          n: "07",
          title: "הצוות שלכם זוכר",
          body: "בסוף מפגש, מבקשים מהסוכנים לסכם: מה הם עשו, מה השתנה, ומה הלאה. כל אחד כותב את זה לזיכרון שלו ולמוח המשותף. ההחלטות שורדות איתו, כולל העיצוב שבחרתם ולמה.",
          note: "סוגרים הכול, חוזרים בשבוע הבא, והם ממשיכים מאיפה שעצרו. לא צריך להסביר את עצמכם פעמיים. זה ההבדל בין צ׳אט שהיה לכם לבין צוות שיש לכם.",
          prompts: [
            { key: "wrapup", label: "מקלידים לפני שסוגרים", intro: "פקודה אחת, בסוף כל מפגש. בלעדיה שום דבר ממה שקרה לא ממשיך הלאה." },
          ],
        },
        {
          n: "08",
          title: "לוקחים הביתה: להפוך את העמוד לאמיתי",
          body: "מסיימים את הרשימה עם ה-Product Manager. שני הסעיפים הבאים כבר כתובים שם. מחברים את שדה האימייל למשהו אמיתי, כדי שכתובת באמת תגיע לאנשהו. ואז מעלים לאוויר: חשבון, עמוד, ודומיין כשתרצו.",
          note: "בקשו מה-Technical Lead ללוות אתכם שלב שלב. הוא מחזיק את כל התוכנית, והוא עדיין זוכר את הסדנה.",
        },
      ],
      closing: "עמוד, וצוות שנשאר אתכם. העמוד הוא עבודה של אחר צהריים אחד. הצוות הוא מה שנשאר.",
    },

  };

  /* ---- The exported model app.js renders ------------------------------- */
  return {
    prompts: PROMPTS,
    en: EN,
    he: HE,
  };
})();
