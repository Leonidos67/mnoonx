import { Ticket, User, ActivityLog, View, Employee } from '../types';

export const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'Алекс Джонсон',
    email: 'alex.johnson@example.com',
    avatar: 'AJ'
  },
  {
    id: 'user2',
    name: 'Сара Уильямс',
    email: 'sarah.williams@primer.ru',
    avatar: 'SW'
  },
  {
    id: 'user3',
    name: 'Майкл Чен',
    email: 'michael.chen@primer.ru',
    avatar: 'МЧ'
  },
  {
    id: 'user4',
    name: 'Эмма Дэвис',
    email: 'emma.davis@primer.ru',
    avatar: 'ЭД'
  }
];

export const mockActivityLogs: ActivityLog[] = [
  {
    id: 'act1',
    timestamp: '2023-06-15T10:30:00Z',
    action: 'Создана заявка',
    description: 'Заявка создана службой поддержки',
    user: mockUsers[0]
  },
  {
    id: 'act2',
    timestamp: '2023-06-15T11:15:00Z',
    action: 'Назначена',
    description: 'Назначена Майклу Чену',
    user: mockUsers[1]
  },
  {
    id: 'act3',
    timestamp: '2023-06-15T14:20:00Z',
    action: 'Статус обновлен',
    description: 'Статус изменен на в ожидании',
    user: mockUsers[2]
  },
  {
    id: 'act4',
    timestamp: '2023-06-16T09:45:00Z',
    action: 'Комментарий добавлен',
    description: 'Изучение сообщенной проблемы',
    user: mockUsers[2]
  },
  {
    id: 'act5',
    timestamp: '2023-06-16T12:10:00Z',
    action: 'База знаний',
    description: 'Упомянута статья из базы знаний №KB-12345',
    user: mockUsers[3]
  }
];

export const mockTickets: Ticket[] = [
  {
    id: '1',
    ticketId: 'TKT-001',
    title: 'Проблемы с входом в новую систему аутентификации',
    description: 'Пользователи испытывают трудности с входом после недавнего обновления системы аутентификации. Множественные сообщения о недействительных учетных данных несмотря на правильный ввод.',
    category: 'Техническая поддержка',
    status: 'open',
    priority: 'high',
    assignee: mockUsers[2],
    createdAt: '2023-06-15T08:30:00Z',
    updatedAt: '2023-06-16T12:10:00Z',
    confidenceScore: 87,
    aiSummary: 'Несколько пользователей пострадали от сбоя аутентификации. Вероятно, связано с недавней интеграцией OAuth. Рекомендуется проверить действительность сертификатов и процесс аутентификации.',
    resolutionSteps: [
      'Проверьте действительность сертификатов OAuth',
      'Проверьте логи службы аутентификации',
      'Протестируйте с примером учетных данных',
      'Откатите изменения при необходимости'
    ],
    knowledgeBaseRefs: ['KB-12345', 'KB-67890'],
    activityLogs: [mockActivityLogs[0], mockActivityLogs[1], mockActivityLogs[2], mockActivityLogs[3], mockActivityLogs[4]]
  },
  {
    id: '2',
    ticketId: 'TKT-002',
    title: 'Ухудшение производительности в модуле отчетов',
    description: 'Модуль отчетов требует значительно больше времени для генерации отчетов по сравнению с предыдущими версиями. Пользователи сообщают о таймаутах при выполнении сложных отчетов.',
    category: 'Производительность',
    status: 'pending',
    priority: 'medium',
    assignee: mockUsers[1],
    createdAt: '2023-06-14T14:20:00Z',
    updatedAt: '2023-06-16T10:15:00Z',
    confidenceScore: 72,
    aiSummary: 'Выявлено узкое место производительности в оптимизации запросов к базе данных. Проблемы с индексированием вызывают медленную генерацию отчетов. Рекомендуется изучить планы выполнения запросов.',
    resolutionSteps: [
      'Проанализируйте производительность запросов к базе данных',
      'Изучите стратегию индексирования',
      'Оптимизируйте медленно работающие запросы',
      'Мониторьте после изменений'
    ],
    knowledgeBaseRefs: ['KB-23456'],
    activityLogs: [mockActivityLogs[0], mockActivityLogs[1], mockActivityLogs[2], mockActivityLogs[3]]
  },
  {
    id: '3',
    ticketId: 'TKT-003',
    title: 'Несоответствие интерфейса в мобильной версии',
    description: 'Меню навигации отображается неправильно на мобильных устройствах. Элементы перекрываются, а сенсорные зоны слишком малы.',
    category: 'Интерфейс/UX',
    status: 'resolved',
    priority: 'low',
    assignee: mockUsers[0],
    createdAt: '2023-06-13T09:15:00Z',
    updatedAt: '2023-06-15T16:45:00Z',
    confidenceScore: 95,
    aiSummary: 'Проблема с медиа-запросами CSS вызывает проблемы с макетом на мобильных экранах. Подтверждено, что исправление применено и протестировано на нескольких устройствах.',
    resolutionSteps: [
      'Выявлены проблемные медиа-запросы CSS',
      'Исправлены проблемы с макетом flexbox',
      'Протестировано на нескольких размерах устройств',
      'Исправление развернуто на промежуточном сервере'
    ],
    knowledgeBaseRefs: [],
    activityLogs: [mockActivityLogs[0], mockActivityLogs[1], mockActivityLogs[4]]
  },
  {
    id: '4',
    ticketId: 'TKT-004',
    title: 'Сбой интеграции со сторонним API',
    description: 'Интеграция с API платежного шлюза возвращает ошибки. Транзакции периодически завершаются неудачно.',
    category: 'Интеграция',
    status: 'escalated',
    priority: 'critical',
    assignee: mockUsers[3],
    createdAt: '2023-06-16T07:45:00Z',
    updatedAt: '2023-06-16T11:30:00Z',
    confidenceScore: 65,
    aiSummary: 'Ограничение частоты запросов к API или проблема с аутентификацией платежного шлюза. Проверьте ключи API и ограничения частоты. Рассмотрите возможность реализации механизма повторных попыток.',
    resolutionSteps: [
      'Проверьте учетные данные и разрешения API',
      'Проверьте статус ограничения частоты',
      'Реализуйте экспоненциальную задержку',
      'Обратитесь в службу поддержки платежного шлюза'
    ],
    knowledgeBaseRefs: ['KB-34567', 'KB-45678'],
    activityLogs: [mockActivityLogs[0], mockActivityLogs[1], mockActivityLogs[2]]
  },
  {
    id: '5',
    ticketId: 'TKT-005',
    title: 'Уведомления по электронной почте не отправляются',
    description: 'Пользователи не получают уведомления по электронной почте о важных обновлениях. Проверенные настройки электронной почты кажутся правильными.',
    category: 'Коммуникация',
    status: 'open',
    priority: 'medium',
    assignee: mockUsers[1],
    createdAt: '2023-06-15T11:20:00Z',
    updatedAt: '2023-06-16T09:20:00Z',
    confidenceScore: 78,
    aiSummary: 'Выявлена проблема обработки очереди электронной почты. Поставщик услуг может блокировать письма из-за проблем с репутацией. Необходимо проверить логи SMTP.',
    resolutionSteps: [
      'Проверьте статус очереди электронной почты',
      'Изучите логи сервера SMTP',
      'Проверьте репутацию отправителя',
      'Протестируйте доставку электронной почты'
    ],
    knowledgeBaseRefs: ['KB-56789'],
    activityLogs: [mockActivityLogs[0], mockActivityLogs[1], mockActivityLogs[3]]
  },
  {
    id: '6',
    ticketId: 'TKT-006',
    title: 'Отсутствуют данные в функции экспорта',
    description: 'При экспорте отчетов в формат CSV определенные столбцы отображаются пустыми, несмотря на наличие данных в приложении.',
    category: 'Экспорт данных',
    status: 'pending',
    priority: 'medium',
    assignee: mockUsers[0],
    createdAt: '2023-06-14T16:30:00Z',
    updatedAt: '2023-06-16T08:15:00Z',
    confidenceScore: 82,
    aiSummary: 'Проблема сопоставления данных в функции экспорта, из-за которой определенные поля не включаются в вывод. Связано с недавними изменениями схемы.',
    resolutionSteps: [
      'Изучите логику функции экспорта',
      'Проверьте конфигурацию сопоставления данных',
      'Протестируйте экспорт с различными наборами данных',
      'Обновите шаблоны экспорта'
    ],
    knowledgeBaseRefs: ['KB-67890'],
    activityLogs: [mockActivityLogs[0], mockActivityLogs[2], mockActivityLogs[3]]
  }
];

export const mockEmployees: Employee[] = [
  {
    id: 'emp-001',
    name: 'Александр Петров',
    email: 'alexander.petrov@company.com',
    avatar: 'AP',
    type: 'human',
    role: 'Главный специалист поддержки',
    status: 'online',
    workload: 65,
    channels: ['chat', 'email'],
    aiCapabilities: ['автоматическая маршрутизация', 'анализ тональности'],
    availability: {
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: { start: '10:00', end: '14:00' },
      sunday: { start: '10:00', end: '14:00' },
    },
    aiSettings: {
      capabilities: {
        automateRouting: true,
        sentimentAnalysis: true,
        smartResponses: false,
        escalationRules: true,
      },
      communicationStyle: 'professional',
      escalationConditions: {
        customerFrustration: true,
        complexIssue: true,
        predefinedTime: false,
      },
    },
    skills: ['техническая поддержка', 'решение проблем', 'работа с клиентами'],
    joinDate: '2022-03-15',
    lastActive: '2023-06-16T10:30:00Z',
  },
  {
    id: 'emp-002',
    name: 'Елена Смирнова',
    email: 'elena.smirnova@company.com',
    avatar: 'ES',
    type: 'human',
    role: 'Старший специалист',
    status: 'busy',
    workload: 85,
    channels: ['chat', 'call', 'email'],
    aiCapabilities: ['умные ответы', 'правила эскалации'],
    availability: {
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: { start: '10:00', end: '14:00' },
      sunday: { start: '10:00', end: '14:00' },
    },
    aiSettings: {
      capabilities: {
        automateRouting: false,
        sentimentAnalysis: true,
        smartResponses: true,
        escalationRules: true,
      },
      communicationStyle: 'friendly',
      escalationConditions: {
        customerFrustration: true,
        complexIssue: false,
        predefinedTime: true,
      },
    },
    skills: ['работа с жалобами', 'VIP-клиенты', 'ведение переговоров'],
    joinDate: '2021-11-22',
    lastActive: '2023-06-16T11:15:00Z',
  },
  {
    id: 'emp-003',
    name: 'Анна Иванова',
    email: 'anna.ivanova@company.com',
    avatar: 'AI',
    type: 'human',
    role: 'Специалист по качеству',
    status: 'offline',
    workload: 0,
    channels: ['email'],
    aiCapabilities: ['анализ эффективности'],
    availability: {
      monday: { start: '10:00', end: '19:00' },
      tuesday: { start: '10:00', end: '19:00' },
      wednesday: { start: '10:00', end: '19:00' },
      thursday: { start: '10:00', end: '19:00' },
      friday: { start: '10:00', end: '18:00' },
      saturday: { start: '11:00', end: '15:00' },
      sunday: { start: '11:00', end: '15:00' },
    },
    aiSettings: {
      capabilities: {
        automateRouting: false,
        sentimentAnalysis: false,
        smartResponses: true,
        escalationRules: false,
      },
      communicationStyle: 'empathetic',
      escalationConditions: {
        customerFrustration: false,
        complexIssue: true,
        predefinedTime: false,
      },
    },
    skills: ['оценка качества', 'обратная связь', 'обучение'],
    joinDate: '2023-01-10',
    lastActive: '2023-06-15T16:45:00Z',
  },
  {
    id: 'ai-001',
    name: 'Ассистент-бот',
    email: 'assistant-bot@company.com',
    avatar: 'AB',
    type: 'ai',
    role: 'AI-ассистент поддержки',
    status: 'online',
    workload: 95,
    channels: ['chat', 'email'],
    aiCapabilities: ['автоматическая маршрутизация', 'анализ тональности', 'умные ответы', 'правила эскалации'],
    availability: {
      monday: { start: '00:00', end: '23:59' },
      tuesday: { start: '00:00', end: '23:59' },
      wednesday: { start: '00:00', end: '23:59' },
      thursday: { start: '00:00', end: '23:59' },
      friday: { start: '00:00', end: '23:59' },
      saturday: { start: '00:00', end: '23:59' },
      sunday: { start: '00:00', end: '23:59' },
    },
    aiSettings: {
      capabilities: {
        automateRouting: true,
        sentimentAnalysis: true,
        smartResponses: true,
        escalationRules: true,
      },
      communicationStyle: 'professional',
      escalationConditions: {
        customerFrustration: true,
        complexIssue: true,
        predefinedTime: false,
      },
    },
    skills: ['обработка запросов', 'маршрутизация', 'анализ'],
    joinDate: '2023-01-01',
    lastActive: '2023-06-16T12:10:00Z',
  },
  {
    id: 'emp-004',
    name: 'Дмитрий Волков',
    email: 'dmitry.volkov@company.com',
    avatar: 'DV',
    type: 'human',
    role: 'Технический специалист',
    status: 'auto',
    workload: 45,
    channels: ['chat', 'call'],
    aiCapabilities: ['автоматическая маршрутизация'],
    availability: {
      monday: { start: '08:00', end: '17:00' },
      tuesday: { start: '08:00', end: '17:00' },
      wednesday: { start: '08:00', end: '17:00' },
      thursday: { start: '08:00', end: '17:00' },
      friday: { start: '08:00', end: '16:00' },
      saturday: { start: '00:00', end: '00:00' },
      sunday: { start: '00:00', end: '00:00' },
    },
    aiSettings: {
      capabilities: {
        automateRouting: true,
        sentimentAnalysis: false,
        smartResponses: false,
        escalationRules: false,
      },
      communicationStyle: 'direct',
      escalationConditions: {
        customerFrustration: false,
        complexIssue: true,
        predefinedTime: false,
      },
    },
    skills: ['диагностика', 'решение технических проблем', 'интеграции'],
    joinDate: '2022-07-05',
    lastActive: '2023-06-16T09:45:00Z',
  },
];

export const mockViews: View[] = [
  { id: 'all', name: 'Все заявки', count: 24 },
  { id: 'new', name: 'Новые', count: 5 },
  { id: 'open', name: 'Открытые', count: 12 },
  { id: 'pending', name: 'В ожидании', count: 6 },
  { id: 'resolved', name: 'Решенные', count: 18 },
  { id: 'escalated', name: 'Эскалированные', count: 3 }
];