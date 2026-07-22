/**
 * Interactive Mnoonx Support bot — FAQ tree + escalate to SupportTicket.
 * Bodies/labels are bilingual; resolve via locale ('ru' | 'en').
 */

function L(en, ru) {
  return { en, ru };
}

function pick(loc, pair) {
  if (!pair) return '';
  if (typeof pair === 'string') return pair;
  return loc === 'ru' ? pair.ru || pair.en : pair.en || pair.ru;
}

/** @typedef {{ id: string, label: {en:string,ru:string} }} BotActionDef */
/** @typedef {{ body: {en:string,ru:string}, actions?: BotActionDef[], expectInput?: 'ticket_description', ticketCategory?: 'bug'|'authentication'|'other' }} BotNode */

/** @type {Record<string, BotNode>} */
const NODES = {
  root: {
    body: L(
      'Hello! I am the Mnoonx support bot.\n\nI can answer common questions with quick tips, or connect you to a human agent.\n\nPick a topic below — or type /start anytime to open this menu again. Type / for all commands.',
      'Привет! Я бот поддержки Mnoonx.\n\nМогу подсказать по частым вопросам или передать обращение живому специалисту.\n\nВыберите тему ниже — или введите /start, чтобы снова открыть это меню. Введите /, чтобы увидеть команды.'
    ),
    actions: [
      { id: 'account', label: L('Account & security', 'Аккаунт и безопасность') },
      { id: 'communities', label: L('Communities', 'Сообщества') },
      { id: 'posts', label: L('Posts & feed', 'Посты и лента') },
      { id: 'messenger', label: L('Messenger', 'Мессенджер') },
      { id: 'payments', label: L('Payments & plan', 'Оплата и тариф') },
      { id: 'bugs', label: L('Bugs & technical issues', 'Ошибки и техника') },
      { id: 'contact', label: L('Talk to a human', 'Написать в поддержку') },
    ],
  },

  account: {
    body: L(
      'Account & security — what do you need?',
      'Аккаунт и безопасность — что нужно?'
    ),
    actions: [
      { id: 'account_login', label: L('Sign in / password', 'Вход и пароль') },
      { id: 'account_2fa', label: L('Two-factor authentication', 'Двухфакторная аутентификация') },
      { id: 'account_sessions', label: L('Sessions & devices', 'Сессии и устройства') },
      { id: 'account_profile', label: L('Profile, email, username', 'Профиль, email, username') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
      { id: 'contact', label: L('Talk to a human', 'Написать в поддержку') },
    ],
  },
  account_login: {
    body: L(
      'Sign in & password\n\n• Open Settings → Security to change your password.\n• Forgot password? Use “Forgot password” on the login screen — we’ll email a code.\n• Still locked out? Reset may take a few minutes; check spam.\n\nNeed more help?',
      'Вход и пароль\n\n• Смена пароля: Настройки → Безопасность.\n• Забыли пароль? На экране входа — «Забыли пароль», код придёт на email.\n• Не приходит код? Проверьте «Спам» и подождите пару минут.\n\nНужна ещё помощь?'
    ),
    actions: [
      { id: 'account_2fa', label: L('Set up 2FA', 'Настроить 2FA') },
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'contact', label: L('Still need help', 'Всё ещё нужна помощь') },
      { id: 'account', label: L('← Account menu', '← Меню аккаунта') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },
  account_2fa: {
    body: L(
      'Two-factor authentication (2FA)\n\n• Go to Settings → Security → Two-factor authentication.\n• Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.).\n• Enter the 6-digit code to finish setup.\n• To turn off 2FA you’ll need the code or your current password.\n\nWe recommend enabling 2FA for every account.',
      'Двухфакторная аутентификация (2FA)\n\n• Настройки → Безопасность → Двухфакторная аутентификация.\n• Отсканируйте QR в приложении (Google Authenticator, Authy и т.п.).\n• Введите 6-значный код для завершения.\n• Для отключения нужны код или текущий пароль.\n\nРекомендуем включить 2FA всем.'
    ),
    actions: [
      { id: 'account_sessions', label: L('Manage sessions', 'Управление сессиями') },
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'contact', label: L('Still need help', 'Всё ещё нужна помощь') },
      { id: 'account', label: L('← Account menu', '← Меню аккаунта') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },
  account_sessions: {
    body: L(
      'Sessions & devices\n\n• Settings → Security → Active sessions shows devices signed in to your account.\n• Use “Sign out this device” to revoke a session you don’t recognize.\n• After a password change, review sessions and revoke unknown ones.\n\nSaw a suspicious device?',
      'Сессии и устройства\n\n• Настройки → Безопасность → Активные сессии — список устройств.\n• «Выйти на этом устройстве» отзывает чужую или старую сессию.\n• После смены пароля проверьте список и завершите неизвестные сессии.\n\nВидите подозрительное устройство?'
    ),
    actions: [
      { id: 'contact', label: L('Report suspicious activity', 'Сообщить о подозрительной активности') },
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'account', label: L('← Account menu', '← Меню аккаунта') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },
  account_profile: {
    body: L(
      'Profile, email & username\n\n• Edit name, bio, avatar, and links in Settings → Edit profile.\n• Username appears in your profile URL (/@username).\n• Email is locked for security — contact support to change it.\n• Social links and website can be updated anytime in profile settings.',
      'Профиль, email и username\n\n• Имя, био, аватар и ссылки — Настройки → Редактировать профиль.\n• Username виден в адресе профиля (/@username).\n• Email защищён — смена только через поддержку.\n• Соцсети и сайт можно менять в настройках профиля.'
    ),
    actions: [
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'contact', label: L('Need email change', 'Нужна смена email') },
      { id: 'account', label: L('← Account menu', '← Меню аккаунта') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },

  communities: {
    body: L(
      'Communities — pick a topic:',
      'Сообщества — выберите тему:'
    ),
    actions: [
      { id: 'comm_create', label: L('Create a community', 'Создать сообщество') },
      { id: 'comm_join', label: L('Join / leave / private', 'Вступление / выход / приватные') },
      { id: 'comm_apps', label: L('Apps & store', 'Приложения и Store') },
      { id: 'comm_roles', label: L('Owner & posting rights', 'Владелец и право постить') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
      { id: 'contact', label: L('Talk to a human', 'Написать в поддержку') },
    ],
  },
  comm_create: {
    body: L(
      'Create a community\n\n• Use “Start a Community” from the sidebar or /create-community.\n• Choose a unique handle — it becomes /community/your-handle.\n• You become the owner and can install apps, set branding, and manage members.\n• Visibility (public/private) and join codes are in Community settings.',
      'Создание сообщества\n\n• «Создать сообщество» в сайдбаре или /create-community.\n• Уникальный handle станет адресом /community/your-handle.\n• Вы — владелец: приложения, брендинг, участники.\n• Публичность и код вступления — в настройках сообщества.'
    ),
    actions: [
      { id: 'comm_apps', label: L('About apps', 'Про приложения') },
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'contact', label: L('Still need help', 'Всё ещё нужна помощь') },
      { id: 'communities', label: L('← Communities', '← Сообщества') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },
  comm_join: {
    body: L(
      'Join, leave & private communities\n\n• Public communities: open the page and tap Join.\n• Private ones may ask for a join code from the owner.\n• Without access you’ll see a limited preview, not the full feed.\n• Leave from the community page or member menu.\n• Discover lists all communities, including private (you still need access to enter).',
      'Вступление, выход и приватные сообщества\n\n• Публичные: откройте страницу и нажмите Join.\n• Приватные могут запросить код от владельца.\n• Без доступа — только превью, не полная лента.\n• Выйти можно со страницы сообщества.\n• Discover показывает все сообщества, но внутрь приватного без доступа не попасть.'
    ),
    actions: [
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'contact', label: L('Still need help', 'Всё ещё нужна помощь') },
      { id: 'communities', label: L('← Communities', '← Сообщества') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },
  comm_apps: {
    body: L(
      'Community apps & Store\n\n• Owners install apps from the Community Store (chat, courses, files, events, announcements, AI, kanban, forms…).\n• Each install is an instance with its own title and visibility.\n• Members see apps the owner made visible.\n• Open an app from the community left sidebar.',
      'Приложения и Store\n\n• Владелец ставит приложения из Community Store (чат, курсы, файлы, события, объявления, AI, канбан, формы…).\n• Каждая установка — отдельный экземпляр с названием и видимостью.\n• Участники видят то, что разрешил владелец.\n• Открывайте приложения в левой панели сообщества.'
    ),
    actions: [
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'contact', label: L('Still need help', 'Всё ещё нужна помощь') },
      { id: 'communities', label: L('← Communities', '← Сообщества') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },
  comm_roles: {
    body: L(
      'Owner & who can post\n\n• The creator is the owner and always can post.\n• In settings, owners can allow or disallow members posting (membersCanPost).\n• Only the owner manages branding, apps, join code, and deletion.\n• Dashboard (/dashboard/:handle) is for owners.',
      'Владелец и кто может постить\n\n• Создатель — владелец, всегда может публиковать.\n• В настройках владелец включает/выключает посты участников (membersCanPost).\n• Брендинг, приложения, код вступления и удаление — только владелец.\n• Dashboard (/dashboard/:handle) — для владельцев.'
    ),
    actions: [
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'contact', label: L('Still need help', 'Всё ещё нужна помощь') },
      { id: 'communities', label: L('← Communities', '← Сообщества') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },

  posts: {
    body: L(
      'Posts & feed — pick a topic:',
      'Посты и лента — выберите тему:'
    ),
    actions: [
      { id: 'posts_create', label: L('Create & edit posts', 'Создание и редактирование') },
      { id: 'posts_engage', label: L('Likes, reposts, quotes', 'Лайки, репосты, цитаты') },
      { id: 'posts_comments', label: L('Comments', 'Комментарии') },
      { id: 'posts_visibility', label: L('Where posts appear', 'Где видны посты') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
      { id: 'contact', label: L('Talk to a human', 'Написать в поддержку') },
    ],
  },
  posts_create: {
    body: L(
      'Create & edit posts\n\n• Compose from Home or inside a community (if you’re allowed to post).\n• You can attach links, media, and coins where available.\n• Open the ⋯ menu on your post to edit or delete.\n• Quotes let you share another post with your commentary.',
      'Создание и редактирование\n\n• Пишите с главной или внутри сообщества (если есть право).\n• Можно прикреплять ссылки, медиа и монеты.\n• Меню ⋯ на своём посте — редактировать или удалить.\n• Цитата — репост чужого поста со своим комментарием.'
    ),
    actions: [
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'contact', label: L('Still need help', 'Всё ещё нужна помощь') },
      { id: 'posts', label: L('← Posts menu', '← Меню постов') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },
  posts_engage: {
    body: L(
      'Likes, reposts & quotes\n\n• Like and repost from the action bar under a post.\n• Counts and your state (liked/reposted) sync from the server.\n• Quote creates a new post referencing the original.\n• Bookmark saves a post for later (if enabled on your build).',
      'Лайки, репосты и цитаты\n\n• Лайк и репост — кнопки под постом.\n• Счётчики и ваш статус приходят с сервера.\n• Цитата создаёт новый пост со ссылкой на оригинал.\n• Закладка сохраняет пост на потом (если функция включена).'
    ),
    actions: [
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'contact', label: L('Still need help', 'Всё ещё нужна помощь') },
      { id: 'posts', label: L('← Posts menu', '← Меню постов') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },
  posts_comments: {
    body: L(
      'Comments\n\n• Open a post to comment or reply inline in the feed.\n• You can reply to a specific comment.\n• Authors can manage (delete) their own comments.\n• Keep it respectful — report abuse from the profile/post menus when needed.',
      'Комментарии\n\n• Комментируйте на странице поста или прямо в ленте.\n• Можно ответить на конкретный комментарий.\n• Свои комментарии можно удалять.\n• При нарушениях — жалоба из меню поста/профиля.'
    ),
    actions: [
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'contact', label: L('Still need help', 'Всё ещё нужна помощь') },
      { id: 'posts', label: L('← Posts menu', '← Меню постов') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },
  posts_visibility: {
    body: L(
      'Where posts appear\n\n• Home feed: posts from people and communities you follow / joined.\n• Community feed: posts in that community.\n• Profile: posts you authored.\n• Discover helps find communities; Market and other tabs are separate surfaces.',
      'Где видны посты\n\n• Главная: посты от тех, на кого вы подписаны, и сообществ.\n• Лента сообщества: посты этого сообщества.\n• Профиль: ваши посты.\n• Discover — поиск сообществ; Market и другие вкладки — отдельные разделы.'
    ),
    actions: [
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'contact', label: L('Still need help', 'Всё ещё нужна помощь') },
      { id: 'posts', label: L('← Posts menu', '← Меню постов') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },

  messenger: {
    body: L(
      'Messenger — pick a topic:',
      'Мессенджер — выберите тему:'
    ),
    actions: [
      { id: 'msg_dm', label: L('Direct messages', 'Личные сообщения') },
      { id: 'msg_system', label: L('Team Mnoonx & Support chats', 'Чаты Team Mnoonx и Support') },
      { id: 'msg_media', label: L('Stickers, animoji, links', 'Стикеры, анимодзи, ссылки') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
      { id: 'contact', label: L('Talk to a human', 'Написать в поддержку') },
    ],
  },
  msg_dm: {
    body: L(
      'Direct messages\n\n• Open a profile and start a chat, or search users in Messenger.\n• Each person has their own inbox copy of the conversation.\n• You can pin messages, reply, hide a chat, block, or report.\n• Unread badges update from Messages in the header.',
      'Личные сообщения\n\n• Напишите из профиля или найдите человека в Мессенджере.\n• У каждого свой inbox со своей копией переписки.\n• Можно закреплять, отвечать, скрывать чат, блокировать и жаловаться.\n• Непрочитанные — бейдж Messages в шапке.'
    ),
    actions: [
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'contact', label: L('Still need help', 'Всё ещё нужна помощь') },
      { id: 'messenger', label: L('← Messenger', '← Мессенджер') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },
  msg_system: {
    body: L(
      'System chats\n\n• Team Mnoonx is a read-only official channel (announcements).\n• Mnoonx Support is this chat — bot tips or human tickets.\n• System chats can’t be deleted.\n• You’re chatting with me right now 👋',
      'Системные чаты\n\n• Team Mnoonx — официальный канал только для чтения.\n• Mnoonx Support — этот чат: бот или тикет человеку.\n• Системные чаты нельзя удалить.\n• Сейчас вы как раз здесь 👋'
    ),
    actions: [
      { id: 'root', label: L('Browse topics', 'Смотреть темы') },
      { id: 'contact', label: L('Talk to a human', 'Написать в поддержку') },
      { id: 'messenger', label: L('← Messenger', '← Мессенджер') },
    ],
  },
  msg_media: {
    body: L(
      'Stickers, animoji & links\n\n• Attach menu: animoji, stickers, and coins.\n• External links open with a safety prompt (in-app browser or new tab).\n• Link previews may appear for supported URLs.\n• You can change how links open in Settings → Security.',
      'Стикеры, анимодзи и ссылки\n\n• Меню вложений: анимодзи, стикеры и монеты.\n• Внешние ссылки — с подтверждением (браузер в приложении или новая вкладка).\n• Для части ссылок есть превью.\n• Как открывать ссылки — Настройки → Безопасность.'
    ),
    actions: [
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'contact', label: L('Still need help', 'Всё ещё нужна помощь') },
      { id: 'messenger', label: L('← Messenger', '← Мессенджер') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },

  payments: {
    body: L(
      'Payments & plan\n\nBilling is rolling out gradually.\n\n• Settings → Payments / Orders show saved methods and history when available.\n• Community memberships and products will appear under Orders.\n• Plan page (/plan) describes upcoming tiers.\n\nFor billing disputes or failed charges, contact a human with the approximate time and amount.',
      'Оплата и тариф\n\nБиллинг подключается постепенно.\n\n• Настройки → Оплата / Заказы — способы оплаты и история, когда доступно.\n• Подписки и продукты сообществ появятся в Заказах.\n• Страница /plan — про будущие тарифы.\n\nСпоры по оплате или сбой списания — напишите человеку, укажите время и сумму.'
    ),
    actions: [
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'contact', label: L('Billing issue — contact support', 'Проблема с оплатой — в поддержку') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },

  bugs: {
    body: L(
      'Bugs & technical issues — what best matches?',
      'Ошибки и техника — что ближе?'
    ),
    actions: [
      { id: 'bugs_load', label: L('Page won’t load / blank', 'Страница не грузится / пустая') },
      { id: 'bugs_mobile', label: L('Mobile / PWA issues', 'Мобильные / PWA') },
      { id: 'bugs_browser', label: L('External links / in-app browser', 'Ссылки / браузер в приложении') },
      { id: 'contact', label: L('Report a bug to humans', 'Сообщить об ошибке человеку') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },
  bugs_load: {
    body: L(
      'Page won’t load\n\n• Hard-refresh (Ctrl/Cmd+Shift+R) or clear site cache.\n• Check you’re online; try another network.\n• Sign out and back in if data looks stuck.\n• Note the URL and approximate time — that helps support a lot.\n\nIf it keeps happening, open a ticket with steps to reproduce.',
      'Страница не грузится\n\n• Жёсткое обновление (Ctrl/Cmd+Shift+R) или очистка кэша сайта.\n• Проверьте сеть, попробуйте другой интернет.\n• Выйдите и войдите снова, если данные «зависли».\n• Запомните URL и время — это сильно помогает.\n\nЕсли повторяется — тикет с шагами воспроизведения.'
    ),
    actions: [
      { id: 'contact', label: L('Open a bug ticket', 'Открыть тикет об ошибке') },
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'bugs', label: L('← Bugs menu', '← Меню ошибок') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },
  bugs_mobile: {
    body: L(
      'Mobile & PWA\n\n• Add MNOONX to your home screen for the installed experience.\n• Pull-to-refresh works on main feeds where enabled.\n• Edge swipe goes back on mobile.\n• If the bottom nav or keyboard covers content, rotate once or relaunch the PWA.\n\nStill broken? Send device + browser version to support.',
      'Мобильные и PWA\n\n• Добавьте MNOONX на домашний экран для режима приложения.\n• Pull-to-refresh — на основных лентах.\n• Свайп от края — назад.\n• Если нижняя навигация или клавиатура перекрывают контент — переверните экран или перезапустите PWA.\n\nНе помогло — напишите модель устройства и браузер.'
    ),
    actions: [
      { id: 'contact', label: L('Open a bug ticket', 'Открыть тикет об ошибке') },
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'bugs', label: L('← Bugs menu', '← Меню ошибок') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },
  bugs_browser: {
    body: L(
      'Links & in-app browser\n\n• Some sites block embedding — use “Open in new tab”.\n• Settings → Security → Opening links: always ask / open in MNOONX / new tab.\n• Browsers (including MNOONX) may use info about visited links.\n• Blank page inside the app usually means the site blocked framing.',
      'Ссылки и браузер в приложении\n\n• Некоторые сайты запрещают встраивание — «Открыть в новой вкладке».\n• Настройки → Безопасность → Открытие ссылок: спрашивать / в MNOONX / новая вкладка.\n• Браузеры (в т.ч. MNOONX) могут использовать данные о посещённых ссылках.\n• Пустая страница внутри обычно значит, что сайт запретил показ во фрейме.'
    ),
    actions: [
      { id: 'helpful_yes', label: L('Thanks, that helped', 'Спасибо, помогло') },
      { id: 'contact', label: L('Still need help', 'Всё ещё нужна помощь') },
      { id: 'bugs', label: L('← Bugs menu', '← Меню ошибок') },
      { id: 'root', label: L('← Main menu', '← Главное меню') },
    ],
  },

  helpful_yes: {
    body: L(
      'Glad that helped! 🎉\n\nIf anything else comes up, open the main menu anytime.',
      'Рад, что помогло! 🎉\n\nЕсли появится ещё вопрос — снова откройте главное меню.'
    ),
    actions: [
      { id: 'root', label: L('Main menu', 'Главное меню') },
      { id: 'contact', label: L('Talk to a human', 'Написать в поддержку') },
    ],
  },

  contact: {
    body: L(
      'Connect with a human specialist\n\nChoose a category for your ticket. After that, describe the problem in one message — our team will see it in the admin support inbox.',
      'Связь с живым специалистом\n\nВыберите категорию тикета. Затем опишите проблему одним сообщением — команда увидит обращение в админке поддержки.'
    ),
    actions: [
      { id: 'ticket_auth', label: L('Login / account / 2FA', 'Вход / аккаунт / 2FA') },
      { id: 'ticket_bug', label: L('Bug / something broken', 'Ошибка / что-то сломалось') },
      { id: 'ticket_other', label: L('Other question', 'Другой вопрос') },
      { id: 'root', label: L('← Back to bot topics', '← К темам бота') },
    ],
  },
  ticket_auth: {
    body: L(
      'Authentication ticket\n\nPlease write one message with:\n• what you tried\n• what went wrong\n• your username (if relevant)\n\nI’ll create a support ticket for the team. Max ~500 characters.',
      'Тикет: вход и аккаунт\n\nНапишите одним сообщением:\n• что делали\n• что пошло не так\n• ваш username (если важно)\n\nЯ создам тикет для команды. До ~500 символов.'
    ),
    expectInput: 'ticket_description',
    ticketCategory: 'authentication',
    actions: [
      { id: 'contact', label: L('← Change category', '← Сменить категорию') },
      { id: 'root', label: L('Cancel — main menu', 'Отмена — главное меню') },
    ],
  },
  ticket_bug: {
    body: L(
      'Bug report ticket\n\nPlease write one message with:\n• steps to reproduce\n• what you expected vs what happened\n• device / browser if you know\n\nI’ll create a support ticket. Max ~500 characters.',
      'Тикет: ошибка\n\nНапишите одним сообщением:\n• шаги воспроизведения\n• что ожидали и что получили\n• устройство / браузер, если знаете\n\nЯ создам тикет. До ~500 символов.'
    ),
    expectInput: 'ticket_description',
    ticketCategory: 'bug',
    actions: [
      { id: 'contact', label: L('← Change category', '← Сменить категорию') },
      { id: 'root', label: L('Cancel — main menu', 'Отмена — главное меню') },
    ],
  },
  ticket_other: {
    body: L(
      'General support ticket\n\nDescribe your question in one message. Include links or community handles if useful.\n\nI’ll create a support ticket for the team. Max ~500 characters.',
      'Общий тикет поддержки\n\nОпишите вопрос одним сообщением. Можно добавить ссылки или handle сообщества.\n\nЯ создам тикет для команды. До ~500 символов.'
    ),
    expectInput: 'ticket_description',
    ticketCategory: 'other',
    actions: [
      { id: 'contact', label: L('← Change category', '← Сменить категорию') },
      { id: 'root', label: L('Cancel — main menu', 'Отмена — главное меню') },
    ],
  },

  ticket_created: {
    body: L(
      'Ticket created ✅\n\nOur team can see it in the admin support panel. You’ll also find it under Docs → Support.\n\nTypical first reply is within a few hours. Anything else I can help with in the bot?',
      'Тикет создан ✅\n\nКоманда видит его в админке поддержки. Также он в Docs → Support.\n\nОбычно первый ответ — в течение нескольких часов. Чем ещё помочь в боте?'
    ),
    actions: [
      { id: 'root', label: L('Main menu', 'Главное меню') },
      { id: 'contact', label: L('Open another ticket', 'Открыть ещё тикет') },
    ],
  },

  free_text_fallback: {
    body: L(
      'I work best with the topic buttons below.\n\nPick a topic for a quick answer, or talk to a human if you need a personal reply.',
      'Лучше всего я отвечаю по кнопкам тем ниже.\n\nВыберите тему для быстрого ответа или напишите человеку, если нужен личный разбор.'
    ),
    actions: [
      { id: 'account', label: L('Account & security', 'Аккаунт и безопасность') },
      { id: 'communities', label: L('Communities', 'Сообщества') },
      { id: 'posts', label: L('Posts & feed', 'Посты и лента') },
      { id: 'messenger', label: L('Messenger', 'Мессенджер') },
      { id: 'payments', label: L('Payments & plan', 'Оплата и тариф') },
      { id: 'bugs', label: L('Bugs & technical', 'Ошибки и техника') },
      { id: 'contact', label: L('Talk to a human', 'Написать в поддержку') },
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

/** Slash commands available in Mnoonx Support chat */
const SLASH_COMMANDS = [
  {
    command: '/start',
    nodeId: 'root',
    description: L('Main menu and topics', 'Главное меню и темы'),
  },
  {
    command: '/help',
    nodeId: 'help',
    description: L('List bot commands', 'Список команд бота'),
  },
  {
    command: '/menu',
    nodeId: 'root',
    description: L('Same as /start', 'То же, что /start'),
  },
  {
    command: '/account',
    nodeId: 'account',
    description: L('Account & security', 'Аккаунт и безопасность'),
  },
  {
    command: '/communities',
    nodeId: 'communities',
    description: L('Communities help', 'Помощь по сообществам'),
  },
  {
    command: '/posts',
    nodeId: 'posts',
    description: L('Posts & feed', 'Посты и лента'),
  },
  {
    command: '/messenger',
    nodeId: 'messenger',
    description: L('Messenger tips', 'Подсказки по мессенджеру'),
  },
  {
    command: '/payments',
    nodeId: 'payments',
    description: L('Payments & plan', 'Оплата и тариф'),
  },
  {
    command: '/bugs',
    nodeId: 'bugs',
    description: L('Bugs & technical issues', 'Ошибки и техника'),
  },
  {
    command: '/support',
    nodeId: 'contact',
    description: L('Talk to a human', 'Написать человеку'),
  },
  {
    command: '/human',
    nodeId: 'contact',
    description: L('Talk to a human', 'Написать человеку'),
  },
];

NODES.help = {
  body: L(
    'Support bot commands\n\n' +
      SLASH_COMMANDS.map((c) => `${c.command} — ${c.description.en}`).join('\n') +
      '\n\nType / in the message field to see suggestions. You can also use the topic buttons.',
    'Команды бота поддержки\n\n' +
      SLASH_COMMANDS.map((c) => `${c.command} — ${c.description.ru}`).join('\n') +
      '\n\nВведите / в поле сообщения, чтобы увидеть подсказки. Также можно пользоваться кнопками тем.'
  ),
  actions: [
    { id: 'root', label: L('Main menu', 'Главное меню') },
    { id: 'contact', label: L('Talk to a human', 'Написать в поддержку') },
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
  const cmd = `/${m[1].toLowerCase()}`;
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
  if (/post|пост|like|лайк|repost|репост|comment|коммент|лент|feed/.test(t)) return 'posts';
  if (/message|мессен|dm|чат|sticker|стикер/.test(t)) return 'messenger';
  if (/pay|оплат|billing|тариф|plan|подписк/.test(t)) return 'payments';
  if (/bug|ошибк|баг|crash|не работ|blank|бел(ый|ая)|pwa/.test(t)) return 'bugs';
  if (/support|поддерж|human|человек|оператор|ticket|тикет/.test(t)) return 'contact';
  return null;
}

module.exports = {
  NODES,
  SLASH_COMMANDS,
  resolveNode,
  getRootWelcome,
  resolveActionTarget,
  guessNodeFromText,
  resolveSlashCommand,
  listSlashCommands,
  normalizeLocale,
};
