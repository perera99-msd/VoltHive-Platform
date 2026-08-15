'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { apiUrl } from '../lib/api';
import { createSSEClient, SSEStatus } from '../lib/sse';

export type LiveEvent =
  | 'connected'
  | 'booking.created'
  | 'booking.updated'
  | 'booking.deleted'
  | 'booking.expired'
  | 'message.new'
  | 'availability.updated';

/** SSE event payload — always a JSON object from the backend. */
export type LiveEventPayload = Record<string, unknown>;

interface LiveEventsContextType {
  /** Subscribe to one or more event names. Returns unsubscribe. */
  subscribe: (
    events: LiveEvent | LiveEvent[],
    handler: (event: LiveEvent, data: LiveEventPayload) => void
  ) => () => void;
  /** Follow a station for live availability updates. */
  followStation: (stationId: string) => Promise<boolean>;
  /** Unfollow a station. */
  unfollowStation: (stationId: string) => Promise<boolean>;
  status: SSEStatus;
  isLive: boolean;
}

const LiveEventsContext = createContext<LiveEventsContextType>({
  subscribe: () => () => {},
  followStation: async () => false,
  unfollowStation: async () => false,
  status: 'closed',
  isLive: false,
});

export function LiveEventsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<SSEStatus>('closed');
  const handlersRef = useRef<Map<string, Set<(event: LiveEvent, data: LiveEventPayload) => void>>>(new Map());
  const clientRef = useRef<{ close: () => void } | null>(null);
  const followedRef = useRef<Set<string>>(new Set());

  const handleEvent = useCallback((event: string, data: unknown) => {
    const handlers = handlersRef.current.get(event);
    if (!handlers) return;
    const payload = (data && typeof data === 'object' ? data : {}) as LiveEventPayload;
    for (const handler of handlers) {
      try {
        handler(event as LiveEvent, payload);
      } catch (err) {
        console.error(`LiveEvents handler error for "${event}":`, err);
      }
    }
  }, []);

  // Open / close the SSE stream based on auth state.
  useEffect(() => {
    if (!user) {
      // client.close() emits the 'closed' status via onStatus.
      clientRef.current?.close();
      clientRef.current = null;
      return;
    }

    const client = createSSEClient(apiUrl('/api/events'), {
      token: async () => {
        try {
          return await user.getIdToken();
        } catch {
          return null;
        }
      },
      onEvent: handleEvent,
      onStatus: setStatus,
    });
    clientRef.current = client;

    return () => {
      client.close();
      clientRef.current = null;
    };
  }, [user, handleEvent]);

  const subscribe = useCallback(
    (events: LiveEvent | LiveEvent[], handler: (event: LiveEvent, data: LiveEventPayload) => void) => {
      const list = Array.isArray(events) ? events : [events];
      for (const evt of list) {
        if (!handlersRef.current.has(evt)) handlersRef.current.set(evt, new Set());
        handlersRef.current.get(evt)!.add(handler);
      }
      return () => {
        for (const evt of list) {
          handlersRef.current.get(evt)?.delete(handler);
        }
      };
    },
    []
  );

  const withAuthPost = useCallback(async (path: string, stationId: string) => {
    if (!user) return false;
    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl(path), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stationId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, [user]);

  const followStation = useCallback(
    async (stationId: string) => {
      const ok = await withAuthPost('/api/events/follow', stationId);
      if (ok) followedRef.current.add(stationId);
      return ok;
    },
    [withAuthPost]
  );

  const unfollowStation = useCallback(
    async (stationId: string) => {
      const ok = await withAuthPost('/api/events/unfollow', stationId);
      if (ok) followedRef.current.delete(stationId);
      return ok;
    },
    [withAuthPost]
  );

  return (
    <LiveEventsContext.Provider
      value={{ subscribe, followStation, unfollowStation, status, isLive: status === 'open' }}
    >
      {children}
    </LiveEventsContext.Provider>
  );
}

export const useLiveEvents = () => useContext(LiveEventsContext);
