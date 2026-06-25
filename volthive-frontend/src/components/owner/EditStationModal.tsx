'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';

type Station = {
  _id: string;
  stationName: string;
  address?: string;
  contactPhone?: string;
  description?: string;
  location?: { coordinates?: [number, number] };
};

type Props = {
  station: Station | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function EditStationModal({ station, isOpen, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (station) {
      setName(station.stationName || '');
      setAddress(station.address || '');
      setPhone(station.contactPhone || '');
      setDesc(station.description || '');
    }
  }, [station]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!station || !user) return;
    setLoading(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl(`/api/stations/${station._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          stationName: name,
          address,
          contactPhone: phone,
          description: desc
        })
      });

      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const err = await res.json();
        alert(`Error: ${err.message || 'Failed to update station'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 bg-background border border-(--brand-border) rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/20 focus:border-(--brand-blue) text-(--brand-ink)";

  return (
    <AnimatePresence>
      {isOpen && station && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-(--brand-ink)/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            className="bg-(--brand-card) rounded-3xl p-6 md:p-8 max-w-xl w-full border border-(--brand-border) shadow-2xl relative text-(--brand-ink)"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-(--brand-muted) hover:text-(--brand-ink)">
              ✕
            </button>
            <h3 className="text-xl font-bold mb-1">Edit Premise Specifications</h3>
            <p className="text-xs text-(--brand-muted) mb-6">Update site name, physical location, and contact information.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-1">Premise Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-1">Physical Address</label>
                <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-1">Contact Hotline</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="+94 7X XXX XXXX" />
              </div>

              <div>
                <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-1">Description / Access Notes</label>
                <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} className={inputCls} />
              </div>

              <div className="flex gap-3 pt-4 border-t border-(--brand-border)">
                <button type="button" onClick={onClose} className="flex-1 py-3 bg-(--surface-soft) text-(--brand-ink) font-bold rounded-xl hover:bg-(--surface-tint) transition-colors text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-(--brand-blue) text-white font-bold rounded-xl shadow-md hover:bg-(--brand-blue-deep) transition-all text-sm cursor-pointer">
                  {loading ? 'Saving Changes...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
