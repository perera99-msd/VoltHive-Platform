'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { apiUrl } from '../../../lib/api';
import Toast from '../../common/Toast';
import ConfirmModal from '../../common/ConfirmModal';

interface OwnerProfileViewProps {
  onLogout: () => void;
}

export const AVATAR_OPTIONS = [
  { id: 'bot-1', name: 'VoltSpark Bot', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=VoltSpark&backgroundColor=b6e3f4,c0aede,d1d4f9' },
  { id: 'bot-2', name: 'Circuit Hero', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=CircuitHero&backgroundColor=ffd5dc,ffdfbf' },
  { id: 'bot-3', name: 'Eco Charge', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=EcoCharge&backgroundColor=c0aede,d1d4f9' },
  { id: 'bot-4', name: 'Amp Master', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=AmpMaster&backgroundColor=b6e3f4' },
  { id: 'bot-5', name: 'Cyber Pulse', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=CyberPulse&backgroundColor=ffd5dc,b6e3f4' },
  { id: 'bot-6', name: 'Neon Surge', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=NeonSurge&backgroundColor=d1d4f9,c0aede' },
  { id: 'adv-1', name: 'Alex Volt', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AlexVolt&backgroundColor=b6e3f4' },
  { id: 'adv-2', name: 'Sam Station', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SamStation&backgroundColor=ffd5dc' },
  { id: 'adv-3', name: 'Jordan Host', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=JordanHost&backgroundColor=d1d4f9' },
  { id: 'adv-4', name: 'Solar Pilot', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SolarPilot&backgroundColor=ffdfbf' },
  { id: 'adv-5', name: 'Maya Energy', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MayaEnergy&backgroundColor=b6e3f4' },
  { id: 'adv-6', name: 'Kai Charger', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KaiCharger&backgroundColor=ffdfbf' },
  { id: 'emoji-1', name: 'Hyper Power', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=HyperPower&backgroundColor=c0aede' },
  { id: 'emoji-2', name: 'Electric Spark', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=ElectricWink&backgroundColor=b6e3f4' },
  { id: 'emoji-3', name: 'Zen Spark', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=ZenSpark&backgroundColor=d1d4f9' },
  { id: 'pers-1', name: 'Tech Operator', url: 'https://api.dicebear.com/7.x/personas/svg?seed=TechOperator&backgroundColor=ffd5dc' },
  { id: 'pers-2', name: 'Grid Commander', url: 'https://api.dicebear.com/7.x/personas/svg?seed=GridCommander&backgroundColor=c0aede' },
  { id: 'pers-3', name: 'Quantum Captain', url: 'https://api.dicebear.com/7.x/personas/svg?seed=QuantumCaptain&backgroundColor=b6e3f4' },
];

export default function OwnerProfileView({ onLogout }: OwnerProfileViewProps) {
  const { user } = useAuth();
  
  // Profile Data State - Always initialized with valid avatar URL
  const [profileData, setProfileData] = useState<{ name?: string; email?: string; role?: string; createdAt?: string; photoURL?: string } | null>(null);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [editNameInput, setEditNameInput] = useState(user?.displayName || '');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(() => {
    if (user?.photoURL) return user.photoURL;
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('volthive_owner_avatar');
      if (cached) return cached;
    }
    return AVATAR_OPTIONS[0].url;
  });
  const [selectedAvatarName, setSelectedAvatarName] = useState('');

  // Password Update State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Status & Confirmation
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' | 'info' } | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Load User Profile from MongoDB & Firebase (Guarded once per uid)
  useEffect(() => {
    if (!user?.uid) return;
    let isCancelled = false;
    const fetchProfile = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token || isCancelled) return;
        const res = await fetch(apiUrl('/api/users/profile'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setProfileData(data);
          if (data.name) {
            setDisplayName(data.name);
            setEditNameInput(data.name);
          }
          const validAvatar = data.avatar || data.photoURL || user?.photoURL || AVATAR_OPTIONS[0].url;
          setSelectedAvatarUrl(validAvatar);
          localStorage.setItem('volthive_owner_avatar', validAvatar);
        }
      } catch (e) {
        console.warn('Could not fetch user profile details', e);
      }
    };
    fetchProfile();
    return () => { isCancelled = true; };
  }, [user?.uid]);

  // Execute Avatar Update
  const executeUpdateAvatar = async (avatarUrl: string, avatarName: string) => {
    if (!auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, { photoURL: avatarUrl });
      const token = await auth.currentUser.getIdToken();
      if (token) {
        await fetch(apiUrl('/api/users/profile'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ avatar: avatarUrl, photoURL: avatarUrl })
        });
      }
      setSelectedAvatarUrl(avatarUrl);
      localStorage.setItem('volthive_owner_avatar', avatarUrl);
      window.dispatchEvent(new Event('volthive_avatar_updated'));
      setToastMessage({ msg: `Avatar updated to "${avatarName}"!`, type: 'success' });
    } catch (err: any) {
      setToastMessage({ msg: err?.message || 'Failed to update avatar.', type: 'error' });
    }
  };

  const handleSelectAvatar = (avatarUrl: string, avatarName: string) => {
    if (avatarUrl === selectedAvatarUrl) return;
    setSelectedAvatarName(avatarName);
    setPendingConfirm({
      isOpen: true,
      title: 'Update Operator Avatar?',
      message: `Set "${avatarName}" as your active station operator profile picture? It will appear on your top navigation bar and live chat messages.`,
      confirmText: 'Set Avatar',
      isDanger: false,
      onConfirm: () => {
        setPendingConfirm(null);
        executeUpdateAvatar(avatarUrl, avatarName);
      }
    });
  };

  // Execute Name Update
  const handleSaveName = () => {
    const trimmed = editNameInput.trim();
    if (!trimmed) {
      setToastMessage({ msg: 'Display name cannot be empty.', type: 'error' });
      return;
    }
    if (trimmed === displayName) return;

    setPendingConfirm({
      isOpen: true,
      title: 'Save Display Name Changes?',
      message: `Update your public operator name to "${trimmed}" across all station invoices and driver communications?`,
      confirmText: 'Save Name',
      isDanger: false,
      onConfirm: async () => {
        setPendingConfirm(null);
        setIsUpdatingName(true);
        try {
          if (!auth.currentUser) return;
          await updateProfile(auth.currentUser, { displayName: trimmed });
          const token = await auth.currentUser.getIdToken();
          if (token) {
            await fetch(apiUrl('/api/users/profile'), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ name: trimmed })
            });
          }
          setDisplayName(trimmed);
          setToastMessage({ msg: 'Display name updated successfully!', type: 'success' });
        } catch (err: any) {
          setToastMessage({ msg: err?.message || 'Failed to update display name.', type: 'error' });
        } finally {
          setIsUpdatingName(false);
        }
      }
    });
  };

  // Execute Password Update
  const handleSavePassword = () => {
    if (!currentPassword) {
      setToastMessage({ msg: 'Please enter your current password.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setToastMessage({ msg: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setToastMessage({ msg: 'New passwords do not match.', type: 'error' });
      return;
    }

    setPendingConfirm({
      isOpen: true,
      title: 'Update Account Password?',
      message: 'Are you sure you want to update your operator security password? You will use this new password for subsequent logins.',
      confirmText: 'Update Password',
      isDanger: true,
      onConfirm: async () => {
        setPendingConfirm(null);
        setIsUpdatingPassword(true);
        try {
          if (!auth.currentUser || !auth.currentUser.email) return;
          const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
          await reauthenticateWithCredential(auth.currentUser, credential);
          await updatePassword(auth.currentUser, newPassword);
          
          setCurrentPassword('');
          setNewPassword('');
          setConfirmNewPassword('');
          setToastMessage({ msg: 'Account password updated successfully!', type: 'success' });
        } catch (err: any) {
          if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            setToastMessage({ msg: 'Incorrect current password. Verification failed.', type: 'error' });
          } else {
            setToastMessage({ msg: err?.message || 'Failed to change password.', type: 'error' });
          }
        } finally {
          setIsUpdatingPassword(false);
        }
      }
    });
  };

  const joinDate = profileData?.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })
    : 'Aug 2026';

  const activeAvatarSrc = selectedAvatarUrl || AVATAR_OPTIONS[0].url;

  return (
    <div className="w-full relative font-sans space-y-6 pb-16">
      
      {/* ── 1. SAAS DASHBOARD HEADER BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:px-6 sm:py-5 bg-white/80 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)] shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-(--brand-blue) to-(--brand-green) text-white font-black flex items-center justify-center shadow-xs shrink-0">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-(--brand-ink)">
                Operator Profile & Identity
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-(--brand-green)/10 text-(--brand-green-deep) text-[10px] font-black uppercase tracking-wider border border-(--brand-green)/20 hidden sm:inline-block">
                Verified Host
              </span>
            </div>
            <p className="text-xs text-(--brand-muted) font-medium mt-0.5">
              Manage your verified host identity, public animated avatar personas, and account credentials.
            </p>
          </div>
        </div>

        {/* Action Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3.5 py-1.5 rounded-xl bg-white border border-[#e0e5e3] text-xs font-bold text-(--brand-muted) shadow-2xs">
            Member Since {joinDate}
          </span>
        </div>
      </div>

      {/* ── 2. FULL-WIDTH HERO OPERATOR CARD ── */}
      <div className="w-full bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-linear-to-r from-(--brand-blue) to-(--brand-green)" />
        
        <div className="relative shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-linear-to-tr from-(--brand-blue)/15 to-(--brand-green)/15 border-2 border-white shadow-md overflow-hidden flex items-center justify-center">
            <img
              src={activeAvatarSrc}
              alt="Operator Avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                // fallback to first avatar option if URL ever fails
                (e.target as HTMLImageElement).src = AVATAR_OPTIONS[0].url;
              }}
            />
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-(--brand-green) border-2 border-white flex items-center justify-center shadow-xs text-[10px] text-white font-black">
            ✓
          </span>
        </div>

        <div className="text-center sm:text-left flex-1 min-w-0 space-y-2">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-extrabold text-(--brand-ink) tracking-tight truncate">
                {displayName || user?.displayName || user?.email?.split('@')[0] || 'Station Operator'}
              </h2>
              <span className="w-2 h-2 rounded-full bg-(--brand-green) shrink-0" />
            </div>
            <p className="text-xs font-bold text-(--brand-muted) mt-0.5 truncate">{user?.email || '—'}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <span className="px-3 py-1 rounded-xl bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[11px] font-black uppercase tracking-wider border border-(--brand-blue)/20">
              Verified Station Administrator
            </span>
            <span className="px-3 py-1 rounded-xl bg-(--surface-soft) text-(--brand-muted) text-[11px] font-bold border border-[#e0e5e3]">
              Full Station Grid Access
            </span>
          </div>

          <p className="text-xs text-(--brand-muted) font-medium leading-relaxed pt-1">
            Your public operator name and animated persona are displayed to EV drivers during live chat and on digital charging invoices.
          </p>
        </div>
      </div>

      {/* ── 3. AVATAR PERSONA SELECTOR ── */}
      <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-(--brand-ink) tracking-tight">
              Select Operator Animated Persona
            </h3>
            <p className="text-xs text-(--brand-muted) font-medium mt-0.5">
              Choose from 18 high-resolution vector personas. Click any avatar to apply with confirmation.
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-(--surface-soft) text-(--brand-muted) text-[11px] font-black uppercase tracking-wider border border-[#e0e5e3] shrink-0 self-start sm:self-auto">
            18 Vector Choices
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-3 pt-1">
          {AVATAR_OPTIONS.map((av) => {
            const isSelected = activeAvatarSrc === av.url;
            return (
              <button
                key={av.id}
                type="button"
                onClick={() => handleSelectAvatar(av.url, av.name)}
                className={`p-2 rounded-2xl transition-all cursor-pointer flex flex-col items-center gap-1.5 relative group ${
                  isSelected
                    ? 'bg-linear-to-tr from-(--brand-blue)/15 to-(--brand-green)/15 border-2 border-(--brand-blue) shadow-xs scale-105'
                    : 'bg-(--surface-soft)/60 hover:bg-white border border-[#e0e5e3] hover:border-(--brand-blue)/30 hover:scale-105'
                }`}
                title={av.name}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shadow-2xs flex items-center justify-center">
                  <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] font-bold text-(--brand-ink) truncate max-w-[70px] leading-tight">
                  {av.name.split(' ')[0]}
                </span>
                {isSelected && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-(--brand-green) border-2 border-white flex items-center justify-center text-[8px] text-white font-black">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. PROFILE MANAGEMENT: EDIT NAME & PASSWORD (2 COLS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Edit Operator Display Name */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 text-(--brand-blue-deep) flex items-center justify-center shrink-0">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-(--brand-ink)">Edit Operator Name</h3>
              <p className="text-xs text-(--brand-muted) font-medium">Public name shown on charging receipts</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-(--brand-muted) block mb-1.5">
                Full Display Name
              </label>
              <input
                type="text"
                value={editNameInput}
                onChange={(e) => setEditNameInput(e.target.value)}
                placeholder="e.g. Maya Energy Host"
                className="w-full px-4 py-2.5 bg-(--surface-soft)/60 border border-[#e0e5e3] rounded-2xl text-xs font-semibold text-(--brand-ink) focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-(--brand-muted) block mb-1.5">
                Registered Email (Immutable)
              </label>
              <input
                type="text"
                disabled
                value={user?.email || '—'}
                className="w-full px-4 py-2.5 bg-(--surface-soft) border border-[#e0e5e3] rounded-2xl text-xs font-bold text-(--brand-muted) cursor-not-allowed shadow-2xs"
              />
            </div>

            <button
              type="button"
              disabled={isUpdatingName || editNameInput.trim() === displayName}
              onClick={handleSaveName}
              className={`w-full py-2.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
                editNameInput.trim() !== displayName
                  ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white hover:brightness-105 cursor-pointer active:scale-95'
                  : 'bg-(--surface-soft) text-(--brand-muted) border border-[#e0e5e3] cursor-not-allowed opacity-70'
              }`}
            >
              {isUpdatingName ? 'Saving Changes...' : 'Save Name Changes'}
            </button>
          </div>
        </div>

        {/* Card 2: Change Password & Security */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-(--brand-green)/10 border border-(--brand-green)/20 text-(--brand-green-deep) flex items-center justify-center shrink-0">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-(--brand-ink)">Change Account Password</h3>
              <p className="text-xs text-(--brand-muted) font-medium">Re-authenticate and update credentials</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-(--brand-muted) block mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-(--surface-soft)/60 border border-[#e0e5e3] rounded-2xl text-xs font-semibold text-(--brand-ink) focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) focus:bg-white transition-all shadow-2xs pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-(--brand-muted) hover:text-(--brand-ink)"
                >
                  {showCurrentPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-(--brand-muted) block mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full px-4 py-2.5 bg-(--surface-soft)/60 border border-[#e0e5e3] rounded-2xl text-xs font-semibold text-(--brand-ink) focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) focus:bg-white transition-all shadow-2xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-(--brand-muted)"
                  >
                    {showNewPw ? '✕' : '👁'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-(--brand-muted) block mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-(--surface-soft)/60 border border-[#e0e5e3] rounded-2xl text-xs font-semibold text-(--brand-ink) focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isUpdatingPassword || !currentPassword || !newPassword}
              onClick={handleSavePassword}
              className={`w-full py-2.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
                currentPassword && newPassword
                  ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white hover:brightness-105 cursor-pointer active:scale-95'
                  : 'bg-(--surface-soft) text-(--brand-muted) border border-[#e0e5e3] cursor-not-allowed opacity-70'
              }`}
            >
              {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Safeguard Modal */}
      {pendingConfirm && (
        <ConfirmModal
          isOpen={pendingConfirm.isOpen}
          title={pendingConfirm.title}
          message={pendingConfirm.message}
          confirmText={pendingConfirm.confirmText || 'Confirm'}
          cancelText="Cancel"
          isDanger={pendingConfirm.isDanger}
          onConfirm={pendingConfirm.onConfirm}
          onClose={() => setPendingConfirm(null)}
        />
      )}

      {/* Toast Alert */}
      <Toast message={toastMessage?.msg || null} type={toastMessage?.type || 'info'} onClose={() => setToastMessage(null)} />
    </div>
  );
}
