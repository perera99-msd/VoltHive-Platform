'use client';
import { useState } from 'react';
import { apiUrl } from '../../lib/api';

interface AddChargerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CHARGER_TYPES = [
  { id: 'type2-ac', name: 'Type 2 (AC)', icon: '⚡' },
  { id: 'ccs2-dc', name: 'CCS2 (DC Fast)', icon: '⚡⚡' },
  { id: 'chademo', name: 'CHAdeMO', icon: '⚡' },
  { id: 'gb-t', name: 'GB/T', icon: '⚡' },
];

const POWER_LEVELS = ['7 kW', '11 kW', '22 kW', '50 kW', '150 kW', '350 kW'];

export default function AddChargerForm({ onSuccess, onCancel }: AddChargerFormProps) {
  const [formData, setFormData] = useState({
    stationName: '',
    address: '',
    latitude: '',
    longitude: '',
    chargerTypes: [] as string[],
    powerLevel: '22 kW',
    pricePerKWh: '',
    contactNumber: '',
    enableBooking: true,
    images: [] as File[],
  });

  type Step = 'basic' | 'location' | 'chargers' | 'review';
  const [step, setStep] = useState<Step>('basic');
  const [mapOpen, setMapOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleCharger = (chargerId: string) => {
    setFormData(prev => ({
      ...prev,
      chargerTypes: prev.chargerTypes.includes(chargerId)
        ? prev.chargerTypes.filter(c => c !== chargerId)
        : [...prev.chargerTypes, chargerId],
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (formData.images.length + files.length > 2) {
      alert('Maximum 2 images allowed');
      return;
    }
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create FormData for multipart upload (images)
      const submitData = new FormData();
      submitData.append('stationName', formData.stationName);
      submitData.append('address', formData.address);
      submitData.append('latitude', formData.latitude);
      submitData.append('longitude', formData.longitude);
      submitData.append('chargerTypes', JSON.stringify(formData.chargerTypes));
      submitData.append('powerLevel', formData.powerLevel);
      submitData.append('pricePerKWh', formData.pricePerKWh);
      submitData.append('contactNumber', formData.contactNumber);
      submitData.append('enableBooking', String(formData.enableBooking));

      formData.images.forEach(img => {
        submitData.append('images', img);
      });

      const res = await fetch(apiUrl('/api/stations'), {
        method: 'POST',
        body: submitData,
      });

      if (res.ok) {
        alert('Station created successfully!');
        onSuccess();
      } else {
        alert('Failed to create station');
      }
    } catch (error) {
      console.error('Error creating station:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={onCancel}
          className="w-10 h-10 rounded-lg bg-(--brand-border)/50 hover:bg-(--brand-border) flex items-center justify-center transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-(--brand-muted)"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h1 className="text-3xl font-semibold text-(--brand-ink)">Add New Station</h1>
          <p className="text-(--brand-muted) text-sm">Step {step === 'basic' ? '1' : step === 'location' ? '2' : step === 'chargers' ? '3' : '4'} of 4</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ===== BASIC INFO ===== */}
        {(step === 'basic' || step === 'review') && (
          <div className="bg-white rounded-2xl border border-(--brand-border) p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-(--brand-ink) mb-6">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-(--brand-ink) mb-2">Station Name</label>
                  <input 
                    type="text"
                    name="stationName"
                    value={formData.stationName}
                    onChange={handleInputChange}
                    placeholder="e.g. Colombo Fast Hub"
                    className="w-full px-4 py-3 border border-(--brand-border) rounded-lg focus:border-(--accent-blue) focus:ring-1 focus:ring-(--accent-blue) outline-none transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-(--brand-ink) mb-2">Address</label>
                  <input 
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Full physical address"
                    className="w-full px-4 py-3 border border-(--brand-border) rounded-lg focus:border-(--accent-blue) focus:ring-1 focus:ring-(--accent-blue) outline-none transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-(--brand-ink) mb-2">Contact Number</label>
                  <input 
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="+94 XX XXX XXXX"
                    className="w-full px-4 py-3 border border-(--brand-border) rounded-lg focus:border-(--accent-blue) focus:ring-1 focus:ring-(--accent-blue) outline-none transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-(--brand-ink) mb-2">Price per kWh</label>
                  <input 
                    type="number"
                    name="pricePerKWh"
                    value={formData.pricePerKWh}
                    onChange={handleInputChange}
                    placeholder="150.00"
                    step="0.01"
                    className="w-full px-4 py-3 border border-(--brand-border) rounded-lg focus:border-(--accent-blue) focus:ring-1 focus:ring-(--accent-blue) outline-none transition-all text-sm"
                    required
                  />
                </div>

                <label className="flex items-center justify-between p-4 border border-(--brand-border) rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-(--brand-ink)">Enable Reservations</p>
                    <p className="text-xs text-(--brand-muted)">Allow drivers to pre-book slots</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={formData.enableBooking}
                    onChange={(e) => setFormData(prev => ({ ...prev, enableBooking: e.target.checked }))}
                    className="w-5 h-5 accent-(--brand-blue) cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ===== LOCATION ===== */}
        {(step === 'location' || step === 'review') && (
          <div className="bg-white rounded-2xl border border-(--brand-border) p-8 space-y-6">
            <h2 className="text-xl font-semibold text-(--brand-ink)">Location</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-(--brand-ink) mb-2">Latitude</label>
                <input 
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="6.9271"
                  step="0.00001"
                  className="w-full px-4 py-3 border border-(--brand-border) rounded-lg focus:border-(--accent-blue) focus:ring-1 focus:ring-(--accent-blue) outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-(--brand-ink) mb-2">Longitude</label>
                <input 
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="80.7789"
                  step="0.00001"
                  className="w-full px-4 py-3 border border-(--brand-border) rounded-lg focus:border-(--accent-blue) focus:ring-1 focus:ring-(--accent-blue) outline-none transition-all text-sm"
                />
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setMapOpen(!mapOpen)}
              className="w-full py-3 bg-(--accent-blue)/10 text-(--brand-blue) rounded-lg font-semibold hover:bg-(--accent-blue)/20 transition-colors"
            >
              {mapOpen ? 'Hide Map' : 'Pick on Map'}
            </button>

            {mapOpen && (
              <div className="bg-(--background) rounded-lg p-4 h-64 flex items-center justify-center border-2 border-dashed border-(--brand-border)">
                <p className="text-(--brand-muted) text-center">
                  Map integration coming soon.<br/>
                  <span className="text-xs">Use coordinates above or manual entry</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* ===== CHARGER TYPES ===== */}
        {(step === 'chargers' || step === 'review') && (
          <div className="bg-white rounded-2xl border border-(--brand-border) p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-(--brand-ink) mb-2">Charger Configuration</h2>
              <p className="text-(--brand-muted) text-sm mb-6">Select installed connector types</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {CHARGER_TYPES.map(type => (
                  <button 
                    key={type.id}
                    type="button"
                    onClick={() => toggleCharger(type.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      formData.chargerTypes.includes(type.id)
                        ? 'border-(--brand-blue) bg-(--brand-blue)/10'
                        : 'border-(--brand-border) hover:border-(--accent-blue)'
                    }`}
                  >
                    <p className="text-2xl mb-2">{type.icon}</p>
                    <p className="text-[11px] font-bold text-(--brand-ink)">{type.name}</p>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-semibold text-(--brand-ink) mb-2">Default Power Level</label>
                <select 
                  name="powerLevel"
                  value={formData.powerLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-(--brand-border) rounded-lg focus:border-(--accent-blue) focus:ring-1 focus:ring-(--accent-blue) outline-none transition-all text-sm bg-white"
                >
                  {POWER_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ===== IMAGES ===== */}
        {(step === 'review') && (
          <div className="bg-white rounded-2xl border border-(--brand-border) p-8 space-y-6">
            <h2 className="text-xl font-semibold text-(--brand-ink)">Station Images (Max 2)</h2>
            
            <div className="flex gap-4">
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img src={URL.createObjectURL(img)} alt={`Upload ${idx + 1}`} width={96} height={96} className="w-24 h-24 rounded-lg object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-(--ui-error) text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              {formData.images.length < 2 && (
                <label className="w-24 h-24 rounded-lg border-2 border-dashed border-(--brand-border) flex items-center justify-center cursor-pointer hover:border-(--accent-blue) hover:bg-(--accent-blue)/5 transition-all">
                  <input 
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="text-center">
                    <p className="text-2xl mb-1">📸</p>
                    <p className="text-[10px] text-(--brand-muted) font-bold">Add Image</p>
                  </div>
                </label>
              )}
            </div>
          </div>
        )}

        {/* ===== REVIEW ===== */}
        {step === 'review' && (
          <div className="bg-(--accent-green)/10 border border-(--accent-green)/30 rounded-2xl p-6">
            <p className="text-(--brand-green) font-semibold text-sm mb-3">✓ Ready to Deploy</p>
            <div className="space-y-2 text-sm">
              <p><strong>Station:</strong> {formData.stationName}</p>
              <p><strong>Location:</strong> {formData.address}</p>
              <p><strong>Chargers:</strong> {formData.chargerTypes.length} types selected</p>
              <p><strong>Price:</strong> {formData.pricePerKWh} LKR/kWh</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {step !== 'basic' && (
            <button 
              type="button"
              onClick={() => {
                const steps: Step[] = ['basic', 'location', 'chargers', 'review'];
                const currentIdx = steps.indexOf(step);
                if (currentIdx > 0) setStep(steps[currentIdx - 1]);
              }}
              className="flex-1 px-6 py-3 bg-(--brand-border)/50 hover:bg-(--brand-border) text-(--brand-ink) font-semibold rounded-lg transition-colors"
            >
              Back
            </button>
          )}
          
          {step !== 'review' && (
            <button 
              type="button"
              onClick={() => {
                const steps: Step[] = ['basic', 'location', 'chargers', 'review'];
                const currentIdx = steps.indexOf(step);
                if (currentIdx < steps.length - 1) setStep(steps[currentIdx + 1]);
              }}
              className="flex-1 px-6 py-3 bg-(--brand-blue) text-white font-semibold rounded-lg hover:bg-(--brand-blue-deep) transition-colors"
            >
              Next
            </button>
          )}

          {step === 'review' && (
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-(--ui-success) text-white font-semibold rounded-lg hover:bg-(--brand-green-deep) disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Deploy Station'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
