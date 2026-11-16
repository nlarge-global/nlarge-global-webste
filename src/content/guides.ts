export type GuideSection = {
  heading: string;
  paragraphs: string[];
  points?: string[];
};

export type Guide = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  lastModified: string;
  sections: GuideSection[];
};

export const guides: Guide[] = [
  {
    slug: "website-maintenance-checklist",
    title: "What does website maintenance include?",
    description:
      "A practical website maintenance checklist covering updates, backups, security, forms, and the difference between hosting and ongoing support.",
    publishedAt: "2026-11-16",
    lastModified: "2026-11-16",
    sections: [
      {
        heading: "Maintenance is more than keeping a site online",
        paragraphs: [
          "Hosting provides the infrastructure that serves a website. Maintenance is the ongoing work of keeping the site, its software, and its important user journeys working as they change. The right maintenance scope depends on the platform, how it is used, and who is responsible for each part.",
          "A site that accepts enquiries, payments, bookings, or account logins needs checks that match those functions. A static information site has different risks and may need less frequent hands-on work.",
        ],
      },
      {
        heading: "A useful maintenance checklist",
        paragraphs: [
          "Agree on a routine that names the work, who handles it, and how urgent problems are reported. For software updates, plan a safe way to check important pages and integrations after changes.",
        ],
        points: [
          "Apply supported platform and dependency updates, after checking compatibility.",
          "Keep backups and periodically confirm that a restore can be completed.",
          "Test contact forms, key links, payments, bookings, and other critical flows.",
          "Review availability, errors, certificates, and domain renewal responsibilities.",
          "Check page speed and mobile usability when the site or its content changes.",
          "Document who owns hosting, domain, source code, accounts, and recovery access.",
        ],
      },
      {
        heading: "Choose support that matches your needs",
        paragraphs: [
          "Before agreeing to a maintenance plan, ask what is included, what counts as an urgent issue, how response times are handled, whether hosting is separate, and how extra feature work is estimated. A clear scope helps distinguish routine care from a redesign or a larger development project.",
          "If a website has recurring errors, outdated dependencies, broken forms, or unclear ownership, start with an assessment and a prioritized repair list rather than changing everything at once.",
        ],
      },
    ],
  },
  {
    slug: "taking-over-an-existing-codebase",
    title: "Can a developer take over an existing codebase?",
    description:
      "How to prepare for a developer to take over an existing website or app, review access safely, and prioritize improvements without disrupting users.",
    publishedAt: "2026-11-16",
    lastModified: "2026-11-16",
    sections: [
      {
        heading: "Yes, but begin with ownership and access",
        paragraphs: [
          "A new developer can often continue an existing website or application. First confirm that you or your business is entitled to provide the source code and grant access to the relevant accounts, repositories, and third-party services. Check any previous development agreement or software license if ownership is unclear.",
          "Do not send passwords, API keys, or production secrets in ordinary email or chat. Use a secure, access-controlled sharing method, grant only the permissions needed, and remove temporary access when the work ends.",
        ],
      },
      {
        heading: "What to gather before the assessment",
        paragraphs: [
          "A short handover can save investigation time. You do not need to understand every technical detail; collect the information and let the developer identify what is missing.",
        ],
        points: [
          "The source-code repository and instructions for running the project.",
          "Hosting, domain, database, email, payment, and API services involved.",
          "A list of known bugs, requested features, and pages that matter most.",
          "Recent backups and a contact who can approve safe changes.",
          "Any setup notes, designs, contracts, licenses, and deployment instructions.",
        ],
      },
      {
        heading: "Review before making production changes",
        paragraphs: [
          "A responsible takeover starts by understanding the app, its dependencies, deployment process, data, and current failure points. Ask for findings and priorities before authorizing a broad rewrite. Make a backup and agree how changes will be tested and released.",
          "The first useful outcome may be a small repair, a reliable deployment, or a scoped improvement plan. Replacing the whole platform is only one possible option, not the default.",
        ],
      },
    ],
  },
  {
    slug: "why-is-my-website-slow",
    title: "Why is my website slow, and what should I check?",
    description:
      "A practical way to investigate a slow website: test real pages and devices, then check images, scripts, hosting, APIs, and third-party services.",
    publishedAt: "2026-11-16",
    lastModified: "2026-11-16",
    sections: [
      {
        heading: "Find out where and when it feels slow",
        paragraphs: [
          "Start with the exact page and action that feels slow. Test it on a phone as well as a desktop, and note the network, browser, and time. A homepage that loads slowly, a search that waits on an API, and a form that takes too long to submit can have different causes.",
          "Use repeatable measurements and compare the same pages before and after a change. One speed score is a useful clue, but it does not explain the whole user experience or guarantee how every visitor's device and connection will perform.",
        ],
      },
      {
        heading: "Check common causes in a sensible order",
        paragraphs: [
          "Begin with issues that are common and visible, then investigate server and application behavior if those checks do not explain the delay.",
        ],
        points: [
          "Large images or video that are not sized and delivered appropriately.",
          "Too much JavaScript, unused code, or scripts that block the first interaction.",
          "Slow fonts, analytics, chat widgets, or other third-party requests.",
          "Slow database queries, APIs, or server rendering on data-heavy pages.",
          "Missing caching or inefficient delivery of static files.",
          "Layouts or interactions that wait for work that could happen later.",
        ],
      },
      {
        heading: "Fix the cause, then check the important journeys",
        paragraphs: [
          "Make one focused change at a time where possible. After each change, check the page on mobile and desktop, then test the forms, navigation, and integrations that visitors rely on. Keep a note of the measurement conditions so the comparison is meaningful.",
          "If the cause is not obvious, a technical review can trace the slow request or page section before recommending a rebuild. Avoid adding optimization plugins or scripts without knowing what they change.",
        ],
      },
    ],
  },
  {
    slug: "website-redesign-or-new-feature",
    title: "Should you redesign your website or add a new feature?",
    description:
      "A decision guide for choosing between repairing, redesigning, or extending a website or app, with planning and launch checks.",
    publishedAt: "2026-11-16",
    lastModified: "2026-11-16",
    sections: [
      {
        heading: "Start with the problem, not the solution",
        paragraphs: [
          "A visual redesign is useful when the current experience no longer supports the audience, brand, content, or way people use the site. A new feature is more appropriate when the existing product works but cannot complete a specific task users need. A bug fix or content change may be enough when the problem is narrower.",
          "Write down who has the problem, what they are trying to do, and what currently gets in their way. If available, use support enquiries, sales questions, form completion, and site analytics as evidence, while avoiding assumptions from a small number of observations.",
        ],
      },
      {
        heading: "Plan the work before choosing a build",
        paragraphs: [
          "Inventory the pages, content, integrations, and data that must continue working. Agree on the must-have outcome, what can wait, who approves the work, and how success will be checked.",
        ],
        points: [
          "Map the key user journeys and identify where they break down.",
          "List the pages, content, brand assets, and existing URLs to preserve.",
          "Check mobile layouts, accessibility needs, forms, and integrations.",
          "Define the feature scope and how it fits the current system.",
          "Set a testing, backup, launch, and rollback plan before release.",
        ],
      },
      {
        heading: "Protect discovery and search during a redesign",
        paragraphs: [
          "Keep useful page content and URLs where possible. If a URL must change, prepare a relevant permanent redirect and update internal links and the sitemap. Test important pages, metadata, forms, and mobile behavior before launch, then monitor errors and visitor enquiries afterward.",
          "A redesign can improve clarity and usability, but no design or development team can guarantee a particular search ranking, conversion rate, or amount of traffic.",
        ],
      },
    ],
  },
];
