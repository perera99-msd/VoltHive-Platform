'use client';
import { useState } from 'react';

export default function SmartMatchPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [battery, setBattery] = useState(20);
  const [plugType, setPlugType] = useState('CCS');
  const [isScanning, setIsScanning] = useState(false);

  // Mock scan function for UI purposes
  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setIsOpen(false);
      // Later, this will trigger the map to zoom to the best station and open the Booking Drawer
      alert("AI found the best match! (Backend integration coming soon)"); 
    }, 2000);
  };

  if (!isOpen) {
    return (
      <div className="absolute top-6 right-6 z-40 animate-in fade-in slide-in-from-top-4">
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-linear-to-r from-(--brand-blue) to-(--brand-green) backdrop-blur-md text-white px-5 py-3.5 rounded-full shadow-[0_8px_30px_rgba(74,144,164,0.24)] hover:brightness-105 hover:scale-105 transition-all duration-300 border border-white/15"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white/90">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
          <span className="font-semibold text-[15px] tracking-wide">Find Best Deal</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-6 right-6 z-40 w-[340px] bg-white/85 backdrop-blur-3xl rounded-[2rem] p-6 border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] animate-in fade-in slide-in-from-top-4 duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-(--brand-ink) tracking-tight flex items-center gap-2">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-(--brand-blue)">
             <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          Smart Match AI
        </h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 rounded-full bg-(--accent-blue)/12 hover:bg-(--accent-blue)/22 flex items-center justify-center text-(--brand-muted) transition-colors"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Input 1: Battery Level Slider */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-3">
          <label className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-widest">Current Battery</label>
          <span className={`text-sm font-bold ${battery < 20 ? 'text-(--ui-error)' : 'text-(--brand-ink)'}`}>{battery}%</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="100" 
          value={battery}
          onChange={(e) => setBattery(Number(e.target.value))}
          className="w-full h-2 bg-(--brand-border) rounded-lg appearance-none cursor-pointer accent-(--brand-blue)"
        />
      </div>

      {/* Input 2: Plug Compatibility */}
      <div className="mb-8">
        <label className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-widest block mb-3">Connector Type</label>
        <div className="flex gap-2">
          {['Type 2', 'CCS', 'CHAdeMO'].map(plug => (
            <button
              key={plug}
              onClick={() => setPlugType(plug)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                plugType === plug 
                  ? 'bg-(--brand-blue) border-(--brand-blue) text-white shadow-md' 
                  : 'bg-white/60 border-(--brand-border) text-(--brand-muted) hover:border-(--accent-blue) hover:bg-white'
              }`}
            >
              {plug}
            </button>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={handleScan}
        disabled={isScanning}
        className="w-full py-3.5 rounded-2xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-semibold text-[15px] shadow-[0_8px_20px_rgba(74,144,164,0.25)] hover:shadow-[0_8px_25px_rgba(74,144,164,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 overflow-hidden relative"
      >
        {isScanning ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Scanning Network...
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_infinite]" />
          </>
        ) : (
          'Find Optimal Station'
        )}
      </button>

    </div>
  );
}