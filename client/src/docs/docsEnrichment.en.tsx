import React from 'react';
import type { DocsArticleProps, DocSection, DocStep, DocsFaqItem } from '../components/Docs/DocsArticle';

import type { DocsPageKey } from './docsPagesShared';

type PageKey = DocsPageKey;

interface SectionDef {
  heading: string;
  paragraphs: string[];
}

interface StepDef {
  title: string;
  paragraphs: string[];
}

interface EnrichmentDef {
  context?: string;
  extraSections?: SectionDef[];
  extraSteps?: StepDef[];
  extraTips?: string[];
  faq?: { question: string; answer: string }[];
}

function paras(texts: string[]): React.ReactNode {
  return (
    <>
      {texts.map((t, i) => (
        <p key={i} className={i > 0 ? 'mt-3' : undefined}>
          {t}
        </p>
      ))}
    </>
  );
}

function toSections(defs: SectionDef[]): DocSection[] {
  return defs.map((s) => ({ heading: s.heading, body: paras(s.paragraphs) }));
}

function toSteps(defs: StepDef[]): DocStep[] {
  return defs.map((s) => ({ title: s.title, body: paras(s.paragraphs) }));
}

function toFaq(items: { question: string; answer: string }[]): DocsFaqItem[] {
  return items.map((f) => ({ question: f.question, answer: <p>{f.answer}</p> }));
}

const ENRICHMENTS: Record<PageKey, EnrichmentDef> = {
  'start/overview': {
    context:
      'This page is your starting point. Follow the left menu in order or jump to the topic you need: communities, apps, analytics. Every section describes concrete actions in the interface.',
    extraSections: [
      {
        heading: 'How long onboarding takes',
        paragraphs: [
          'Basics — registration, profile, first post — take 5–10 minutes. Launching a simple community with chat and announcements takes a few hours to one day if content is ready.',
          'You do not need to read everything at once: bookmark the section you need or use search in the docs header.',
        ],
      },
    ],
    faq: [
      {
        question: 'Do I need special experience to get started?',
        answer:
          'No. The platform works for interest clubs, learning communities, private groups, professional networks, and team spaces.',
      },
      {
        question: 'Docs are in English — what about the interface?',
        answer:
          'The main interface can be switched in the profile menu. The community owner dashboard is partly in English; button labels match the descriptions in these guides.',
      },
    ],
  },

  'start/account': {
    context:
      'Your account is your identity on the platform: feed, messages, and the ability to create communities. A complete profile builds trust and helps convert visitors into members.',
    extraSections: [
      {
        heading: 'What others see',
        paragraphs: [
          'After registration you get a public page with name, avatar, bio, and follow counts. Share it as a card in messengers, social media, or email.',
          'Email is not shown to everyone by default — it is for sign-in and appears to community owners in the members section if you joined their club.',
        ],
      },
    ],
    extraTips: [
      'Use the same avatar style on social media and MNOONX so people recognize you faster.',
      'If you forget your password, recovery uses the email from registration.',
    ],
    faq: [
      {
        question: 'Can I change my username?',
        answer:
          'Changes are limited because links depend on it. Pick a final username that matches your brand from the start.',
      },
    ],
  },

  'start/navigation': {
    context:
      'Navigation keeps the feed and communities one click away. On mobile, sections are in the bottom bar; on desktop, in the left sidebar.',
    extraSections: [
      {
        heading: 'Where to find your communities',
        paragraphs: [
          'After sign-in, My communities appears in the sidebar — quick access without browsing the catalog.',
          'You can also open a community from the owner dashboard or via the link you copy from the community page.',
        ],
      },
    ],
    faq: [
      {
        question: 'Why do I not see Create community?',
        answer: 'Make sure you are signed in. Guests can only view some public pages.',
      },
    ],
  },

  'profile/basics': {
    context:
      'Your profile is a storefront: people check it before following, links from posts land here, and direct messages start here. A filled profile builds trust in you and your communities.',
    extraSections: [
      {
        heading: 'Compact header while scrolling',
        paragraphs: [
          'While scrolling the profile feed, a compact bar with name and actions stays visible — easy to follow or message without scrolling back.',
          'On your own profile you can edit details and view activity with achievements and progress.',
        ],
      },
      {
        heading: 'Posts and media',
        paragraphs: [
          'The post composer supports multiple images, image and video links, and article link previews.',
          'Posts from a private community stay in the club context and do not appear on the home feed unless you intend them to.',
        ],
      },
    ],
    extraTips: [
      'Make your first post a welcome: who you are, what you share, and a link to your community.',
    ],
    faq: [
      {
        question: 'How is a profile different from a community?',
        answer:
          'A profile is a person’s page. A community is a separate space with its own feed, apps, and members.',
      },
    ],
  },

  'profile/connections': {
    context:
      'Follows shape your home feed. Followers are people who track you. Both are visible through counters on your profile.',
    extraSections: [
      {
        heading: 'Growing your audience',
        paragraphs: [
          'Regular posts, comments in discussions, and activity in your community bring new followers.',
          'Add your profile link to other social bios and your community description.',
        ],
      },
    ],
    faq: [
      {
        question: 'Will someone know if I unfollow?',
        answer: 'The follower count updates; there is usually no separate unfollow notification.',
      },
    ],
  },

  'community/roadmap': {
    context:
      'The roadmap keeps you focused: concept and branding first, then tools, then people. You avoid spending a day on apps before deciding public vs private access.',
    extraSections: [
      {
        heading: 'Common launch mistakes',
        paragraphs: [
          'Too many apps on day one — members get lost. Chat and announcements are enough to start.',
          'Empty feed: publish 2–3 posts and rules before promotion.',
          'Private club without an invite code — new people cannot join until you send the code manually.',
        ],
      },
    ],
    extraTips: [
      'Set dates for soft launch and public announcement — it makes content planning easier.',
    ],
  },

  'community/create': {
    context:
      'Creating a community is a one-time setup for a space that runs for months. Pick a short address like your social handle: concise and without spaces.',
    extraSections: [
      {
        heading: 'Choosing a community address',
        paragraphs: [
          'Use Latin letters and numbers, no spaces — for example my-club or brand_lab.',
          'The address appears in every link you share — changing it after launch is difficult.',
        ],
      },
      {
        heading: 'Create wizard options',
        paragraphs: [
          'The wizard uses different prompts for Personal and Business paths, but both create the same type of community. Pick the path with questions that feel clearer to you.',
        ],
      },
    ],
    faq: [
      {
        question: 'How many communities can I create?',
        answer:
          'There is usually no hard limit, but one main club plus an optional test community is easier to run well.',
      },
    ],
  },

  'community/access': {
    context:
      'Access settings define the feel of your club: open plaza or closed core. You can change them later, but switching from public to private suddenly confuses existing members.',
    extraSections: [
      {
        heading: 'When to make a community private',
        paragraphs: [
          'Paid content, internal discussions, and closed courses are common reasons.',
          'For growth through the community catalog, a public club with a clear description and active feed works best.',
        ],
      },
      {
        heading: 'Invite code',
        paragraphs: [
          'The code is the password to join. Share it in direct messages, email, or a pinned channel post. Without it, new people only see a preview.',
        ],
      },
    ],
    faq: [
      {
        question: 'Does the catalog show that a club is private?',
        answer:
          'The community may appear in the catalog, but content inside is available only after joining and entering the code if one is enabled.',
      },
    ],
  },

  'community/branding': {
    context:
      'Visual style is the first thing people see in the catalog and on the community page. A consistent avatar and banner make the product recognizable even when the feed is empty.',
    extraSections: [
      {
        heading: 'Banner tips',
        paragraphs: [
          'Use a horizontal image without small text near the edges — mobile crops the sides.',
          'Update the banner for a season or campaign without recreating the community.',
        ],
      },
    ],
    extraTips: [
      'Match banner colors to the avatar — the page feels cohesive.',
    ],
  },

  'community/members': {
    context:
      'Members are the heart of the community. The owner sees the full list in the dashboard; regular members interact in chat and the feed.',
    extraSections: [
      {
        heading: 'Moderation and tone',
        paragraphs: [
          'Pin rules in the feed and announcements. If conflicts arise, the owner can limit posting by turning off member posts.',
          'For large clubs, assign admins with access to members and analytics.',
        ],
      },
    ],
    faq: [
      {
        question: 'How do I remove a member?',
        answer: 'Use member management in community settings or the owner dashboard.',
      },
    ],
  },

  'community/feed': {
    context:
      'The community feed is the main stage: announcements, discussions, media. It works like the home feed but content lives in your club’s context.',
    extraSections: [
      {
        heading: 'Feed content plan',
        paragraphs: [
          'Mix formats: short updates, deep dives, comment discussions, pinned rules.',
          'Public posts published as the community strengthen your brand on the home feed.',
        ],
      },
    ],
    extraTips: [
      'Reply to comments in the first hours — engagement grows when conversations stay active.',
    ],
  },

  'apps/overview': {
    context:
      'Apps turn a community page into a product: chat, courses, files, calendar. Each is installed separately; you can add multiple instances when needed.',
    extraSections: [
      {
        heading: 'Which apps to install first',
        paragraphs: [
          'Chat for daily conversation. Announcements for rules and important news. Courses or files when you have learning content.',
          'Events if you run calls, AMAs, or offline meetups.',
        ],
      },
      {
        heading: 'Visibility for members',
        paragraphs: [
          'Hide an app while you prepare a draft course, then enable visibility on launch day — in the Products section of the owner dashboard.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can I remove an app?',
        answer: 'Yes, via Products or the store. Save important materials before removing.',
      },
    ],
  },

  'apps/store': {
    context:
      'The store is a module catalog for owners only. Members see installed tabs on the community page, not the store itself.',
    extraSections: [
      {
        heading: 'Browsing categories',
        paragraphs: [
          'Core club tools, education, and themed modules are grouped by category.',
          'Use search by name when the catalog is large.',
        ],
      },
    ],
    faq: [
      {
        question: 'Are apps paid?',
        answer:
          'Each card shows a price — often free. Paid access to the community itself is configured separately in community settings.',
      },
    ],
  },

  'apps/install': {
    context:
      'Installation takes about a minute: pick an app, confirm the tab name, done. Members see that name — for example VIP Chat instead of plain Chat.',
    extraSections: [
      {
        heading: 'After installation',
        paragraphs: [
          'Open the community page and the new tab — confirm it is visible. Post a welcome in chat or your first announcement.',
          'If the tab is missing, check member visibility in product settings.',
        ],
      },
    ],
  },

  'apps/configure': {
    context:
      'Instance settings are about order and naming: two chats, a hidden course, renaming a tab to match your brand.',
    extraSections: [
      {
        heading: 'Multiple instances of the same app',
        paragraphs: [
          'Two chats work well for General and Pro-only. Two courses for beginners and advanced. Each has its own name and history.',
        ],
      },
    ],
  },

  'apps/chat': {
    context:
      'Chat makes the club feel alive. Members write in real time; the owner sets tone with the first message.',
    extraSections: [
      {
        heading: 'Chat guidelines',
        paragraphs: [
          'Repeat key rules in announcements. Large clubs assign moderators from admins.',
          'Unread messages appear on the owner dashboard — respond during activity peaks.',
        ],
      },
    ],
  },

  'apps/courses': {
    context:
      'Courses support step-by-step learning: modules, lessons, progress. Ideal for paid clubs and long programs.',
    extraSections: [
      {
        heading: 'Course structure',
        paragraphs: [
          'Start with a short intro lesson, then core modules, then a bonus or final assignment.',
          'Hide the course until launch, then enable visibility on start day.',
        ],
      },
    ],
  },

  'apps/content': {
    context:
      'The content section holds articles, guides, and long materials that should not mix with short feed posts.',
    extraSections: [
      {
        heading: 'Content vs feed',
        paragraphs: [
          'Feed — news and discussion. Content — evergreen material: getting started, FAQ, knowledge base.',
        ],
      },
    ],
  },

  'apps/files': {
    context:
      'Files store PDFs, spreadsheets, and templates. Useful for working groups and courses with downloads.',
    extraSections: [
      {
        heading: 'Organization',
        paragraphs: [
          'Use clear file names. Mention new uploads in an announcement.',
        ],
      },
    ],
  },

  'apps/announcements': {
    context:
      'Announcements carry what matters: rules, schedule changes, partnerships. They stay separate from casual chat traffic.',
    extraSections: [
      {
        heading: 'First announcement',
        paragraphs: [
          'Publish a welcome note with rules, chat links, and schedule. Update it when the season changes.',
        ],
      },
    ],
  },

  'apps/events': {
    context:
      'Events keep AMAs, calls, and deadlines visible. Members see a calendar inside the club.',
    extraSections: [
      {
        heading: 'Event types',
        paragraphs: [
          'Recurring calls, one-off AMAs, challenge deadlines — all with date and description in one place.',
        ],
      },
    ],
  },

  'dashboard/overview': {
    context:
      'The owner dashboard is your control center: settings, members, apps, and analytics without extra navigation.',
    extraSections: [
      {
        heading: 'Dashboard sections',
        paragraphs: [
          'Home — summary. Settings — name, access, payments. Members — member table. Products — apps. Analytics — charts. Invites — links for new people.',
        ],
      },
    ],
  },

  'dashboard/analytics': {
    context:
      'Analytics answers “are we growing or stalling?” Track new members and posts over 7 days and compare weeks.',
    extraSections: [
      {
        heading: 'How to respond to the numbers',
        paragraphs: [
          'Member growth without posts — schedule activity or an event. Many posts, few joins — improve description and catalog presence.',
          'Unread chat — a signal to reply or assign a moderator.',
        ],
      },
    ],
  },

  'dashboard/members': {
    context:
      'The member table shows who has been inactive, who to invite personally, and who to export for email — respecting data privacy laws.',
    extraSections: [
      {
        heading: 'Export',
        paragraphs: [
          'CSV export works for CRM and newsletters. Use it only with member consent.',
        ],
      },
    ],
  },

  'social/posts': {
    context:
      'Posts drive engagement: likes and comments show live content. Reposts spread it to follower networks.',
    extraSections: [
      {
        heading: 'Comments',
        paragraphs: [
          'Expand comments under the post or open the full post card. The author’s replies are visible to everyone in the thread.',
        ],
      },
    ],
  },

  'social/messenger': {
    context:
      'Direct messages combine member conversations and platform service channels. Open a chat from someone’s profile in one click.',
    extraSections: [
      {
        heading: 'Service chats',
        paragraphs: [
          'On first sign-in, platform and support conversations appear — use them for product questions.',
        ],
      },
    ],
  },

  'social/discover': {
    context:
      'The community catalog lists every club. A strong description, avatar, and active feed increase the chance someone clicks Join.',
    extraSections: [
      {
        heading: 'Standing out in the catalog',
        paragraphs: [
          'Clear name and niche in the description, a recent feed post, and a readable banner — three things new visitors see before joining.',
        ],
      },
    ],
  },

  'growth/strategy': {
    context:
      'Growth is rhythm, not a one-time ad. Week by week: content, events, personal invites, replies in chat.',
    extraSections: [
      {
        heading: 'Acquisition channels',
        paragraphs: [
          'Messengers, social media, email — use the same community link everywhere. Ask your core audience to share strong posts.',
        ],
      },
    ],
  },

  'growth/monetization': {
    context:
      'Monetization works when value is visible: feed content, active chat, social proof. Paid access is configured in community settings.',
    extraSections: [
      {
        heading: 'Free to paid',
        paragraphs: [
          'A common model: public area free, closed chat or courses by subscription. Announce clearly what the paid tier includes.',
        ],
      },
    ],
  },

  'growth/checklist': {
    context:
      'Run through the checklist the day before and the day of launch. Checking items reduces the risk of forgetting an invite code or hidden app.',
    extraSections: [
      {
        heading: 'After launch',
        paragraphs: [
          'In the first week, review chat, feed, and analytics daily. Adjust the content plan based on response.',
        ],
      },
    ],
  },
};

export function applyDocsEnrichmentEn(
  key: PageKey,
  base: Omit<DocsArticleProps, 'prev' | 'next'>
): Omit<DocsArticleProps, 'prev' | 'next'> {
  const extra = ENRICHMENTS[key];
  if (!extra) return base;

  const merged: Omit<DocsArticleProps, 'prev' | 'next'> = { ...base };

  if (extra.context) merged.context = extra.context;
  if (extra.extraSections?.length) {
    merged.sections = [...(base.sections ?? []), ...toSections(extra.extraSections)];
  }
  if (extra.extraSteps?.length) {
    merged.steps = [...(base.steps ?? []), ...toSteps(extra.extraSteps)];
  }
  if (extra.extraTips?.length) {
    merged.tips = [...(base.tips ?? []), ...extra.extraTips];
  }
  if (extra.faq?.length) {
    merged.faq = toFaq(extra.faq);
  }

  return merged;
}
