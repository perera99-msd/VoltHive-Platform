'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Toast from '../../common/Toast';
import ConfirmModal from '../../common/ConfirmModal';

interface OwnerSettingsViewProps {
  onNavigate?: (tab: string) => void;
}

interface PortalSettings {
  driverChatAlerts: boolean;
  bookingQueueAlerts: boolean;
  aiPricingAlerts: boolean;
  autoAcceptBookings: boolean;
  currency: 'LKR' | 'USD' | 'EUR';
  clockFormat: '12h' | '24h';
  soundEffects: boolean;
  telemetryPollingSec: number;
  hardwareAcceleration: boolean;
}

const DEFAULT_SETTINGS: PortalSettings = {
  driverChatAlerts: true,
  bookingQueueAlerts: true,
  aiPricingAlerts: true,
  autoAcceptBookings: false,
  currency: 'LKR',
  clockFormat: '12h',
  soundEffects: true,
  telemetryPollingSec: 15,
  hardwareAcceleration: true,
};

const ToggleSwitch = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onChange(!checked);
    }}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? 'bg-(--brand-green)' : 'bg-(--brand-border)'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export default function OwnerSettingsView({ onNavigate }: OwnerSettingsViewProps) {
  const [settings, setSettings] = useState<PortalSettings>(DEFAULT_SETTINGS);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' | 'info' } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('volthive_owner_settings');
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch {
      // fallback
    }
  }, []);

  const updateSetting = <K extends keyof PortalSettings>(key: K, val: PortalSettings[K]) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: val };
      setHasChanges(true);
      return updated;
    });
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('volthive_owner_settings', JSON.stringify(settings));
      setHasChanges(false);
      setToastMessage({ msg: 'Portal settings saved successfully!', type: 'success' });
    } catch {
      setToastMessage({ msg: 'Failed to save settings.', type: 'error' });
    }
  };

  const requestResetDefaults = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Settings to Factory Defaults?',
      message: 'Are you sure you want to reset all telemetry polling intervals, sound preferences, and formats to initial platform defaults?',
      confirmText: 'Reset to Defaults',
      cancelText: 'Cancel',
      isDanger: true,
      onConfirm: () => {
        setSettings(DEFAULT_SETTINGS);
        localStorage.setItem('volthive_owner_settings', JSON.stringify(DEFAULT_SETTINGS));
        setHasChanges(false);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setToastMessage({ msg: 'Settings restored to factory defaults.', type: 'info' });
      }
    });
  };

  const requestClearCache = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear Local Telemetry Cache?',
      message: 'This will purge cached station GIS maps, telemetry logs, and offline metrics from your browser. Live operations will re-sync on next refresh.',
      confirmText: 'Clear Cache',
      cancelText: 'Cancel',
      isDanger: true,
      onConfirm: () => {
        sessionStorage.clear();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setToastMessage({ msg: 'Browser telemetry cache cleared successfully.', type: 'success' });
      }
    });
  };

  const handleExportData = () => {
    const csvContent = 'data:text/csv;charset=utf-8,VoltHive Station Ledger Export\nDate,Metric,Value\n' +
      new Date().toISOString() + ',Exported By,Station Operator\n' +
      new Date().toISOString() + ',Currency,' + settings.currency + '\n' +
      new Date().toISOString() + ',Telemetry Polling,' + settings.telemetryPollingSec + 's\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VoltHive_Station_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage({ msg: 'Station ledger CSV exported.', type: 'success' });
  };

  return (
    <div className="w-full relative font-sans space-y-6 pb-16">
      
      {/* ── 1. SAAS DASHBOARD HEADER BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:px-6 sm:py-5 bg-white/80 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)] shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-(--brand-blue) to-(--brand-green) text-white font-black flex items-center justify-center shadow-xs shrink-0">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-(--brand-ink)">
                System & Portal Settings
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[10px] font-black uppercase tracking-wider border border-(--brand-blue)/20 hidden sm:inline-block">
                Grid Console
              </span>
            </div>
            <p className="text-xs text-(--brand-muted) font-medium mt-0.5">
              Configure telemetry polling frequency, operational sound chimes, currency formats, and diagnostic tools.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          {hasChanges && (
            <button
              type="button"
              onClick={handleSaveSettings}
              className="px-4 py-2 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-black text-xs shadow-xs hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <span>Save Changes</span>
              <span>✓</span>
            </button>
          )}
          <button
            type="button"
            onClick={requestResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-(--surface-soft) border border-[#e0e5e3] text-xs font-bold text-(--brand-muted) hover:text-(--brand-ink) transition-all cursor-pointer shadow-2xs"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* ── 2. TWO-COLUMN DASHBOARD SETTINGS GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD 1: OPERATIONS & NOTIFICATIONS */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col justify-between">
          <div className="p-5 sm:p-6 border-b border-[#e0e5e3]/70 bg-(--surface-soft)/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 text-(--brand-blue-deep) flex items-center justify-center">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <h3 className="text-sm font-extrabold text-(--brand-ink)">Operations & Audio Alerts</h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-(--brand-muted)">Live Feeds</span>
          </div>

          <div className="divide-y divide-[#e0e5e3]/70">
            <div className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-(--surface-soft)/40 transition-colors">
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-(--brand-ink)">Driver Chat Audio Alerts</p>
                <p className="text-xs text-(--brand-muted) font-medium mt-0.5">Play sound chime when EV drivers send inquiries</p>
              </div>
              <ToggleSwitch
                checked={settings.driverChatAlerts}
                onChange={(val) => updateSetting('driverChatAlerts', val)}
              />
            </div>

            <div className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-(--surface-soft)/40 transition-colors">
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-(--brand-ink)">Booking Queue & POS Alerts</p>
                <p className="text-xs text-(--brand-muted) font-medium mt-0.5">Audio signal when driver arrives or books slot</p>
              </div>
              <ToggleSwitch
                checked={settings.bookingQueueAlerts}
                onChange={(val) => updateSetting('bookingQueueAlerts', val)}
              />
            </div>

            <div className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-(--surface-soft)/40 transition-colors">
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-(--brand-ink)">AI Pricing Multiplier Alert</p>
                <p className="text-xs text-(--brand-muted) font-medium mt-0.5">Notify when neural models detect peak surge hours</p>
              </div>
              <ToggleSwitch
                checked={settings.aiPricingAlerts}
                onChange={(val) => updateSetting('aiPricingAlerts', val)}
              />
            </div>

            <div className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-(--surface-soft)/40 transition-colors">
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-(--brand-ink)">Auto-Accept Verified Bookings</p>
                <p className="text-xs text-(--brand-muted) font-medium mt-0.5">Auto-confirm slots for registered fleet vehicles</p>
              </div>
              <ToggleSwitch
                checked={settings.autoAcceptBookings}
                onChange={(val) => updateSetting('autoAcceptBookings', val)}
              />
            </div>
          </div>
        </div>

        {/* CARD 2: REGIONAL FORMATS & DISPLAY */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col justify-between">
          <div className="p-5 sm:p-6 border-b border-[#e0e5e3]/70 bg-(--surface-soft)/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-(--brand-green)/10 border border-(--brand-green)/20 text-(--brand-green-deep) flex items-center justify-center">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-extrabold text-(--brand-ink)">Regional Formats & Display</h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-(--brand-muted)">Localization</span>
          </div>

          <div className="divide-y divide-[#e0e5e3]/70">
            <div className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-(--surface-soft)/40 transition-colors">
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-(--brand-ink)">Primary Billing Currency</p>
                <p className="text-xs text-(--brand-muted) font-medium mt-0.5">Currency symbol on invoices & rates</p>
              </div>
              <div className="flex bg-(--surface-soft) p-1 rounded-xl border border-[#e0e5e3] gap-1">
                {(['LKR', 'USD', 'EUR'] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => updateSetting('currency', curr)}
                    className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                      settings.currency === curr
                        ? 'bg-white text-(--brand-blue-deep) shadow-2xs'
                        : 'text-(--brand-muted) hover:text-(--brand-ink)'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-(--surface-soft)/40 transition-colors">
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-(--brand-ink)">Top Panel Clock Format</p>
                <p className="text-xs text-(--brand-muted) font-medium mt-0.5">Live time display on operator bar</p>
              </div>
              <div className="flex bg-(--surface-soft) p-1 rounded-xl border border-[#e0e5e3] gap-1">
                {(['12h', '24h'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => updateSetting('clockFormat', fmt)}
                    className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                      settings.clockFormat === fmt
                        ? 'bg-white text-(--brand-blue-deep) shadow-2xs'
                        : 'text-(--brand-muted) hover:text-(--brand-ink)'
                    }`}
                  >
                    {fmt === '12h' ? '12h (AM/PM)' : '24h (Military)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-(--surface-soft)/40 transition-colors">
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-(--brand-ink)">Interface Interaction Sounds</p>
                <p className="text-xs text-(--brand-muted) font-medium mt-0.5">Audio feedback when sliding tariff steppers</p>
              </div>
              <ToggleSwitch
                checked={settings.soundEffects}
                onChange={(val) => updateSetting('soundEffects', val)}
              />
            </div>
          </div>
        </div>

        {/* CARD 3: HARDWARE TELEMETRY */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col justify-between">
          <div className="p-5 sm:p-6 border-b border-[#e0e5e3]/70 bg-(--surface-soft)/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 text-(--brand-blue-deep) flex items-center justify-center">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-sm font-extrabold text-(--brand-ink)">Hardware Telemetry & Refresh</h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-(--brand-muted)">Sensors</span>
          </div>

          <div className="divide-y divide-[#e0e5e3]/70">
            <div className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-(--surface-soft)/40 transition-colors">
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-(--brand-ink)">Sensor Polling Frequency</p>
                <p className="text-xs text-(--brand-muted) font-medium mt-0.5">Interval for charger kW and port updates</p>
              </div>
              <div className="flex bg-(--surface-soft) p-1 rounded-xl border border-[#e0e5e3] gap-1">
                {([5, 15, 30, 60] as const).map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => updateSetting('telemetryPollingSec', sec)}
                    className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                      settings.telemetryPollingSec === sec
                        ? 'bg-white text-(--brand-blue-deep) shadow-2xs'
                        : 'text-(--brand-muted) hover:text-(--brand-ink)'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-(--surface-soft)/40 transition-colors">
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-(--brand-ink)">GIS Map Hardware Acceleration</p>
                <p className="text-xs text-(--brand-muted) font-medium mt-0.5">WebGL acceleration for 60fps station maps</p>
              </div>
              <ToggleSwitch
                checked={settings.hardwareAcceleration}
                onChange={(val) => updateSetting('hardwareAcceleration', val)}
              />
            </div>
          </div>
        </div>

        {/* CARD 4: LEDGER DATA & MAINTENANCE */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col justify-between">
          <div className="p-5 sm:p-6 border-b border-[#e0e5e3]/70 bg-(--surface-soft)/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <h3 className="text-sm font-extrabold text-(--brand-ink)">Ledger Data & Maintenance</h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-(--brand-muted)">Utilities</span>
          </div>

          <div className="divide-y divide-[#e0e5e3]/70">
            <div className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-(--surface-soft)/40 transition-colors">
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-(--brand-ink)">Export Station Ledger CSV</p>
                <p className="text-xs text-(--brand-muted) font-medium mt-0.5">Download complete charging logs for utility auditing</p>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                className="px-3.5 py-1.5 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-black text-xs shadow-2xs hover:brightness-105 cursor-pointer active:scale-95 transition-all flex items-center gap-1"
              >
                <span>Export</span>
                <span>→</span>
              </button>
            </div>

            <div className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-(--surface-soft)/40 transition-colors">
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-(--brand-ink)">Clear Local Telemetry Cache</p>
                <p className="text-xs text-(--brand-muted) font-medium mt-0.5">Purge cached offline data and re-sync live socket</p>
              </div>
              <button
                type="button"
                onClick={requestClearCache}
                className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-extrabold text-xs transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText || 'Confirm'}
        cancelText={confirmModal.cancelText || 'Cancel'}
        isDanger={confirmModal.isDanger}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Alert */}
      <Toast message={toastMessage?.msg || null} type={toastMessage?.type || 'info'} onClose={() => setToastMessage(null)} />
    </div>
  );
}
