'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
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

        // Validate that user possesses the explicit owner database role configuration
        const res = await fetch(apiUrl('/api/users/profile'), {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          const profile = await res.json();
          if (profile.role !== 'owner') {
            await auth.signOut();
            throw new Error('Access denied. This portal is explicitly reserved for registered Station Owners.');
          }
          router.push('/owner-dashboard');
        } else {
          throw new Error('Failed to fetch user verification context metrics.');
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Authentication lifecycle verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Reusable input class for cleaner JSX
  const inputClass = "w-full px-4 py-3.5 rounded-xl bg-(--brand-card) border border-(--brand-border) focus:bg-white focus:border-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue)/20 transition-all outline-none text-(--brand-ink) placeholder:text-(--brand-muted)/60 text-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]";

  return (
    <main className="min-h-dvh w-full flex bg-(--background) font-sans text-(--brand-ink) overflow-hidden relative selection:bg-(--accent-blue)/30">
      
      {/* Mobile Background */}
      <div className="absolute inset-0 lg:hidden z-0 bg-[linear-gradient(160deg,#f5f7f6_0%,#e8f3ef_44%,#dcefe8_100%)] overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[80%] h-[60%] rounded-full bg-(--accent-blue)/20 blur-[100px] z-0" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[80%] h-[60%] rounded-full bg-(--accent-green)/15 blur-[100px] z-0" />
        <div className="absolute inset-0 z-0 opacity-30 bg-[linear-gradient(rgba(74,144,164,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(108,181,103,0.08)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_100%_100%_at_50%_50%,#000_30%,transparent_100%)]" />
      </div>

      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-8 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:top-10 lg:left-10 z-50 bg-(--brand-card)/70 lg:bg-(--brand-card)/90 backdrop-blur-2xl lg:backdrop-blur-md border border-(--brand-card)/50 lg:border-(--brand-border) rounded-[1.25rem] lg:rounded-2xl px-4 py-3 lg:px-3 lg:py-2 shadow-[0_16px_40px_-16px_rgba(9,32,52,0.3)] hover:shadow-[0_20px_40px_-24px_rgba(74,144,164,0.4)] transition-all flex items-center gap-2 group"
      >
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-(--brand-muted) group-hover:-translate-x-0.5 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        <Image src="/brand/logo-without-slogan.png" alt="VoltHive" width={160} height={42} className="h-6 sm:h-7 w-auto pr-1" priority />
      </Link>

      {/* =========================================================
          LEFT PANE: Form Area
      ========================================================= */}
      <div className={`w-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSignUp ? 'lg:w-[65%] xl:w-[68%]' : 'lg:w-[48%] xl:w-[42%]'} flex flex-col justify-center px-6 sm:px-12 lg:px-16 relative z-10 min-h-dvh pt-28 lg:pt-0 pb-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']`}>
        
        {/* Ambient desktop glow */}
        <div className="hidden lg:block absolute -top-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-(--accent-blue)/10 blur-[120px] pointer-events-none" />

        <div className={`w-full mx-auto transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSignUp ? 'max-w-[650px]' : 'max-w-[420px]'} vh-rise-in`}>
          
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-(--brand-ink) mb-2.5">
              {isSignUp ? 'Register Enterprise Node' : 'Operator Portal'}
            </h1>
            <p className="text-(--brand-muted) text-[14px] leading-relaxed font-medium">
              {isSignUp 
                ? 'Submit your enterprise details below to establish your operational framework.' 
                : 'Authenticate down below to pipeline network command metrics.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-3.5 bg-(--ui-error)/10 border border-(--ui-error)/20 rounded-xl text-[13px] text-(--ui-error) font-semibold flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-(--ui-error)/20 flex items-center justify-center shrink-0">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                </div>
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAuth} className="space-y-4">
            
            {isSignUp ? (
              // ==============================
              // SIGN UP LAYOUT (2-COLUMN GRID)
              // ==============================
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[12px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Enterprise / Owner Name *</label>
                  <input type="text" required placeholder="Anuradha Hardware" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Email Endpoint *</label>
                  <input type="email" required placeholder="owner@enterprise.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Telephone *</label>
                  <input type="tel" required placeholder="+94 7X XXX XXXX" value={telephone} onChange={(e) => setTelephone(e.target.value)} className={inputClass} />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[12px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">NIC or BRC Number *</label>
                  <input type="text" required placeholder="Business Registration or ID" value={nicOrBrc} onChange={(e) => setNicOrBrc(e.target.value)} className={inputClass} />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[12px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Registered Address *</label>
                  <input type="text" required placeholder="Full physical address" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">District <span className="lowercase font-medium">(Optional)</span></label>
                  <input type="text" placeholder="e.g. Colombo" value={district} onChange={(e) => setDistrict(e.target.value)} className={inputClass} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Town <span className="lowercase font-medium">(Optional)</span></label>
                  <input type="text" placeholder="e.g. Nugegoda" value={town} onChange={(e) => setTown(e.target.value)} className={inputClass} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Security Token *</label>
                  <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} focus:border-(--accent-green) focus:ring-(--accent-green)/20 tracking-widest`} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Confirm Token *</label>
                  <input type="password" required placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputClass} focus:border-(--accent-green) focus:ring-(--accent-green)/20 tracking-widest`} />
                </div>
              </motion.div>
            ) : (
              // ==============================
              // LOGIN LAYOUT (SINGLE COLUMN)
              // ==============================
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Network Email Endpoint</label>
                  <input type="email" required placeholder="owner@enterprise.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[12px] font-bold text-(--brand-muted) uppercase tracking-wider ml-1">Security Token</label>
                    <button type="button" className="text-[12px] font-semibold text-(--brand-blue-deep) hover:text-(--brand-blue) transition-colors">Forgot token?</button>
                  </div>
                  <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} focus:border-(--accent-green) focus:ring-(--accent-green)/20 tracking-widest`} />
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-semibold text-[15px] hover:brightness-105 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2 group shadow-[0_12px_25px_-10px_rgba(36,84,196,0.65)]"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white vh-loader-soft" />
                  Pipelining Security Layers...
                </span>
              ) : (
                <>
                  {isSignUp ? 'Submit Enterprise Application' : 'Enter Command Suite'}
                  <svg className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Toggle & Footer */}
          <div className="mt-8 pt-6 border-t border-(--brand-border)/80">
            <p className="text-[13px] font-medium text-(--brand-muted) mb-5">
              {isSignUp ? "Existing deployment partner?" : "New provider enterprise asset?"}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
                className="text-(--brand-blue-deep) font-bold hover:text-(--brand-blue) transition-colors"
              >
                {isSignUp ? 'Log in here' : 'Register here'}
              </button>
            </p>

            <Link href="/driver-login" className="inline-flex items-center gap-2 text-[12px] font-medium text-(--brand-muted) hover:text-(--brand-ink) transition-colors p-3 rounded-xl bg-(--surface-soft) border border-(--brand-border)/60 hover:border-(--brand-muted)/40">
              Are you an EV Driver instead? Go to Driver Grid
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </Link>
          </div>

        </div>
      </div>

      {/* =========================================================
          RIGHT PANE: Dynamic Image Card (Shrinks on Signup)
      ========================================================= */}
      <div className={`hidden lg:block transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSignUp ? 'w-[35%] xl:w-[32%]' : 'w-[52%] xl:w-[58%]'} p-4 pl-0 relative z-10 h-dvh`}>
        <div className="w-full h-full relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-(--brand-border)/40 bg-(--brand-ink)">
          
          <Image
            src="/owner%20login/owner%20login.jpg"
            alt="VoltHive Station Infrastructure"
            fill
            className="object-cover opacity-80 mix-blend-luminosity hover:scale-105 transition-transform duration-[10s] ease-out"
            priority
          />
          
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-(--brand-ink) via-(--brand-ink)/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-linear-to-br from-(--brand-blue)/30 to-transparent mix-blend-overlay z-10" />

          {/* Slogans */}
          <div className={`absolute bottom-12 left-8 right-8 xl:left-12 xl:right-12 z-20 transition-all duration-700 ${isSignUp ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest border border-white/20 backdrop-blur-md shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-(--brand-green) shadow-[0_0_6px_var(--brand-green)] animate-pulse" />
              Secured Connection
            </div>
            <h2 className="text-4xl xl:text-5xl font-semibold tracking-tight text-white leading-[1.1] mb-5">
              Turn your charging infrastructure into a predictable asset engine.
            </h2>
            <p className="text-[15px] xl:text-base text-white/80 font-medium leading-relaxed max-w-lg">
              Connect systems, deploy automated machine learning dynamic pricing, monitor physical hardware streams, and respond to network congestion seamlessly.
            </p>
          </div>
        </div>
      </div>

    </main>
  );
}