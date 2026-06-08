import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Send,
  ArrowLeft,
  X,
  Smile,
  Check,
  CheckCheck,
  Clock,
  MessageCircle,
  Lock,
  ChevronRight,
  CirclePlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUnreads } from '../context/UnreadsContext';
import MessengerAttachmentMenu, {
  AttachmentMenuAction,
} from '../components/Messenger/MessengerAttachmentMenu';
import MessengerEmojiPicker from '../components/Messenger/MessengerEmojiPicker';
import MessengerAnimojiAttachPanel from '../components/Messenger/MessengerAnimojiAttachPanel';
import MessengerStickersAttachPanel from '../components/Messenger/MessengerStickersAttachPanel';
import MessengerCoinAttachPanel from '../components/Messenger/MessengerCoinAttachPanel';
import MessengerMessageBody from '../components/Messenger/MessengerMessageBody';
import MessengerChatContextMenu, {
  type ChatContextMenuAnchor,
  type MessengerChatActionId,
} from '../components/Messenger/MessengerChatContextMenu';
import MessengerChatDesktopMenu from '../components/Messenger/MessengerChatDesktopMenu';
import MessengerChatListItem from '../components/Messenger/MessengerChatListItem';
import type { MessengerChatListItemData } from '../components/Messenger/MessengerChatListItem';
import MessengerMessageBubble from '../components/Messenger/MessengerMessageBubble';
import MessengerPinnedMessagesBar from '../components/Messenger/MessengerPinnedMessagesBar';
import MessengerMessageContextMenu, {
  type MessageContextMenuAnchor,
} from '../components/Messenger/MessengerMessageContextMenu';
import type { MessengerMessageActionId } from '../components/Messenger/messengerMessageActionRows';
import { MessengerEmojiItem } from '../constants/messengerEmojis';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n/useTranslation';
import {
  buildReplyMessage,
  encodeAnimojiMessage,
  formatMessagePreview,
  getMessageBody,
  getReplyQuotePreview,
  isAnimojiOnlyMessage,
  isAttachmentOnlyMessage,
  rebuildReplyMessage,
  splitReplyMessage,
} from '../utils/messengerAnimoji';
import { encodeCoinMessage, isCoinOnlyMessage } from '../utils/messengerCoins';
import { encodeStickerMessage, isStickerOnlyMessage } from '../utils/messengerStickers';
import type { PostCoinAttachment } from '../types/postCoin';
import type { MessengerStickerItem, MessengerStickerPack } from '../types/messengerStickers';
import {
  loadMessengerChatPrefs,
  saveMessengerChatPrefs,
  type MessengerChatPrefs,
} from '../utils/messengerChatPrefs';
import {
  getPinnedMessageIds,
  loadMessengerMessagePins,
  saveMessengerMessagePins,
  type MessengerMessagePinsMap,
} from '../utils/messengerMessagePrefs';

import { MESSAGES_API as MSG_API, USERS_API as USERS_API } from '../config/api';

/** Within this distance from the bottom, new messages auto-scroll. */
const SCROLL_NEAR_BOTTOM_PX = 72;

const composerIconBtnClass =
  'rounded-full p-1 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40';

interface ApiMessage {
  id: string;
  text: string;
  sender: 'user' | 'support' | 'mnoonx' | 'peer';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface ApiConversation {
  id: string;
  kind: string;
  name: string;
  username: string | null;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  lastMessageFromMe?: boolean;
  lastMessageStatus?: 'sent' | 'delivered' | 'read' | null;
  isReadOnly?: boolean;
  isOnline?: boolean;
  officialChannel?: boolean;
}

interface UserHit {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  isSelf: boolean;
}

function dedupeSystemChats(list: ApiConversation[]): ApiConversation[] {
  const seen = new Set<string>();
  return list.filter((c) => {
    if (c.kind !== 'system_mnoonx' && c.kind !== 'system_support') return true;
    if (seen.has(c.kind)) return false;
    seen.add(c.kind);
    return true;
  });
}

const Messenger: React.FC = () => {
  const { token, user } = useAuth();
  const { refreshUnreads } = useUnreads();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [chatPrefs, setChatPrefs] = useState<MessengerChatPrefs>(() => loadMessengerChatPrefs());
  const [chatActionAnchor, setChatActionAnchor] = useState<ChatContextMenuAnchor | null>(null);
  const [messagePins, setMessagePins] = useState<MessengerMessagePinsMap>(() =>
    loadMessengerMessagePins()
  );
  const [messageActionAnchor, setMessageActionAnchor] = useState<MessageContextMenuAnchor | null>(
    null
  );
  const [replyTo, setReplyTo] = useState<ApiMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ApiMessage | null>(null);

  const [chats, setChats] = useState<ApiConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [selectedMeta, setSelectedMeta] = useState<{
    name: string;
    avatar: string;
    isReadOnly?: boolean;
    isOnline?: boolean;
    kind: string;
  } | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userHits, setUserHits] = useState<UserHit[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [attachMenuView, setAttachMenuView] = useState<'main' | 'animoji' | 'stickers' | 'coin'>(
    'main'
  );
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);
  const prevLoadingMessagesRef = useRef(false);
  const lastUrlChatIdRef = useRef<string | null>(null);
  const chatPickerOpen = attachMenuOpen || emojiPickerOpen;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      const container = messagesScrollRef.current;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior });
        return;
      }
      messagesEndRef.current?.scrollIntoView({ behavior });
    });
  }, []);

  const updateStickToBottom = useCallback(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distance <= SCROLL_NEAR_BOTTOM_PX;
  }, []);

  const loadChats = useCallback(async (options?: { silent?: boolean }) => {
    if (!token) {
      setChats([]);
      setLoadingChats(false);
      return;
    }
    if (!options?.silent) {
      setLoadingChats(true);
    }
    try {
      const res = await fetch(`${MSG_API}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: ApiConversation[] = await res.json();
        setChats(dedupeSystemChats(data));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChats(false);
    }
  }, [token]);

  const loadMessages = useCallback(
    async (conversationId: string, options?: { silent?: boolean }) => {
      if (!token) return;
      if (!options?.silent) {
        setLoadingMessages(true);
      }
      try {
        const res = await fetch(`${MSG_API}/conversations/${conversationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const incoming: ApiMessage[] = data.messages || [];
          setMessages((prev) => {
            if (options?.silent && prev.length > 0 && prev.length === incoming.length) {
              const statusById = new Map(
                incoming.filter((m) => m.sender === 'user').map((m) => [m.id, m.status])
              );
              return prev.map((m) =>
                statusById.has(m.id) ? { ...m, status: statusById.get(m.id)! } : m
              );
            }
            return incoming;
          });
          setSelectedMeta(data.conversation);
        }
        const readRes = await fetch(`${MSG_API}/conversations/${conversationId}/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (readRes.ok) {
          const readData: { unreadCount?: number } = await readRes.json();
          if (typeof readData.unreadCount === 'number') {
            setChats((prev) =>
              prev.map((c) =>
                c.id === conversationId ? { ...c, unreadCount: readData.unreadCount! } : c
              )
            );
          }
        }
        await loadChats({ silent: true });
        refreshUnreads();
      } catch (e) {
        console.error(e);
      } finally {
        if (!options?.silent) {
          setLoadingMessages(false);
        }
      }
    },
    [token, loadChats, refreshUnreads]
  );

  const persistChatPrefs = useCallback((next: MessengerChatPrefs) => {
    setChatPrefs(next);
    saveMessengerChatPrefs(next);
  }, []);

  const clearMarkedNew = useCallback(
    (id: string) => {
      setChatPrefs((prev) => {
        if (!prev.markedNewIds.includes(id)) return prev;
        const next = { ...prev, markedNewIds: prev.markedNewIds.filter((x) => x !== id) };
        saveMessengerChatPrefs(next);
        return next;
      });
    },
    []
  );

  const openChat = useCallback(
    (id: string) => {
      clearMarkedNew(id);
      setAttachMenuOpen(false);
      setAttachMenuView('main');
      setEmojiPickerOpen(false);
      stickToBottomRef.current = true;
      prevMessageCountRef.current = 0;
      lastUrlChatIdRef.current = id;
      setMessages([]);
      setSelectedId(id);
      setSearchParams({ chat: id }, { replace: true });
      void loadMessages(id);
    },
    [clearMarkedNew, loadMessages, setSearchParams]
  );

  const closeChat = useCallback(() => {
    setAttachMenuOpen(false);
    setAttachMenuView('main');
    setEmojiPickerOpen(false);
    lastUrlChatIdRef.current = null;
    setSelectedId(null);
    setSelectedMeta(null);
    setMessages([]);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const startDmByUsername = useCallback(
    async (username: string) => {
      if (!token) {
        window.dispatchEvent(new CustomEvent('openLogin'));
        return;
      }
      try {
        const res = await fetch(`${MSG_API}/dm/${encodeURIComponent(username)}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          await loadChats();
          openChat(data.conversationId);
          setSearchQuery('');
          setUserHits([]);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [token, loadChats, openChat]
  );

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  useEffect(() => {
    const chatId = searchParams.get('chat');
    const dmUser = searchParams.get('user');
    if (dmUser && token) {
      void startDmByUsername(dmUser.replace(/^@/, ''));
      return;
    }
    if (!chatId) {
      lastUrlChatIdRef.current = null;
      setSelectedId(null);
      setSelectedMeta(null);
      setMessages([]);
      return;
    }
    if (!token || chatId === lastUrlChatIdRef.current) return;
    lastUrlChatIdRef.current = chatId;
    stickToBottomRef.current = true;
    prevMessageCountRef.current = 0;
    setMessages([]);
    setSelectedId(chatId);
    void loadMessages(chatId);
  }, [searchParams, token, loadMessages, startDmByUsername]);

  useEffect(() => {
    if (!token || searchQuery.trim().length < 2) {
      setUserHits([]);
      return;
    }
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `${USERS_API}/list?q=${encodeURIComponent(searchQuery.trim())}&limit=8`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data: UserHit[] = await res.json();
          setUserHits(data.filter((u) => !u.isSelf));
        }
      } catch {
        setUserHits([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, token]);

  useEffect(() => {
    if (!selectedId) return;
    stickToBottomRef.current = true;
    prevMessageCountRef.current = 0;
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const justFinishedLoading = prevLoadingMessagesRef.current && !loadingMessages;
    prevLoadingMessagesRef.current = loadingMessages;

    if (justFinishedLoading && messages.length > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom('auto');
          stickToBottomRef.current = true;
        });
      });
    }
  }, [selectedId, loadingMessages, messages.length, scrollToBottom]);

  useEffect(() => {
    if (!selectedId || loadingMessages) return;
    const len = messages.length;
    if (len > prevMessageCountRef.current && stickToBottomRef.current) {
      scrollToBottom('smooth');
    }
    prevMessageCountRef.current = len;
  }, [selectedId, loadingMessages, messages.length, scrollToBottom]);

  useEffect(() => {
    if (!selectedId || !selectedMeta || selectedMeta.isReadOnly || loadingMessages) return;
    messageInputRef.current?.focus();
  }, [selectedId, selectedMeta, loadingMessages]);

  useEffect(() => {
    setMessageActionAnchor(null);
    setReplyTo(null);
    setEditingMessage(null);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || !token || selectedMeta?.kind !== 'dm') return;
    const poll = window.setInterval(() => {
      void loadMessages(selectedId, { silent: true });
    }, 4000);
    return () => window.clearInterval(poll);
  }, [selectedId, token, selectedMeta?.kind, loadMessages]);

  useEffect(() => {
    if (!chatPickerOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const inMenu =
        attachMenuRef.current?.contains(target) || emojiPickerRef.current?.contains(target);
      const inPanel = chatPanelRef.current?.contains(target);
      if (inPanel && !inMenu) {
        setAttachMenuOpen(false);
        setAttachMenuView('main');
        setEmojiPickerOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAttachMenuOpen(false);
        setAttachMenuView('main');
        setEmojiPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [chatPickerOpen]);

  const sendMessageWithBody = useCallback(
    async (text: string) => {
      if (!text.trim() || !selectedId || !token || selectedMeta?.isReadOnly || sending) return;
      setSending(true);
      try {
        const res = await fetch(`${MSG_API}/conversations/${selectedId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ body: text.trim() }),
        });
        if (res.ok) {
          const sent: ApiMessage = await res.json();
          stickToBottomRef.current = true;
          setMessages((prev) => [...prev, sent]);
          scrollToBottom('smooth');
          messageInputRef.current?.focus();
          void loadChats({ silent: true });
          refreshUnreads();
          if (selectedMeta?.kind === 'system_support') {
            window.setTimeout(() => void loadMessages(selectedId, { silent: true }), 1200);
          }
        }
      } catch (e) {
        console.error(e);
        throw e;
      } finally {
        setSending(false);
      }
    },
    [selectedId, token, selectedMeta?.isReadOnly, selectedMeta?.kind, sending, loadChats, refreshUnreads, scrollToBottom]
  );

  const sendAnimoji = (item: MessengerEmojiItem) => {
    if (item.lottieUrl && item.id && item.slug) {
      void sendMessageWithBody(encodeAnimojiMessage(item));
    }
  };

  const closeAttachMenu = () => {
    setAttachMenuOpen(false);
    setAttachMenuView('main');
  };

  const handleEmojiSelect = (item: MessengerEmojiItem) => {
    setEmojiPickerOpen(false);
    if (item.lottieUrl && item.id && item.slug) {
      sendAnimoji(item);
      return;
    }
    setNewMessage((prev) => prev + item.emoji);
  };

  const handleAttachAnimojiSelect = (item: MessengerEmojiItem) => {
    closeAttachMenu();
    sendAnimoji(item);
  };

  const sendSticker = useCallback(
    (pack: MessengerStickerPack, sticker: MessengerStickerItem) => {
      void sendMessageWithBody(
        encodeStickerMessage({
          packSlug: pack.slug,
          id: sticker.id,
          imageUrl: sticker.imageUrl,
        })
      );
    },
    [sendMessageWithBody]
  );

  const handleAttachStickerSelect = (pack: MessengerStickerPack, sticker: MessengerStickerItem) => {
    closeAttachMenu();
    sendSticker(pack, sticker);
  };

  const sendCoin = useCallback(
    (coin: PostCoinAttachment) => {
      void sendMessageWithBody(encodeCoinMessage(coin));
    },
    [sendMessageWithBody]
  );

  const handleAttachCoinSelect = (coin: PostCoinAttachment) => {
    closeAttachMenu();
    sendCoin(coin);
  };

  const handleAttachmentAction = (action: AttachmentMenuAction) => {
    if (action === 'close') {
      closeAttachMenu();
      return;
    }
    if (action === 'animated-emoji') {
      setAttachMenuView('animoji');
      return;
    }
    if (action === 'stickers') {
      setAttachMenuView('stickers');
      return;
    }
    if (action === 'coin') {
      setAttachMenuView('coin');
      return;
    }
    setAttachMenuOpen(false);
    setAttachMenuView('main');
  };

  const persistMessagePins = useCallback((next: MessengerMessagePinsMap) => {
    setMessagePins(next);
    saveMessengerMessagePins(next);
  }, []);

  const pinnedMessageIds = selectedId ? getPinnedMessageIds(messagePins, selectedId) : [];
  const pinnedIdSet = useMemo(() => new Set(pinnedMessageIds), [pinnedMessageIds]);

  const messageActionLabels = useMemo(
    () => ({
      menuTitle: t('messenger.messageActions.menuTitle'),
      reply: t('messenger.messageActions.reply'),
      edit: t('messenger.messageActions.edit'),
      pin: t('messenger.messageActions.pin'),
      unpin: t('messenger.messageActions.unpin'),
      copy: t('messenger.messageActions.copy'),
      delete: t('messenger.messageActions.delete'),
    }),
    [t]
  );

  const openMessageMenu = useCallback(
    (message: ApiMessage, rect: DOMRect) => {
      if (!selectedId) return;
      const canCompose = !selectedMeta?.isReadOnly;
      setMessageActionAnchor((prev) => {
        if (prev?.messageId === message.id) return null;
        return {
          messageId: message.id,
          rect,
          isPinned: pinnedIdSet.has(message.id),
          canReply: canCompose,
          canEdit: canCompose && message.sender === 'user',
          canDelete: canCompose && message.sender === 'user',
        };
      });
    },
    [selectedId, selectedMeta?.isReadOnly, pinnedIdSet]
  );

  const clearComposerMode = useCallback(() => {
    setReplyTo(null);
    setEditingMessage(null);
  }, []);

  const handleMessageAction = useCallback(
    async (action: MessengerMessageActionId) => {
      if (!messageActionAnchor || !selectedId) return;
      const message = messages.find((m) => m.id === messageActionAnchor.messageId);
      setMessageActionAnchor(null);
      if (!message) return;

      if (action === 'reply') {
        setReplyTo(message);
        setEditingMessage(null);
        setNewMessage('');
        messageInputRef.current?.focus();
        return;
      }

      if (action === 'edit') {
        setEditingMessage(message);
        setReplyTo(null);
        setNewMessage(getMessageBody(message.text));
        messageInputRef.current?.focus();
        return;
      }

      if (action === 'pin') {
        const current = getPinnedMessageIds(messagePins, selectedId);
        const next = new Set(current);
        const wasPinned = next.has(message.id);
        if (wasPinned) next.delete(message.id);
        else next.add(message.id);
        persistMessagePins({
          ...messagePins,
          [selectedId]: Array.from(next),
        });
        showToast(
          wasPinned ? t('messenger.messageActions.unpinned') : t('messenger.messageActions.pinned')
        );
        return;
      }

      if (action === 'copy') {
        try {
          await navigator.clipboard.writeText(formatMessagePreview(getMessageBody(message.text)));
          showToast(t('messenger.messageActions.copied'));
        } catch {
          showToast(t('messenger.messageActions.copied'), 'info');
        }
        return;
      }

      if (action === 'delete') {
        const ok = await confirm({
          title: t('messenger.messageActions.deleteTitle'),
          message: t('messenger.messageActions.deleteMessage'),
          confirmLabel: t('messenger.messageActions.deleteConfirm'),
          variant: 'danger',
        });
        if (!ok) return;
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
        if (pinnedIdSet.has(message.id)) {
          const current = getPinnedMessageIds(messagePins, selectedId);
          persistMessagePins({
            ...messagePins,
            [selectedId]: current.filter((id) => id !== message.id),
          });
        }
        if (editingMessage?.id === message.id) {
          setEditingMessage(null);
          setNewMessage('');
        }
        if (replyTo?.id === message.id) setReplyTo(null);
        showToast(t('messenger.messageActions.deleted'));
      }
    },
    [
      messageActionAnchor,
      selectedId,
      messages,
      messagePins,
      persistMessagePins,
      pinnedIdSet,
      editingMessage?.id,
      replyTo?.id,
      showToast,
      t,
      confirm,
    ]
  );

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    let text = newMessage.trim();

    if (editingMessage) {
      const { quoteBlock } = splitReplyMessage(editingMessage.text);
      const nextText = quoteBlock ? rebuildReplyMessage(quoteBlock, text) : text;
      setMessages((prev) =>
        prev.map((m) => (m.id === editingMessage.id ? { ...m, text: nextText } : m))
      );
      setNewMessage('');
      setEditingMessage(null);
      showToast(t('messenger.messageActions.edited'));
      messageInputRef.current?.focus();
      return;
    }

    const savedReply = replyTo;
    if (replyTo) {
      text = buildReplyMessage(getReplyQuotePreview(replyTo.text), text);
      setReplyTo(null);
    }

    setNewMessage('');
    try {
      await sendMessageWithBody(text);
    } catch {
      setNewMessage(text);
      if (savedReply) setReplyTo(savedReply);
    }
  };

  const pinnedMessages = useMemo(
    () =>
      pinnedMessageIds
        .map((id) => messages.find((m) => m.id === id))
        .filter((m): m is ApiMessage => Boolean(m)),
    [messages, pinnedMessageIds]
  );

  const scrollToMessage = useCallback((messageId: string) => {
    requestAnimationFrame(() => {
      const root = messagesScrollRef.current;
      const el = root?.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement | null;
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('messenger-message-jump-highlight');
      window.setTimeout(() => el.classList.remove('messenger-message-jump-highlight'), 1200);
    });
  }, []);

  const filteredChats = chats.filter((chat) => {
    if (chatPrefs.hiddenIds.includes(chat.id)) return false;
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      chat.name.toLowerCase().includes(q) ||
      (chat.username && chat.username.toLowerCase().includes(q)) ||
      chat.lastMessage.toLowerCase().includes(q)
    );
  });

  const displayChats = useMemo(() => {
    const pinned = new Set(chatPrefs.pinnedIds);
    const markedNew = new Set(chatPrefs.markedNewIds);
    return [...filteredChats]
      .map((chat) => ({
        ...chat,
        unreadCount: markedNew.has(chat.id) ? Math.max(1, chat.unreadCount) : chat.unreadCount,
      }))
      .sort((a, b) => {
        const ap = pinned.has(a.id) ? 1 : 0;
        const bp = pinned.has(b.id) ? 1 : 0;
        if (ap !== bp) return bp - ap;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
  }, [filteredChats, chatPrefs.pinnedIds, chatPrefs.markedNewIds]);

  const chatActionLabels = useMemo(
    () => ({
      sheetTitle: t('messenger.chatActions.sheetTitle'),
      pin: t('messenger.chatActions.pin'),
      unpin: t('messenger.chatActions.unpin'),
      markNew: t('messenger.chatActions.markNew'),
      report: t('messenger.chatActions.report'),
      blockUser: t('messenger.chatActions.blockUser'),
      deleteChat: t('messenger.chatActions.deleteChat'),
    }),
    [t]
  );

  const messageStatusLabels = useMemo(
    () => ({
      sent: t('messenger.messageStatus.sent'),
      delivered: t('messenger.messageStatus.delivered'),
      read: t('messenger.messageStatus.read'),
    }),
    [t]
  );

  const toListChatItem = useCallback(
    (chat: ApiConversation): MessengerChatListItemData => ({
      id: chat.id,
      name: chat.name,
      avatar: chat.avatar,
      lastMessage: chat.lastMessage,
      lastMessageTime: chat.lastMessageTime,
      unreadCount: chat.unreadCount,
      isOnline: chat.isOnline,
      lastMessageFromMe: chat.lastMessageFromMe,
      lastMessageStatus: chat.lastMessageStatus ?? null,
    }),
    []
  );

  const openChatActionsMenu = useCallback((chat: ApiConversation, rect: DOMRect) => {
    setChatActionAnchor((prev) => {
      if (prev?.target.id === chat.id) return null;
      return {
        rect,
        chat: toListChatItem(chat),
        target: {
          id: chat.id,
          name: chat.name,
          avatar: chat.avatar,
          kind: chat.kind,
          username: chat.username,
        },
      };
    });
  }, [toListChatItem]);

  const handleChatAction = useCallback(
    async (action: MessengerChatActionId) => {
      const chat = chatActionAnchor?.target;
      if (!chat) return;
      setChatActionAnchor(null);

      if (action === 'pin') {
        const pinned = new Set(chatPrefs.pinnedIds);
        if (pinned.has(chat.id)) pinned.delete(chat.id);
        else pinned.add(chat.id);
        persistChatPrefs({ ...chatPrefs, pinnedIds: Array.from(pinned) });
        showToast(pinned.has(chat.id) ? t('messenger.chatActions.pinned') : t('messenger.chatActions.unpinned'));
        return;
      }

      if (action === 'markNew') {
        if (!chatPrefs.markedNewIds.includes(chat.id)) {
          persistChatPrefs({
            ...chatPrefs,
            markedNewIds: [...chatPrefs.markedNewIds, chat.id],
          });
          setChats((prev) =>
            prev.map((c) => (c.id === chat.id ? { ...c, unreadCount: Math.max(1, c.unreadCount) } : c))
          );
        }
        showToast(t('messenger.chatActions.markedNew'));
        return;
      }

      if (action === 'report') {
        showToast(t('messenger.chatActions.reportSent'), 'info');
        return;
      }

      if (action === 'block') {
        showToast(t('messenger.chatActions.blocked'), 'info');
        return;
      }

      if (action === 'delete') {
        const ok = await confirm({
          title: t('messenger.chatActions.deleteTitle'),
          message: t('messenger.chatActions.deleteMessage', { name: chat.name }),
          confirmLabel: t('messenger.chatActions.deleteConfirm'),
          variant: 'danger',
        });
        if (!ok) return;
        const hidden = new Set(chatPrefs.hiddenIds);
        hidden.add(chat.id);
        persistChatPrefs({
          ...chatPrefs,
          hiddenIds: Array.from(hidden),
          pinnedIds: chatPrefs.pinnedIds.filter((id) => id !== chat.id),
          markedNewIds: chatPrefs.markedNewIds.filter((id) => id !== chat.id),
        });
        if (selectedId === chat.id) closeChat();
        showToast(t('messenger.chatActions.deleted'));
      }
    },
    [
      chatActionAnchor,
      chatPrefs,
      closeChat,
      confirm,
      persistChatPrefs,
      selectedId,
      showToast,
      t,
    ]
  );

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatListTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageStatusIcon = (status: ApiMessage['status']) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3" aria-label="Sent" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-neutral-400" aria-label="Delivered" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" aria-label="Read" />;
      default:
        return <Clock className="h-3 w-3" aria-label="Sending" />;
    }
  };

  const handleSupportLinkClick = () => {
    const support = chats.find((c) => c.kind === 'system_support');
    if (support) openChat(support.id);
  };

  const formatMessageText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
      if (line.match(/^\d+\./)) {
        return (
          <div key={idx} className="mt-1 flex items-start gap-2">
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^\d+\.\s/, '') }} />
          </div>
        );
      }
      if (formattedLine.includes('Support Team')) {
        return (
          <div key={idx} className="mt-2">
            <button
              type="button"
              onClick={handleSupportLinkClick}
              className="inline-flex items-center gap-1 font-medium text-blue-400 underline hover:text-blue-300"
            >
              Support Team
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        );
      }
      if (formattedLine.trim() === '') return <div key={idx} className="h-2" />;
      return <div key={idx} className="mt-1" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    });
  };

  if (!token) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-neutral-600">
        <p>
          <button
            type="button"
            className="font-medium text-[#315efb] underline"
            onClick={() => window.dispatchEvent(new CustomEvent('openLogin'))}
          >
            Sign in
          </button>{' '}
          to use Messages.
        </p>
      </div>
    );
  }

  const showChatThread = Boolean(selectedId && selectedMeta);

  return (
    <div className="flex h-full min-h-0">
      <div
        className={`flex h-full w-full flex-col border-neutral-200 lg:w-96 lg:shrink-0 lg:border-r ${
          showChatThread ? 'max-lg:hidden' : ''
        }`}
      >
        <div className="shrink-0 border-b border-neutral-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-neutral-800 sm:text-xl">Messages</h1>
            {/* <Link to="/users" className="shrink-0 text-sm font-medium text-blue-500 hover:underline">
              Find people
            </Link> */}
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search chats or @username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          {userHits.length > 0 && (
            <ul className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
              {userHits.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => void startDmByUsername(u.username)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                  >
                    <img
                      src={
                        u.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}&background=000&color=fff&bold=true`
                      }
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                    <span>
                      <span className="font-medium">{u.fullName}</span>
                      <span className="text-neutral-500"> @{u.username}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
            </div>
          ) : (
            displayChats.map((chat) => (
              <MessengerChatListItem
                key={chat.id}
                chat={toListChatItem(chat)}
                selected={selectedId === chat.id}
                isPinned={chatPrefs.pinnedIds.includes(chat.id)}
                formatListTime={formatListTime}
                noMessagesLabel={t('messenger.noMessagesYet')}
                menuOpenForThisChat={chatActionAnchor?.target.id === chat.id}
                actionsMenuLabel={chatActionLabels.sheetTitle}
                statusLabels={messageStatusLabels}
                onOpen={() => openChat(chat.id)}
                onLongPress={(rect) => openChatActionsMenu(chat, rect)}
                onOpenActionsMenu={(rect) => openChatActionsMenu(chat, rect)}
              />
            ))
          )}
        </div>
      </div>

      {showChatThread && selectedMeta ? (
        <div
          ref={chatPanelRef}
          className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden max-lg:fixed max-lg:inset-0 max-lg:z-30 max-lg:bg-white lg:relative lg:z-auto"
        >
          <div className="flex shrink-0 items-center justify-between gap-1 border-b border-neutral-200 p-2 sm:px-4 sm:py-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 transition-colors hover:bg-black/5 active:scale-95 lg:hidden"
                onClick={closeChat}
                aria-label="Back to chats"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
              <img src={selectedMeta.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full" />
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-neutral-800">{selectedMeta.name}</h2>
                {selectedMeta.isOnline && <p className="text-xs text-green-500">Online</p>}
              </div>
            </div>
            {/* <div className="hidden shrink-0 items-center gap-1 sm:flex sm:gap-2">
              <button type="button" className="rounded-full p-2 transition-colors hover:bg-black/5">
                <Phone className="h-5 w-5 text-neutral-600" />
              </button>
              <button type="button" className="rounded-full p-2 transition-colors hover:bg-black/5">
                <Video className="h-5 w-5 text-neutral-600" />
              </button>
              <button type="button" className="rounded-full p-2 transition-colors hover:bg-black/5">
                <Info className="h-5 w-5 text-neutral-600" />
              </button>
              <button type="button" className="rounded-full p-2 transition-colors hover:bg-black/5">
                <MoreVertical className="h-5 w-5 text-neutral-600" />
              </button>
            </div> */}
          </div>

          <MessengerPinnedMessagesBar
            messages={pinnedMessages}
            sectionLabel={t('messenger.messageActions.pinnedSection')}
            formatTime={formatMessageTime}
            onJumpTo={scrollToMessage}
          />

          <div
            ref={messagesScrollRef}
            onScroll={updateStickToBottom}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-4"
          >
            {loadingMessages ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
              </div>
            ) : (
              messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender !== 'user' && (
                      <img
                        src={selectedMeta.avatar}
                        alt=""
                        className="mr-2 h-8 w-8 shrink-0 self-end rounded-full"
                      />
                    )}
                    <MessengerMessageBubble
                      messageId={message.id}
                      align={message.sender === 'user' ? 'end' : 'start'}
                      isMenuOpen={messageActionAnchor?.messageId === message.id}
                      onOpenMenu={(rect) => openMessageMenu(message, rect)}
                    >
                      <div
                        className={`rounded-2xl ${
                          isStickerOnlyMessage(message.text) || isCoinOnlyMessage(message.text)
                            ? 'p-0'
                            : isAttachmentOnlyMessage(message.text)
                              ? 'px-1 py-1'
                              : 'px-4 py-2'
                        } ${
                          message.sender === 'user'
                            ? isAttachmentOnlyMessage(message.text)
                              ? ''
                              : 'bg-black text-white'
                            : isAttachmentOnlyMessage(message.text)
                              ? ''
                              : 'bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        {selectedMeta.kind === 'system_mnoonx' &&
                        messages[0]?.id === message.id &&
                        message.sender === 'mnoonx' ? (
                          <div className="whitespace-pre-wrap break-words text-sm">
                            {formatMessageText(message.text)}
                          </div>
                        ) : (
                          <MessengerMessageBody text={message.text} />
                        )}
                      </div>
                      <div
                        className={`mt-1 flex items-center gap-1 text-xs text-neutral-400 ${
                          message.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <span>{formatMessageTime(message.timestamp)}</span>
                        {message.sender === 'user' && getMessageStatusIcon(message.status)}
                      </div>
                    </MessengerMessageBubble>
                  </div>
                ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {selectedMeta.isReadOnly ? (
            <div className="flex-shrink-0 border-t border-neutral-200 bg-neutral-50">
              <div className="p-4 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4 text-neutral-500" />
                  <span className="text-sm font-medium text-neutral-600">Official MNOONX Channel</span>
                </div>
                <p className="text-xs text-neutral-500">
                  This is the official MNOONX notification channel.
                  <br />
                  MNOONX will always use verified accounts to communicate with you.
                </p>
              </div>
            </div>
          ) : (
            <div className="shrink-0 border-t border-neutral-200 p-0 pb-[env(safe-area-inset-bottom,0px)]">
              {(replyTo || editingMessage) && (
                <div className="flex items-start gap-2 border-b border-neutral-100 bg-neutral-50 px-3 py-2 sm:px-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-neutral-500">
                      {editingMessage
                        ? t('messenger.messageActions.editing')
                        : t('messenger.messageActions.replyTo')}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-neutral-800">
                      {formatMessagePreview(getMessageBody((editingMessage ?? replyTo)!.text))}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={t('messenger.messageActions.cancel')}
                    onClick={() => {
                      clearComposerMode();
                      setNewMessage('');
                    }}
                    className="shrink-0 rounded-full p-1 text-neutral-500 hover:bg-neutral-200/80"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )}
              <div className="relative min-w-0">
                <input
                  ref={messageInputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void sendMessage()}
                  placeholder="Type a message..."
                  className="w-full py-3 pl-11 pr-20 text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-black/10"
                />

                <div ref={attachMenuRef} className="absolute left-2 top-1/2 z-[3] -translate-y-1/2">
                  {!attachMenuOpen ? (
                    <button
                      type="button"
                      aria-expanded={false}
                      aria-haspopup="menu"
                      aria-label="Attach"
                      onClick={() => {
                        setEmojiPickerOpen(false);
                        setAttachMenuView('main');
                        setAttachMenuOpen(true);
                      }}
                      className={composerIconBtnClass}
                    >
                      <CirclePlus className="h-5 w-5 text-neutral-400" />
                    </button>
                  ) : (
                    <AnimatePresence mode="wait">
                      {attachMenuView === 'main' ? (
                        <MessengerAttachmentMenu key="attach-menu" onSelect={handleAttachmentAction} />
                      ) : attachMenuView === 'animoji' ? (
                        <MessengerAnimojiAttachPanel
                          key="attach-animoji"
                          onSelect={handleAttachAnimojiSelect}
                          onBack={() => setAttachMenuView('main')}
                          onClose={closeAttachMenu}
                        />
                      ) : attachMenuView === 'stickers' ? (
                        <MessengerStickersAttachPanel
                          key="attach-stickers"
                          onSelect={handleAttachStickerSelect}
                          onBack={() => setAttachMenuView('main')}
                          onClose={closeAttachMenu}
                        />
                      ) : (
                        <MessengerCoinAttachPanel
                          key="attach-coin"
                          onSelect={handleAttachCoinSelect}
                          onBack={() => setAttachMenuView('main')}
                          onClose={closeAttachMenu}
                        />
                      )}
                    </AnimatePresence>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={!newMessage.trim() || sending}
                  aria-label="Send message"
                  className={`absolute right-2 top-1/2 z-[1] -translate-y-1/2 ${composerIconBtnClass}`}
                >
                  <Send
                    className={`h-5 w-5 ${
                      newMessage.trim() && !sending ? 'text-neutral-800' : 'text-neutral-400'
                    }`}
                  />
                </button>

                <div ref={emojiPickerRef} className="absolute right-10 top-1/2 z-[1] -translate-y-1/2">
                  <button
                    type="button"
                    aria-expanded={emojiPickerOpen}
                    aria-haspopup="dialog"
                    aria-label="Emoji picker"
                    onClick={() => {
                      setAttachMenuOpen(false);
                      setEmojiPickerOpen((open) => !open);
                    }}
                    className={`${composerIconBtnClass} ${emojiPickerOpen ? 'bg-black/5' : ''}`}
                  >
                    <Smile className="h-5 w-5 text-neutral-400" />
                  </button>
                  {emojiPickerOpen && (
                    <AnimatePresence>
                      <MessengerEmojiPicker
                        key="emoji-picker"
                        onSelect={handleEmojiSelect}
                        onClose={() => setEmojiPickerOpen(false)}
                      />
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </div>
          )}
          <AnimatePresence>
            {attachMenuOpen && !selectedMeta.isReadOnly && (
              <motion.div
                key="attach-blur"
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="pointer-events-none absolute inset-0 z-[2] bg-white/45 backdrop-blur-[48px] backdrop-saturate-150"
              />
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-200">
              <MessageCircle className="h-10 w-10 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-800">{t('messenger.yourMessages')}</h3>
            <p className="mt-1 text-neutral-500">{t('messenger.selectConversationHint')}</p>
            {/* <Link to="/users" className="mt-4 inline-block text-sm font-medium text-[#315efb] hover:underline">
              Browse all members
            </Link> */}
          </div>
        </div>
      )}

      <MessengerChatContextMenu
        anchor={chatActionAnchor}
        isPinned={
          chatActionAnchor ? chatPrefs.pinnedIds.includes(chatActionAnchor.target.id) : false
        }
        formatListTime={formatListTime}
        noMessagesLabel={t('messenger.noMessagesYet')}
        onClose={() => setChatActionAnchor(null)}
        onAction={(action) => void handleChatAction(action)}
        labels={chatActionLabels}
      />
      <MessengerChatDesktopMenu
        anchor={chatActionAnchor}
        isPinned={
          chatActionAnchor ? chatPrefs.pinnedIds.includes(chatActionAnchor.target.id) : false
        }
        onClose={() => setChatActionAnchor(null)}
        onAction={(action) => void handleChatAction(action)}
        labels={chatActionLabels}
      />
      <MessengerMessageContextMenu
        anchor={messageActionAnchor}
        onClose={() => setMessageActionAnchor(null)}
        onAction={(action) => void handleMessageAction(action)}
        labels={messageActionLabels}
      />
    </div>
  );
};

export default Messenger;
