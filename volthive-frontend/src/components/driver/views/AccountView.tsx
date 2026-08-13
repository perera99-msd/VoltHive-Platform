'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { apiUrl } from '../../../lib/api';
import MessagesView from './MessagesView';
import AboutContent from '../../info/AboutContent';
import PrivacyContent from '../../info/PrivacyContent';
import Toast from '../../common/Toast';
import ConfirmModal from '../../common/ConfirmModal';

const SettingsRow = ({
  icon,
  title,
  value,
  iconBgClass,
  onClick,
  isDestructive,
}: {
  icon: ReactNode;
  title: string;
  value?: string;
  iconBgClass?: string;
  onClick?: () => void;
  isDestructive?: boolean;
}) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between p-4 sm:px-6 cursor-pointer transition-colors border-b border-(--brand-border) last:border-0 ${
      isDestructive ? 'hover:bg-(--ui-error)/10' : onClick ? 'hover:bg-(--accent-blue)/8' : ''
    }`}
  >
    <div className="flex items-center gap-4 min-w-0 flex-1 mr-3">
      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center border border-(--brand-border) shrink-0 ${iconBgClass || 'bg-(--accent-blue)/12 text-(--brand-muted)'}`}>
        {icon}
      </div>
      <p className={`text-[15px] font-medium tracking-tight truncate ${isDestructive ? 'text-(--ui-error)' : 'text-(--brand-ink)'}`}>
        {title}
      </p>
    </div>
    <div className="flex items-center gap-3 shrink-0">
      {value && <span className="text-[13px] font-medium text-(--brand-muted) max-w-[140px] sm:max-w-[220px] truncate">{value}</span>}
      {onClick && (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-(--brand-muted)">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      )}
    </div>
  </div>
);

const SettingsCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="mb-8">
    <h3 className="text-xs font-bold text-(--brand-muted) uppercase tracking-[0.15em] mb-3 ml-2">{title}</h3>
    <div className="bg-(--brand-card)/82 backdrop-blur-2xl rounded-3xl border border-(--brand-border) shadow-[0_10px_30px_-24px_rgba(9,32,52,0.45)] overflow-hidden">
      {children}
    </div>
  </div>
);

export default function AccountView({ initialChatStationId, onChatConsumed }: {
  initialChatStationId?: string | null;
  onChatConsumed?: () => void;
}) {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);

  // In-app full-screen screens (About / Privacy / Messages) — stay inside the app
  const [infoScreen, setInfoScreen] = useState<'about' | 'privacy' | null>(null);
  const [chatOpen, setChatOpen] = useState(!!initialChatStationId);
  const [chatStationId, setChatStationId] = useState<string | null>(initialChatStationId || null);

  // Open a chat with a preselected station (e.g. from a "Message" button on the map/drawer)
  useEffect(() => {
    if (initialChatStationId) {
      setChatStationId(initialChatStationId);
      setChatOpen(true);
      onChatConsumed?.();
    }
  }, [initialChatStationId, onChatConsumed]);

  // Modals state
  const [activeModal, setActiveModal] = useState<'name' | 'password' | 'address' | 'history' | 'help' | null>(null);

  // Form Inputs
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI status
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [updating, setUpdating] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' | 'info' } | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    isDanger?: boolean;
    action: () => Promise<void> | void;
  } | null>(null);

  // Real transaction history: completed charging sessions from the backend
  const [txBookings, setTxBookings] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    if (activeModal !== 'history') return;
    const fetchTx = async () => {
      if (!user) return;
      setTxLoading(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch(apiUrl('/api/bookings/driver'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const payload = await res.json();
          const completed = (payload.data || []).filter((b: any) => b.status === 'Completed');
          setTxBookings(completed);
        }
      } catch (err) {
        console.warn('Failed to load transaction history:', err);
      } finally {
        setTxLoading(false);
      }
    };
    fetchTx();
  }, [activeModal, user]);

  useEffect(() => {
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                            ('standalone' in navigator && (navigator as any).standalone === true);
    setIsPWA(checkStandalone);
    const saved = localStorage.getItem('volthive_driver_biometrics');
    try {
      const parsed = saved ? JSON.parse(saved) : null;
      setBiometricsEnabled(!!(parsed && parsed.id));
    } catch {
      setBiometricsEnabled(false);
    }
  }, []);

  const handleToggleBiometrics = async () => {
    setErr('');
    setMsg('');
    if (!biometricsEnabled) {
      // Only enable when the device actually registers a hardware credential (WebAuthn).
      if (typeof window !== 'undefined' && window.PublicKeyCredential && window.isSecureContext) {
        try {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          const options: PublicKeyCredentialCreationOptions = {
            challenge,
            rp: { name: 'VoltHive', id: window.location.hostname },
            user: {
              id: new TextEncoder().encode(user?.uid || 'driver_id'),
              name: user?.email || 'VoltHive Driver',
              displayName: profileData?.name || user?.displayName || 'Driver'
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
            authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
            timeout: 60000
          };
          const cred = await navigator.credentials.create({ publicKey: options });
          const credId = cred ? (cred as PublicKeyCredential).id : null;
          if (!credId) throw new Error('No credential returned');
          const token = await auth.currentUser?.getIdToken();
          localStorage.setItem('volthive_driver_biometrics', JSON.stringify({
            id: credId,
            email: user?.email || '',
            uid: user?.uid || '',
            token: token || '',
            registeredAt: Date.now()
          }));
          setBiometricsEnabled(true);
          setMsg('✓ Face ID / fingerprint registered. You can now unlock the app with biometrics on this device.');
          setToastMessage({ msg: 'Face ID / Touch ID registered for this device.', type: 'success' });
        } catch (e: any) {
          console.warn('WebAuthn registration failed:', e);
          setBiometricsEnabled(false);
          setErr('Hardware biometric setup was cancelled or is unavailable — it was not enabled.');
          setToastMessage({ msg: 'Biometric setup cancelled or unavailable.', type: 'error' });
        }
      } else {
        setBiometricsEnabled(false);
        setErr('Hardware biometrics (WebAuthn) are not available in this browser or context.');
        setToastMessage({ msg: 'Biometrics unavailable in this browser.', type: 'error' });
      }
    } else {
      localStorage.removeItem('volthive_driver_biometrics');
      setBiometricsEnabled(false);
      setMsg('Hardware biometric login disabled.');
      setToastMessage({ msg: 'Biometric login disabled.', type: 'info' });
    }
  };

  const joinDate = profileData?.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch(apiUrl('/api/users/profile'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
          setEditName(data.name || user?.displayName || '');
          setEditAddress(data.address || '');
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchProfile();
  }, [user]);

  const executeUpdateName = async () => {
    setUpdating(true);
    setErr('');
    setMsg('');
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: editName });
      }
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await fetch(apiUrl('/api/users/profile'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: editName })
        });
      }
      setProfileData((prev: any) => ({ ...prev, name: editName }));
      setMsg('✓ Display name updated successfully!');
      setToastMessage({ msg: 'Display name updated successfully.', type: 'success' });
      setTimeout(() => { setMsg(''); setActiveModal(null); }, 1200);
    } catch (error: any) {
      setErr(error.message || 'Failed to update name');
      setToastMessage({ msg: error.message || 'Failed to update name', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setPendingConfirm({
      title: 'Update Profile Name?',
      message: `Are you sure you want to update your display name to "${editName}"?`,
      confirmText: 'Update Name',
      action: executeUpdateName
    });
  };

  const executeUpdateAddress = async () => {
    setUpdating(true);
    setErr('');
    setMsg('');
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await fetch(apiUrl('/api/users/profile'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ address: editAddress })
        });
      }
      setProfileData((prev: any) => ({ ...prev, address: editAddress }));
      setMsg('✓ Billing address saved successfully!');
      setToastMessage({ msg: 'Billing address saved successfully.', type: 'success' });
      setTimeout(() => { setMsg(''); setActiveModal(null); }, 1200);
    } catch (error: any) {
      setErr(error.message || 'Failed to save address');
      setToastMessage({ msg: error.message || 'Failed to save address', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAddress.trim()) return;
    setPendingConfirm({
      title: 'Save Billing Address?',
      message: 'Are you sure you want to update your billing address for energy tax receipts?',
      confirmText: 'Save Address',
      action: executeUpdateAddress
    });
  };

  const executeUpdatePassword = async () => {
    setUpdating(true);
    setErr('');
    setMsg('');
    try {
      if (auth.currentUser && currentPassword) {
        const credential = EmailAuthProvider.credential(user?.email || '', currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword);
      } else if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }
      setMsg('✓ Password updated successfully!');
      setToastMessage({ msg: 'Password updated successfully.', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => { setMsg(''); setActiveModal(null); }, 1500);
    } catch (error: any) {
      setErr(error.message || 'Verification failed. Please check your current password.');
      setToastMessage({ msg: error.message || 'Verification failed.', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setErr('New passwords do not match.');
      setToastMessage({ msg: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setErr('Password must be at least 6 characters.');
      setToastMessage({ msg: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }
    setPendingConfirm({
      title: 'Change Account Password?',
      message: 'Are you sure you want to update your account security password?',
      confirmText: 'Change Password',
      isDanger: true,
      action: executeUpdatePassword
    });
  };

  if (chatOpen || chatStationId) {
    return (
      <MessagesView
        initialStationId={chatStationId}
        onBack={() => {
          setChatOpen(false);
          setChatStationId(null);
        }}
      />
    );
  }

  return (
    <section className="w-full max-w-4xl mx-auto pb-20 relative font-sans">
      <div className="absolute -top-20 -right-12 w-72 h-72 rounded-full bg-(--accent-blue)/16 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-12 w-72 h-72 rounded-full bg-(--accent-green)/14 blur-[120px] pointer-events-none" />

      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
        className="mb-7 rounded-4xl border border-(--brand-card)/70 bg-(--brand-card)/80 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_24px_64px_-44px_rgba(9,32,52,0.58)]"
      >
        <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-(--brand-muted)">Profile Settings</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-(--brand-ink) tracking-tight mt-2">
          Account
          <span className="text-transparent bg-clip-text bg-linear-to-r from-(--brand-blue) to-(--brand-green)"> Center</span>
        </h1>
        <p className="text-(--brand-muted) text-sm mt-2 font-medium">Manage identity, billing, security, and support preferences in one premium workspace.</p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="bg-(--brand-card)/84 backdrop-blur-2xl rounded-[2.2rem] border border-(--brand-card)/70 shadow-[0_20px_48px_-30px_rgba(9,32,52,0.52)] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 mb-10 relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-(--accent-blue)/16 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-(--accent-green)/16 rounded-full blur-3xl pointer-events-none" />

        <div className="relative shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-linear-to-br from-(--brand-blue) to-(--brand-green) rounded-[1.5rem] flex items-center justify-center text-4xl font-light text-(--brand-card) shadow-xl shadow-(--brand-blue)/25 border-2 border-(--brand-card)/80 z-10 relative">
            {profileData?.name?.charAt(0) || user?.displayName?.charAt(0) || 'D'}
          </div>
        </div>

        <div className="text-center sm:text-left flex-1 relative z-10">
          <h2 className="text-2xl font-semibold text-(--brand-ink) tracking-tight">{profileData?.name || user?.displayName || '—'}</h2>
          <p className="text-[15px] font-medium text-(--brand-muted) mt-1">{user?.email || '—'}</p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--accent-blue)/12 text-(--brand-muted) text-[11px] font-bold uppercase tracking-widest border border-(--brand-border) shadow-sm">
            Member since {joinDate}
          </div>
        </div>
      </motion.div>

      <SettingsCard title="Profile Details">
        <SettingsRow 
          title="Display Name" 
          value={profileData?.name || user?.displayName || '—'}
          onClick={() => { setEditName(profileData?.name || user?.displayName || ''); setErr(''); setMsg(''); setActiveModal('name'); }}
          iconBgClass="bg-(--accent-blue)/16 text-(--brand-blue)"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>} 
        />
        <SettingsRow 
          title="Email Address" 
          value={`${user?.email || '—'} (Permanent)`}
          iconBgClass="bg-(--surface-soft) text-(--brand-muted) border border-(--brand-border)"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>} 
        />
        <SettingsRow 
          title="Change Password" 
          value="••••••••"
          onClick={() => { setErr(''); setMsg(''); setActiveModal('password'); }}
          iconBgClass="bg-(--accent-green)/20 text-(--brand-green-deep)"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>} 
        />
      </SettingsCard>

      <SettingsCard title="App Security & Biometrics">
        {(isPWA || process.env.NODE_ENV === 'development') && (
          <div className="flex items-center justify-between p-4 sm:px-6 transition-colors border-b border-(--brand-border) last:border-0">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-(--brand-border) bg-(--accent-blue)/16 text-(--brand-blue)">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-medium tracking-tight text-(--brand-ink)">Biometric Login (FaceID / TouchID)</p>
                <p className="text-xs text-(--brand-muted)">Fast native authentication for PWA standalone app</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleBiometrics}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  biometricsEnabled ? 'bg-(--brand-green)' : 'bg-(--brand-border)'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    biometricsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </SettingsCard>

      <SettingsCard title="Billing & Operations">
        {/* Payment Methods removed per user instruction */}
        <SettingsRow 
          title="Billing Address" 
          value={profileData?.address || ''}
          onClick={() => { setEditAddress(profileData?.address || ''); setErr(''); setMsg(''); setActiveModal('address'); }}
          iconBgClass="bg-(--accent-blue)/10 text-(--brand-blue)"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>} 
        />
        <SettingsRow 
          title="Transaction History" 
          value="View Ledger"
          onClick={() => setActiveModal('history')}
          iconBgClass="bg-(--accent-blue)/10 text-(--brand-muted)"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} 
        />
      </SettingsCard>

      <SettingsCard title="Inbox & Messages">
        <SettingsRow 
          title="Messages" 
          value="Chat with stations"
          onClick={() => { setChatStationId(null); setChatOpen(true); }}
          iconBgClass="bg-(--accent-green)/16 text-(--brand-green-deep)"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>} 
        />
      </SettingsCard>

      <SettingsCard title="Support & Legal">
        <SettingsRow 
          title="Help Center" 
          onClick={() => { setErr(''); setMsg(''); setActiveModal('help'); }}
          iconBgClass="bg-(--accent-blue)/16 text-(--brand-blue)"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>} 
        />
        <SettingsRow 
          title="About VoltHive" 
          onClick={() => setInfoScreen('about')}
          iconBgClass="bg-(--accent-blue)/10 text-(--brand-muted)"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>} 
        />
        <SettingsRow 
          title="Privacy Policy" 
          onClick={() => setInfoScreen('privacy')}
          iconBgClass="bg-(--accent-blue)/10 text-(--brand-muted)"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>} 
        />
      </SettingsCard>

      <div className="mt-10">
        <div className="bg-(--brand-card)/84 backdrop-blur-xl rounded-3xl border border-(--ui-error)/30 shadow-sm overflow-hidden ring-1 ring-(--ui-error)/20">
          <SettingsRow 
            isDestructive 
            onClick={() => {
              setPendingConfirm({
                title: 'Sign Out of VoltHive?',
                message: 'Are you sure you want to sign out? You will need to log back in to manage your charging sessions and reservations.',
                confirmText: 'Sign Out',
                isDanger: true,
                action: () => {
                  setToastMessage({ msg: 'Signed out successfully.', type: 'info' });
                  logout();
                }
              });
            }}
            title="Sign Out Securely" 
            iconBgClass="bg-(--ui-error)/12 text-(--ui-error) border-(--ui-error)/30"
            icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>} 
          />
        </div>
      </div>

      {/* =========================================================
          INTERACTIVE EDIT MODALS OVERLAY
      ========================================================= */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-(--brand-ink)/40 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 12 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 12 }} 
              className="relative z-10 w-full max-w-md bg-(--brand-card)/95 backdrop-blur-3xl rounded-3xl border border-(--brand-border) shadow-[0_34px_80px_-30px_rgba(9,32,52,0.7)] p-6 sm:p-8 overflow-hidden text-(--brand-ink)"
            >
              {/* MODAL 1: EDIT NAME */}
              {activeModal === 'name' && (
                <form onSubmit={handleUpdateName} className="space-y-4">
                  <h3 className="text-xl font-bold text-(--brand-ink)">Edit Display Name</h3>
                  <p className="text-xs text-(--brand-muted)">Update how your name appears on reservations and invoices.</p>
                  <div>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Display Name"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-(--brand-border) text-sm font-semibold bg-(--brand-card) text-(--brand-ink) focus:outline-none focus:border-(--brand-blue) focus:ring-1 focus:ring-(--brand-blue)"
                    />
                  </div>
                  {err && <p className="text-xs text-(--ui-error) font-semibold">{err}</p>}
                  {msg && <p className="text-xs text-(--brand-green) font-bold">{msg}</p>}
                  <div className="flex gap-2.5 pt-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-3 px-4 rounded-xl bg-(--surface-soft) text-(--brand-ink) text-xs sm:text-sm font-bold border border-(--brand-border) hover:bg-(--surface-tint) cursor-pointer">Cancel</button>
                    <button type="submit" disabled={updating} className="flex-1 py-3 px-4 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white text-xs sm:text-sm font-bold shadow-md hover:brightness-105 cursor-pointer">{updating ? 'Saving...' : 'Save Name'}</button>
                  </div>
                </form>
              )}

              {/* MODAL 2: EDIT ADDRESS */}
              {activeModal === 'address' && (
                <form onSubmit={handleUpdateAddress} className="space-y-4">
                  <h3 className="text-xl font-bold text-(--brand-ink)">Edit Billing Address</h3>
                  <p className="text-xs text-(--brand-muted)">Update your primary address for monthly energy tax receipts.</p>
                  <div>
                    <textarea 
                      rows={3}
                      value={editAddress} 
                      onChange={e => setEditAddress(e.target.value)}
                      placeholder="Street Address, City"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-(--brand-border) text-sm font-semibold bg-(--brand-card) text-(--brand-ink) focus:outline-none focus:border-(--brand-blue) focus:ring-1 focus:ring-(--brand-blue) resize-none"
                    />
                  </div>
                  {err && <p className="text-xs text-(--ui-error) font-semibold">{err}</p>}
                  {msg && <p className="text-xs text-(--brand-green) font-bold">{msg}</p>}
                  <div className="flex gap-2.5 pt-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-3 px-4 rounded-xl bg-(--surface-soft) text-(--brand-ink) text-xs sm:text-sm font-bold border border-(--brand-border) hover:bg-(--surface-tint) cursor-pointer">Cancel</button>
                    <button type="submit" disabled={updating} className="flex-1 py-3 px-4 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white text-xs sm:text-sm font-bold shadow-md hover:brightness-105 cursor-pointer">{updating ? 'Saving...' : 'Save Address'}</button>
                  </div>
                </form>
              )}

              {/* MODAL 3: CHANGE PASSWORD */}
              {activeModal === 'password' && (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <h3 className="text-xl font-bold text-(--brand-ink)">Change Password</h3>
                  <p className="text-xs text-(--brand-muted)">Enter your current password to authorize this security change.</p>
                  <div className="space-y-3">
                    <input 
                      type="password" 
                      value={currentPassword} 
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Current Password"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-(--brand-border) text-sm font-semibold bg-(--brand-card) text-(--brand-ink) focus:outline-none focus:border-(--brand-blue) focus:ring-1 focus:ring-(--brand-blue)"
                    />
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="New Password (min 6 chars)"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-(--brand-border) text-sm font-semibold bg-(--brand-card) text-(--brand-ink) focus:outline-none focus:border-(--brand-blue) focus:ring-1 focus:ring-(--brand-blue)"
                    />
                    <input 
                      type="password" 
                      value={confirmNewPassword} 
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm New Password"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-(--brand-border) text-sm font-semibold bg-(--brand-card) text-(--brand-ink) focus:outline-none focus:border-(--brand-blue) focus:ring-1 focus:ring-(--brand-blue)"
                    />
                  </div>
                  {err && <p className="text-xs text-(--ui-error) font-semibold">{err}</p>}
                  {msg && <p className="text-xs text-(--brand-green) font-bold">{msg}</p>}
                  <div className="flex gap-2.5 pt-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-3 px-4 rounded-xl bg-(--surface-soft) text-(--brand-ink) text-xs sm:text-sm font-bold border border-(--brand-border) hover:bg-(--surface-tint) cursor-pointer">Cancel</button>
                    <button type="submit" disabled={updating} className="flex-1 py-3 px-4 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white text-xs sm:text-sm font-bold shadow-md hover:brightness-105 cursor-pointer">{updating ? 'Updating...' : 'Update Password'}</button>
                  </div>
                </form>
              )}

              {/* MODAL 4: TRANSACTION HISTORY (real completed sessions) */}
              {activeModal === 'history' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-(--brand-ink)">Transaction History</h3>
                    <button onClick={() => setActiveModal(null)} className="text-(--brand-muted) hover:text-(--brand-ink)">✕</button>
                  </div>
                  {txLoading ? (
                    <div className="bg-(--surface-soft) rounded-2xl p-6 text-center text-sm text-(--brand-muted)">Loading completed sessions…</div>
                  ) : txBookings.length === 0 ? (
                    <div className="bg-(--surface-soft) rounded-2xl p-4 border border-(--brand-border) text-center py-8 space-y-2">
                      <p className="text-sm font-bold text-(--brand-ink)">No completed sessions yet.</p>
                      <p className="text-xs text-(--brand-muted)">Once you finish charging, each session's cost appears here.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {txBookings.map((b: any, i: number) => (
                        <div key={b._id || i} className="flex items-center justify-between p-3 rounded-xl border border-(--brand-border) bg-(--background)">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-(--brand-ink) truncate">
                              {b.station?.stationName || b.station?.name || 'EV Station'}
                            </p>
                            <p className="text-xs text-(--brand-muted)">
                              {b.date} · {b.startTime} {b.energyConsumedKWh != null ? `· ${b.energyConsumedKWh.toFixed(1)} kWh` : ''}
                            </p>
                          </div>
                          <span className="font-bold text-sm text-(--brand-green) shrink-0">
                            {b.totalCostLKR != null ? `LKR ${Math.round(b.totalCostLKR)}` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={() => setActiveModal(null)} className="w-full py-3.5 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white text-xs sm:text-sm font-bold shadow-md hover:brightness-105 cursor-pointer">Close Ledger</button>
                </div>
              )}

              {/* MODAL 5: HELP CENTER */}
              {activeModal === 'help' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-(--brand-ink)">Help Center</h3>
                    <button onClick={() => setActiveModal(null)} className="text-(--brand-muted) hover:text-(--brand-ink) cursor-pointer">✕</button>
                  </div>
                  <div className="space-y-3 text-sm text-(--brand-muted) leading-relaxed">
                    <p><b className="text-(--brand-ink)">Booking:</b> Tap a station on the map, pick an available charger and a time slot, then request a booking. The owner has 15 minutes to approve it.</p>
                    <p><b className="text-(--brand-ink)">Smart Match:</b> Tap “Find Best Value Station”, set your battery level and plug type — the AI ranks nearby stations by price and drive time.</p>
                    <p><b className="text-(--brand-ink)">Need help at a station?</b> Use the <b>Contact</b> button on any station to call the owner directly.</p>
                  </div>
                  <button type="button" onClick={() => setActiveModal(null)} className="w-full py-3.5 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white text-xs sm:text-sm font-bold shadow-md hover:brightness-105 cursor-pointer">Close</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════ FULL-SCREEN IN-APP: MESSAGES ══════════ */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[90] bg-(--background) overflow-y-auto"
          >
            <div className="w-full min-h-dvh md:pl-[120px] lg:pl-[140px] md:pr-12 pt-8 px-6 pb-36 max-w-4xl mx-auto">
              <MessagesView
                initialStationId={chatStationId}
                onBack={() => { setChatOpen(false); setChatStationId(null); }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ FULL-SCREEN IN-APP: ABOUT / PRIVACY ══════════ */}
      <AnimatePresence>
        {infoScreen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[90] bg-(--background) flex flex-col overflow-hidden"
          >
            {/* Sticky Glass Header */}
            <div className="sticky top-0 z-10 bg-(--brand-card)/80 backdrop-blur-xl border-b border-(--brand-border) px-6 py-4 flex items-center gap-3.5">
              <button
                onClick={() => setInfoScreen(null)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-(--surface-soft) border border-(--brand-border) text-(--brand-ink) hover:bg-(--surface-tint) transition-colors cursor-pointer"
                title="Back to Account"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              </button>
              <h1 className="text-xl font-bold text-(--brand-ink) tracking-tight">
                {infoScreen === 'about' ? 'About VoltHive' : 'Privacy Policy'}
              </h1>
            </div>

            {/* Scrollable Content Card */}
            <div className="flex-1 overflow-y-auto px-6 py-8 pb-32">
              <div className="max-w-2xl mx-auto bg-(--brand-card)/85 backdrop-blur-2xl rounded-3xl border border-(--brand-border) p-6 sm:p-8 shadow-[0_20px_50px_-25px_rgba(9,32,52,0.4)]">
                {infoScreen === 'about' ? <AboutContent /> : <PrivacyContent />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <ConfirmModal
        isOpen={!!pendingConfirm}
        title={pendingConfirm?.title || ''}
        message={pendingConfirm?.message || ''}
        confirmText={pendingConfirm?.confirmText || 'Confirm'}
        isDanger={pendingConfirm?.isDanger || false}
        onConfirm={async () => {
          const act = pendingConfirm?.action;
          setPendingConfirm(null);
          if (act) await act();
        }}
        onClose={() => setPendingConfirm(null)}
      />

      <Toast
        message={toastMessage?.msg || null}
        type={toastMessage?.type || 'error'}
        onClose={() => setToastMessage(null)}
      />
    </section>
  );
}