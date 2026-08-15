'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLiveEvents } from '../../../context/LiveEventsContext';
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
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const QUICK_REPLIES = [
  '🔌 Your charging port is ready and unlocked.',
  '⚡ Charging session has started successfully.',
  '💳 Please proceed to checkout at the counter.',
  '📞 An operator is on the way to assist you.',
  '⏱️ Your reserved slot is approaching its end time.'
];

export default function OwnerChatView() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<OwnerThread[]>([]);
  const [openThread, setOpenThread] = useState<OwnerThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  
  const chatStreamRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
        const data: OwnerThread[] = json.data || [];
        setThreads(data);
        
        // Auto-select first thread on desktop if none open
        if (!openThread && data.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1024) {
          openConversation(data[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to load chat threads', e);
    } finally {
      setLoadingList(false);
    }
  }, [user, tokenFor, openThread]);

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
        
        // Refresh unread counts
        const refreshRes = await fetch(apiUrl('/api/chat/owner/conversations'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (refreshRes.ok) {
          const freshData = await refreshRes.json();
          setThreads(freshData.data || []);
        }
      }
    } catch (e) {
      setError('Could not load messages for this conversation.');
    } finally {
      setLoadingThread(false);
    }
  }, [tokenFor]);

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
        setError('Reply failed to send. Please try again.');
      }
    } catch (e) {
      setError('Could not send reply. Check your network.');
    } finally {
      setSending(false);
    }
  };

  // Refresh just the open thread (used by SSE + fallback poll).
  const refreshThread = useCallback(async () => {
    if (!user || !openThread) return;
    try {
      const token = await tokenFor();
      const res = await fetch(apiUrl(`/api/chat/owner/${openThread.stationId}/${openThread.driverId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setMessages(json.messages || []);
        loadThreads();
      }
    } catch (e) {
      console.warn('Failed to refresh chat thread', e);
    }
  }, [user, openThread, tokenFor, loadThreads]);

  const handleQuickReply = (text: string) => {
    setDraft(text);
    inputRef.current?.focus();
  };

  // Scroll ONLY the inner chat stream container
  useEffect(() => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
    }
  }, [messages, loadingThread]);

  useEffect(() => { 
    loadThreads(); 
  }, [loadThreads]);

  // Poll while a thread is open — slow fallback; SSE pushes instant updates.
  useEffect(() => {
    if (!openThread) return;
    const timer = setInterval(() => {
      if (!user || (typeof document !== 'undefined' && document.hidden)) return;
      refreshThread();
    }, 30000);
    return () => clearInterval(timer);
  }, [openThread, user, refreshThread]);

  // Realtime: new message in the open thread → refresh instantly.
  const { subscribe } = useLiveEvents();
  useEffect(() => {
    if (!openThread) return;
    const unsub = subscribe('message.new', (_event, data) => {
      if (!data) return;
      if (String(data.stationId) === String(openThread.stationId) &&
          String(data.driverId) === String(openThread.driverId)) {
        refreshThread();
      }
    });
    return unsub;
  }, [openThread, subscribe, refreshThread]);

  const backToList = () => {
    setOpenThread(null);
    setMessages([]);
    loadThreads();
  };

  const filteredThreads = threads.filter(t => {
    const dName = t.driverName || '';
    const sName = t.stationName || '';
    const lastMsg = t.lastMessage || '';
    const query = searchQuery.toLowerCase();
    return dName.toLowerCase().includes(query) || sName.toLowerCase().includes(query) || lastMsg.toLowerCase().includes(query);
  });

  const totalUnread = threads.reduce((acc, t) => acc + (t.unread || 0), 0);

  return (
    <div className="w-full flex flex-col font-sans space-y-4">
      
      {/* ── 1. HEADER BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-6 sm:py-3.5 bg-white/80 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-linear-to-tr from-(--brand-blue) to-(--brand-green) text-white font-black flex items-center justify-center shadow-xs shrink-0">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4.5 h-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.767-.704 5.922 5.922 0 011.026-3.47A7.95 7.95 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-(--brand-ink)">
              Driver Support & Messages
            </h1>
            <p className="text-xs text-(--brand-muted) font-medium">
              Real-time two-way operator communication with EV drivers charging at your premises.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {totalUnread > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[11px] font-black border border-rose-200 shadow-2xs animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {totalUnread} Unread
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[11px] font-black border border-(--brand-blue)/20">
            {threads.length} Active Conversation{threads.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── 2. SPLIT-PANE MESSAGING CONSOLE (Exact Viewport Fit) ── */}
      <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden h-[calc(100vh-230px)] min-h-[460px] max-h-[750px] grid grid-cols-1 lg:grid-cols-12">
        
        {/* ── LEFT PANE: CONVERSATION THREAD LIST (4 cols on lg) ── */}
        <div className={`lg:col-span-4 border-r border-[#e0e5e3]/90 flex flex-col h-full bg-white/60 min-h-0 ${openThread ? 'hidden lg:flex' : 'flex'}`}>
          
          {/* Search Header */}
          <div className="p-3 border-b border-[#e0e5e3]/80 bg-white/80 backdrop-blur-md shrink-0">
            <div className="relative">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4 text-(--brand-muted) absolute left-3.5 top-1/2 -translate-y-1/2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drivers or stations..."
                className="w-full pl-10 pr-8 py-2 bg-(--surface-soft)/60 border border-[#e0e5e3] rounded-2xl text-xs font-semibold text-(--brand-ink) placeholder:text-(--brand-muted)/70 focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) focus:bg-white transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-(--brand-muted) hover:text-(--brand-ink) font-bold text-xs p-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Threads List Stream */}
          <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-[#e0e5e3]/50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#e0e5e3] [&::-webkit-scrollbar-thumb]:rounded-full">
            {loadingList ? (
              <div className="p-10 text-center text-xs font-bold text-(--brand-muted) flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-(--brand-blue) border-t-transparent rounded-full animate-spin" />
                <span>Loading conversations…</span>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-10 text-center text-xs text-(--brand-muted) space-y-2">
                <span className="text-3xl block">💬</span>
                <p className="font-extrabold text-(--brand-ink)">No conversations found</p>
                <p className="text-[11px] leading-relaxed">
                  {searchQuery ? `No results match "${searchQuery}".` : 'Incoming chats from drivers will appear here.'}
                </p>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isSelected = openThread?.stationId === t.stationId && openThread?.driverId === t.driverId;
                return (
                  <button
                    key={`${t.stationId}-${t.driverId}`}
                    onClick={() => openConversation(t)}
                    className={`w-full flex items-start gap-3 p-3.5 text-left transition-all cursor-pointer group ${
                      isSelected 
                        ? 'bg-linear-to-r from-(--brand-blue)/10 to-(--brand-green)/10 border-l-4 border-l-(--brand-blue) shadow-2xs' 
                        : 'hover:bg-(--surface-soft)/40'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0 mt-0.5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-2xs group-hover:scale-105 transition-transform ${
                        isSelected 
                          ? 'bg-linear-to-tr from-(--brand-blue) to-(--brand-green)' 
                          : 'bg-linear-to-tr from-(--brand-blue)/80 to-(--brand-green)/80'
                      }`}>
                        {(t.driverName || 'D')[0].toUpperCase()}
                      </div>
                      {t.unread > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
                          {t.unread}
                        </span>
                      )}
                    </div>

                    {/* Thread Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5 mb-0.5">
                        <h4 className={`text-xs font-black truncate ${isSelected ? 'text-(--brand-blue-deep)' : 'text-(--brand-ink)'}`}>
                          {t.driverName}
                        </h4>
                        <span className={`text-[10px] font-bold shrink-0 ${t.unread > 0 ? 'text-(--brand-blue-deep) font-black' : 'text-(--brand-muted)'}`}>
                          {timeLabel(t.lastTime)}
                        </span>
                      </div>
                      
                      <p className="text-[10px] font-bold text-(--brand-blue-deep) truncate mb-0.5">
                        📍 {t.stationName}
                      </p>
                      
                      <p className={`text-xs truncate ${t.unread > 0 ? 'text-(--brand-ink) font-extrabold' : 'text-(--brand-muted) font-medium'}`}>
                        {t.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANE: ACTIVE CHAT ROOM (8 cols on lg) ── */}
        <div className={`lg:col-span-8 flex flex-col h-full bg-white min-h-0 ${!openThread ? 'hidden lg:flex' : 'flex'}`}>
          {!openThread ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-(--surface-soft)/20">
              <div className="w-14 h-14 rounded-3xl bg-white border border-[#e0e5e3] flex items-center justify-center text-2xl shadow-sm mb-3">
                💬
              </div>
              <h3 className="text-sm font-black text-(--brand-ink)">Select a Driver Conversation</h3>
              <p className="text-xs text-(--brand-muted) mt-1 max-w-sm font-medium leading-relaxed">
                Choose a conversation from the left thread list to reply, send charging status updates, or answer driver inquiries.
              </p>
            </div>
          ) : (
            <>
              {/* Active Thread Room Header */}
              <div className="px-5 py-3 border-b border-[#e0e5e3]/90 bg-white/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={backToList}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-(--surface-soft) border border-[#e0e5e3] text-(--brand-ink) hover:bg-white transition-colors cursor-pointer shrink-0 lg:hidden shadow-2xs"
                    title="Back to conversations"
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>

                  <div className="w-9 h-9 rounded-2xl bg-linear-to-tr from-(--brand-blue) to-(--brand-green) text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {(openThread.driverName || 'D')[0].toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-xs sm:text-sm font-black text-(--brand-ink) truncate leading-tight">
                      {openThread.driverName}
                    </h2>
                    <p className="text-[10px] sm:text-[11px] text-(--brand-muted) font-semibold truncate leading-tight">
                      Station: <span className="text-(--brand-blue-deep) font-black">{openThread.stationName}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--brand-green)/10 text-(--brand-green-deep) text-[9px] sm:text-[10px] font-black uppercase tracking-wider border border-(--brand-green)/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-(--brand-green) animate-pulse" />
                    Live Support
                  </span>
                </div>
              </div>

              {/* Message Bubble History Stream */}
              <div 
                ref={chatStreamRef}
                className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3 bg-(--surface-soft)/30 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#e0e5e3] [&::-webkit-scrollbar-thumb]:rounded-full"
              >
                {loadingThread ? (
                  <div className="flex flex-col items-center justify-center py-20 text-xs font-bold text-(--brand-muted) gap-2">
                    <div className="w-6 h-6 border-2 border-(--brand-blue) border-t-transparent rounded-full animate-spin" />
                    <span>Loading conversation history…</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16">
                    <span className="text-3xl block mb-2">👋</span>
                    <p className="text-sm font-black text-(--brand-ink)">Start of Conversation</p>
                    <p className="text-xs text-(--brand-muted) mt-1 font-medium">Send a message to assist this driver at your charging location.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender === 'owner';
                    return (
                      <motion.div
                        key={m._id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            mine
                              ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white rounded-br-xs font-medium'
                              : 'bg-white text-(--brand-ink) border border-[#e0e5e3] rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.text}</p>
                          <p className={`text-[9px] mt-1 font-bold ${mine ? 'text-white/75 text-right' : 'text-(--brand-muted)'}`}>
                            {mine ? 'Station Operator · ' : `${openThread.driverName} · `}
                            {timeLabel(m.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Quick Template Replies Chips */}
              <div className="px-3.5 py-2 bg-white border-t border-[#e0e5e3]/60 overflow-x-auto flex items-center gap-2 shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <span className="text-[9px] font-black uppercase tracking-wider text-(--brand-muted) shrink-0">
                  Quick:
                </span>
                {QUICK_REPLIES.map((reply, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickReply(reply)}
                    className="px-2.5 py-1 rounded-xl bg-(--surface-soft)/60 hover:bg-(--surface-soft) text-(--brand-ink) text-[10.5px] font-semibold border border-[#e0e5e3] whitespace-nowrap cursor-pointer hover:border-(--brand-blue)/30 transition-all shrink-0 active:scale-95"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Message Composer Footer */}
              <div className="p-3 border-t border-[#e0e5e3]/90 bg-white shrink-0 space-y-1.5">
                {error && (
                  <div className="p-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                    <span>⚠️</span> {error}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    placeholder="Type a message to the driver as station operator..."
                    maxLength={1000}
                    className="flex-1 px-3.5 py-2.5 rounded-2xl bg-(--surface-soft)/50 border border-[#e0e5e3] text-xs font-semibold text-(--brand-ink) outline-none focus:border-(--brand-blue) focus:bg-white focus:ring-2 focus:ring-(--brand-blue)/20 transition-all placeholder:text-(--brand-muted)/70 shadow-2xs"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !draft.trim()}
                    className="px-4 py-2.5 shrink-0 rounded-2xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white flex items-center justify-center gap-1.5 text-xs font-black shadow-xs hover:shadow-md hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all"
                  >
                    <span>{sending ? 'Sending...' : 'Send'}</span>
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
