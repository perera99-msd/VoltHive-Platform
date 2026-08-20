'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLiveEvents } from '../../../context/LiveEventsContext';
import { apiUrl } from '../../../lib/api';
import { motion } from 'framer-motion';
import Toast from '../../common/Toast';

interface Conversation {
  stationId: string;
  stationName: string;
  address?: string;
  phone?: string;
  lastMessage?: string | null;
  lastTime?: string | null;
  unread: number;
}

interface Message {
  _id: string;
  sender: 'driver' | 'owner';
  text: string;
  read: boolean;
  createdAt: string;
}

const timeLabel = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function MessagesView({ initialStationId, onBack }: { initialStationId?: string | null; onBack?: () => void }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [openStationId, setOpenStationId] = useState<string | null>(initialStationId || null);
  const [station, setStation] = useState<{ stationName: string; address?: string; phone?: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(!!initialStationId);
  const [sending, setSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' | 'info' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const tokenFor = useCallback(async () => (await user?.getIdToken()) || '', [user]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const token = await tokenFor();
      const res = await fetch(apiUrl('/api/chat/driver/conversations'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setConversations(json.data || []);
      }
    } catch (e) {
      console.warn('Failed to load conversations', e);
    } finally {
      setLoadingList(false);
    }
  }, [user, tokenFor]);

  const openThread = useCallback(async (stationId: string) => {
    if (!user || !stationId) return;
    setOpenStationId(stationId);
    setLoadingThread(true);
    try {
      const token = await tokenFor();
      const res = await fetch(apiUrl(`/api/chat/driver/${stationId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setStation(json.station || null);
        setMessages(json.messages || []);
        loadConversations();
      } else {
        setToastMessage({ msg: 'Could not load station chat.', type: 'error' });
      }
    } catch (e) {
      setToastMessage({ msg: 'Could not open this conversation.', type: 'error' });
    } finally {
      setLoadingThread(false);
    }
  }, [user, tokenFor, loadConversations]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!user || !openStationId || !text || sending) return;
    setSending(true);
    try {
      const token = await tokenFor();
      const res = await fetch(apiUrl(`/api/chat/driver/${openStationId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const json = await res.json();
        setMessages(prev => [...prev, json.message]);
        setDraft('');
        loadConversations();
      } else {
        setToastMessage({ msg: 'Message failed to send.', type: 'error' });
      }
    } catch (e) {
      setToastMessage({ msg: 'Could not send message.', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  // Refresh just the open thread (used by SSE + fallback poll).
  const refreshThread = useCallback(async (stationId: string) => {
    if (!user || !stationId) return;
    try {
      const token = await tokenFor();
      const res = await fetch(apiUrl(`/api/chat/driver/${stationId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setStation(json.station || null);
        setMessages(json.messages || []);
        loadConversations();
      }
    } catch (e) {
      console.warn('Failed to refresh thread', e);
    }
  }, [user, tokenFor, loadConversations]);

  // Auto-scroll ONLY the inner chat stream container to the newest message,
  // so the page itself (outer scroll area) is never pushed off-screen.
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Load conversation list on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Open initial station thread whenever initialStationId is supplied or changes
  useEffect(() => {
    if (initialStationId) {
      openThread(initialStationId);
    }
  }, [initialStationId, openThread]);

  // Poll while a thread is open — slow fallback; SSE pushes instant updates.
  useEffect(() => {
    if (!openStationId) return;
    const timer = setInterval(() => {
      if (!user || (typeof document !== 'undefined' && document.hidden)) return;
      refreshThread(openStationId);
    }, 30000);
    return () => clearInterval(timer);
  }, [openStationId, user, refreshThread]);

  // Realtime: new message in the open thread → refresh instantly.
  const { subscribe } = useLiveEvents();
  useEffect(() => {
    if (!openStationId) return;
    const unsub = subscribe('message.new', (_event, data) => {
      if (!data || String(data.stationId) !== String(openStationId)) return;
      refreshThread(openStationId);
    });
    return unsub;
  }, [openStationId, subscribe, refreshThread]);

  const backToList = () => {
    setOpenStationId(null);
    setMessages([]);
    setStation(null);
    loadConversations();
  };

  const handleBack = () => {
    if (openStationId) {
      backToList();
    } else if (onBack) {
      onBack();
    }
  };

  // ── THREAD VIEW ──
  if (openStationId) {
    return (
      <section className="space-y-4 relative pb-12 font-sans text-(--brand-ink)">
        {/* Thread Header Card */}
        <motion.header
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border border-(--brand-border) bg-(--brand-card)/90 backdrop-blur-2xl p-3.5 sm:p-5 shadow-[0_16px_40px_-24px_rgba(9,32,52,0.4)] flex items-center justify-between gap-3 relative z-10"
        >
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
            <button
              onClick={handleBack}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-2xl bg-(--surface-soft) border border-(--brand-border) text-(--brand-ink) hover:bg-(--surface-tint) active:scale-95 transition-all cursor-pointer shrink-0 shadow-xs"
              title="Back"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-linear-to-br from-(--brand-blue) to-(--brand-green) text-white flex items-center justify-center font-bold text-base sm:text-lg shrink-0 shadow-md border border-white/20">
              {station?.stationName?.charAt(0) || 'S'}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-bold text-(--brand-ink) truncate tracking-tight">
                  {station?.stationName || (loadingThread ? 'Loading station…' : 'Station Chat')}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--ui-success)/15 text-(--ui-success) text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider border border-(--ui-success)/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-(--ui-success) animate-pulse" />
                  Active
                </span>
              </div>
              {station?.address && (
                <p className="text-[11px] sm:text-xs text-(--brand-muted) font-medium truncate mt-0.5">
                  {station.address}
                </p>
              )}
            </div>
          </div>

          {station?.phone && (
            <a
              href={`tel:${station.phone}`}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-2xl bg-(--brand-blue)/12 text-(--brand-blue) border border-(--brand-blue)/25 hover:bg-(--brand-blue)/20 transition-all cursor-pointer shrink-0 shadow-xs"
              title={`Call ${station.phone}`}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.864-1.041l-3.286-.47a1.125 1.125 0 00-1.073.436l-2.276 3.034c-2.126-1.01-3.951-2.835-4.96-4.96l3.034-2.276a1.125 1.125 0 00.436-1.073l-.47-3.286c-.075-.512-.525-.864-1.041-.864H4.5a2.25 2.25 0 00-2.25 2.25z" />
              </svg>
            </a>
          )}
        </motion.header>

        {/* Chat Thread Container Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="bg-(--brand-card)/85 backdrop-blur-2xl rounded-3xl border border-(--brand-border) shadow-[0_20px_50px_-25px_rgba(9,32,52,0.45)] overflow-hidden flex flex-col h-[calc(100dvh-280px)] sm:h-[580px] min-h-[380px] relative z-10"
        >
          {/* Scrollable Messages Area */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-(--surface-soft)/20 [&::-webkit-scrollbar]:hidden">
            {loadingThread ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-8 h-8 rounded-full border-2 border-(--brand-blue) border-t-transparent animate-spin mb-3" />
                <p className="text-sm font-semibold text-(--brand-muted)">Loading conversation history…</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-(--brand-blue)/15 to-(--brand-green)/15 text-(--brand-blue) border border-(--brand-blue)/20 flex items-center justify-center mb-3 shadow-sm">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.596.596 0 01-.743-.75l1.01-2.525A8.13 8.13 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-(--brand-ink)">Say hello to {station?.stationName || 'the station'}</h3>
                <p className="text-xs text-(--brand-muted) mt-1 max-w-xs font-medium leading-relaxed">
                  Inquire about charger availability, connector types, or confirm your upcoming booking slot.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const mine = m.sender === 'driver';
                return (
                  <motion.div
                    key={m._id}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[82%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        mine
                          ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-medium shadow-sm rounded-br-xs'
                          : 'bg-(--brand-card) text-(--brand-ink) border border-(--brand-border) font-medium rounded-bl-xs shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p className={`text-[10px] mt-1 font-semibold text-right ${mine ? 'text-white/80' : 'text-(--brand-muted)'}`}>
                        {timeLabel(m.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3.5 sm:p-4 border-t border-(--brand-border) bg-(--brand-card)/95 backdrop-blur-2xl">
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message to station owner…"
                maxLength={1000}
                className="flex-1 px-4 py-3 rounded-2xl bg-(--surface-soft) border border-(--brand-border) text-sm font-semibold text-(--brand-ink) outline-none focus:border-(--brand-blue) focus:ring-1 focus:ring-(--brand-blue) placeholder:text-(--brand-muted) shadow-inner transition-all"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !draft.trim()}
                className="w-11 h-11 shrink-0 rounded-2xl bg-linear-to-br from-(--brand-blue) to-(--brand-green) text-white flex items-center justify-center shadow-md hover:brightness-105 disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
                title="Send Message"
              >
                {sending ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        <Toast
          message={toastMessage?.msg || null}
          type={toastMessage?.type || 'error'}
          onClose={() => setToastMessage(null)}
        />
      </section>
    );
  }

  // Filter conversations by search query
  const filteredConversations = conversations.filter(c =>
    c.stationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ── CONVERSATION LIST VIEW ──
  return (
    <section className="space-y-6 relative pb-12 font-sans text-(--brand-ink)">
      {/* Header Banner matching Account Center */}
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-4xl border border-(--brand-border) bg-(--brand-card)/90 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_24px_64px_-44px_rgba(9,32,52,0.58)] relative z-10"
      >
        <div className="flex items-center gap-3.5">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-(--surface-soft) border border-(--brand-border) text-(--brand-ink) hover:bg-(--surface-tint) active:scale-95 transition-all cursor-pointer shrink-0 shadow-xs"
              title="Back"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-(--brand-muted)">Direct Communication</p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-(--brand-ink) tracking-tight mt-1 truncate">
              Station
              <span className="text-transparent bg-clip-text bg-linear-to-r from-(--brand-blue) to-(--brand-green)"> Messages</span>
            </h1>
          </div>
        </div>
        <p className="text-(--brand-muted) text-sm mt-1.5 font-medium">
          Chat directly with station owners regarding charger status, hardware specs, and reservation confirmations.
        </p>
      </motion.header>

      {/* Search Input Bar */}
      {conversations.length > 0 && (
        <div className="mb-6 relative z-10">
          <div className="relative flex items-center">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute left-4 text-(--brand-muted) pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search station conversations…"
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-(--brand-card)/85 border border-(--brand-border) text-sm font-semibold text-(--brand-ink) placeholder:text-(--brand-muted) focus:outline-none focus:border-(--brand-blue) focus:ring-1 focus:ring-(--brand-blue) backdrop-blur-2xl shadow-xs transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3.5 text-xs text-(--brand-muted) hover:text-(--brand-ink) p-1 cursor-pointer">✕</button>
            )}
          </div>
        </div>
      )}

      {/* Conversation Cards List */}
      <div className="space-y-3 relative z-10">
        {loadingList ? (
          <div className="bg-(--brand-card)/82 backdrop-blur-2xl rounded-3xl border border-(--brand-border) p-8 text-center text-sm font-semibold text-(--brand-muted)">
            Loading conversations…
          </div>
        ) : conversations.length === 0 ? (
          <div className="relative rounded-3xl border border-(--brand-card)/80 bg-(--brand-card)/82 backdrop-blur-2xl p-8 sm:p-12 text-center shadow-[0_20px_50px_-25px_rgba(9,32,52,0.4)] overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-(--brand-blue)/15 to-(--brand-green)/15 text-(--brand-blue) border border-(--brand-blue)/20 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-.462-.011-.924-.033-1.385-.067-1.134-.084-1.98-.985-1.98-2.122v-4.286c0-1.137.846-2.1 1.98-2.193 1.196-.096 2.408-.145 3.635-.145.748 0 1.488.018 2.22.052z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.511C10.512 4.344 12.78 4.25 15.05 4.25c1.472 0 2.93.039 4.373.116M15.05 4.25v2.25M6.27 6.634C5.136 6.727 4.29 7.628 4.29 8.765v4.286c0 1.137.846 2.038 1.98 2.122.461.034.923.056 1.385.067" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-(--brand-ink) tracking-tight">No Active Conversations</h3>
            <p className="text-sm text-(--brand-muted) mt-2 max-w-sm mx-auto font-medium leading-relaxed">
              Select any station on the map and tap <span className="font-bold text-(--brand-blue)">Message</span> to open a direct thread with the station operator.
            </p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="bg-(--brand-card)/82 backdrop-blur-2xl rounded-3xl border border-(--brand-border) p-8 text-center text-sm font-semibold text-(--brand-muted)">
            No station chats matching "{searchQuery}".
          </div>
        ) : (
          filteredConversations.map((c) => (
            <div
              key={c.stationId}
              onClick={() => openThread(c.stationId)}
              className="bg-(--brand-card)/84 backdrop-blur-2xl rounded-3xl border border-(--brand-border) p-4 sm:p-5 flex items-center justify-between gap-4 shadow-[0_10px_30px_-24px_rgba(9,32,52,0.45)] hover:border-(--brand-blue)/50 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-(--brand-blue) to-(--brand-green) text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                  {c.stationName?.charAt(0) || 'S'}
                </div>
                {c.unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-(--ui-error) text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                    {c.unread}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h3 className="font-bold text-(--brand-ink) text-base truncate group-hover:text-(--brand-blue) transition-colors">{c.stationName}</h3>
                  <span className={`text-[11px] font-semibold shrink-0 ${c.unread > 0 ? 'text-(--brand-blue) font-bold' : 'text-(--brand-muted)'}`}>{timeLabel(c.lastTime)}</span>
                </div>
                <p className={`text-[13px] truncate leading-snug ${c.unread > 0 ? 'text-(--brand-ink) font-bold' : 'text-(--brand-muted)'}`}>
                  {c.lastMessage || 'No messages yet'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {c.phone && (
                  <a
                    href={`tel:${c.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-(--brand-blue)/10 hover:bg-(--brand-blue)/20 text-(--brand-blue) border border-(--brand-blue)/20 transition-all cursor-pointer"
                    title={`Call ${c.stationName}`}
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.864-1.041l-3.286-.47a1.125 1.125 0 00-1.073.436l-2.276 3.034c-2.126-1.01-3.951-2.835-4.96-4.96l3.034-2.276a1.125 1.125 0 00.436-1.073l-.47-3.286c-.075-.512-.525-.864-1.041-.864H4.5a2.25 2.25 0 00-2.25 2.25z" /></svg>
                  </a>
                )}
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-(--brand-muted) group-hover:text-(--brand-ink) group-hover:translate-x-0.5 transition-all"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </div>
            </div>
          ))
        )}
      </div>

      <Toast
        message={toastMessage?.msg || null}
        type={toastMessage?.type || 'error'}
        onClose={() => setToastMessage(null)}
      />
    </section>
  );
}
