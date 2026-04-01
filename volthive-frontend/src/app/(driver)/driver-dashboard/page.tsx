'use client';

import ProtectedRoute from "../../../components/ProtectedRoute";
import StationMap from "../../../components/StationMap";
import { useAuth } from "../../../context/AuthContext";

export default function DriverDashboard() {
  const { logout } = useAuth();

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">VoltHive Aggregator</h1>
              <p className="text-gray-500 text-sm">Find available charging stations near you.</p>
            </div>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all shadow-sm"
            >
              Sign Out
            </button>
          </header>

          <section className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
            <StationMap />
          </section>

        </div>
      </main>
    </ProtectedRoute>
  );
}