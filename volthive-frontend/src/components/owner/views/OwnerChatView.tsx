'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../lib/api';
import { motion } from 'framer-motion';

interface OwnerThread {
  stationId: string;
  stationName: string;
  driverId: string;
  driverName: string;
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
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function OwnerChatView() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<OwnerThread[]>([]);
  const [openThread, setOpenThread] = useState<OwnerThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const tokenFor = useCallback(async () => (await user?.getIdToken()) || '', [user]);

  const loadThreads = useCallback(async () => {
    if (!user) return;
    try {
      const token = await tokenFor();
      const res = await fetch(apiUrl('/api/chat/owner/conversations'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setThreads(json.data || []);
      }
    } catch (e) {
      console.warn('Failed to load chat threads', e);
    } finally {
      setLoadingList(false);
    }
  }, [user, tokenFor]);

  const openConversation = useCallback(async (t: OwnerThread) => {
    setOpenThread(t);
    setLoadingThread(true);
    setError('');
    try {
      const token = await tokenFor();
      const res = await fetch(apiUrl(`/api/chat/owner/${t.stationId}/${t.driverId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setMessages(json.messages || []);
        loadThreads();
      }
    } catch (e) {
      setError('Could not open this conversation.');
    } finally {
      setLoadingThread(false);
    }
  }, [tokenFor, loadThreads]);

  const sendReply = async () => {
    const text = draft.trim();
    if (!user || !openThread || !text || sending) return;
    setSending(true);
    setError('');
    try {
      const token = await tokenFor();
      const res = await fetch(apiUrl(`/api/chat/owner/${openThread.stationId}/${openThread.driverId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const json = await res.json();
        setMessages(prev => [...prev, json.message]);
        setDraft('');
        loadThreads();
      } else {
        setError('Reply failed to send.');
      }
    } catch (e) {
      setError('Could not send reply.');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  // Poll while a thread is open
  useEffect(() => {
    if (!openThread) return;
    const timer = setInterval(async () => {
      if (!user) return;
      try {
        const token = await tokenFor();
        const res = await fetch(apiUrl(`/api/chat/owner/${openThread.stationId}/${openThread.driverId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setMessages(json.messages || []);
        }
      } catch (e) { /* keep state */ }
    }, 6000);
    return () => clearInterval(timer);
  }, [openThread, user, tokenFor]);

  const backToList = () => {
    setOpenThread(null);
    setMessages([]);
    loadThreads();
  };

  // ── THREAD VIEW ──
  if (openThread) {
    return (
      <section className="flex flex-col h-[calc(100vh-160px)] min-h-[420px] font-sans">
        <div className="flex items-center gap-3 p-4 border-b border-(--brand-border) bg-white rounded-t-2xl sticky top-0 z-10">
          <button onClick={backToList} className="w-9 h-9 flex items-center justify-center rounded-full bg-(--surface-soft) border border-(--brand-border) text-(--brand-ink) cursor-pointer">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-(--brand-ink) truncate">{openThread.driverName}</h2>
            <p className="text-[11px] text-(--brand-muted) font-medium truncate">{openThread.stationName}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-2.5 bg-(--surface-soft)/30 [&::-webkit-scrollbar]:hidden">
          {loadingThread ? (
            <div className="text-center text-sm text-(--brand-muted) py-10">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-3xl block mb-2">💬</span>
              <p className="text-sm font-bold text-(--brand-ink)">No messages yet</p>
              <p className="text-xs text-(--brand-muted) mt-1">Reply to this driver when they reach out.</p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.sender === 'owner';
              return (
                <motion.div key={m._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${mine ? 'bg-(--brand-green) text-white rounded-br-md' : 'bg-white text-(--brand-ink) border border-(--brand-border) rounded-bl-md'}`}>
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    <p className={`text-[10px] mt-1 font-semibold ${mine ? 'text-white/70' : 'text-(--brand-muted)'}`}>{timeLabel(m.createdAt)}</p>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t border-(--brand-border) bg-white sticky bottom-0 z-10 rounded-b-2xl">
          {error && <p className="text-xs text-(--ui-error) font-semibold px-2 pb-2">{error}</p>}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendReply(); }}
              placeholder="Reply as station…"
              maxLength={1000}
              className="flex-1 px-4 py-3 rounded-full bg-(--surface-soft) border border-(--brand-border) text-sm text-(--brand-ink) outline-none focus:border-(--brand-blue) placeholder:text-(--brand-muted)"
            />
            <button
              onClick={sendReply}
              disabled={sending || !draft.trim()}
              className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-r from-[#4a90a4] to-[#6cb567] text-white flex items-center justify-center shadow-md disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ── THREAD LIST ──
  return (
    <div className="font-sans">
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold text-(--brand-ink) tracking-tight">Station Messages</h1>
        <p className="text-[12px] text-(--brand-muted) font-medium mt-0.5">Chat threads with drivers across your stations.</p>
      </div>

      <div className="bg-white rounded-2xl border border-(--brand-border)/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
        {loadingList ? (
          <div className="p-8 text-center text-sm text-(--brand-muted)">Loading conversations…</div>
        ) : threads.length === 0 ? (
          <div className="p-10 text-center">
            <span className="text-4xl block mb-3">💬</span>
            <p className="font-bold text-(--brand-ink)">No driver messages yet</p>
            <p className="text-sm text-(--brand-muted) mt-1 max-w-xs mx-auto">When a driver chats with your station, their thread appears here.</p>
          </div>
        ) : (
          threads.map((t, i) => (
            <button
              key={`${t.stationId}-${t.driverId}`}
              onClick={() => openConversation(t)}
              className={`w-full flex items-center gap-3.5 p-4 text-left hover:bg-(--surface-soft)/60 transition-colors cursor-pointer ${i !== 0 ? 'border-t border-(--brand-border)/60' : ''}`}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4a90a4] to-[#6cb567] text-white flex items-center justify-center font-bold text-lg">
                  {t.driverName?.charAt(0) || 'D'}
                </div>
                {t.unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center shadow">{t.unread}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-(--brand-ink) truncate">{t.driverName}</h3>
                  <span className={`text-[10px] font-semibold shrink-0 ${t.unread > 0 ? 'text-[#3f7f90] font-bold' : 'text-(--brand-muted)'}`}>{timeLabel(t.lastTime)}</span>
                </div>
                <p className="text-[12px] font-bold text-(--brand-muted)">{t.stationName}</p>
                <p className={`text-[13px] truncate ${t.unread > 0 ? 'text-(--brand-ink) font-semibold' : 'text-(--brand-muted)'}`}>
                  {t.lastMessage || 'No messages yet'}
                </p>
              </div>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-(--brand-muted) shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
