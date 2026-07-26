import React from 'react';
import {
  Rocket,
  Map,
  Store,
  Users,
  MessageCircle,
  BarChart3,
  Sparkles,
  UserPlus,
  Compass,
} from 'lucide-react';
import type { DocsArticleProps } from '../components/Docs/DocsArticle';
import { docsPagePath } from './docsNav';
import { DocsLink as L, DocsUl as Ul, type DocsPageKey } from './docsPagesShared';

export const PAGES_EN: Record<DocsPageKey, Omit<DocsArticleProps, 'prev' | 'next'>> = {
  'start/overview': {
    title: 'MNOONX Documentation',
    lead:
      'Step-by-step guides for founders and community managers: sign up, launch a community, install apps, and grow your audience. Start with the cards below or pick a section in the left menu.',
    showHero: true,
    sections: [
      {
        heading: 'Who this is for',
        body: (
          <>
            <p>
              This guide is for community creators, moderators, and active members who need to learn
              the platform quickly without technical jargon. We focus on concrete actions: what to
              click, what to verify before launch, and how to add chat, courses, or announcements.
            </p>
            <p className="mt-3">
              If you are new to MNOONX, read Getting Started, then Communities and Apps — most teams
              launch their first project in one to two days following that order.
            </p>
          </>
        ),
      },
      {
        heading: 'What the platform includes',
        body: (
          <>
            <p className="mb-3">
              MNOONX is a social platform for communities: learning, private clubs, professional
              groups, and team spaces.
            </p>
            <Ul
              items={[
                <>
                  <strong>Home feed</strong> — <L to="/">posts</L> from people you follow and public
                  community content.
                </>,
                <>
                  <strong>Profiles</strong> — personal pages with subscriptions, posts, and direct
                  messaging.
                </>,
                <>
                  <strong>Communities</strong> — dedicated spaces with a feed, branding, and
                  built-in apps.
                </>,
                <>
                  <strong>App store</strong> — chat, courses, files, announcements, events.
                </>,
                <>
                  <strong>Owner dashboard</strong> — analytics, members, and app management.
                </>,
                <>
                  <strong>Messages and notifications</strong> — conversations on the{' '}
                  <L to="/messenger">messages page</L> and updates on the{' '}
                  <L to="/notifications">notifications page</L>.
                </>,
              ]}
            />
          </>
        ),
      },
    ],
    cardGrids: [
      {
        title: 'Start here',
        cards: [
          {
            icon: Rocket,
            title: 'Quick start',
            description: 'From registration to your first post and platform navigation.',
            to: docsPagePath('start', 'account'),
          },
          {
            icon: Map,
            title: 'Community launch plan',
            description: 'Roadmap: concept, branding, apps, first members.',
            to: docsPagePath('community', 'roadmap'),
          },
          {
            icon: Sparkles,
            title: 'Pre-launch checklist',
            description: 'Final check: access, branding, apps, and content.',
            to: docsPagePath('growth', 'checklist'),
          },
        ],
      },
      {
        title: 'What you can do on MNOONX',
        cards: [
          {
            icon: UserPlus,
            title: 'Create a community',
            description: 'Launch a space with a unique address and access settings.',
            to: docsPagePath('community', 'create'),
          },
          {
            icon: Store,
            title: 'App store',
            description: 'Install chat, courses, files, and other modules.',
            to: docsPagePath('apps', 'store'),
          },
          {
            icon: Users,
            title: 'Members and roles',
            description: 'Invite people, set privacy, and posting permissions.',
            to: docsPagePath('community', 'members'),
          },
          {
            icon: BarChart3,
            title: 'Analytics',
            description: 'Track member growth, feed activity, and chat engagement.',
            to: docsPagePath('dashboard', 'analytics'),
          },
          {
            icon: MessageCircle,
            title: 'Direct messages',
            description: 'Message members privately and handle support conversations.',
            to: docsPagePath('social', 'messenger'),
          },
          {
            icon: Compass,
            title: 'Community catalog',
            description: 'Browse communities and join clubs that fit your interests.',
            to: docsPagePath('social', 'discover'),
          },
        ],
      },
    ],
  },

  'start/account': {
    title: 'Account and sign-in',
    lead:
      'An account unlocks posting, joining communities, direct messages, and profile settings. Some public pages are visible without signing in; most actions require registration.',
    steps: [
      {
        title: 'Registration',
        body: (
          <>
            <p>
              On the <L to="/">home feed</L> or in the site header, click Sign in or Register. Fill
              in the form:
            </p>
            <Ul
              items={[
                <>
                  <strong>Username</strong> — 3 to 30 Latin characters; used for your profile page
                  address.
                </>,
                <>
                  <strong>Email</strong> — for sign-in and account recovery.
                </>,
                <>
                  <strong>Password</strong> — at least 6 characters; store it securely.
                </>,
              ]}
            />
            <p className="mt-3">
              After registration you are signed in immediately: the home feed opens, your
              communities appear in the menu, and your profile link is ready to share with members
              and colleagues.
            </p>
          </>
        ),
      },
      {
        title: 'Sign in and sign out',
        body: (
          <>
            <p>
              On your next visit, click Sign in and enter your email or username and password. The
              platform keeps your session until you sign out manually.
            </p>
            <p className="mt-3">
              Sign out is in the profile menu. After signing out, posting, editing your profile, and
              messaging require signing in again.
            </p>
          </>
        ),
      },
      {
        title: 'Account settings',
        body: (
          <>
            <p>
              Open <L to="/settings">profile settings</L>. Here you update display name, bio, avatar,
              banner, city, and website link.
            </p>
            <p className="mt-3">
              Click Save after changes — updates appear on your profile and post cards right away.
              Fill in your avatar and a short bio before inviting your first members.
            </p>
          </>
        ),
      },
    ],
    tips: [
      'Choose a short, memorable username — it becomes part of your community address.',
      'Avoid usernames that match the names of main platform sections.',
      'One person, one account; for testing, create a separate username instead of sharing passwords.',
    ],
  },

  'start/navigation': {
    title: 'Platform navigation',
    lead:
      'On desktop, main sections are in the left sidebar; on mobile, in the bottom bar. The center shows the content of the page you selected.',
    steps: [
      {
        title: 'Home feed',
        body: (
          <>
            <p>
              The <L to="/">home feed</L> shows posts from people you follow and public community
              content. Each post has like, comment, and repost actions. The post menu lets you copy a
              link or edit and delete your own posts.
            </p>
            <p className="mt-3">
              Click a post card to open the discussion with comments in a side panel on desktop or a
              bottom sheet on mobile.
            </p>
          </>
        ),
      },
      {
        title: 'Community catalog',
        body: (
          <p>
            The <L to="/discover">community catalog</L> lists public and private communities.
            Private ones are marked separately; joining requires an invite code from the owner.
          </p>
        ),
      },
      {
        title: 'Messages and notifications',
        body: (
          <Ul
            items={[
              <>
                <L to="/messenger">Direct messages</L> — conversations with members and platform
                service channels. History is saved between visits.
              </>,
              <>
                <L to="/notifications">Notifications</L> — likes, mentions, community events, and
                system messages. The header badge shows unread items.
              </>,
            ]}
          />
        ),
      },
      {
        title: 'Creating a community',
        body: (
          <p>
            To launch your space, go to <L to="/create-community">create a community</L> or open the{' '}
            <L to="/new">Create wizard</L> — Personal and Business paths use different prompts in
            the form, but both create a new community with your chosen address.
          </p>
        ),
      },
    ],
  },

  'profile/basics': {
    title: 'Profile and feed',
    lead:
      'Your profile is your platform presence: people read your posts, follow you, and start direct messages here. A polished profile builds trust in you and the communities you lead.',
    steps: [
      {
        title: 'Open a profile',
        body: (
          <p>
            Your own profile is available after sign-in from the account menu. Other profiles are
            public; follow and message actions require authorization.
          </p>
        ),
      },
      {
        title: 'Publishing posts',
        body: (
          <p>
            On your profile, open the composer under the Posts tab: text, media, and link previews.
            Posts appear on your profile and the home feed unless they belong only to a private
            community.
          </p>
        ),
      },
      {
        title: 'Profile tabs',
        body: (
          <Ul
            items={[
              'Posts — your publications.',
              'Reposts — content you shared.',
              'Replies and media — additional profile sections.',
            ]}
          />
        ),
      },
    ],
  },

  'profile/connections': {
    title: 'Follows and connections',
    lead: 'Follows shape your feed and notifications; you can start a direct conversation from a profile.',
    steps: [
      {
        title: 'Follow and unfollow',
        body: (
          <p>
            Click Follow on someone’s profile to add them to your feed. Click again to unfollow.
            Follower and following counts update automatically.
          </p>
        ),
      },
      {
        title: 'Follower lists',
        body: (
          <p>
            On mobile, tapping Followers or Following opens a searchable list. On desktop, lists
            appear in the right column of the profile.
          </p>
        ),
      },
      {
        title: 'Send a message',
        body: (
          <p>
            Click the message icon to open a <L to="/messenger">direct conversation</L>. The profile
            menu also offers copy link, send message, report, and block.
          </p>
        ),
      },
    ],
  },

  'community/roadmap': {
    title: 'Community launch plan',
    lead:
      'A step-by-step roadmap from concept to a running community with apps and analytics.',
    steps: [
      {
        title: 'Phase 0 — Concept (1–2 days)',
        body: (
          <Ul
            items={[
              'Niche and audience: learning, private club, professional group, or project team.',
              'Short community address in Latin characters, no spaces — this goes in every link you share.',
              'Public or private community; whether you need an invite code.',
              'Starter apps: usually chat and announcements.',
            ]}
          />
        ),
      },
      {
        title: 'Phase 1 — Creation and branding',
        body: (
          <p>
            Follow the guides on{' '}
            <L to={docsPagePath('community', 'create')}>creating a community</L> and{' '}
            <L to={docsPagePath('community', 'branding')}>branding</L>. Set name, description,
            avatar, and banner before inviting the first members.
          </p>
        ),
      },
      {
        title: 'Phase 2 — Apps from the store',
        body: (
          <p>
            <L to={docsPagePath('apps', 'install')}>Install apps</L> by priority: chat for
            conversation, announcements for rules, courses and files for content.
          </p>
        ),
      },
      {
        title: 'Phase 3 — First content and members',
        body: (
          <p>
            Publish rules in the feed, invite 5–10 people, confirm who can post, and assign admins.
            See <L to={docsPagePath('community', 'members')}>community members</L> for details.
          </p>
        ),
      },
      {
        title: 'Phase 4 — Dashboard and growth',
        body: (
          <p>
            Enable <L to={docsPagePath('dashboard', 'analytics')}>analytics</L>, set up invites,
            and follow the <L to={docsPagePath('growth', 'strategy')}>growth strategy</L>.
          </p>
        ),
      },
    ],
    tips: [
      'Do not install every app on day one — start with two or three and add more when members ask.',
      'A private community without an invite code will block new members — verify settings early.',
    ],
  },

  'community/create': {
    title: 'Creating a community',
    lead:
      'Communities are created through a form; you automatically become the owner and first member.',
    steps: [
      {
        title: 'Open the creation flow',
        body: (
          <Ul
            items={[
              <>
                <L to="/create-community">Create a community</L> — main form.
              </>,
              <>
                <L to="/new">Create wizard</L> — Personal or Business path.
              </>,
              'After sign-in, the sidebar shows My communities and a create button.',
            ]}
          />
        ),
      },
      {
        title: 'Required fields',
        body: (
          <Ul
            items={[
              <>
                <strong>Name</strong> — displayed community name.
              </>,
              <>
                <strong>Address</strong> — short unique identifier for links; Latin characters, no
                spaces.
              </>,
              'Description and category — for the community catalog and member trust.',
              'Visibility: public (listed in the catalog) or private (invite only).',
            ]}
          />
        ),
      },
      {
        title: 'Save and open the page',
        body: (
          <p>
            After saving you land on your community page. As owner you see settings, the app store,
            and the owner dashboard.
          </p>
        ),
      },
      {
        title: 'Confirm permissions',
        body: (
          <p>
            Only the owner can delete the community, change critical settings, and install apps.
            Admins can be granted rights through the{' '}
            <L to={docsPagePath('dashboard', 'overview')}>owner dashboard</L>.
          </p>
        ),
      },
    ],
  },

  'community/access': {
    title: 'Access and privacy',
    lead:
      'Settings define who sees the community, who can join, and who can publish posts.',
    steps: [
      {
        title: 'Open settings',
        body: (
          <p>
            As owner, open Settings on the community page or from the owner dashboard.
          </p>
        ),
      },
      {
        title: 'Public and private',
        body: (
          <Ul
            items={[
              <>
                <strong>Public</strong> — everyone sees the page and feed; members can join without
                a code unless you add extra restrictions.
              </>,
              <>
                <strong>Private</strong> — non-members see only a short preview; an invite code or
                membership is required.
              </>,
            ]}
          />
        ),
      },
      {
        title: 'Invite code',
        body: (
          <p>
            Set an invite code in settings. When joining, members enter it in the Join dialog. Without
            the correct code, no one enters a private community — you control membership.
          </p>
        ),
      },
      {
        title: 'Who can publish',
        body: (
          <p>
            The Members can post option: when off, only the owner and assigned admins create posts.
            When on, any member can publish to the community feed.
          </p>
        ),
      },
    ],
    tips: [
      'For paid clubs, combine private access, invite codes, and paid membership — see monetization.',
    ],
  },

  'community/branding': {
    title: 'Community branding',
    lead:
      'Avatar and banner build recognition; upload a file or paste an image URL.',
    steps: [
      {
        title: 'Community avatar',
        body: (
          <p>
            On the community page, the owner opens avatar editing: upload from your computer or paste
            an image link. The avatar appears in the community header and on feed posts published as
            the community.
          </p>
        ),
      },
      {
        title: 'Banner',
        body: (
          <p>
            The banner is a wide header image. You can upload, link, or remove it. On mobile,
            editing opens in a bottom panel.
          </p>
        ),
      },
      {
        title: 'Name and description',
        body: (
          <p>
            Edit these in community settings. Change the community address carefully after launch —
            all shared links depend on it.
          </p>
        ),
      },
    ],
  },

  'community/members': {
    title: 'Community members',
    lead:
      'Members are people who joined your club. The owner sees the full list and manages access; members interact in the feed and apps.',
    steps: [
      {
        title: 'Joining',
        body: (
          <Ul
            items={[
              'In a public community, click Join on the community page — you become a member immediately.',
              'In a private community, Join opens a field for the invite code.',
              'After joining, the community appears in your menu and under My communities.',
            ]}
          />
        ),
      },
      {
        title: 'Leaving',
        body: (
          <p>
            A member can leave the community — they lose access to private content and disappear from
            the member list. The owner always remains.
          </p>
        ),
      },
      {
        title: 'Member list',
        body: (
          <p>
            The <L to={docsPagePath('dashboard', 'members')}>members section</L> of the owner
            dashboard shows email, join date, and last activity — useful for retention.
          </p>
        ),
      },
      {
        title: 'Administrators',
        body: (
          <p>
            The owner assigns admins with rights for members, analytics, and content — in dashboard
            settings.
          </p>
        ),
      },
    ],
  },

  'community/feed': {
    title: 'Community feed',
    lead:
      'The community feed works like the home feed: posts, likes, reposts, comments, and post menus.',
    steps: [
      {
        title: 'Create a community post',
        body: (
          <p>
            On the community page, open the post composer if you have permission. The post belongs to
            the club; public posts can appear under the community name and avatar.
          </p>
        ),
      },
      {
        title: 'Media and links',
        body: (
          <p>
            Upload files, paste image and video links, and add link previews for articles.
          </p>
        ),
      },
      {
        title: 'Engagement',
        body: (
          <p>
            Likes and reposts save immediately. The post menu offers a link to the post, edit, and
            delete — for the author and community owner.
          </p>
        ),
      },
    ],
  },

  'apps/overview': {
    title: 'Community apps',
    lead:
      'Apps are extra sections inside your community: chat, courses, files, and more. Each is installed from the store separately; you can add multiple instances with different names.',
    sections: [
      {
        heading: 'Available apps',
        body: (
          <Ul
            items={[
              <>
                <strong>Chat</strong> — real-time member conversation.
              </>,
              <>
                <strong>Courses</strong> — lessons and learning programs.
              </>,
              <>
                <strong>Content</strong> — articles and long-form materials.
              </>,
              <>
                <strong>Files</strong> — documents and downloads.
              </>,
              <>
                <strong>Announcements</strong> — important news and rules.
              </>,
              <>
                <strong>Events</strong> — calendar of calls and meetups.
              </>,
            ]}
          />
        ),
      },
      {
        heading: 'What members see',
        body: (
          <p>
            After installation, new tabs appear on the community page. Members switch between feed,
            chat, courses, and other sections. Hide a tab while preparing content and reveal it on
            launch day.
          </p>
        ),
      },
    ],
  },

  'apps/store': {
    title: 'App store',
    lead:
      'The app store is available only to the community owner — open it from your community page.',
    steps: [
      {
        title: 'How to open the store',
        body: (
          <p>
            Open your community page and go to App store. Members do not see the store — only
            installed tabs on the community page.
          </p>
        ),
      },
      {
        title: 'Store interface',
        body: (
          <Ul
            items={[
              'Categories: community, education, themed modules.',
              'Search by app name.',
              'Each card shows description, price (often free), and Install.',
            ]}
          />
        ),
      },
      {
        title: 'Already installed',
        body: (
          <p>
            Installed apps are marked in the store. Manage instances in the Products section of the
            owner dashboard or on community page tabs.
          </p>
        ),
      },
    ],
  },

  'apps/install': {
    title: 'Installing an app',
    lead:
      'Installation adds a new tab on the community page — the process takes about a minute.',
    steps: [
      {
        title: 'Choose an app in the store',
        body: (
          <p>
            In the <L to={docsPagePath('apps', 'store')}>app store</L>, find the module you need,
            for example Chat. Click Install.
          </p>
        ),
      },
      {
        title: 'Confirm installation',
        body: (
          <p>
            A dialog asks for the tab name — keep the suggestion or set your own. After confirmation
            the app appears on the community page.
          </p>
        ),
      },
      {
        title: 'Verify on the community page',
        body: (
          <p>
            Return to the community page — the app tab should appear. If it is hidden, enable Visible
            to members in product settings on the owner dashboard.
          </p>
        ),
      },
      {
        title: 'Install again',
        body: (
          <p>
            You can install the same app multiple times — for example two chats, General and VIP.
            Each instance has its own name and message history.
          </p>
        ),
      },
    ],
    tips: [
      'After installing chat, post a welcome message from the owner to set the tone.',
    ],
  },

  'apps/configure': {
    title: 'Configuring app instances',
    lead:
      'Each app instance is configured separately: title, visibility, and internal notes.',
    steps: [
      {
        title: 'Products section',
        body: (
          <p>
            On the owner dashboard, open Products — a list of installed apps: rename, hide from
            members, and reorder tabs.
          </p>
        ),
      },
      {
        title: 'Visibility for members',
        body: (
          <p>
            When visibility is off, members do not see the tab — useful for draft courses. The
            dashboard home shows a reminder about hidden apps.
          </p>
        ),
      },
      {
        title: 'Remove an instance',
        body: (
          <p>
            Remove via Products or the store to drop the tab from the community page. Save important
            materials first — some data may remain archived.
          </p>
        ),
      },
    ],
  },

  'apps/chat': {
    title: 'Chat app',
    lead: 'Community chat — member conversation inside the club with read indicators.',
    steps: [
      {
        title: 'Install chat',
        body: (
          <p>
            See <L to={docsPagePath('apps', 'install')}>installing apps</L>. Choose Chat in the
            store.
          </p>
        ),
      },
      {
        title: 'Open chat',
        body: (
          <p>
            On the community page, switch to the chat tab. Members send messages; the owner sets tone
            and moderates discussion.
          </p>
        ),
      },
      {
        title: 'Unread messages',
        body: (
          <p>
            Unread messages are highlighted in chat and reflected in owner dashboard analytics — so
            you know where to respond.
          </p>
        ),
      },
    ],
  },

  'apps/courses': {
    title: 'Courses app',
    lead: 'Course and lesson structure for learning inside the community.',
    steps: [
      {
        title: 'Install courses',
        body: <p>In the app store, choose Courses and click Install.</p>,
      },
      {
        title: 'Create a course',
        body: (
          <p>
            In the courses section, the owner adds a program: title, description, lessons. Members
            see the list after publish and when visibility is on.
          </p>
        ),
      },
      {
        title: 'Expand over time',
        body: (
          <p>
            Combine with Content and Files: courses for programs, content for articles, files for
            downloads.
          </p>
        ),
      },
    ],
  },

  'apps/content': {
    title: 'Content app',
    lead: 'Documents and long-form materials inside the community.',
    steps: [
      {
        title: 'Install',
        body: <p>In the app store, choose Content and install the module.</p>,
      },
      {
        title: 'Publish',
        body: (
          <p>
            The owner creates documents; members read them in the content section on the community
            page.
          </p>
        ),
      },
    ],
  },

  'apps/files': {
    title: 'Files app',
    lead: 'Upload and share files with members.',
    steps: [
      {
        title: 'Install',
        body: <p>In the app store, choose Files and install the module.</p>,
      },
      {
        title: 'Upload',
        body: (
          <p>
            Uploaded files are available to members with community access — download from the Files
            section.
          </p>
        ),
      },
    ],
  },

  'apps/announcements': {
    title: 'Announcements app',
    lead: 'Important news and community rules.',
    steps: [
      {
        title: 'Install',
        body: <p>In the app store, choose Announcements and install the module.</p>,
      },
      {
        title: 'First announcement',
        body: (
          <p>
            Create a pinned announcement with rules and links. Recommended at launch — see the{' '}
            <L to={docsPagePath('growth', 'checklist')}>pre-launch checklist</L>.
          </p>
        ),
      },
    ],
  },

  'apps/events': {
    title: 'Events app',
    lead: 'Calendar for calls, AMAs, and offline meetups.',
    steps: [
      {
        title: 'Install',
        body: <p>In the app store, choose Events and install the module.</p>,
      },
      {
        title: 'Create an event',
        body: (
          <p>
            Set title, date, and description. Members see the list in Events on the community page.
          </p>
        ),
      },
    ],
  },

  'dashboard/overview': {
    title: 'Owner dashboard',
    lead:
      'The owner dashboard is your control center: settings, members, apps, and analytics in one place.',
    steps: [
      {
        title: 'Access',
        body: (
          <p>
            The owner and admins with the right permissions can open the dashboard from the menu on
            your community page.
          </p>
        ),
      },
      {
        title: 'Sections',
        body: (
          <Ul
            items={[
              <>Home — summary and alerts about hidden apps and unread chat.</>,
              <>Settings — name, access, payments.</>,
              <>Members — member table.</>,
              <>Products — installed apps.</>,
              <>Content — material management.</>,
              <>Analytics — growth charts.</>,
              <>Invites — links and codes for new members.</>,
            ]}
          />
        ),
      },
      {
        title: 'Quick navigation',
        body: (
          <p>
            From the community page you reach settings, the app store, and the dashboard without
            hunting across the platform.
          </p>
        ),
      },
    ],
  },

  'dashboard/analytics': {
    title: 'Analytics',
    lead:
      '30-day charts: member growth, feed activity, and chat engagement.',
    steps: [
      {
        title: 'Open analytics',
        body: (
          <p>
            On the owner dashboard, open Analytics — charts and key metrics for recent weeks.
          </p>
        ),
      },
      {
        title: 'Key metrics',
        body: (
          <Ul
            items={[
              'Total members and new members in the last 7 days.',
              'Post count and new posts in the last 7 days.',
              'Unread chat messages.',
              'Estimated revenue for paid communities.',
            ]}
          />
        ),
      },
      {
        title: 'How to use the data',
        body: (
          <p>
            Compare new members and posts weekly. Member growth without posts signals it is time to
            schedule activity or post an announcement.
          </p>
        ),
      },
    ],
  },

  'dashboard/members': {
    title: 'Members in the dashboard',
    lead:
      'A table of all members with join date and activity — useful for moderation and outreach.',
    steps: [
      {
        title: 'Open members',
        body: (
          <p>
            On the owner dashboard, open Members — a table with name, email, status, and join date.
          </p>
        ),
      },
      {
        title: 'Export',
        body: (
          <p>
            Export CSV downloads the current table page for CRM or email — only with member consent
            for personal data use.
          </p>
        ),
      },
    ],
  },

  'social/posts': {
    title: 'Posts and engagement',
    lead: 'One post model on the home feed, profiles, and communities.',
    steps: [
      {
        title: 'Like',
        body: (
          <p>
            Click the heart under a post to like it. Click again to remove the like. The count
            updates immediately.
          </p>
        ),
      },
      {
        title: 'Repost',
        body: (
          <p>
            Reposting shares the post with your followers. Reposts appear under the Reposts tab on
            your profile.
          </p>
        ),
      },
      {
        title: 'Comments',
        body: (
          <p>
            Open comments under the post or in the side panel. Edit and delete your own comments from
            the menu.
          </p>
        ),
      },
    ],
  },

  'social/messenger': {
    title: 'Direct messages',
    lead: 'Private conversations and platform service channels on one page.',
    steps: [
      {
        title: 'Service chats',
        body: (
          <p>
            On first sign-in, platform and support conversations appear — use them for product
            questions.
          </p>
        ),
      },
      {
        title: 'Private chat',
        body: (
          <p>
            From a profile, click the message icon to open a <L to="/messenger">direct chat</L> with
            that person.
          </p>
        ),
      },
    ],
  },

  'social/discover': {
    title: 'Community catalog',
    lead: 'Browse communities and join clubs that match your interests.',
    steps: [
      {
        title: 'Browse',
        body: (
          <p>
            The <L to="/discover">community catalog</L> lists public and private communities —
            private ones have a distinct badge.
          </p>
        ),
      },
      {
        title: 'Join',
        body: (
          <p>
            Open the community page and click Join. Private communities require an invite code from
            the owner.
          </p>
        ),
      },
    ],
  },

  'growth/strategy': {
    title: 'Growth strategy',
    lead: 'After launch, focus on retention and consistent content.',
    steps: [
      {
        title: 'Week 1 — Core',
        body: (
          <Ul
            items={[
              '10–20 active members through personal invites.',
              'Daily chat message or announcement from the owner.',
              '1–2 posts in the community feed per day.',
            ]}
          />
        ),
      },
      {
        title: 'Weeks 2–4 — Rhythm',
        body: (
          <Ul
            items={[
              'Weekly event in the Events app.',
              'Lesson series or file drops for members.',
              'Post on the home feed with a link to your community.',
            ]}
          />
        ),
      },
      {
        title: 'Metrics',
        body: (
          <p>
            Track new members, posts, and unread chat in{' '}
            <L to={docsPagePath('dashboard', 'analytics')}>analytics</L>. Aim for active members, not
            just sign-ups.
          </p>
        ),
      },
    ],
  },

  'growth/monetization': {
    title: 'Monetization',
    lead:
      'Paid community access is configured in community settings; revenue appears in analytics.',
    steps: [
      {
        title: 'Paid access',
        body: (
          <p>
            In community settings, enable paid mode and set a price. Members get access after
            payment; analytics shows estimated revenue.
          </p>
        ),
      },
      {
        title: 'Memberships and tiers',
        body: (
          <p>
            The members section of the owner dashboard shows access products and active subscribers
            — useful for planning tiers.
          </p>
        ),
      },
    ],
    tips: [
      'Start free; add a paid tier after you have proven value.',
    ],
  },

  'growth/checklist': {
    title: 'Pre-launch checklist',
    lead: 'Complete these items the day before your public announcement.',
    steps: [
      {
        title: 'Branding',
        body: (
          <Ul
            items={[
              'Avatar and banner uploaded.',
              'Description proofread.',
              'Community address matches your brand on social media.',
            ]}
          />
        ),
      },
      {
        title: 'Access',
        body: (
          <Ul
            items={[
              'Public or private — chosen deliberately.',
              'Invite code saved and tested for private clubs.',
              'Who can publish matches your operating model.',
            ]}
          />
        ),
      },
      {
        title: 'Apps',
        body: (
          <Ul
            items={[
              'Chat and announcements installed.',
              'All needed tabs visible to members.',
              'Test chat message removed or turned into a welcome note.',
            ]}
          />
        ),
      },
      {
        title: 'Content',
        body: (
          <Ul
            items={[
              'Rules post in the feed.',
              'First announcement published.',
              'Community link added to the owner profile.',
            ]}
          />
        ),
      },
      {
        title: 'Dashboard',
        body: (
          <Ul
            items={[
              'Analytics opens without errors.',
              'Members section shows a test member after a trial join.',
            ]}
          />
        ),
      },
    ],
  },
};
