'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

/**
 * App splash screen. Shown on every launch (and especially in installed /
 * standalone mobile mode) until Firebase auth state resolves and a short
 * branded animation has played — behaves like a native app launch, no "PWA"
 * wording anywhere.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 1300);
    return () => clearTimeout(t);
  }, []);

  const ready = !loading && minElapsed;

  return (
    <>
      <AnimatePresence>
        {!ready && (
          <motion.div
            key="vh-splash"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="fixed inset-0 z-[999] bg-[#f4f8f6] bg-gradient-to-b from-[#f8faf6] via-[#f0f5f2] to-[#e6efec] flex flex-col items-center justify-center overflow-hidden font-sans text-(--brand-ink)"
          >
            {/* Soft Cyan & Mint Ambient Glows matching Landing Page */}
            <div className="absolute -top-28 -right-20 w-96 h-96 rounded-full bg-[#2fb39a]/14 blur-[140px] pointer-events-none" />
            <div className="absolute -bottom-28 -left-20 w-96 h-96 rounded-full bg-[#2563eb]/10 blur-[140px] pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: [0.97, 1.01, 0.98, 1] }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex flex-col items-center justify-center text-center px-4"
            >
              {/* Centered VoltHive Logo */}
              <Image
                src="/brand/logo-without-slogan.png"
                alt="VoltHive Platform"
                width={180}
                height={48}
                priority
                className="h-10 sm:h-11 w-auto object-contain drop-shadow-sm"
              />

              {/* Minimal Shimmer Line */}
              <div className="mt-6 w-32 h-[2.5px] rounded-full bg-[#dce5e1] overflow-hidden relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#2fb39a] to-[#2563eb] rounded-full"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </>
  );
}
