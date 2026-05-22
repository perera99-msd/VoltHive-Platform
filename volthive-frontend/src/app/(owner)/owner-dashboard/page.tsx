'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import OwnerSidebar from '../../../components/owner/OwnerSidebar';
import OwnerHome from '../../../components/owner/views/OwnerHome';
import StationsView from '../../../components/owner/views/StationsView';
import ChargersView from '../../../components/owner/views/ChargersView';
import LiveOperationsView from '../../../components/owner/views/LiveOperationsView';
import RateCalendar from '../../../components/owner/RateCalendar';
import OwnerMap from '../../../components/owner/views/OwnerMap'; 

export default function OwnerDashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <OwnerHome />;
      case 'stations': return <StationsView />;
      case 'chargers': return <ChargersView />;
      case 'bookings': return <LiveOperationsView />;
      case 'rates': return <RateCalendar />;
      case 'map': return <OwnerMap />;
      default: return <OwnerHome />;
    }
  };

  return (
    <ProtectedRoute requiredRole="owner">
      <div className="flex h-screen w-full bg-(--background) overflow-hidden selection:bg-(--accent-blue)/30">
        
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-(--accent-blue)/10 blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full bg-(--accent-green)/10 blur-[120px] pointer-events-none z-0" />

        <OwnerSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
        
        <main className="flex-1 relative z-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <div className="min-h-full p-6 md:p-8 lg:p-10 pb-10 vh-rise-in">
            {renderContent()}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}