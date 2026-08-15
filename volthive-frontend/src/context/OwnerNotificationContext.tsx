'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useLiveEvents } from './LiveEventsContext';
import { apiUrl } from '../lib/api';

export interface OwnerNotification {
  id: string;
  type: 'booking' | 'message' | 'ai' | 'system';
  title: string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
  archived: boolean;
  targetTab?: string;
  targetId?: string; // bookingId or stationId
  stationName?: string;
  driverName?: string;
}

interface OwnerNotificationContextType {
  notifications: OwnerNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  archiveNotification: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  refreshNotifications: () => Promise<void>;
}

const OwnerNotificationContext = createContext<OwnerNotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  archiveNotification: () => {},
  deleteNotification: () => {},
  clearAll: () => {},
  refreshNotifications: async () => {},
});

const STORAGE_KEY = 'volthive_owner_notifications_store_v1';

export function OwnerNotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<OwnerNotification[]>([]);
  const isFetchingRef = useRef(false);

  // Load persisted state or seeds
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } catch {
      // fallback
    }
  }, []);

  // Persist state
  const persist = (items: OwnerNotification[]) => {
    setNotifications(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // silent
    }
  };

  // Poll backend for real events with concurrency lock & visibility check
  const refreshNotifications = useCallback(async () => {
    if (!user || isFetchingRef.current) return;
    if (typeof document !== 'undefined' && document.hidden) return;

    isFetchingRef.current = true;
    try {
      const token = await user.getIdToken();
      
      // Fetch bookings & conversations concurrently
      const [bookingsRes, chatRes] = await Promise.allSettled([
        fetch(apiUrl('/api/bookings/owner'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(apiUrl('/api/chat/owner/conversations'), { headers: { Authorization: `Bearer ${token}` } })
      ]);

      let liveBookings: any[] = [];
      if (bookingsRes.status === 'fulfilled' && bookingsRes.value.ok) {
        const json = await bookingsRes.value.json();
        liveBookings = json.data || [];
      }

      let liveChats: any[] = [];
      if (chatRes.status === 'fulfilled' && chatRes.value.ok) {
        const json = await chatRes.value.json();
        liveChats = json.data || [];
      }

      setNotifications(prev => {
        const existingMap = new Map(prev.map(n => [n.id, n]));
        const generated: OwnerNotification[] = [...prev];

        // Process Bookings
        liveBookings.forEach(b => {
          const notifId = `booking-${b._id}-${b.status}`;
          if (!existingMap.has(notifId)) {
            const driverName = b.driver?.name || b.driverName || 'EV Driver';
            const stationName = b.station?.stationName || b.station?.name || 'Charging Station';
            
            let title = '⚡ New Booking Received';
            let message = `${driverName} booked a charging slot at ${stationName}.`;
            if (b.status === 'Pending') {
              title = '⚡ Booking Pending Approval';
              message = `${driverName} requested reservation at ${stationName}. Action required.`;
            } else if (b.status === 'Confirmed') {
              title = '⚡ Booking Confirmed';
              message = `${driverName}'s reservation at ${stationName} is confirmed.`;
            } else if (b.status === 'Active_Charging') {
              title = '⚡ Charging Session Started';
              message = `${driverName} plugged in and started charging at ${stationName}.`;
            } else if (b.status === 'Completed') {
              title = '⚡ Charging Completed & Settled';
              message = `Session for ${driverName} completed at ${stationName}.`;
            }

            const newNotif: OwnerNotification = {
              id: notifId,
              type: 'booking',
              title,
              message,
              timestamp: b.updatedAt || b.createdAt || new Date().toISOString(),
              read: false,
              archived: false,
              targetTab: 'bookings',
              targetId: b._id,
              stationName,
              driverName
            };
            generated.unshift(newNotif);
            existingMap.set(notifId, newNotif);
          }
        });

        // Process Messages
        liveChats.forEach(c => {
          if (c.unread > 0 && c.lastMessage) {
            const notifId = `chat-${c.stationId}-${c.driverId}-${c.lastTime || Date.now()}`;
            if (!existingMap.has(notifId)) {
              const newNotif: OwnerNotification = {
                id: notifId,
                type: 'message',
                title: `💬 New Message from ${c.driverName || 'Driver'}`,
                message: `"${c.lastMessage}" (at ${c.stationName || 'Station'})`,
                timestamp: c.lastTime || new Date().toISOString(),
                read: false,
                archived: false,
                targetTab: 'chat',
                targetId: c.stationId,
                stationName: c.stationName,
                driverName: c.driverName
              };
              generated.unshift(newNotif);
              existingMap.set(notifId, newNotif);
            }
          }
        });

        // Limit to latest 50 notifications
        const trimmed = generated.slice(0, 50);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        } catch { /* silent */ }
        return trimmed;
      });

    } catch (err) {
      console.warn('Failed to refresh owner notifications', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, [user]);

  // Initial poll + slow self-healing fallback (SSE pushes instant updates when live)
  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 60000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  // Realtime: refresh the notification stream instantly when a booking or
  // message event arrives for this owner.
  const { subscribe } = useLiveEvents();
  useEffect(() => {
    const unsub = subscribe(
      ['booking.created', 'booking.updated', 'booking.deleted', 'booking.expired', 'message.new'],
      () => {
        refreshNotifications();
      }
    );
    return unsub;
  }, [subscribe, refreshNotifications]);

  const markAsRead = (id: string) => {
    persist(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    persist(notifications.map(n => ({ ...n, read: true })));
  };

  const archiveNotification = (id: string) => {
    persist(notifications.map(n => n.id === id ? { ...n, archived: true, read: true } : n));
  };

  const deleteNotification = (id: string) => {
    persist(notifications.filter(n => n.id !== id));
  };

  const clearAll = () => {
    persist([]);
  };

  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;

  return (
    <OwnerNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        archiveNotification,
        deleteNotification,
        clearAll,
        refreshNotifications,
      }}
    >
      {children}
    </OwnerNotificationContext.Provider>
  );
}

export const useOwnerNotifications = () => useContext(OwnerNotificationContext);
