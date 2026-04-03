'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '../../lib/firebase';

export default function AuthPage() {
  const router = useRouter();
  
  // Assuming signInWithGoogle might be added to your AuthContext soon.
  // If not, you can swap it for the raw Firebase signInWithPopup method.
  const { login, signup, signInWithGoogle } = useAuth() as any; 

  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<'driver' | 'owner'>('driver');
  
  // UI State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      if (signInWithGoogle) {
        await signInWithGoogle();
        // Handle Google Auth backend logic here similar to standard login
        router.push(role === 'owner' ? '/owner-dashboard' : '/driver-dashboard');
      } else {
        setError('Google Sign-In is not fully configured in AuthContext yet.');
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
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
      if (role === 'owner' && !mobile.trim()) {
        return setError('Mobile number is required for Station Owners.');
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

        const res = await fetch('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load your profile.');
        const userData = await res.json();

        if (userData.role === 'owner') router.push('/owner-dashboard');
        else router.push('/driver-dashboard');
      } else {
        const userCredential = await signup(email, password);
        const token = await userCredential.user.getIdToken();

        const res = await fetch('http://localhost:5000/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name,
            email,
            mobile, // Sent to backend
            role,
            firebaseUid: userCredential.user.uid
          })
        });

        if (!res.ok) throw new Error('Failed to save user data');

        if (role === 'owner') router.push('/owner-dashboard');
        else router.push('/driver-dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex text-(--brand-ink) font-sans selection:bg-[#5FAFC0]/30 overflow-hidden relative">
      
      {/* =========================================================
          MOBILE BACKGROUND (Hidden on Desktop lg: screens)
      ========================================================= */}
      <div className="absolute inset-0 lg:hidden z-0 bg-[linear-gradient(160deg,#f5f7f6_0%,#e8f3ef_44%,#dcefe8_100%)] overflow-hidden">
        <div className="absolute -top-[10%] -right-[10%] w-[80%] h-[60%] rounded-full bg-[#5FAFC0]/30 blur-[100px] z-0 pointer-events-none"></div>
        <div className="absolute -bottom-[10%] -left-[10%] w-[80%] h-[60%] rounded-full bg-[#7BC96F]/25 blur-[100px] z-0 pointer-events-none"></div>
        <div className="absolute inset-0 z-0 opacity-25 bg-[linear-gradient(rgba(74,144,164,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(108,181,103,0.08)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_100%_100%_at_50%_50%,#000_30%,transparent_100%)]"></div>
      </div>

      {/* =========================================================
          LOGO
      ========================================================= */}
      <Link
        href="/"
        className="absolute top-8 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:top-10 lg:left-10 z-50 bg-white/70 lg:bg-white/90 backdrop-blur-2xl lg:backdrop-blur-md border border-white/50 lg:border-(--brand-border) rounded-[1.25rem] lg:rounded-2xl px-4 py-3 lg:px-3 lg:py-2 shadow-[0_16px_40px_-16px_rgba(9,32,52,0.3)] hover:shadow-[0_20px_40px_-24px_rgba(74,144,164,0.4)] transition-all"
      >
        <Image
          src="/brand/logo-without-slogan.png"
          alt="VoltHive"
          width={160}
          height={42}
          className="h-7 sm:h-9 w-auto"
          priority
        />
      </Link>

      {/* =========================================================
          LEFT PANE (Desktop Only - UNTOUCHED)
      ========================================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-end p-16 xl:p-20 overflow-hidden border-r border-(--brand-border) bg-[linear-gradient(160deg,#f5f7f6_0%,#e8f3ef_44%,#dcefe8_100%)]">
        <div className="absolute -top-[16%] -right-[10%] w-[58%] h-[54%] rounded-full bg-[#5FAFC0]/30 blur-[110px] z-0 pointer-events-none"></div>
        <div className="absolute -bottom-[14%] left-[4%] w-[58%] h-[52%] rounded-full bg-[#7BC96F]/28 blur-[120px] z-0 pointer-events-none"></div>
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12 relative z-10 bg-transparent min-h-[100dvh] lg:min-h-0 pt-28 lg:pt-0 overflow-y-auto">
        
        {/* The Form Card */}
        <div className="w-full max-w-[500px] bg-white/75 lg:bg-white/92 backdrop-blur-2xl lg:backdrop-blur-md rounded-[2rem] lg:rounded-4xl border border-white/60 lg:border-(--brand-border) shadow-[0_24px_80px_-24px_rgba(9,32,52,0.2)] lg:shadow-[0_34px_80px_-46px_rgba(9,32,52,0.6)] p-6 sm:p-10 vh-rise-in my-auto">
          
          <div className="mb-8 text-left">
            <h2 className="text-3xl font-semibold tracking-tight text-(--brand-ink) mb-2">
              {isLogin ? 'Welcome back.' : 'Create an account.'}
            </h2>
            <p className="text-(--brand-muted) text-sm">
              {isLogin ? 'Enter your details to access your dashboard.' : 'Select your role and enter your details to join the network.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. ROLE SELECTOR (Only on Sign Up) */}
            {!isLogin && (
              <div className="p-1 rounded-xl bg-[#5FAFC0]/10 border border-(--brand-border) lg:border-transparent flex relative overflow-hidden mb-6">
                <button
                  type="button"
                  onClick={() => setRole('driver')}
                  className={`relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors duration-300 ${
                    role === 'driver' ? 'text-(--brand-ink)' : 'text-(--brand-muted) hover:text-(--brand-ink)'
                  }`}
                >
                  EV Driver
                </button>
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors duration-300 ${
                    role === 'owner' ? 'text-(--brand-ink)' : 'text-(--brand-muted) hover:text-(--brand-ink)'
                  }`}
                >
                  Station Owner
                </button>

                <div
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm border border-slate-200/50 transition-transform duration-300 ease-out z-0"
                  style={{ transform: role === 'driver' ? 'translateX(0)' : 'translateX(calc(100% + 4px))' }}
                />
              </div>
            )}

            {/* 2. GOOGLE OAUTH BUTTON */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white border border-(--brand-border) hover:bg-slate-50 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-sm font-semibold text-(--brand-ink)"
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
                    className="w-full px-4 py-3.5 rounded-xl bg-white/80 lg:bg-white border border-white/60 lg:border-(--brand-border) focus:bg-white focus:border-(--accent-blue) focus:ring-2 focus:ring-[color:var(--accent-blue)]/20 transition-all outline-none text-(--brand-ink) placeholder:text-slate-400 sm:text-sm"
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
                  className="w-full px-4 py-3.5 rounded-xl bg-white/80 lg:bg-white border border-white/60 lg:border-(--brand-border) focus:bg-white focus:border-(--accent-blue) focus:ring-2 focus:ring-[color:var(--accent-blue)]/20 transition-all outline-none text-(--brand-ink) placeholder:text-slate-400 sm:text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {!isLogin && (
                <div className="col-span-1 space-y-1.5 animate-in fade-in duration-500">
                  <label className="text-[13px] font-semibold text-(--brand-muted)">
                    Mobile <span className="font-normal">({role === 'owner' ? 'Required' : 'Optional'})</span>
                  </label>
                  <input
                    type="tel"
                    required={role === 'owner'}
                    placeholder="+94 7X XXX XXXX"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/80 lg:bg-white border border-white/60 lg:border-(--brand-border) focus:bg-white focus:border-(--accent-blue) focus:ring-2 focus:ring-[color:var(--accent-blue)]/20 transition-all outline-none text-(--brand-ink) placeholder:text-slate-400 sm:text-sm"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
              )}

              <div className={`space-y-1.5 ${isLogin ? 'col-span-1 sm:col-span-2' : 'col-span-1'}`}>
                <div className="flex justify-between items-center">
                  <label className="text-[13px] font-semibold text-(--brand-muted)">Password</label>
                  {isLogin && <button type="button" className="text-[12px] font-semibold text-(--brand-blue-deep) hover:text-(--brand-blue) transition-colors">Forgot password?</button>}
                </div>
                <input
                  type="password"
                  required 
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 rounded-xl bg-white/80 lg:bg-white border border-white/60 lg:border-(--brand-border) focus:bg-white focus:border-(--accent-green) focus:ring-2 focus:ring-[color:var(--accent-green)]/20 transition-all outline-none text-(--brand-ink) placeholder:text-slate-400 sm:text-sm tracking-widest"
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
                    className="w-full px-4 py-3.5 rounded-xl bg-white/80 lg:bg-white border border-white/60 lg:border-(--brand-border) focus:bg-white focus:border-(--accent-green) focus:ring-2 focus:ring-[color:var(--accent-green)]/20 transition-all outline-none text-(--brand-ink) placeholder:text-slate-400 sm:text-sm tracking-widest"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}

            </div>

            {/* 5. ERROR & SUBMIT */}
            {error && (
              <div className="p-3 mt-4 bg-red-50 border border-red-100 rounded-xl text-[13px] font-medium text-red-600 animate-in fade-in duration-300">
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
        </div>
      </div>
    </main>
  );
}