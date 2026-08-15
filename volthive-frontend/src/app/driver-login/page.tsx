'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '../../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUrl } from '../../lib/api';

export default function AuthPage() {
  const router = useRouter();

  const authContext = useAuth();
  const { login, signup, signInWithGoogle } = authContext;

  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  
  // UI State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [isAppOrMobile, setIsAppOrMobile] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         ('standalone' in navigator && (navigator as any).standalone === true);
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsAppOrMobile(isStandalone || isMobileUA);

    // A credential is considered "set up" only after a real WebAuthn registration.
    const saved = localStorage.getItem('volthive_driver_biometrics');
    try {
      const parsed = saved ? JSON.parse(saved) : null;
      setBiometricRegistered(!!(parsed && parsed.id));
    } catch {
      setBiometricRegistered(false);
    }
  }, []);

  const b64urlToBuffer = (b64: string) => {
    const pad = b64.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(pad);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  };

  const handleBiometricAuth = async () => {
    setError('');

    // Real biometric unlock: verify this device's Face ID / fingerprint with
    // the WebAuthn credential registered in Account, then use the persisted
    // Firebase session.
    const saved = localStorage.getItem('volthive_driver_biometrics');
    let credId: string | null = null;
    let storedEmail: string | null = null;
    try {
      const parsed = saved ? JSON.parse(saved) : null;
      credId = parsed?.id || null;
      storedEmail = parsed?.email || null;
    } catch {
      credId = null;
    }

    if (!credId || typeof window === 'undefined' || !window.PublicKeyCredential || !window.isSecureContext) {
      setError('Biometric login is not set up on this device. Sign in once with email, then enable it in Account.');
      return;
    }

    setBiometricScanning(true);
    try {
      await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: [{ type: 'public-key', id: b64urlToBuffer(credId) }],
          userVerification: 'required',
          timeout: 60000,
        }
      });
    } catch (e) {
      setBiometricScanning(false);
      setError('Biometric verification failed or was cancelled.');
      return;
    }

    // Hardware WebAuthn verification succeeded!
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch(apiUrl('/api/users/profile'), { headers: { Authorization: `Bearer ${token}` } });
        const userData = res.ok ? await res.json() : null;
        setBiometricScanning(false);
        setSuccess('✓ Face ID / Touch ID verified. Welcome back.');
        setTimeout(() => {
          router.push(userData?.role === 'owner' ? '/owner-dashboard' : '/driver-dashboard');
        }, 600);
        return;
      } catch (err) {
        console.warn('Profile check error:', err);
      }
    }

    // If Firebase auth is still restoring, wait 800ms and retry navigation
    setTimeout(async () => {
      const retryUser = auth.currentUser;
      if (retryUser) {
        setBiometricScanning(false);
        setSuccess('✓ Identity verified. Welcome back.');
        router.push('/driver-dashboard');
      } else {
        if (storedEmail) setEmail(storedEmail);
        setBiometricScanning(false);
        setSuccess('✓ Hardware biometric verified! Please enter your password to confirm session.');
      }
    }, 800);
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithGoogle();
      const token = await userCredential.user.getIdToken();

      // 1. Check if the user already exists in our MongoDB database
      const profileRes = await fetch(apiUrl('/api/users/profile'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (profileRes.ok) {
        // User exists: log them in and route based on their existing DB role
        const userData = await profileRes.json();
        router.push(userData.role === 'owner' ? '/owner-dashboard' : '/driver-dashboard');
      } 
      else if (profileRes.status === 404) {
        // User is new: register them in the DB using the UI's selected role
        const createRes = await fetch(apiUrl('/api/users'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: userCredential.user.displayName || 'VoltHive User',
            email: userCredential.user.email,
            mobile: mobile || '', // Google doesn't provide mobile, so send empty string or what's typed
            role: 'driver',
            firebaseUid: userCredential.user.uid
          })
        });

        if (!createRes.ok) throw new Error('Failed to save user data to database.');
        
        // Route based on newly created role
        router.push('/driver-dashboard');
      } 
      else {
        throw new Error('Failed to verify identity with the server.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google authentication failed.';
      // Catch specific Firebase closure errors
      if (message.includes('popup-closed-by-user')) {
        setError('Authentication popup was closed.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Pre-flight Validation for Registration
      if (!isLogin) {
      if (password !== confirmPassword) {
        return setError('Passwords do not match.');
      }
      if (password.length < 6) {
        return setError('Password must be at least 6 characters long.');
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error('Could not verify your identity. Please sign in again.');

        let res = await fetch(apiUrl('/api/users/profile'), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 404) {
          res = await fetch(apiUrl('/api/users'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              name: auth.currentUser?.displayName || email.split('@')[0],
              email,
              role: 'driver',
              firebaseUid: auth.currentUser?.uid
            })
          });
        }

        if (!res.ok) throw new Error('Failed to load your profile.');
        const userData = await res.json();

        if (userData.role === 'owner') router.push('/owner-dashboard');
        else router.push('/driver-dashboard');
      } else {
        const userCredential = await signup(email, password);
        const token = await userCredential.user.getIdToken();

        const res = await fetch(apiUrl('/api/users'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name,
            email,
            mobile, // Sent to backend
            role: 'driver',
            firebaseUid: userCredential.user.uid
          })
        });

        if (!res.ok) throw new Error('Failed to save user data');

        // Prevent auto-login: sign the Firebase user out, show success, then switch UI back to login
        await auth.signOut();
        setSuccess('Account created successfully. Redirecting to login...');
        setTimeout(() => {
          setSuccess('');
          setIsLogin(true);
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setName('');
          setMobile('');
        }, 1400);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      if (message.includes('email-already-in-use')) {
        setError('An account with this email already exists.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address above to reset password.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(`Password reset email sent to ${email}. Check your inbox.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send password reset email.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex text-(--brand-ink) font-sans selection:bg-(--accent-blue)/30 overflow-hidden relative">
      
      {/* =========================================================
          MOBILE BACKGROUND (Hidden on Desktop lg: screens)
      ========================================================= */}
      <div className="absolute inset-0 lg:hidden z-0 bg-[linear-gradient(160deg,#f5f7f6_0%,#e8f3ef_44%,#dcefe8_100%)] overflow-hidden">
        <div className="absolute -top-[10%] -right-[10%] w-[80%] h-[60%] rounded-full bg-(--accent-blue)/30 blur-[100px] z-0 pointer-events-none"></div>
        <div className="absolute -bottom-[10%] -left-[10%] w-[80%] h-[60%] rounded-full bg-(--accent-green)/25 blur-[100px] z-0 pointer-events-none"></div>
        <div className="absolute inset-0 z-0 opacity-25 bg-[linear-gradient(rgba(74,144,164,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(108,181,103,0.08)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_100%_100%_at_50%_50%,#000_30%,transparent_100%)]"></div>
      </div>

      {/* =========================================================
          BACK TO HOME BUTTON (Hidden in Standalone PWA App Mode)
      ========================================================= */}
      {!isAppOrMobile && (
        <Link
          href="/"
          className="absolute top-4 left-4 sm:top-8 sm:left-8 z-50 group inline-flex items-center gap-2.5 rounded-full border border-(--brand-border) bg-(--brand-card)/80 px-3.5 py-2.5 shadow-[0_12px_32px_-16px_rgba(9,32,52,0.35)] backdrop-blur-md hover:shadow-[0_16px_36px_-18px_rgba(74,144,164,0.45)] transition-all"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-(--surface-soft) text-(--brand-blue-deep) transition-transform group-hover:-translate-x-0.5">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3.5 w-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          </span>
          <span className="text-[13px] font-bold text-(--brand-muted) group-hover:text-(--brand-ink)">Back to home</span>
        </Link>
      )}

      {/* =========================================================
          LEFT PANE (Desktop Only)
      ========================================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-end p-16 xl:p-20 overflow-hidden border-r border-(--brand-border) bg-[linear-gradient(160deg,#f5f7f6_0%,#e8f3ef_44%,#dcefe8_100%)]">
        <div className="absolute -top-[16%] -right-[10%] w-[58%] h-[54%] rounded-full bg-(--accent-blue)/30 blur-[110px] z-0 pointer-events-none vh-float-soft"></div>
        <div className="absolute -bottom-[14%] left-[4%] w-[58%] h-[52%] rounded-full bg-(--accent-green)/28 blur-[120px] z-0 pointer-events-none vh-float-soft [animation-delay:2s]"></div>
        <div className="absolute inset-0 z-0 opacity-25 bg-[linear-gradient(rgba(74,144,164,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(108,181,103,0.08)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_78%_78%_at_50%_50%,#000_35%,transparent_100%)]"></div>

        <div className="relative z-10 vh-rise-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/90 border border-(--brand-border) text-xs font-semibold text-(--brand-muted) mb-7 tracking-[0.12em] uppercase">
            <span className="w-2.5 h-2.5 rounded-full bg-(--brand-green) animate-pulse"></span>
            VoltHive Premium Access
          </div>

          <h1 className="text-5xl xl:text-6xl font-semibold tracking-tight text-(--brand-ink) mb-5 leading-[1.07]">
            Power your EV journey
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-(--brand-blue) to-(--brand-green)">with precision.</span>
          </h1>

          <p className="text-(--brand-muted) text-lg max-w-md font-medium leading-relaxed mb-8">
            One network for drivers and station owners. Smarter charging sessions, cleaner operations, and a premium digital experience.
          </p>

          <div className="bg-white/85 rounded-3xl border border-(--brand-border) p-4 max-w-115 shadow-[0_28px_60px_-36px_rgba(9,32,52,0.55)]">
            <Image
              src="/brand/banner.jpg"
              alt="VoltHive brand banner"
              width={1366}
              height={768}
              className="rounded-2xl w-full h-auto"
            />
          </div>
        </div>
      </div>

      {/* =========================================================
          RIGHT PANE (Form Area)
      ========================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12 relative z-10 bg-transparent min-h-dvh lg:min-h-0 pt-28 lg:pt-0 overflow-y-auto"
      >
        
        {/* The Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-125 bg-(--brand-card)/75 lg:bg-(--brand-card)/92 backdrop-blur-2xl lg:backdrop-blur-md rounded-4xl lg:rounded-4xl border border-(--brand-card)/60 lg:border-(--brand-border) shadow-[0_24px_80px_-24px_rgba(9,32,52,0.2)] lg:shadow-[0_34px_80px_-46px_rgba(9,32,52,0.6)] p-6 sm:p-10 my-auto"
        >
          <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isLogin ? 'login' : 'register'}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], opacity: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
            className="overflow-hidden"
          >
          <div className="mb-8 text-left">
            <h2 className="text-3xl font-semibold tracking-tight text-(--brand-ink) mb-2">
              {isLogin ? 'Welcome back.' : 'Create an account.'}
            </h2>
            <p className="text-(--brand-muted) text-sm">
              {isLogin ? 'Enter your details to access your dashboard.' : 'Select your role and enter your details to join the network.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* role selector removed - owner registration moved to separate pages */}
            {/* 1. BIOMETRICS UNLOCK BUTTON (Only visible when enabled in Profile settings on this device) */}
            {isLogin && biometricRegistered && (
              <button
                type="button"
                onClick={handleBiometricAuth}
                disabled={biometricScanning || loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white hover:brightness-105 transition-all shadow-md text-sm font-bold cursor-pointer active:scale-98"
              >
                {biometricScanning ? (
                  <span className="flex items-center gap-2 text-white font-bold">
                    <span className="animate-spin h-4 w-4 border-2 border-white/40 border-t-white rounded-full" />
                    Scanning Face ID / Touch ID...
                  </span>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                      <path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M16 8a4 4 0 0 0-8 0v1a4 4 0 0 0 8 0zM9 15v1a3 3 0 0 0 6 0v-1M3 17v2a2 2 0 0 2 2h2M21 17v2a2 2 0 0 1-2 2h-2" />
                    </svg>
                    <span>Unlock with Face ID / Touch ID</span>
                  </>
                )}
              </button>
            )}

            {/* 2. GOOGLE OAUTH BUTTON */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-(--brand-card) border border-(--brand-border) hover:bg-(--surface-soft) transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-sm font-semibold text-(--brand-ink) cursor-pointer"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 41.939 C -8.804 39.819 -11.514 38.739 -14.754 38.739 C -19.444 38.739 -23.494 41.439 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
              {isLogin ? 'Sign In with Google' : 'Register with Google'}
            </button>

            {/* 3. DIVIDER */}
            <div className="flex items-center gap-3 py-3">
              <div className="h-px flex-1 bg-(--brand-border)"></div>
              <span className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-widest">Or continue with Email</span>
              <div className="h-px flex-1 bg-(--brand-border)"></div>
            </div>

            {/* 4. DYNAMIC FORM FIELDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {!isLogin && (
                <div className="col-span-1 sm:col-span-2 space-y-1.5 animate-in fade-in duration-500">
                  <label className="text-[13px] font-semibold text-(--brand-muted)">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    className="w-full px-4 py-3.5 rounded-xl bg-(--brand-card)/60 lg:bg-(--brand-card)/90 border border-(--brand-card)/50 lg:border-(--brand-border) focus:bg-(--brand-card) focus:border-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue)/20 transition-all outline-none text-(--brand-ink) placeholder:text-(--brand-muted) sm:text-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div className={`space-y-1.5 ${isLogin ? 'col-span-1 sm:col-span-2' : 'col-span-1'}`}>
                <label className="text-[13px] font-semibold text-(--brand-muted)">Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full px-4 py-3.5 rounded-xl bg-(--brand-card)/60 lg:bg-(--brand-card)/90 border border-(--brand-card)/50 lg:border-(--brand-border) focus:bg-(--brand-card) focus:border-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue)/20 transition-all outline-none text-(--brand-ink) placeholder:text-(--brand-muted) sm:text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {!isLogin && (
                <div className="col-span-1 space-y-1.5 animate-in fade-in duration-500">
                  <label className="text-[13px] font-semibold text-(--brand-muted)">Mobile <span className="font-normal">(Optional)</span></label>
                  <input
                    type="tel"
                    placeholder="+94 7X XXX XXXX"
                    className="w-full px-4 py-3.5 rounded-xl bg-(--brand-card)/60 lg:bg-(--brand-card)/90 border border-(--brand-card)/50 lg:border-(--brand-border) focus:bg-(--brand-card) focus:border-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue)/20 transition-all outline-none text-(--brand-ink) placeholder:text-(--brand-muted) sm:text-sm"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
              )}

              <div className={`space-y-1.5 ${isLogin ? 'col-span-1 sm:col-span-2' : 'col-span-1'}`}>
                <div className="flex justify-between items-center">
                  <label className="text-[13px] font-semibold text-(--brand-muted)">Password</label>
                  {isLogin && <button type="button" onClick={handleForgotPassword} className="text-[12px] font-semibold text-(--brand-blue-deep) hover:text-(--brand-blue) transition-colors">Forgot password?</button>}
                </div>
                <input
                  type="password"
                  required 
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 rounded-xl bg-(--brand-card)/60 lg:bg-(--brand-card)/90 border border-(--brand-card)/50 lg:border-(--brand-border) focus:bg-(--brand-card) focus:border-(--accent-green) focus:ring-2 focus:ring-(--accent-green)/20 transition-all outline-none text-(--brand-ink) placeholder:text-(--brand-muted) sm:text-sm tracking-widest"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {!isLogin && (
                <div className="col-span-1 space-y-1.5 animate-in fade-in duration-500">
                  <label className="text-[13px] font-semibold text-(--brand-muted)">Confirm Password</label>
                  <input
                    type="password"
                    required 
                    placeholder="••••••••"
                    className="w-full px-4 py-3.5 rounded-xl bg-(--brand-card)/60 lg:bg-(--brand-card)/90 border border-(--brand-card)/50 lg:border-(--brand-border) focus:bg-(--brand-card) focus:border-(--accent-green) focus:ring-2 focus:ring-(--accent-green)/20 transition-all outline-none text-(--brand-ink) placeholder:text-(--brand-muted) sm:text-sm tracking-widest"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}

            </div>

            {/* 5. STATUS MESSAGES & SUBMIT */}
            {success && (
              <div className="p-3 mt-4 bg-(--ui-success)/10 border border-(--ui-success)/20 rounded-xl text-[13px] font-medium text-(--ui-success) animate-in fade-in duration-300">
                {success}
              </div>
            )}
            {error && (
              <div className="p-3 mt-4 bg-(--ui-error)/10 border border-(--ui-error)/20 rounded-xl text-[13px] font-medium text-(--ui-error) animate-in fade-in duration-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-6 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-semibold text-[15px] hover:brightness-105 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2 group shadow-[0_12px_25px_-10px_rgba(36,84,196,0.65)]"
            >
              {loading ? (
                <span className="animate-spin h-5 w-5 border-2 border-white/40 border-t-white rounded-full"></span>
              ) : (
                <>
                  {isLogin ? 'Sign In with Email' : 'Create Account'}
                  <svg className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* 6. FOOTER TOGGLE */}
          <div className="mt-8 text-center sm:text-left">
            <p className="text-[13px] font-medium text-(--brand-muted)">
              {isLogin ? "New to VoltHive?" : "Already have an account?"}{' '}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-(--brand-blue-deep) font-bold hover:text-(--brand-blue) transition-colors"
              >
                {isLogin ? 'Create an account' : 'Sign in instead'}
              </button>
            </p>
          </div>
          </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </main>
  );
}