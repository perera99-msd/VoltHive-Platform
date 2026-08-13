'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  message: string | null;
  type?: 'error' | 'success' | 'info';
  onClose: () => void;
  durationMs?: number;
}

export default function Toast({ message, type = 'error', onClose, durationMs = 2000 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [message, onClose, durationMs]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-28 sm:bottom-8 left-4 right-4 sm:left-auto sm:right-8 sm:max-w-md z-[9999]"
        >
          <div className={`p-4 sm:p-5 rounded-2xl backdrop-blur-2xl shadow-2xl border flex items-center gap-3.5 text-sm font-bold ${
            type === 'error'
              ? 'bg-[#ffebe9]/95 text-[#d93829] border-[#d93829]/30 shadow-[#d93829]/15'
              : type === 'success'
              ? 'bg-[#e8f3ef]/95 text-[#1e6b52] border-[#1e6b52]/30 shadow-[#1e6b52]/15'
              : 'bg-white/95 text-(--brand-ink) border-(--brand-border) shadow-black/10'
          }`}>
            <span className="text-lg">
              {type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}
            </span>
            <span className="flex-1 leading-snug">{message}</span>
            <button onClick={onClose} className="opacity-60 hover:opacity-100 p-1 cursor-pointer">✕</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
