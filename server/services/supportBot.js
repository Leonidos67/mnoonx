/**
 * Interactive Mnoonx Support bot — FAQ tree + escalate to SupportTicket.
 * Bodies/labels are bilingual; resolve via locale ('ru' | 'en').
 * Tone: professional / business support. In-app paths (/settings, /docs/…) are clickable in Messenger.
 */

function L(en, ru) {
  return { en, ru };
}

function pick(loc, pair) {
  if (!pair) return '';
  if (typeof pair === 'string') return pair;
  return loc === 'ru' ? pair.ru || pair.en : pair.en || pair.ru;
}

/** Shared action labels */
const A = {
  resolved: L('Issue resolved', 'Вопрос решён'),
  contact: L('Contact support', 'Связаться со специалистом'),
  contactMore: L('Contact support', 'Обратитесь в поддержку'),
  mainMenu: L('← Main menu', '← Главное меню'),
  mainMenuPlain: L('Main menu', 'Главное меню'),
  accountMenu: L('← Account', '← Аккаунт'),
  communitiesMenu: L('← Communities', '← Сообщества'),
  postsMenu: L('← Posts', '← Посты'),
  messengerMenu: L('← Messenger', '← Мессенджер'),
  bugsMenu: L('← Technical issues', '← Технические вопросы'),
  notificationsMenu: L('← Notifications', '← Уведомления'),
  discoverMenu: L('← Discover', '← Discover'),
  docsMenu: L('← Documentation', '← Документация'),
  safetyMenu: L('← Safety', '← Безопасность'),
  changeCategory: L('← Change category', '← Сменить категорию'),
  cancelMenu: L('Cancel — main menu', 'Отмена — главное меню'),
  openTicket: L('Submit a ticket', 'Создать обращение'),
};

/** @typedef {{ id: string, label: {en:string,ru:string} }} BotActionDef */
/** @typedef {{ body: {en:string,ru:string}, actions?: BotActionDef[], expectInput?: 'ticket_description', ticketCategory?: 'bug'|'authentication'|'other' }} BotNode */

/** @type {Record<string, BotNode>} */
const NODES = {
  root: {
    body: L(
      'Mnoonx Support\n\nThis assistant covers common platform topics and can create a support ticket for the operations team.\n\nSelect a topic below.\nCommands: /start — this menu · /help — all commands.\n\nUseful pages:\n• Documentation — /docs/start/overview\n• Support tickets — /docs/support\n• Settings — /settings',
      'Поддержка Mnoonx\n\nАссистент отвечает на типовые вопросы по платформе и может создать обращение для специалистов.\n\nВыберите тему ниже.\nКоманды: /start — это меню · /help — все команды.\n\nПолезные страницы:\n• Документация — /docs/start/overview\n• Обращения — /docs/support\n• Настройки — /settings'
    ),
    actions: [
      { id: 'account', label: L('Account & security', 'Аккаунт и безопасность') },
      { id: 'communities', label: L('Communities', 'Сообщества') },
      { id: 'posts', label: L('Posts & feed', 'Посты и лента') },
      { id: 'messenger', label: L('Messenger', 'Мессенджер') },
      { id: 'notifications', label: L('Notifications', 'Уведомления') },
      { id: 'discover', label: L('Discover & market', 'Discover и рынок') },
      { id: 'docs', label: L('Documentation', 'Документация') },
      { id: 'safety', label: L('Safety & moderation', 'Безопасность и модерация') },
      { id: 'payments', label: L('Payments & plan', 'Оплата и тариф') },
      { id: 'bugs', label: L('Technical issues', 'Технические вопросы') },
      { id: 'contact', label: A.contact },
    ],
  },

  account: {
    body: L(
      'Account & security\n\nSelect a subsection.\n\nQuick links:\n• Profile editor — /settings?section=edit-profile\n• Security — /settings?section=security\n• Connected accounts — /settings?section=connected\n• Docs: account — /docs/start/account',
      'Аккаунт и безопасность\n\nВыберите раздел.\n\nБыстрые ссылки:\n• Редактор профиля — /settings?section=edit-profile\n• Безопасность — /settings?section=security\n• Подключённые аккаунты — /settings?section=connected\n• Документация: аккаунт — /docs/start/account'
    ),
    actions: [
      { id: 'account_login', label: L('Sign-in & password', 'Вход и пароль') },
      { id: 'account_2fa', label: L('Two-factor authentication', 'Двухфакторная аутентификация') },
      { id: 'account_sessions', label: L('Sessions & devices', 'Сессии и устройства') },
      { id: 'account_profile', label: L('Profile, email, username', 'Профиль, email, username') },
      { id: 'root', label: A.mainMenu },
      { id: 'contact', label: A.contact },
    ],
  },
  account_login: {
    body: L(
      'Sign-in & password\n\n• Change password: /settings?section=security\n• Password recovery: use “Forgot password” on the sign-in screen; a verification code is sent by email.\n• If the code does not arrive, check spam and wait a few minutes before retrying.\n\nDocs: /docs/start/account\n\nIf access remains unavailable, contact support.',
      'Вход и пароль\n\n• Смена пароля: /settings?section=security\n• Восстановление: на экране входа — «Забыли пароль»; код приходит на email.\n• Если код не получен, проверьте «Спам» и повторите через несколько минут.\n\nДокументация: /docs/start/account\n\nЕсли вход недоступен — обратитесь в поддержку.'
    ),
    actions: [
      { id: 'account_2fa', label: L('Configure 2FA', 'Настроить 2FA') },
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'account', label: A.accountMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },
  account_2fa: {
    body: L(
      'Two-factor authentication (2FA)\n\n• Open /settings?section=security and enable two-factor authentication.\n• Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.).\n• Enter the six-digit code to complete enrollment.\n• Disabling 2FA requires a valid code or your current password.\n\nEnabling 2FA is recommended for all accounts.',
      'Двухфакторная аутентификация (2FA)\n\n• Откройте /settings?section=security и включите двухфакторную аутентификацию.\n• Отсканируйте QR-код в приложении-аутентификаторе (Google Authenticator, Authy и др.).\n• Введите шестизначный код для завершения.\n• Для отключения нужны код или текущий пароль.\n\nРекомендуем включить 2FA для всех учётных записей.'
    ),
    actions: [
      { id: 'account_sessions', label: L('Manage sessions', 'Управление сессиями') },
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'account', label: A.accountMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },
  account_sessions: {
    body: L(
      'Sessions & devices\n\n• Active sessions are listed at /settings?section=security.\n• Use “Sign out this device” to revoke a session.\n• After a password change, review the list and revoke unrecognized devices.\n\nTo report unauthorized access, contact support.',
      'Сессии и устройства\n\n• Активные сессии: /settings?section=security\n• «Выйти на этом устройстве» отзывает выбранную сессию.\n• После смены пароля проверьте список и завершите неизвестные сессии.\n\nПри подозрении на несанкционированный доступ обратитесь в поддержку.'
    ),
    actions: [
      { id: 'contact', label: L('Report unauthorized access', 'Сообщить о несанкционированном доступе') },
      { id: 'helpful_yes', label: A.resolved },
      { id: 'account', label: A.accountMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },
  account_profile: {
    body: L(
      'Profile, email & username\n\n• Edit name, bio, avatar, and links: /settings?section=edit-profile\n• Username forms the public profile path (/@username).\n• Email changes are processed by support for security reasons.\n• Profile basics in docs: /docs/profile/basics\n• Connections: /docs/profile/connections\n• Directory of people: /users',
      'Профиль, email и username\n\n• Имя, описание, аватар и ссылки: /settings?section=edit-profile\n• Username определяет адрес профиля (/@username).\n• Смена email выполняется через поддержку.\n• Основы профиля: /docs/profile/basics\n• Связи: /docs/profile/connections\n• Каталог пользователей: /users'
    ),
    actions: [
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: L('Request email change', 'Запросить смену email') },
      { id: 'account', label: A.accountMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },

  communities: {
    body: L(
      'Communities\n\nSelect a subsection.\n\nQuick links:\n• Create community — /create-community\n• Discover communities — /discover\n• Docs overview — /docs/community/create\n• Access & privacy — /docs/community/access',
      'Сообщества\n\nВыберите раздел.\n\nБыстрые ссылки:\n• Создать сообщество — /create-community\n• Найти сообщества — /discover\n• Документация — /docs/community/create\n• Доступ и приватность — /docs/community/access'
    ),
    actions: [
      { id: 'comm_create', label: L('Create a community', 'Создать сообщество') },
      { id: 'comm_join', label: L('Join, leave & privacy', 'Вступление, выход и доступ') },
      { id: 'comm_apps', label: L('Apps & Store', 'Приложения и Store') },
      { id: 'comm_roles', label: L('Owner & posting rights', 'Владелец и права публикации') },
      { id: 'root', label: A.mainMenu },
      { id: 'contact', label: A.contact },
    ],
  },
  comm_create: {
    body: L(
      'Creating a community\n\n• Start at /create-community or via “Start a Community” in the sidebar.\n• Choose a unique handle; the address becomes /community/your-handle.\n• As owner you manage apps, branding, and members from the community page and /dashboard/:handle.\n• Visibility and join codes: community settings.\n\nGuide: /docs/community/create\nBranding: /docs/community/branding',
      'Создание сообщества\n\n• Страница /create-community или «Создать сообщество» в боковой панели.\n• Уникальный handle → адрес /community/your-handle.\n• Владелец управляет приложениями, брендингом и участниками на странице сообщества и в /dashboard/:handle.\n• Видимость и код вступления — в настройках сообщества.\n\nГайд: /docs/community/create\nБрендинг: /docs/community/branding'
    ),
    actions: [
      { id: 'comm_apps', label: L('Apps overview', 'Обзор приложений') },
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'communities', label: A.communitiesMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },
  comm_join: {
    body: L(
      'Join, leave & private communities\n\n• Public: open the community page and select Join.\n• Private: a join code from the owner may be required.\n• Without access only a limited preview is shown.\n• Leave from the community page.\n• Browse communities: /discover\n\nDetails: /docs/community/access · Members: /docs/community/members',
      'Вступление, выход и приватные сообщества\n\n• Публичные: откройте страницу и нажмите Join.\n• Приватные могут требовать код от владельца.\n• Без доступа — ограниченный просмотр.\n• Выход — со страницы сообщества.\n• Каталог: /discover\n\nПодробнее: /docs/community/access · Участники: /docs/community/members'
    ),
    actions: [
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'communities', label: A.communitiesMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },
  comm_apps: {
    body: L(
      'Community apps & Store\n\n• Owners install apps from the Community Store (chat, courses, files, events, announcements, AI, kanban, forms, and others).\n• Each install is a separate instance with title and visibility.\n• Members see apps the owner has enabled.\n• Open apps from the community navigation.\n\nDocs: /docs/apps/overview · Store: /docs/apps/store · Install: /docs/apps/install',
      'Приложения и Store\n\n• Владелец устанавливает приложения из Community Store (чат, курсы, файлы, события, объявления, AI, канбан, формы и др.).\n• Каждая установка — отдельный экземпляр с названием и видимостью.\n• Участникам доступны приложения, разрешённые владельцем.\n• Открытие — через навигацию сообщества.\n\nДокументация: /docs/apps/overview · Store: /docs/apps/store · Установка: /docs/apps/install'
    ),
    actions: [
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'communities', label: A.communitiesMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },
  comm_roles: {
    body: L(
      'Owner & posting rights\n\n• The creator is the owner and retains posting rights.\n• membersCanPost in settings controls whether members may publish.\n• Branding, apps, join code, and deletion are owner-only.\n• Owner dashboard: /dashboard/:handle\n\nDocs: /docs/dashboard/overview · Feed rules: /docs/community/feed',
      'Владелец и права публикации\n\n• Создатель — владелец и сохраняет право публикации.\n• Параметр membersCanPost управляет постами участников.\n• Брендинг, приложения, код вступления и удаление — только владелец.\n• Панель владельца: /dashboard/:handle\n\nДокументация: /docs/dashboard/overview · Лента: /docs/community/feed'
    ),
    actions: [
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'communities', label: A.communitiesMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },

  posts: {
    body: L(
      'Posts & feed\n\nSelect a subsection.\n\nQuick links:\n• Home feed — /\n• Docs: posts — /docs/social/posts\n• Activity — /activity',
      'Посты и лента\n\nВыберите раздел.\n\nБыстрые ссылки:\n• Главная лента — /\n• Документация: посты — /docs/social/posts\n• Активность — /activity'
    ),
    actions: [
      { id: 'posts_create', label: L('Create & edit', 'Создание и редактирование') },
      { id: 'posts_engage', label: L('Likes, reposts, quotes', 'Лайки, репосты, цитаты') },
      { id: 'posts_comments', label: L('Comments', 'Комментарии') },
      { id: 'posts_visibility', label: L('Post visibility', 'Где отображаются посты') },
      { id: 'root', label: A.mainMenu },
      { id: 'contact', label: A.contact },
    ],
  },
  posts_create: {
    body: L(
      'Creating and editing posts\n\n• Compose from / (Home) or inside a community if posting is allowed.\n• Attachments may include media, links, coins, and polls.\n• Use the post menu (⋯) to edit or delete your own posts.\n• Quote creates a new post referencing an existing one.\n\nGuide: /docs/social/posts',
      'Создание и редактирование постов\n\n• Публикация с / (главная) или в сообществе при наличии права.\n• Вложения: медиа, ссылки, монеты и опросы.\n• Меню поста (⋯) — редактирование или удаление своих публикаций.\n• Цитата создаёт новый пост со ссылкой на исходный.\n\nГайд: /docs/social/posts'
    ),
    actions: [
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'posts', label: A.postsMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },
  posts_engage: {
    body: L(
      'Likes, reposts & quotes\n\n• Like and repost are on the action bar under each post.\n• Counts and your engagement state sync from the server.\n• Quote creates a new post that references the original.\n• Bookmark saves a post when the feature is enabled.\n• Interaction history: /notifications/engagement\n\nDocs: /docs/social/posts',
      'Лайки, репосты и цитаты\n\n• Лайк и репост — в панели под постом.\n• Счётчики и статус синхронизируются с сервером.\n• Цитата создаёт новый пост со ссылкой на оригинал.\n• Закладка сохраняет пост (если функция включена).\n• История взаимодействий: /notifications/engagement\n\nДокументация: /docs/social/posts'
    ),
    actions: [
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'posts', label: A.postsMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },
  posts_comments: {
    body: L(
      'Comments\n\n• Comment on the post page or inline in the feed.\n• Replies to specific comments are supported.\n• Authors may delete their own comments.\n• Report violations via the post or profile menu.\n\nOpen any post at /post/:postId after sharing its link.',
      'Комментарии\n\n• Комментирование — на странице поста и в ленте.\n• Поддерживаются ответы на отдельные комментарии.\n• Автор может удалить свои комментарии.\n• О нарушениях — через меню поста или профиля.\n\nСтраница поста: /post/:postId (по ссылке на публикацию).'
    ),
    actions: [
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'posts', label: A.postsMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },
  posts_visibility: {
    body: L(
      'Where posts appear\n\n• Home (/) — posts from follows and joined communities.\n• Community feed — posts inside that community.\n• Profile (/@username) — posts you authored.\n• Discover (/discover) — find communities; Market is a separate tab.\n• Activity (/activity) — your points and milestones when available.\n\nNavigation guide: /docs/start/navigation',
      'Где отображаются посты\n\n• Главная (/) — подписки и сообщества.\n• Лента сообщества — посты этого сообщества.\n• Профиль (/@username) — ваши публикации.\n• Discover (/discover) — поиск сообществ; Market — отдельная вкладка.\n• Активность (/activity) — очки и достижения при доступности.\n\nНавигация: /docs/start/navigation'
    ),
    actions: [
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'posts', label: A.postsMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },

  messenger: {
    body: L(
      'Messenger\n\nSelect a subsection.\n\nOpen Messenger: /messenger\nDocs: /docs/social/messenger',
      'Мессенджер\n\nВыберите раздел.\n\nОткрыть мессенджер: /messenger\nДокументация: /docs/social/messenger'
    ),
    actions: [
      { id: 'msg_dm', label: L('Direct messages', 'Личные сообщения') },
      { id: 'msg_system', label: L('Official & support chats', 'Официальные чаты и поддержка') },
      { id: 'msg_media', label: L('Attachments & links', 'Вложения и ссылки') },
      { id: 'root', label: A.mainMenu },
      { id: 'contact', label: A.contact },
    ],
  },
  msg_dm: {
    body: L(
      'Direct messages\n\n• Start from a profile or via search in /messenger.\n• Each participant has an independent inbox copy of the thread.\n• Actions: pin, reply, hide, block, report.\n• Unread counts appear on Messages in the header.\n• Find people: /users\n\nDocs: /docs/social/messenger',
      'Личные сообщения\n\n• Диалог из профиля или через поиск в /messenger.\n• У каждого — своя копия переписки во входящих.\n• Действия: закрепление, ответ, скрытие, блокировка, жалоба.\n• Непрочитанные — бейдж Messages в шапке.\n• Поиск людей: /users\n\nДокументация: /docs/social/messenger'
    ),
    actions: [
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'messenger', label: A.messengerMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },
  msg_system: {
    body: L(
      'Official system chats\n\n• Team Mnoonx — read-only channel for official announcements.\n• Mnoonx Support — this conversation: guided answers or a ticket for a specialist.\n• System chats cannot be deleted.\n• You are currently in Mnoonx Support.\n\nOpen inbox: /messenger',
      'Официальные системные чаты\n\n• Team Mnoonx — канал только для чтения с объявлениями.\n• Mnoonx Support — этот диалог: подсказки или обращение к специалисту.\n• Системные чаты удалить нельзя.\n• Сейчас вы в Mnoonx Support.\n\nОткрыть входящие: /messenger'
    ),
    actions: [
      { id: 'root', label: L('Browse topics', 'К темам') },
      { id: 'contact', label: A.contact },
      { id: 'messenger', label: A.messengerMenu },
    ],
  },
  msg_media: {
    body: L(
      'Attachments & links\n\n• Attachment menu: animoji, stickers, and coins.\n• External links open after confirmation (in-app browser or new tab).\n• Link-opening preferences: /settings?section=security&focus=links\n• Supported URLs may show a preview.',
      'Вложения и ссылки\n\n• Меню вложений: анимодзи, стикеры и монеты.\n• Внешние ссылки — после подтверждения (браузер в приложении или новая вкладка).\n• Параметры открытия ссылок: /settings?section=security&focus=links\n• Для части URL отображается превью.'
    ),
    actions: [
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'messenger', label: A.messengerMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },

  notifications: {
    body: L(
      'Notifications\n\n• Inbox: /notifications\n• Followers, likes & comments: /notifications/engagement\n• Preferences (push, email-related toggles): /settings?section=notifications\n\nUnread badges update in the header and mobile navigation.\nMentions and system notices appear in the main notifications list; engagement activity is grouped separately.',
      'Уведомления\n\n• Лента: /notifications\n• Подписчики, лайки и комментарии: /notifications/engagement\n• Настройки (push и связанные параметры): /settings?section=notifications\n\nСчётчики непрочитанных обновляются в шапке и мобильной навигации.\nУпоминания и системные сообщения — в общем списке; взаимодействия сгруппированы отдельно.'
    ),
    actions: [
      { id: 'notif_prefs', label: L('Notification settings', 'Настройки уведомлений') },
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'root', label: A.mainMenu },
    ],
  },
  notif_prefs: {
    body: L(
      'Notification settings\n\n• Open /settings?section=notifications to manage push and activity preferences.\n• Enable browser push only if you want device alerts; you can test the delivery from the same page.\n• Disabling a category stops new alerts of that type; existing unread items remain until marked read.\n\nInbox: /notifications',
      'Настройки уведомлений\n\n• Страница /settings?section=notifications — push и параметры активности.\n• Включайте push в браузере только при необходимости; тест отправки доступен на той же странице.\n• Отключение категории останавливает новые оповещения этого типа; уже непрочитанные остаются до прочтения.\n\nЛента: /notifications'
    ),
    actions: [
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'notifications', label: A.notificationsMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },

  discover: {
    body: L(
      'Discover & market\n\n• Communities and discovery: /discover\n• Market tab (charts / coins): /discover?tab=market\n• Portfolio tracker: /portfolio-tracker\n• Docs: /docs/social/discover\n\nUse Discover to find public and listed private communities. Market tools are separate from the social feed.',
      'Discover и рынок\n\n• Сообщества и поиск: /discover\n• Вкладка Market (графики / монеты): /discover?tab=market\n• Portfolio tracker: /portfolio-tracker\n• Документация: /docs/social/discover\n\nDiscover помогает находить сообщества. Инструменты Market отделены от социальной ленты.'
    ),
    actions: [
      { id: 'discover_market', label: L('Market & coins', 'Рынок и монеты') },
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'root', label: A.mainMenu },
    ],
  },
  discover_market: {
    body: L(
      'Market & coins\n\n• Open /discover?tab=market for the market overview.\n• Coin pages use /discover/coin/:coinId (open a coin from search results).\n• Attach a coin chart to a post from the composer when available.\n• Portfolio: /portfolio-tracker\n\nIf a chart fails to load, check your network and try another coin; report persistent failures via support.',
      'Рынок и монеты\n\n• Обзор рынка: /discover?tab=market\n• Страница монеты: /discover/coin/:coinId (из результатов поиска).\n• График монеты можно прикрепить к посту в композере.\n• Портфель: /portfolio-tracker\n\nЕсли график не загружается, проверьте сеть и другую монету; при повторении сообщите в поддержку.'
    ),
    actions: [
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'discover', label: A.discoverMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },

  docs: {
    body: L(
      'Documentation\n\n• Start here: /docs/start/overview\n• Account & navigation: /docs/start/account · /docs/start/navigation\n• Communities: /docs/community/create\n• Apps & Store: /docs/apps/overview\n• Social (posts, messenger, discover): /docs/social/posts\n• Growth & monetization: /docs/growth/strategy\n• Platform updates: /updates\n• Support tickets UI: /docs/support\n\nUse the docs search inside /docs to find a specific topic.',
      'Документация\n\n• Начало: /docs/start/overview\n• Аккаунт и навигация: /docs/start/account · /docs/start/navigation\n• Сообщества: /docs/community/create\n• Приложения и Store: /docs/apps/overview\n• Социальное (посты, мессенджер, discover): /docs/social/posts\n• Рост и монетизация: /docs/growth/strategy\n• Обновления платформы: /updates\n• Обращения: /docs/support\n\nПоиск по разделам доступен внутри /docs.'
    ),
    actions: [
      { id: 'docs_start', label: L('Getting started', 'Быстрый старт') },
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contact },
      { id: 'root', label: A.mainMenu },
    ],
  },
  docs_start: {
    body: L(
      'Getting started\n\n1. Complete your profile: /settings?section=edit-profile\n2. Review security (password / 2FA): /settings?section=security\n3. Explore the feed: /\n4. Find or create a community: /discover · /create-community\n5. Read the overview: /docs/start/overview\n\nFor product changes see /updates.',
      'Быстрый старт\n\n1. Заполните профиль: /settings?section=edit-profile\n2. Проверьте безопасность (пароль / 2FA): /settings?section=security\n3. Лента: /\n4. Найдите или создайте сообщество: /discover · /create-community\n5. Обзор продукта: /docs/start/overview\n\nИзменения платформы: /updates.'
    ),
    actions: [
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'docs', label: A.docsMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },

  safety: {
    body: L(
      'Safety & moderation\n\n• Block or report users from profile and chat menus.\n• Report posts from the post menu when content violates rules.\n• Session review: /settings?section=security\n• Resolution center: /settings?section=resolution\n• Support tickets: /docs/support\n\nProvide links, usernames, and timestamps when contacting support about abuse.',
      'Безопасность и модерация\n\n• Блокировка и жалоба — в меню профиля и чата.\n• Жалоба на пост — в меню публикации при нарушении правил.\n• Сессии: /settings?section=security\n• Центр решений: /settings?section=resolution\n• Обращения: /docs/support\n\nПри обращении по злоупотреблениям укажите ссылки, username и время.'
    ),
    actions: [
      { id: 'safety_report', label: L('How to report', 'Как пожаловаться') },
      { id: 'contact', label: A.contact },
      { id: 'root', label: A.mainMenu },
    ],
  },
  safety_report: {
    body: L(
      'How to report\n\n• Profile: open the user menu → Report / Block.\n• Messenger: chat menu → Report or Block.\n• Post: ⋯ menu → Report when available.\n• Track formal tickets at /docs/support\n• Security settings: /settings?section=security\n\nFor urgent account compromise, create an authentication ticket via Contact support.',
      'Как пожаловаться\n\n• Профиль: меню пользователя → Жалоба / Блокировка.\n• Мессенджер: меню чата → Жалоба или Блокировка.\n• Пост: меню ⋯ → Жалоба (если доступно).\n• Тикеты: /docs/support\n• Безопасность: /settings?section=security\n\nПри компрометации аккаунта создайте обращение категории «Вход / аккаунт».'
    ),
    actions: [
      { id: 'contact', label: A.contact },
      { id: 'helpful_yes', label: A.resolved },
      { id: 'safety', label: A.safetyMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },

  payments: {
    body: L(
      'Payments & plan\n\nBilling features are rolling out gradually.\n\n• Orders: /settings?section=orders\n• Payment methods: /settings?section=payments\n• Resolution center: /settings?section=resolution\n• Growth / monetization docs: /docs/growth/monetization\n\nFor disputed charges, contact support with the approximate time and amount.',
      'Оплата и тариф\n\nБиллинг подключается поэтапно.\n\n• Заказы: /settings?section=orders\n• Способы оплаты: /settings?section=payments\n• Центр решений: /settings?section=resolution\n• Документация по монетизации: /docs/growth/monetization\n\nПо спорным списаниям укажите время и сумму в обращении.'
    ),
    actions: [
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: L('Billing inquiry', 'Вопрос по оплате') },
      { id: 'root', label: A.mainMenu },
    ],
  },

  bugs: {
    body: L(
      'Technical issues\n\nSelect the closest match.\n\nBefore opening a ticket, try a hard refresh and check /updates for known changes.\nTicket history: /docs/support',
      'Технические вопросы\n\nВыберите наиболее подходящий пункт.\n\nПеред обращением выполните жёсткое обновление и проверьте /updates.\nИстория обращений: /docs/support'
    ),
    actions: [
      { id: 'bugs_load', label: L('Page fails to load', 'Страница не загружается') },
      { id: 'bugs_mobile', label: L('Mobile / PWA', 'Мобильные устройства / PWA') },
      { id: 'bugs_browser', label: L('Links / in-app browser', 'Ссылки / браузер в приложении') },
      { id: 'contact', label: L('Report a defect', 'Сообщить о дефекте') },
      { id: 'root', label: A.mainMenu },
    ],
  },
  bugs_load: {
    body: L(
      'Page fails to load\n\n• Hard refresh (Ctrl/Cmd+Shift+R) or clear site cache.\n• Verify network connectivity; try another connection.\n• Sign out and sign in again if data looks stale.\n• Note the URL and approximate time.\n• Check /updates for recent platform changes.\n\nIf it persists, submit a ticket with reproduction steps via Contact support.',
      'Страница не загружается\n\n• Жёсткое обновление (Ctrl/Cmd+Shift+R) или очистка кэша.\n• Проверьте сеть; при необходимости смените подключение.\n• Выйдите и войдите снова при некорректных данных.\n• Зафиксируйте URL и время.\n• Проверьте /updates на недавние изменения.\n\nПри повторении создайте обращение с шагами воспроизведения.'
    ),
    actions: [
      { id: 'contact', label: A.openTicket },
      { id: 'helpful_yes', label: A.resolved },
      { id: 'bugs', label: A.bugsMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },
  bugs_mobile: {
    body: L(
      'Mobile & PWA\n\n• Add MNOONX to the home screen for the installed experience.\n• Pull-to-refresh is available on primary feeds where enabled.\n• Edge swipe navigates back on mobile.\n• If the bottom navigation or keyboard obscures content, rotate once or relaunch the PWA.\n• Navigation overview: /docs/start/navigation\n\nInclude device model and browser version in tickets.',
      'Мобильные устройства и PWA\n\n• Добавьте MNOONX на домашний экран для режима приложения.\n• Pull-to-refresh — на основных лентах при включении.\n• Свайп от края — возврат назад.\n• Если навигация или клавиатура перекрывают контент — смените ориентацию или перезапустите PWA.\n• Навигация: /docs/start/navigation\n\nВ обращении укажите модель устройства и версию браузера.'
    ),
    actions: [
      { id: 'contact', label: A.openTicket },
      { id: 'helpful_yes', label: A.resolved },
      { id: 'bugs', label: A.bugsMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },
  bugs_browser: {
    body: L(
      'Links & in-app browser\n\n• Some sites block embedding — use “Open in new tab”.\n• Preferences: /settings?section=security&focus=links\n• A blank page inside the app usually means the site blocked framing.\n\nDocs: /docs/start/navigation',
      'Ссылки и браузер в приложении\n\n• Часть сайтов запрещает встраивание — «Открыть в новой вкладке».\n• Параметры: /settings?section=security&focus=links\n• Пустая страница внутри обычно означает запрет фрейма.\n\nДокументация: /docs/start/navigation'
    ),
    actions: [
      { id: 'helpful_yes', label: A.resolved },
      { id: 'contact', label: A.contactMore },
      { id: 'bugs', label: A.bugsMenu },
      { id: 'root', label: A.mainMenu },
    ],
  },

  helpful_yes: {
    body: L(
      'Thank you for confirming.\n\nFurther help: main menu, documentation (/docs/start/overview), or Contact support.',
      'Благодарим за подтверждение.\n\nДополнительная помощь: главное меню, документация (/docs/start/overview) или обращение к специалисту.'
    ),
    actions: [
      { id: 'root', label: A.mainMenuPlain },
      { id: 'docs', label: L('Documentation', 'Документация') },
      { id: 'contact', label: A.contact },
    ],
  },

  contact: {
    body: L(
      'Contact support\n\nSelect a category, then describe the issue in one message. The request is queued for the support team.\n\nYou can also track tickets at /docs/support.',
      'Связь со специалистом\n\nВыберите категорию, затем опишите ситуацию одним сообщением. Запрос будет передан команде поддержки.\n\nСтатус обращений: /docs/support.'
    ),
    actions: [
      { id: 'ticket_auth', label: L('Sign-in / account / 2FA', 'Вход / аккаунт / 2FA') },
      { id: 'ticket_bug', label: L('Defect / malfunction', 'Дефект / сбой') },
      { id: 'ticket_other', label: L('Other inquiry', 'Иной вопрос') },
      { id: 'root', label: L('← Back to topics', '← К темам') },
    ],
  },
  ticket_auth: {
    body: L(
      'Authentication request\n\nSend one message including:\n• actions already taken\n• observed result\n• username (if relevant)\n\nA support ticket will be created (~500 characters max).\nTrack at /docs/support',
      'Обращение: вход и аккаунт\n\nОтправьте одно сообщение:\n• выполненные действия\n• результат\n• username (если применимо)\n\nБудет создано обращение (до ~500 символов).\nСтатус: /docs/support'
    ),
    expectInput: 'ticket_description',
    ticketCategory: 'authentication',
    actions: [
      { id: 'contact', label: A.changeCategory },
      { id: 'root', label: A.cancelMenu },
    ],
  },
  ticket_bug: {
    body: L(
      'Defect report\n\nSend one message including:\n• reproduction steps\n• expected versus actual result\n• device and browser, if known\n\nA support ticket will be created (~500 characters max).\nTrack at /docs/support',
      'Обращение: дефект\n\nОтправьте одно сообщение:\n• шаги воспроизведения\n• ожидаемый и фактический результат\n• устройство и браузер (если известно)\n\nБудет создано обращение (до ~500 символов).\nСтатус: /docs/support'
    ),
    expectInput: 'ticket_description',
    ticketCategory: 'bug',
    actions: [
      { id: 'contact', label: A.changeCategory },
      { id: 'root', label: A.cancelMenu },
    ],
  },
  ticket_other: {
    body: L(
      'General inquiry\n\nDescribe your question in one message. Include links or community handles if useful (~500 characters max).\n\nTrack tickets at /docs/support',
      'Общее обращение\n\nОпишите вопрос одним сообщением. При необходимости укажите ссылки или handle сообщества (до ~500 символов).\n\nСтатус: /docs/support'
    ),
    expectInput: 'ticket_description',
    ticketCategory: 'other',
    actions: [
      { id: 'contact', label: A.changeCategory },
      { id: 'root', label: A.cancelMenu },
    ],
  },

  ticket_created: {
    body: L(
      'Request registered\n\nThe support team can review it in the admin panel. Track status at /docs/support.\n\nInitial response typically arrives within several hours. Use the main menu or /docs/start/overview for self-service topics.',
      'Обращение зарегистрировано\n\nКоманда поддержки видит его в панели администрирования. Статус: /docs/support.\n\nПервичный ответ обычно в течение нескольких часов. Самообслуживание: главное меню или /docs/start/overview.'
    ),
    actions: [
      { id: 'root', label: A.mainMenuPlain },
      { id: 'docs', label: L('Documentation', 'Документация') },
      { id: 'contact', label: L('Submit another request', 'Создать ещё одно обращение') },
    ],
  },

  free_text_fallback: {
    body: L(
      'Please select a topic using the buttons below, open /docs/start/overview, or contact support for an individual review.',
      'Выберите тему кнопками ниже, откройте /docs/start/overview или свяжитесь со специалистом для индивидуального рассмотрения.'
    ),
    actions: [
      { id: 'account', label: L('Account & security', 'Аккаунт и безопасность') },
      { id: 'communities', label: L('Communities', 'Сообщества') },
      { id: 'posts', label: L('Posts & feed', 'Посты и лента') },
      { id: 'messenger', label: L('Messenger', 'Мессенджер') },
      { id: 'notifications', label: L('Notifications', 'Уведомления') },
      { id: 'discover', label: L('Discover & market', 'Discover и рынок') },
      { id: 'docs', label: L('Documentation', 'Документация') },
      { id: 'safety', label: L('Safety & moderation', 'Безопасность и модерация') },
      { id: 'payments', label: L('Payments & plan', 'Оплата и тариф') },
      { id: 'bugs', label: L('Technical issues', 'Технические вопросы') },
      { id: 'contact', label: A.contact },
      { id: 'root', label: L('Full main menu', 'Полное главное меню') },
    ],
  },
};

/** Map ticket_* action ids → node ids (same). */
const ACTION_ALIASES = {
  ticket_auth: 'ticket_auth',
  ticket_bug: 'ticket_bug',
  ticket_other: 'ticket_other',
};

function normalizeLocale(locale) {
  const s = String(locale || '').toLowerCase();
  return s.startsWith('ru') ? 'ru' : 'en';
}

function resolveNode(nodeId, locale) {
  const id = ACTION_ALIASES[nodeId] || nodeId;
  const node = NODES[id];
  if (!node) return null;
  const loc = normalizeLocale(locale);
  return {
    nodeId: id,
    body: pick(loc, node.body),
    actions: (node.actions || []).map((a) => ({
      id: a.id,
      label: pick(loc, a.label),
    })),
    expectInput: node.expectInput || null,
    ticketCategory: node.ticketCategory || null,
  };
}

function getRootWelcome(locale) {
  return resolveNode('root', locale);
}

function resolveActionTarget(actionId) {
  if (!actionId) return null;
  if (NODES[actionId]) return actionId;
  if (ACTION_ALIASES[actionId]) return ACTION_ALIASES[actionId];
  return null;
}

/** Slash commands listed in /help and composer suggestions */
const SLASH_COMMANDS = [
  {
    command: '/start',
    nodeId: 'root',
    description: L('Main menu and topics', 'Главное меню и темы'),
  },
  {
    command: '/help',
    nodeId: 'help',
    description: L('List of commands', 'Список команд'),
  },
  {
    command: '/menu',
    nodeId: 'root',
    description: L('Open main menu', 'Открыть главное меню'),
  },
  {
    command: '/account',
    nodeId: 'account',
    description: L('Account & security', 'Аккаунт и безопасность'),
  },
  {
    command: '/communities',
    nodeId: 'communities',
    description: L('Communities', 'Сообщества'),
  },
  {
    command: '/posts',
    nodeId: 'posts',
    description: L('Posts & feed', 'Посты и лента'),
  },
  {
    command: '/messenger',
    nodeId: 'messenger',
    description: L('Messenger', 'Мессенджер'),
  },
  {
    command: '/notifications',
    nodeId: 'notifications',
    description: L('Notifications', 'Уведомления'),
  },
  {
    command: '/discover',
    nodeId: 'discover',
    description: L('Discover & market', 'Discover и рынок'),
  },
  {
    command: '/docs',
    nodeId: 'docs',
    description: L('Documentation', 'Документация'),
  },
  {
    command: '/safety',
    nodeId: 'safety',
    description: L('Safety & moderation', 'Безопасность и модерация'),
  },
  {
    command: '/payments',
    nodeId: 'payments',
    description: L('Payments & plan', 'Оплата и тариф'),
  },
  {
    command: '/bugs',
    nodeId: 'bugs',
    description: L('Technical issues', 'Технические вопросы'),
  },
  {
    command: '/support',
    nodeId: 'contact',
    description: L('Contact support', 'Связаться со специалистом'),
  },
];

/** Hidden aliases (not shown in /help) */
const SLASH_ALIASES = {
  '/human': '/support',
};

NODES.help = {
  body: L(
    'Support commands\n\n' +
      SLASH_COMMANDS.map((c) => `${c.command} — ${c.description.en}`).join('\n') +
      '\n\nType / in the message field for suggestions, or use the topic buttons.\nDocs: /docs/start/overview · Tickets: /docs/support',
    'Команды поддержки\n\n' +
      SLASH_COMMANDS.map((c) => `${c.command} — ${c.description.ru}`).join('\n') +
      '\n\nВведите / в поле сообщения для подсказок или используйте кнопки тем.\nДокументация: /docs/start/overview · Обращения: /docs/support'
  ),
  actions: [
    { id: 'root', label: A.mainMenuPlain },
    { id: 'docs', label: L('Documentation', 'Документация') },
    { id: 'contact', label: A.contact },
  ],
};

function listSlashCommands(locale) {
  const loc = normalizeLocale(locale);
  return SLASH_COMMANDS.map((c) => ({
    command: c.command,
    nodeId: c.nodeId,
    description: pick(loc, c.description),
  }));
}

/**
 * @returns {string|null} nodeId
 */
function resolveSlashCommand(text) {
  const raw = String(text || '').trim();
  const m = raw.match(/^\/([a-zA-Z0-9_]+)\s*$/i);
  if (!m) return null;
  let cmd = `/${m[1].toLowerCase()}`;
  if (SLASH_ALIASES[cmd]) cmd = SLASH_ALIASES[cmd];
  const found = SLASH_COMMANDS.find((c) => c.command === cmd);
  return found ? found.nodeId : null;
}

/** Lightweight keyword hint for free-text → suggested node (optional). */
function guessNodeFromText(text) {
  const slash = resolveSlashCommand(text);
  if (slash) return slash;

  const t = String(text || '').toLowerCase();
  if (/2fa|two.?factor|двухфактор|аутентификат|totp|парол|password|login|вход|сесс|session/.test(t)) {
    return 'account';
  }
  if (/community|сообществ|join|вступ|handle|store|приложен/.test(t)) return 'communities';
  if (/post|пост|like|лайк|repost|репост|comment|коммент|лент|feed|опрос|poll/.test(t)) return 'posts';
  if (/message|мессен|dm|чат|sticker|стикер/.test(t)) return 'messenger';
  if (/notif|уведомл|push|бейдж|badge/.test(t)) return 'notifications';
  if (/discover|market|монет|coin|портфел|portfolio|trading/.test(t)) return 'discover';
  if (/docs|документ|гайд|guide|howto|инструкц/.test(t)) return 'docs';
  if (/block|блок|report|жалоб|abuse|модерац|safety|безопасност/.test(t)) return 'safety';
  if (/pay|оплат|billing|тариф|plan|подписк|order|заказ/.test(t)) return 'payments';
  if (/bug|ошибк|баг|crash|не работ|blank|бел(ый|ая)|pwa/.test(t)) return 'bugs';
  if (/support|поддерж|human|человек|оператор|ticket|тикет/.test(t)) return 'contact';
  return null;
}

module.exports = {
  NODES,
  SLASH_COMMANDS,
  SLASH_ALIASES,
  resolveNode,
  getRootWelcome,
  resolveActionTarget,
  guessNodeFromText,
  resolveSlashCommand,
  listSlashCommands,
  normalizeLocale,
};
