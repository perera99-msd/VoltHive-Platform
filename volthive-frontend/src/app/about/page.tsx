'use client';

import { useRouter } from 'next/navigation';
import AboutContent from '../../components/info/AboutContent';

export default function AboutPage() {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-[#f5f7f6] text-(--brand-ink) font-sans">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
          className="inline-flex items-center gap-2 text-sm font-semibold text-(--brand-blue) hover:underline mb-8 cursor-pointer"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back
        </button>

        <h1 className="text-3xl font-extrabold tracking-tight mb-3">About VoltHive</h1>
        <AboutContent />
      </div>
    </main>
  );
}
