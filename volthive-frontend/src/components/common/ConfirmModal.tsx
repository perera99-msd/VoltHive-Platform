'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  onConfirm,
  onClose,
  isLoading = false
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          {/* Frosted Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
            className="absolute inset-0 bg-linear-to-br from-(--brand-ink)/40 to-(--brand-ink)/60 backdrop-blur-xl"
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-md bg-(--brand-card)/95 backdrop-blur-3xl rounded-3xl p-6 sm:p-8 border border-(--brand-border) shadow-[0_34px_80px_-30px_rgba(9,32,52,0.7)] text-(--brand-ink)"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isDanger ? 'bg-(--ui-error)/15 text-(--ui-error)' : 'bg-(--brand-blue)/15 text-(--brand-blue)'
              }`}>
                {isDanger ? (
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                ) : (
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.21M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-xl font-bold text-(--brand-ink) mb-1">{title}</h3>
                <p className="text-xs sm:text-sm text-(--brand-muted) leading-relaxed">{message}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-(--brand-border)/60">
              <button
                type="button"
                disabled={isLoading}
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-(--surface-soft) hover:bg-(--surface-tint) text-(--brand-ink) font-bold rounded-xl text-sm transition-all border border-(--brand-border) cursor-pointer disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={onConfirm}
                className={`flex-1 py-3 px-4 font-bold rounded-xl text-sm transition-all shadow-md text-white cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
                  isDanger
                    ? 'bg-(--ui-error) hover:brightness-110 shadow-(--ui-error)/25'
                    : 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) hover:brightness-105 shadow-(--brand-blue)/25'
                }`}
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}
                <span>{confirmText}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
