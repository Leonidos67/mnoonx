import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Settings2,
  Sparkles,
  Loader2,
  KeyRound,
  MessageSquareText,
  GraduationCap,
  Check,
  Plus,
  X,
} from 'lucide-react';
import AnimatedSendIcon, { type AnimatedSendIconHandle } from '../Common/AnimatedSendIcon';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/useTranslation';
import { COMMUNITIES_API as API } from '../../config/api';

interface CommunityAiPanelProps {
  handle: string;
  instanceId: string;
  instanceTitle?: string;
  isOwner: boolean;
  onBackToCommunity: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  done?: boolean;
}

interface AiConfig {
  provider: 'gemini' | 'openai';
  model: string;
  botName: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  chatEnabled: boolean;
  analyzePostsEnabled: boolean;
  analyzeChatEnabled: boolean;
  autoReplyInChat: boolean;
  linkedChatInstanceId: string;
  replyOnlyWhenMentioned: boolean;
  contextPostLimit: number;
  contextChatLimit: number;
  responseLanguage: string;
  onboardingEnabled: boolean;
  onboardingWelcomePrompt: string;
  onboardingRulesText: string;
  onboardingSteps: OnboardingStep[];
  onboardingPostToChat: boolean;
  hasApiKey: boolean;
  apiKeyLast4: string;
  isOwner?: boolean;
  chatInstances?: { id: string; title: string }[];
}

interface AiMessage {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  kind: 'chat' | 'analysis' | 'onboarding';
  createdAt: string;
  user?: { _id: string; username: string; fullName: string; avatar?: string } | null;
}

interface OnboardingState {
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  welcomeMessage: string;
  completedStepIds: string[];
  steps: OnboardingStep[];
  onboardingEnabled: boolean;
  botName: string;
  hasApiKey?: boolean;
  messages: AiMessage[];
}

type TabId = 'chat' | 'analyze' | 'onboarding' | 'settings';

const defaultOnboardingSteps: OnboardingStep[] = [
  {
    id: 'rules',
    title: 'Read the community rules',
    description: 'Ask the AI guide if anything is unclear.',
  },
  {
    id: 'intro',
    title: 'Introduce yourself',
    description: 'Tell the AI a bit about yourself or your goals.',
  },
  {
    id: 'explore',
    title: 'Explore the feed and apps',
    description: 'Open Home and installed apps to look around.',
  },
  {
    id: 'chat',
    title: 'Say hello in community chat',
    description: 'Post a short intro in the linked chat if available.',
  },
];

const CommunityAiPanel: React.FC<CommunityAiPanelProps> = ({
  handle,
  instanceId,
  instanceTitle,
  isOwner,
  onBackToCommunity,
}) => {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabId>('chat');
  const [config, setConfig] = useState<AiConfig | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeFocus, setAnalyzeFocus] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
  const [onboardInput, setOnboardInput] = useState('');
  const [onboardSending, setOnboardSending] = useState(false);
  const [onboardStarting, setOnboardStarting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const onboardBottomRef = useRef<HTMLDivElement>(null);
  const chatSendRef = useRef<AnimatedSendIconHandle>(null);
  const onboardSendRef = useRef<AnimatedSendIconHandle>(null);

  const [form, setForm] = useState({
    provider: 'gemini' as 'gemini' | 'openai',
    model: 'gemini-2.0-flash-lite',
    botName: 'Community AI',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 1024,
    chatEnabled: true,
    analyzePostsEnabled: true,
    analyzeChatEnabled: true,
    autoReplyInChat: false,
    linkedChatInstanceId: '',
    replyOnlyWhenMentioned: true,
    contextPostLimit: 25,
    contextChatLimit: 40,
    responseLanguage: 'auto',
    onboardingEnabled: false,
    onboardingWelcomePrompt: '',
    onboardingRulesText: '',
    onboardingSteps: defaultOnboardingSteps,
    onboardingPostToChat: true,
  });

  const applyConfigToForm = (cfg: AiConfig) => {
    setForm({
      provider: cfg.provider === 'openai' ? 'openai' : 'gemini',
      model: cfg.model || 'gemini-2.0-flash-lite',
      botName: cfg.botName || 'Community AI',
      systemPrompt: cfg.systemPrompt || '',
      temperature: cfg.temperature ?? 0.7,
      maxTokens: cfg.maxTokens ?? 1024,
      chatEnabled: cfg.chatEnabled !== false,
      analyzePostsEnabled: cfg.analyzePostsEnabled !== false,
      analyzeChatEnabled: cfg.analyzeChatEnabled !== false,
      autoReplyInChat: Boolean(cfg.autoReplyInChat),
      linkedChatInstanceId: cfg.linkedChatInstanceId || '',
      replyOnlyWhenMentioned: cfg.replyOnlyWhenMentioned !== false,
      contextPostLimit: cfg.contextPostLimit ?? 25,
      contextChatLimit: cfg.contextChatLimit ?? 40,
      responseLanguage: cfg.responseLanguage || 'auto',
      onboardingEnabled: Boolean(cfg.onboardingEnabled),
      onboardingWelcomePrompt: cfg.onboardingWelcomePrompt || '',
      onboardingRulesText: cfg.onboardingRulesText || '',
      onboardingSteps:
        Array.isArray(cfg.onboardingSteps) && cfg.onboardingSteps.length
          ? cfg.onboardingSteps.map((s) => ({
              id: s.id,
              title: s.title,
              description: s.description || '',
            }))
          : defaultOnboardingSteps,
      onboardingPostToChat: cfg.onboardingPostToChat !== false,
    });
  };

  const loadConfig = useCallback(async () => {
    if (!token || !handle || !instanceId) return null;
    const q = new URLSearchParams({ instanceId });
    const res = await fetch(`${API}/${encodeURIComponent(handle)}/ai/config?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as { message?: string }).message || t('community.aiPanel.loadFailed'));
    }
    return data as AiConfig;
  }, [token, handle, instanceId, t]);

  const loadMessages = useCallback(async () => {
    if (!token || !handle || !instanceId) return [];
    const q = new URLSearchParams({ instanceId });
    const res = await fetch(`${API}/${encodeURIComponent(handle)}/ai/messages?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => []);
    if (!res.ok) {
      throw new Error((data as { message?: string }).message || t('community.aiPanel.loadFailed'));
    }
    return Array.isArray(data) ? (data as AiMessage[]) : [];
  }, [token, handle, instanceId, t]);

  const loadOnboarding = useCallback(async () => {
    if (!token || !handle || !instanceId) return null;
    const q = new URLSearchParams({ instanceId });
    const res = await fetch(`${API}/${encodeURIComponent(handle)}/ai/onboarding?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return null;
    return data as OnboardingState;
  }, [token, handle, instanceId]);

  const refresh = useCallback(async () => {
    if (!token || !handle || !instanceId) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [cfg, msgs, onboard] = await Promise.all([
        loadConfig(),
        loadMessages(),
        loadOnboarding(),
      ]);
      if (cfg) {
        setConfig(cfg);
        applyConfigToForm(cfg);
      }
      setMessages(msgs);
      if (onboard) setOnboarding(onboard);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('community.aiPanel.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [token, handle, instanceId, loadConfig, loadMessages, loadOnboarding, t]);

  useEffect(() => {
    setLoading(true);
    setTab('chat');
    setApiKeyDraft('');
    void refresh();
  }, [refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, tab]);

  useEffect(() => {
    onboardBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [onboarding?.messages, tab]);

  const sendChat = async () => {
    const text = input.trim();
    if (!text || !token || sending) return;
    chatSendRef.current?.startAnimation();
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/ai/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ instanceId, content: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('community.aiPanel.sendFailed'));
        return;
      }
      const u = (data as { userMessage?: AiMessage }).userMessage;
      const a = (data as { assistantMessage?: AiMessage }).assistantMessage;
      setMessages((prev) => [...prev, ...(u ? [u] : []), ...(a ? [a] : [])]);
      setInput('');
    } catch {
      setError(t('community.networkError'));
    } finally {
      setSending(false);
    }
  };

  const runAnalyze = async () => {
    if (!token || analyzing) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ instanceId, focus: analyzeFocus.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('community.aiPanel.analyzeFailed'));
        return;
      }
      const msg = (data as { message?: AiMessage }).message;
      if (msg) setMessages((prev) => [...prev, msg]);
      setTab('chat');
    } catch {
      setError(t('community.networkError'));
    } finally {
      setAnalyzing(false);
    }
  };

  const startOnboarding = async (regenerate = false) => {
    if (!token || onboardStarting) return;
    setOnboardStarting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/ai/onboarding/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ instanceId, regenerate }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('community.aiPanel.onboardStartFailed'));
        return;
      }
      setOnboarding(data as OnboardingState);
    } catch {
      setError(t('community.networkError'));
    } finally {
      setOnboardStarting(false);
    }
  };

  const sendOnboardingMessage = async () => {
    const text = onboardInput.trim();
    if (!text || !token || onboardSending) return;
    onboardSendRef.current?.startAnimation();
    setOnboardSending(true);
    setError(null);
    try {
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/ai/onboarding/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ instanceId, content: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('community.aiPanel.sendFailed'));
        return;
      }
      const u = (data as { userMessage?: AiMessage }).userMessage;
      const a = (data as { assistantMessage?: AiMessage }).assistantMessage;
      const prog = (data as { progress?: OnboardingState }).progress;
      setOnboarding((prev) => {
        const base = prog ? { ...prev, ...prog } : prev;
        const prevMsgs = prev?.messages || [];
        return {
          ...(base as OnboardingState),
          messages: [...prevMsgs, ...(u ? [u] : []), ...(a ? [a] : [])],
        };
      });
      setOnboardInput('');
    } catch {
      setError(t('community.networkError'));
    } finally {
      setOnboardSending(false);
    }
  };

  const toggleStep = async (stepId: string, done: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/ai/onboarding/step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ instanceId, stepId, done }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('community.aiPanel.onboardStepFailed'));
        return;
      }
      setOnboarding((prev) =>
        prev
          ? {
              ...prev,
              ...(data as OnboardingState),
              messages: prev.messages,
            }
          : (data as OnboardingState)
      );
    } catch {
      setError(t('community.networkError'));
    }
  };

  const finishOnboarding = async (action: 'complete' | 'skip') => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/ai/onboarding/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ instanceId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('community.aiPanel.onboardFinishFailed'));
        return;
      }
      setOnboarding((prev) =>
        prev
          ? { ...prev, ...(data as OnboardingState), messages: prev.messages }
          : (data as OnboardingState)
      );
    } catch {
      setError(t('community.networkError'));
    }
  };

  const saveSettings = async () => {
    if (!token || !isOwner || saving) return;
    setSaving(true);
    setSaveMsg(null);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        instanceId,
        ...form,
        onboardingSteps: form.onboardingSteps.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
        })),
      };
      if (apiKeyDraft.trim()) body.apiKey = apiKeyDraft.trim();
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/ai/config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('community.aiPanel.saveFailed'));
        return;
      }
      setConfig(data as AiConfig);
      applyConfigToForm(data as AiConfig);
      setApiKeyDraft('');
      setSaveMsg(t('community.aiPanel.saved'));
      window.setTimeout(() => setSaveMsg(null), 2000);
    } catch {
      setError(t('community.networkError'));
    } finally {
      setSaving(false);
    }
  };

  const testKey = async () => {
    if (!token || !isOwner || testing) return;
    setTesting(true);
    setError(null);
    setSaveMsg(null);
    try {
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/ai/test-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          instanceId,
          apiKey: apiKeyDraft.trim() || undefined,
          provider: form.provider,
          model: form.model,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('community.aiPanel.testFailed'));
        return;
      }
      setSaveMsg(t('community.aiPanel.testOk'));
      window.setTimeout(() => setSaveMsg(null), 2500);
    } catch {
      setError(t('community.networkError'));
    } finally {
      setTesting(false);
    }
  };

  const title = instanceTitle || t('community.defaultAiTitle');
  const botLabel = config?.botName || form.botName || 'AI';
  const needsKey = isOwner && config && !config.hasApiKey && !apiKeyDraft.trim();
  const onboardActive =
    onboarding &&
    onboarding.onboardingEnabled &&
    onboarding.status !== 'completed' &&
    onboarding.status !== 'skipped';

  const tabs: { id: TabId; label: string; Icon: typeof Bot }[] = [
    { id: 'chat', label: t('community.aiPanel.tabChat'), Icon: MessageSquareText },
    ...(isOwner
      ? [{ id: 'analyze' as const, label: t('community.aiPanel.tabAnalyze'), Icon: Sparkles }]
      : []),
    { id: 'onboarding', label: t('community.aiPanel.tabOnboarding'), Icon: GraduationCap },
    ...(isOwner
      ? [{ id: 'settings' as const, label: t('community.aiPanel.tabSettings'), Icon: Settings2 }]
      : []),
  ];

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {t('community.aiPanel.loading')}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#e7e7e7] bg-white max-lg:rounded-none max-lg:border-x-0">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#ececec] px-3 py-3 sm:px-6 sm:py-4">
        <button
          type="button"
          onClick={onBackToCommunity}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 lg:hidden"
          aria-label={t('community.aiPanel.back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Bot className="h-5 w-5 shrink-0 text-emerald-600" />
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-neutral-900">{title}</h1>
      </div>

      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-[#ececec] px-2 py-1.5">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium ${
              tab === id ? 'bg-[#eef2ff] text-[#315efb]' : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <Icon size={14} />
            {label}
            {id === 'onboarding' && onboardActive ? (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            ) : null}
          </button>
        ))}
      </div>

      {error && (
        <div className="mx-3 mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </div>
      )}
      {saveMsg && (
        <div className="mx-3 mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          {saveMsg}
        </div>
      )}

      {tab === 'chat' && (
        <>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.length === 0 && (
              <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center">
                <Bot className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
                <p className="text-sm font-medium text-neutral-800">{t('community.aiPanel.emptyTitle')}</p>
                <p className="mt-1 text-[13px] text-neutral-500">{t('community.aiPanel.emptyHint')}</p>
                {needsKey && (
                  <button
                    type="button"
                    onClick={() => setTab('settings')}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-[13px] font-medium text-white"
                  >
                    <KeyRound size={14} />
                    {t('community.aiPanel.addKeyCta')}
                  </button>
                )}
              </div>
            )}
            {messages.map((m) => {
              const mine = m.role === 'user' && m.user && user?.id === String(m.user._id);
              const isAnalysis = m.kind === 'analysis';
              return (
                <div
                  key={m._id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-[14px] leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-[#315efb] text-white'
                        : isAnalysis
                          ? 'border border-amber-200 bg-amber-50 text-neutral-800'
                          : 'bg-neutral-100 text-neutral-900'
                    }`}
                  >
                    {m.role === 'assistant' && (
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-70">
                        {isAnalysis ? t('community.aiPanel.analysisLabel') : botLabel}
                      </div>
                    )}
                    {m.role === 'user' && !mine && m.user?.username && (
                      <div className="mb-1 text-[11px] font-medium opacity-80">@{m.user.username}</div>
                    )}
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div className="shrink-0 border-t border-[#ececec] p-3">
            {!config?.chatEnabled && !isOwner ? (
              <p className="text-center text-[13px] text-neutral-500">{t('community.aiPanel.chatDisabled')}</p>
            ) : (
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendChat();
                    }
                  }}
                  rows={2}
                  placeholder={t('community.aiPanel.chatPlaceholder', { name: botLabel })}
                  className="min-h-[44px] flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#315efb]"
                  disabled={sending}
                />
                <button
                  type="button"
                  onClick={() => void sendChat()}
                  disabled={sending || !input.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#315efb] text-white disabled:opacity-40"
                >
                  <AnimatedSendIcon ref={chatSendRef} size={18} color="#ffffff" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'analyze' && (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {!isOwner ? (
            <p className="text-sm text-neutral-500">{t('community.aiPanel.analyzeOwnerOnly')}</p>
          ) : (
            <div className="mx-auto max-w-lg space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">{t('community.aiPanel.analyzeTitle')}</h3>
                <p className="mt-1 text-[13px] text-neutral-500">{t('community.aiPanel.analyzeHint')}</p>
              </div>
              <label className="block text-[13px] font-medium text-neutral-700">
                {t('community.aiPanel.analyzeFocus')}
                <textarea
                  value={analyzeFocus}
                  onChange={(e) => setAnalyzeFocus(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#315efb]"
                  placeholder={t('community.aiPanel.analyzeFocusPh')}
                />
              </label>
              <button
                type="button"
                onClick={() => void runAnalyze()}
                disabled={analyzing}
                className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {analyzing ? t('community.aiPanel.analyzing') : t('community.aiPanel.runAnalyze')}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'onboarding' && (
        <div className="flex min-h-0 flex-1 flex-col">
          {!config?.onboardingEnabled && !form.onboardingEnabled ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
              <GraduationCap className="mb-2 h-8 w-8 text-emerald-600" />
              <p className="text-sm font-medium text-neutral-800">{t('community.aiPanel.onboardDisabledTitle')}</p>
              <p className="mt-1 max-w-sm text-[13px] text-neutral-500">
                {t('community.aiPanel.onboardDisabledHint')}
              </p>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, onboardingEnabled: true }));
                    setTab('settings');
                  }}
                  className="mt-3 rounded-lg bg-neutral-900 px-3 py-1.5 text-[13px] font-medium text-white"
                >
                  {t('community.aiPanel.onboardEnableCta')}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-semibold text-emerald-900">
                        {t('community.aiPanel.onboardChecklist')}
                      </p>
                      <p className="mt-0.5 text-[12px] text-emerald-800/80">
                        {onboarding?.status === 'completed'
                          ? t('community.aiPanel.onboardStatusDone')
                          : onboarding?.status === 'skipped'
                            ? t('community.aiPanel.onboardStatusSkipped')
                            : t('community.aiPanel.onboardStatusActive')}
                      </p>
                    </div>
                    {(!onboarding || onboarding.status === 'pending') && (
                      <button
                        type="button"
                        onClick={() => void startOnboarding(false)}
                        disabled={onboardStarting}
                        className="shrink-0 rounded-md bg-emerald-700 px-2.5 py-1 text-[12px] font-medium text-white disabled:opacity-50"
                      >
                        {onboardStarting
                          ? t('community.aiPanel.onboardStarting')
                          : t('community.aiPanel.onboardStart')}
                      </button>
                    )}
                    {isOwner && onboarding && (
                      <button
                        type="button"
                        onClick={() => void startOnboarding(true)}
                        disabled={onboardStarting}
                        className="shrink-0 rounded-md border border-emerald-300 px-2.5 py-1 text-[12px] font-medium text-emerald-900 disabled:opacity-50"
                      >
                        {t('community.aiPanel.onboardRegen')}
                      </button>
                    )}
                  </div>
                  <ul className="mt-3 space-y-2">
                    {(onboarding?.steps?.length
                      ? onboarding.steps
                      : form.onboardingSteps
                    ).map((step) => (
                      <li key={step.id}>
                        <label className="flex cursor-pointer items-start gap-2 text-[13px] text-neutral-800">
                          <button
                            type="button"
                            onClick={() => void toggleStep(step.id, !step.done)}
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              step.done
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-neutral-300 bg-white'
                            }`}
                            aria-pressed={Boolean(step.done)}
                          >
                            {step.done ? <Check size={10} strokeWidth={3} /> : null}
                          </button>
                          <span>
                            <span className={step.done ? 'line-through opacity-60' : 'font-medium'}>
                              {step.title}
                            </span>
                            {step.description ? (
                              <span className="mt-0.5 block text-[12px] text-neutral-500">
                                {step.description}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  {onboardActive && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void finishOnboarding('complete')}
                        className="rounded-md bg-neutral-900 px-2.5 py-1 text-[12px] font-medium text-white"
                      >
                        {t('community.aiPanel.onboardComplete')}
                      </button>
                      <button
                        type="button"
                        onClick={() => void finishOnboarding('skip')}
                        className="rounded-md border border-neutral-200 px-2.5 py-1 text-[12px] font-medium text-neutral-700"
                      >
                        {t('community.aiPanel.onboardSkip')}
                      </button>
                    </div>
                  )}
                </div>

                {(onboarding?.messages || []).map((m) => (
                  <div
                    key={m._id}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-[14px] leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-[#315efb] text-white'
                          : 'border border-emerald-100 bg-white text-neutral-900'
                      }`}
                    >
                      {m.role === 'assistant' && (
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                          {botLabel} · {t('community.aiPanel.onboardGuide')}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    </div>
                  </div>
                ))}
                <div ref={onboardBottomRef} />
              </div>
              {onboardActive && (
                <div className="shrink-0 border-t border-[#ececec] p-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={onboardInput}
                      onChange={(e) => setOnboardInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void sendOnboardingMessage();
                        }
                      }}
                      rows={2}
                      placeholder={t('community.aiPanel.onboardChatPh')}
                      className="min-h-[44px] flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                      disabled={onboardSending}
                    />
                    <button
                      type="button"
                      onClick={() => void sendOnboardingMessage()}
                      disabled={onboardSending || !onboardInput.trim()}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white disabled:opacity-40"
                    >
                      <AnimatedSendIcon ref={onboardSendRef} size={18} color="#ffffff" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'settings' && isOwner && (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto max-w-lg space-y-4">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-[13px] text-neutral-600">
              {t('community.aiPanel.settingsIntro')}
            </div>

            <label className="block text-[13px] font-medium text-neutral-700">
              {t('community.aiPanel.provider')}
              <select
                value={form.provider}
                onChange={(e) => {
                  const p = e.target.value === 'openai' ? 'openai' : 'gemini';
                  setForm((f) => ({
                    ...f,
                    provider: p,
                    model: p === 'openai' ? 'gpt-4o-mini' : 'gemini-2.0-flash-lite',
                  }));
                }}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
              </select>
            </label>

            <label className="block text-[13px] font-medium text-neutral-700">
              {t('community.aiPanel.apiKey')}
              <input
                type="password"
                value={apiKeyDraft}
                onChange={(e) => setApiKeyDraft(e.target.value)}
                placeholder={
                  config?.hasApiKey
                    ? t('community.aiPanel.apiKeyReplacePh', { last4: config.apiKeyLast4 })
                    : t('community.aiPanel.apiKeyPh')
                }
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-mono"
                autoComplete="off"
              />
            </label>

            <label className="block text-[13px] font-medium text-neutral-700">
              {t('community.aiPanel.model')}
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-[13px] font-medium text-neutral-700">
              {t('community.aiPanel.botName')}
              <input
                type="text"
                value={form.botName}
                onChange={(e) => setForm((f) => ({ ...f, botName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-[13px] font-medium text-neutral-700">
              {t('community.aiPanel.systemPrompt')}
              <textarea
                value={form.systemPrompt}
                onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
                rows={5}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-[13px] font-medium text-neutral-700">
              {t('community.aiPanel.responseLanguage')}
              <select
                value={form.responseLanguage}
                onChange={(e) => setForm((f) => ({ ...f, responseLanguage: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="auto">{t('community.aiPanel.langAuto')}</option>
                <option value="English">English</option>
                <option value="Russian">Русский</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[13px] font-medium text-neutral-700">
                {t('community.aiPanel.temperature')}
                <input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={form.temperature}
                  onChange={(e) => setForm((f) => ({ ...f, temperature: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-[13px] font-medium text-neutral-700">
                {t('community.aiPanel.maxTokens')}
                <input
                  type="number"
                  min={64}
                  max={4096}
                  value={form.maxTokens}
                  onChange={(e) => setForm((f) => ({ ...f, maxTokens: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
              <p className="text-[13px] font-semibold text-neutral-800">{t('community.aiPanel.features')}</p>
              {(
                [
                  ['chatEnabled', t('community.aiPanel.featChat')],
                  ['analyzePostsEnabled', t('community.aiPanel.featPosts')],
                  ['analyzeChatEnabled', t('community.aiPanel.featChatCtx')],
                  ['autoReplyInChat', t('community.aiPanel.featAutoReply')],
                  ['replyOnlyWhenMentioned', t('community.aiPanel.featMentionOnly')],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-[13px] text-neutral-700">
                  <input
                    type="checkbox"
                    checked={Boolean(form[key])}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                  />
                  {label}
                </label>
              ))}
              <label className="block text-[13px] font-medium text-neutral-700">
                {t('community.aiPanel.linkedChat')}
                <select
                  value={form.linkedChatInstanceId}
                  onChange={(e) => setForm((f) => ({ ...f, linkedChatInstanceId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                >
                  <option value="">{t('community.aiPanel.linkedChatNone')}</option>
                  {(config?.chatInstances || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="block text-[13px] font-medium text-neutral-700">
                  {t('community.aiPanel.postLimit')}
                  <input
                    type="number"
                    min={0}
                    max={80}
                    value={form.contextPostLimit}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, contextPostLimit: Number(e.target.value) }))
                    }
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-[13px] font-medium text-neutral-700">
                  {t('community.aiPanel.chatLimit')}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.contextChatLimit}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, contextChatLimit: Number(e.target.value) }))
                    }
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
              <p className="text-[13px] font-semibold text-emerald-900">
                {t('community.aiPanel.onboardSettingsTitle')}
              </p>
              <p className="text-[12px] text-emerald-900/70">{t('community.aiPanel.onboardSettingsHint')}</p>
              <label className="flex items-center gap-2 text-[13px] text-neutral-800">
                <input
                  type="checkbox"
                  checked={form.onboardingEnabled}
                  onChange={(e) => setForm((f) => ({ ...f, onboardingEnabled: e.target.checked }))}
                />
                {t('community.aiPanel.featOnboarding')}
              </label>
              <label className="flex items-center gap-2 text-[13px] text-neutral-800">
                <input
                  type="checkbox"
                  checked={form.onboardingPostToChat}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, onboardingPostToChat: e.target.checked }))
                  }
                />
                {t('community.aiPanel.featOnboardPostChat')}
              </label>
              <label className="block text-[13px] font-medium text-neutral-700">
                {t('community.aiPanel.onboardWelcomePrompt')}
                <textarea
                  value={form.onboardingWelcomePrompt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, onboardingWelcomePrompt: e.target.value }))
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                  placeholder={t('community.aiPanel.onboardWelcomePromptPh')}
                />
              </label>
              <label className="block text-[13px] font-medium text-neutral-700">
                {t('community.aiPanel.onboardRules')}
                <textarea
                  value={form.onboardingRulesText}
                  onChange={(e) => setForm((f) => ({ ...f, onboardingRulesText: e.target.value }))}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                  placeholder={t('community.aiPanel.onboardRulesPh')}
                />
              </label>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-medium text-neutral-700">
                    {t('community.aiPanel.onboardStepsEdit')}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        onboardingSteps: [
                          ...f.onboardingSteps,
                          {
                            id: `step_${Date.now()}`,
                            title: '',
                            description: '',
                          },
                        ].slice(0, 12),
                      }))
                    }
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-800"
                  >
                    <Plus size={14} />
                    {t('community.aiPanel.onboardAddStep')}
                  </button>
                </div>
                <div className="space-y-2">
                  {form.onboardingSteps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="rounded-lg border border-neutral-200 bg-white p-2"
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) =>
                              setForm((f) => {
                                const next = [...f.onboardingSteps];
                                next[idx] = { ...next[idx], title: e.target.value };
                                return { ...f, onboardingSteps: next };
                              })
                            }
                            placeholder={t('community.aiPanel.onboardStepTitlePh')}
                            className="w-full rounded border border-neutral-200 px-2 py-1.5 text-sm"
                          />
                          <input
                            type="text"
                            value={step.description}
                            onChange={(e) =>
                              setForm((f) => {
                                const next = [...f.onboardingSteps];
                                next[idx] = { ...next[idx], description: e.target.value };
                                return { ...f, onboardingSteps: next };
                              })
                            }
                            placeholder={t('community.aiPanel.onboardStepDescPh')}
                            className="w-full rounded border border-neutral-200 px-2 py-1.5 text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              onboardingSteps: f.onboardingSteps.filter((_, i) => i !== idx),
                            }))
                          }
                          className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-red-600"
                          aria-label={t('community.aiPanel.onboardRemoveStep')}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pb-6">
              <button
                type="button"
                onClick={() => void saveSettings()}
                disabled={saving}
                className="rounded-lg bg-[#315efb] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? t('community.aiPanel.saving') : t('community.aiPanel.save')}
              </button>
              <button
                type="button"
                onClick={() => void testKey()}
                disabled={testing}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
              >
                {testing ? t('community.aiPanel.testing') : t('community.aiPanel.testKey')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityAiPanel;
