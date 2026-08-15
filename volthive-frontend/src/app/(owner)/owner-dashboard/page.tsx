'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { OwnerNotificationProvider } from '../../../context/OwnerNotificationContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import OwnerSidebar from '../../../components/owner/OwnerSidebar';
import OwnerTopBar from '../../../components/owner/OwnerTopBar';
import OwnerHome from '../../../components/owner/views/OwnerHome';
import StationsView from '../../../components/owner/views/StationsView';
import ChargersView from '../../../components/owner/views/ChargersView';
import LiveOperationsView from '../../../components/owner/views/LiveOperationsView';
import RateCalendar from '../../../components/owner/RateCalendar';
import OwnerMap from '../../../components/owner/views/OwnerMap'; 
import AiPredictionView from '../../../components/owner/views/AiPredictionView';
import OwnerChatView from '../../../components/owner/views/OwnerChatView';
import OwnerNotificationsView from '../../../components/owner/views/OwnerNotificationsView';
import OwnerProfileView from '../../../components/owner/views/OwnerProfileView';
import OwnerSettingsView from '../../../components/owner/views/OwnerSettingsView';
import OwnerHelpView from '../../../components/owner/views/OwnerHelpView';

export default function OwnerDashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/owner-login');
    } catch (err) {
      console.error(err);
    }
  };

  const handleTabSelect = (tab: string) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <OwnerHome onNavigate={handleTabSelect} />;
      case 'ai': return <AiPredictionView />;
      case 'stations': return <StationsView />;
      case 'chargers': return <ChargersView />;
      case 'bookings': return <LiveOperationsView />;
      case 'chat': return <OwnerChatView />;
      case 'notifications': return <OwnerNotificationsView onNavigate={handleTabSelect} />;
      case 'rates': return <RateCalendar />;
      case 'map': return <OwnerMap />;
      case 'profile': return <OwnerProfileView onLogout={handleLogout} />;
      case 'settings': return <OwnerSettingsView onNavigate={handleTabSelect} />;
      case 'help': return <OwnerHelpView onNavigate={handleTabSelect} />;
      default: return <OwnerHome onNavigate={handleTabSelect} />;
    }
  };

  return (
    <ProtectedRoute requiredRole="owner">
      <OwnerNotificationProvider>
        <div className="fixed inset-0 flex w-full h-full bg-[#f4f8f6] bg-gradient-to-b from-[#f8faf6] via-[#f0f5f2] to-[#e6efec] overflow-hidden selection:bg-(--accent-blue)/30 font-sans">
          
          {/* Soft Ambient Theme Glows */}
          <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-[#2563eb]/8 blur-[130px] pointer-events-none z-0" />
          <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#2fb39a]/10 blur-[130px] pointer-events-none z-0" />

          {/* Mobile Off-canvas Backdrop */}
          {mobileSidebarOpen && (
            <div
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-xs z-40"
            />
          )}

          {/* Sidebar Container */}
          <div className={`fixed inset-y-0 left-0 z-50 transform ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out shrink-0`}>
            <OwnerSidebar activeTab={activeTab} setActiveTab={handleTabSelect} onLogout={handleLogout} />
          </div>
          
          {/* Main View Area with Persistent Top Panel */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
            {/* ── Persistent Top Panel (Always Visible) ── */}
            <OwnerTopBar
              activeTab={activeTab}
              onNavigate={handleTabSelect}
              onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              onLogout={handleLogout}
            />

            {/* Scrollable Page Content View */}
            <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              <div className="p-4 sm:p-6 md:p-8 w-full min-h-full flex flex-col max-w-[1600px] mx-auto">
                {renderContent()}
              </div>
            </main>
          </div>
        </div>
      </OwnerNotificationProvider>
    </ProtectedRoute>
  );
}