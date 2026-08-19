'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { apiUrl } from '../../lib/api';

export default function OwnerLoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [telephone, setTelephone] = useState('');
  const [nicOrBrc, setNicOrBrc] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [town, setTown] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [remember, setRemember] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        // Validation
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        // Owner Registration
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        const token = await firebaseUser.getIdToken();

        // Sync metadata profile down to backend server instances
        const res = await fetch(apiUrl('/api/users'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            email,
            role: 'owner',
            firebaseUid: firebaseUser.uid,
            telephone,
            nicOrBrc,
            address,
            district,
            town
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to initialize owner profile sync.');
        }

        router.push('/owner-dashboard');
      } else {
        // Owner Login Flow
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        const token = await firebaseUser.getIdToken();

        let res = await fetch(apiUrl('/api/users/profile'), {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.status === 404) {
          res = await fetch(apiUrl('/api/users'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              name: firebaseUser.displayName || email.split('@')[0],
              email,
              role: 'owner',
              firebaseUid: firebaseUser.uid
            })
          });
        }

        if (res.ok) {
          const profile = await res.json();
          if (profile.role !== 'owner') {
            await auth.signOut();
            throw new Error('Access denied. This portal is explicitly reserved for registered Station Owners.');
          }
          router.push('/owner-dashboard');
        } else {
          throw new Error('Failed to verify user account in database.');
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Authentication lifecycle verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg('Please enter your network email endpoint above to reset token.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg(`Password reset link sent to ${email}. Check your inbox.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send password reset email.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-2xl bg-white/95 border border-(--brand-border) shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus:bg-white focus:border-(--accent-blue) focus:ring-4 focus:ring-(--accent-blue)/12 transition-all outline-none text-(--brand-ink) placeholder:text-(--brand-muted)/55 text-[14px] font-medium";

  const headerBlock = (
    <div className="mb-3">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isSignUp ? 'signup' : 'login'}
          initial={{ opacity: 0, y: 12, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -12, height: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], opacity: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
          className="overflow-hidden"
        >
          {!isSignUp && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-(--brand-blue)/8 border border-(--brand-blue)/18 text-(--brand-blue-deep) text-[10px] font-black uppercase tracking-[0.16em] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-(--brand-green) shadow-[0_0_10px_rgba(108,181,103,0.9)] animate-pulse" />
              Secure operator access
            </div>
          )}
          <h1 className="text-[2rem] leading-none tracking-[-0.04em] font-bold text-(--brand-ink) mb-2">
            {isSignUp ? 'Register your charging network' : 'Welcome back, operator'}
          </h1>
          <p className="text-[14px] text-(--brand-muted) leading-relaxed">
            {isSignUp
              ? 'Create your owner account and connect your charging business to the VoltHive network.'
              : 'Sign in to monitor network performance, unlock compliance tools, and manage your charging infrastructure.'}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  const alertsBlock = (
    <AnimatePresence mode="wait">
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-5 p-3.5 rounded-2xl border border-(--ui-error)/20 bg-(--ui-error)/8 text-[13px] text-(--ui-error) font-semibold flex items-center gap-3 shadow-[0_10px_24px_-16px_rgba(224,90,90,0.5)]"
        >
          <div className="w-7 h-7 rounded-full bg-(--ui-error)/12 flex items-center justify-center shrink-0">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          </div>
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-5 p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 text-[13px] text-emerald-700 font-semibold flex items-center gap-3 shadow-[0_10px_24px_-16px_rgba(16,185,129,0.5)]"
        >
          <div className="w-7 h-7 rounded-full bg-emerald-500/12 flex items-center justify-center shrink-0">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          </div>
          <span>{successMsg}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const submitButton = (
    <button
      type="submit"
      disabled={loading}
      className="relative z-10 w-full py-3 mt-2 rounded-2xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-bold text-[15px] hover:brightness-105 hover:shadow-[0_18px_38px_-12px_rgba(36,84,196,0.8)] active:scale-[0.99] transition-all duration-300 disabled:opacity-60 disabled:scale-100 flex justify-center items-center gap-2 group shadow-[0_18px_36px_-16px_rgba(74,144,164,0.9)]"
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-white vh-loader-soft" />
          Securing your access...
        </span>
      ) : (
        <>
          {isSignUp ? 'Create account' : 'Continue to dashboard'}
          <svg className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </>
      )}
    </button>
  );

  const trustNote = (
    <p className="mt-3 flex items-center justify-center gap-2 text-[11px] font-semibold text-(--brand-muted)">
      <svg className="w-3.5 h-3.5 text-(--brand-green)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
      Protected with enterprise-grade security
    </p>
  );

  const footerBlock = (
    <div className="mt-4 pt-3 border-t border-(--brand-border)">
      <p className="text-[13px] font-medium text-(--brand-muted) mb-3">
        {isSignUp ? 'Already have a deployment account?' : 'Need a station account?'}{' '}
        <button
          onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
          className="text-(--brand-blue-deep) font-bold hover:text-(--brand-blue) transition-colors"
        >
          {isSignUp ? 'Sign in here' : 'Register here'}
        </button>
      </p>

      <Link href="/driver-login" className="inline-flex items-center justify-between gap-3 w-full text-[12px] font-semibold text-(--brand-muted) hover:text-(--brand-ink) transition-colors p-3 rounded-2xl bg-(--surface-soft) border border-(--brand-border) hover:border-(--brand-border) shadow-[0_8px_18px_-15px_rgba(9,32,52,0.5)]">
        <span>Looking for EV driver access?</span>
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
      </Link>
    </div>
  );

  const formBody = (
    <form onSubmit={handleAuth} className="space-y-4">
      <AnimatePresence mode="wait" initial={false}>
      {isSignUp ? (
        // ==============================
        // SIGN UP LAYOUT (2-COLUMN GRID)
        // ==============================
        <motion.div
          key="signup"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], opacity: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 overflow-hidden"
        >
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Enterprise / Owner Name *</label>
            <input type="text" required placeholder="Anuradha Hardware" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Email Endpoint *</label>
            <input type="email" required placeholder="owner@enterprise.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Telephone *</label>
            <input type="tel" required placeholder="+94 7X XXX XXXX" value={telephone} onChange={(e) => setTelephone(e.target.value)} className={inputClass} />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">NIC or BRC Number *</label>
            <input type="text" required placeholder="Business Registration or ID" value={nicOrBrc} onChange={(e) => setNicOrBrc(e.target.value)} className={inputClass} />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Registered Address *</label>
            <input type="text" required placeholder="Full physical address" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">District <span className="lowercase font-medium">(Optional)</span></label>
            <input type="text" placeholder="e.g. Colombo" value={district} onChange={(e) => setDistrict(e.target.value)} className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Town <span className="lowercase font-medium">(Optional)</span></label>
            <input type="text" placeholder="e.g. Nugegoda" value={town} onChange={(e) => setTown(e.target.value)} className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Security Token *</label>
            <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} focus:border-(--accent-green) focus:ring-(--accent-green)/20 tracking-widest`} />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Confirm Token *</label>
            <input type="password" required placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputClass} focus:border-(--accent-green) focus:ring-(--accent-green)/20 tracking-widest`} />
          </div>
        </motion.div>
      ) : (
        // ==============================
        // LOGIN LAYOUT (SINGLE COLUMN)
        // ==============================
        <motion.div
          key="login"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], opacity: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
          className="space-y-4 overflow-hidden"
        >
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Network Email Endpoint</label>
            <input type="email" required placeholder="owner@enterprise.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[12px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Security Token</label>
              <button type="button" onClick={handleForgotPassword} className="text-[12px] font-semibold text-(--brand-blue-deep) hover:text-(--brand-blue) transition-colors">Forgot token?</button>
            </div>
            <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} focus:border-(--accent-green) focus:ring-(--accent-green)/20 tracking-widest`} />
          </div>
          <div className="flex items-center pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[13px] font-medium text-(--brand-muted)">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded accent-(--brand-green) cursor-pointer"
              />
              Remember this device
            </label>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
      {submitButton}
    </form>
  );

  return (
    <main className={`relative min-h-dvh w-full flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 ${isSignUp ? 'lg:py-6' : 'lg:py-14'} font-sans text-(--brand-ink) selection:bg-(--accent-blue)/30 overflow-x-hidden bg-[linear-gradient(160deg,#f5f7f6_0%,#e8f3ef_44%,#dcefe8_100%)]`}>
      {/* =========================================================
          BACKGROUND — same clean theme gradient as driver login
      ========================================================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[12%] -right-[10%] w-[70%] h-[60%] rounded-full bg-(--accent-blue)/25 blur-[120px] vh-float-soft" />
        <div className="absolute -bottom-[14%] -left-[10%] w-[70%] h-[60%] rounded-full bg-(--accent-green)/25 blur-[120px] vh-float-soft [animation-delay:2s]" />
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(rgba(74,144,164,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(108,181,103,0.08)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_100%_100%_at_50%_50%,#000_30%,transparent_100%)]" />
      </div>

      {/* =========================================================
          BACK BUTTON — top left
      ========================================================= */}
      <Link
        href="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50 group inline-flex items-center gap-2 rounded-full border border-(--brand-border) bg-(--brand-card)/85 px-3 py-2 shadow-[0_10px_25px_-12px_rgba(9,32,52,0.3)] backdrop-blur-md hover:shadow-[0_14px_30px_-14px_rgba(74,144,164,0.4)] transition-all"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-(--surface-soft) text-(--brand-blue-deep) transition-transform group-hover:-translate-x-0.5">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3 w-3"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
        </span>
        <span className="text-[12px] font-bold text-(--brand-muted) group-hover:text-(--brand-ink)">Back</span>
      </Link>

      {/* =========================================================
          CENTERED SPLIT CARD — form left, image right
      ========================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`relative z-10 w-full ${isSignUp ? 'max-w-[1140px]' : 'max-w-[960px]'} grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-3xl lg:rounded-[2rem] border border-(--brand-border) bg-(--brand-card) shadow-[0_20px_60px_-24px_rgba(9,32,52,0.25)] lg:shadow-[0_40px_100px_-40px_rgba(9,32,52,0.4)] transition-[max-width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] my-auto`}
      >

        {/* ---------- LEFT: form column ---------- */}
        <div className="order-2 lg:order-1 p-5 sm:p-7 lg:p-8">
          {headerBlock}
          {alertsBlock}
          {formBody}
          {trustNote}
          {footerBlock}
        </div>

        {/* ---------- RIGHT: image column ---------- */}
        <div className="order-1 lg:order-2 relative h-32 sm:h-44 lg:h-auto lg:min-h-[540px]">
          <Image
            src="/owner%20login/owner%20login.jpg"
            alt="VoltHive Station Infrastructure"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          {/* Brand tint */}
          <div className="absolute inset-0 bg-linear-to-br from-(--brand-blue)/20 via-(--brand-ink)/5 to-(--brand-green)/20" />
          {/* Bottom scrim */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-(--brand-ink)/85 via-(--brand-ink)/35 to-transparent" />

          {/* Top pill */}
          <div className="absolute left-4 top-4 sm:left-6 sm:top-6 z-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/90 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-(--brand-green) shadow-[0_0_14px_rgba(108,181,103,0.9)]" />
            VoltHive Host
          </div>

          {/* Tagline */}
          <div className="absolute bottom-4 left-4 right-4 z-10 sm:bottom-6 sm:left-6 sm:right-6 lg:bottom-8 lg:left-8 lg:right-8">
            <h2 className="text-base sm:text-xl lg:text-[1.85rem] font-semibold leading-tight tracking-tight text-white drop-shadow-[0_4px_12px_rgba(9,32,52,0.6)]">
              One network. Smart charging.
            </h2>
            <p className="mt-1 max-w-sm text-xs sm:text-[13px] lg:text-[14px] leading-relaxed text-white/80 hidden sm:block">
              Turn your EV charging operations into a predictable, high-performing infrastructure engine.
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}