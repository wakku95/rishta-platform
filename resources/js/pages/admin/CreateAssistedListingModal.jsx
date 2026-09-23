import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Check } from 'lucide-react';
import { getProfileOptions } from '../../api/profile';

export default function CreateAssistedListingModal({ isOpen, listing = null, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: '',
    gender: '',
    date_of_birth: '',
    religion: 'Islam',
    sect: '',
    city: '',
    education: '',
    profession: '',
    marital_status: '',
    height: 165,
    public_about: '',
    family_background: '',
    managed_by: '',
    contact_number: '',
    admin_notes: '',
    listing_status: 'draft',
    consent_given: false
  });

  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProfileOptions().then(res => setOptions(res.data)).catch(() => {});
    
    if (listing) {
      setFormData({
        full_name: listing.full_name || '',
        gender: listing.gender || '',
        date_of_birth: listing.date_of_birth || '',
        religion: listing.religion || 'Islam',
        sect: listing.sect || '',
        city: listing.city || '',
        education: listing.education || '',
        profession: listing.profession || '',
        marital_status: listing.marital_status || '',
        height: listing.height || 165,
        public_about: listing.public_about || '',
        family_background: listing.family_background || '',
        managed_by: listing.managed_by || '',
        contact_number: listing.contact_number || '',
        admin_notes: listing.admin_notes || '',
        listing_status: listing.listing_status || 'draft',
        consent_given: !!listing.consent_given_at
      });
    }
  }, [listing]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (listing) {
        await axios.put(`/api/admin/listings/${listing.id}`, formData);
      } else {
        await axios.post('/api/admin/listings', formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-navy-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-navy-800/50">
          <h2 className="text-lg font-bold text-white">
            {listing ? `Edit Listing: ${listing.listing_code}` : 'Create Assisted Listing'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
              {error}
            </div>
          )}

          <form id="listing-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Private Contact Block */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                Private Admin Data (Never Public)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Number (WhatsApp/Phone)</label>
                  <input type="text" name="contact_number" required value={formData.contact_number} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Private Family Background</label>
                  <textarea name="family_background" rows="2" value={formData.family_background} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"></textarea>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Internal Notes</label>
                  <textarea name="admin_notes" rows="2" value={formData.admin_notes} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"></textarea>
                </div>
              </div>
            </div>

            {/* Public Profile Block */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Public Biodata
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
                  <select name="gender" required value={formData.gender} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none">
                    <option value="">Select...</option>
                    {options?.genders?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth</label>
                  <input type="date" name="date_of_birth" required value={formData.date_of_birth} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Marital Status</label>
                  <select name="marital_status" required value={formData.marital_status} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none">
                    <option value="">Select...</option>
                    {options?.marital_statuses?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <select name="city" required value={formData.city} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none">
                    <option value="">Select...</option>
                    {options?.cities?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Religion</label>
                  <select name="religion" required value={formData.religion} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none">
                    <option value="">Select...</option>
                    {options?.religions?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sect</label>
                  <select name="sect" value={formData.sect} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none">
                    <option value="">Select...</option>
                    {options?.sects?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Education</label>
                  <select name="education" required value={formData.education} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none">
                    <option value="">Select...</option>
                    {options?.educations?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Profession</label>
                  <select name="profession" required value={formData.profession} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none">
                    <option value="">Select...</option>
                    {options?.professions?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Height (cm)</label>
                  <input type="number" name="height" required value={formData.height} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Managed By</label>
                  <select name="managed_by" required value={formData.managed_by} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none">
                    <option value="">Select...</option>
                    {options?.managed_by?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Public About</label>
                  <textarea name="public_about" rows="3" required value={formData.public_about} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"></textarea>
                </div>
              </div>
            </div>

            {/* Status & Consent */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Status & Consent
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Listing Status</label>
                  <select name="listing_status" value={formData.listing_status} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    {listing?.listing_status === 'converted' && <option value="converted">Converted</option>}
                    {listing?.listing_status === 'unpublished' && <option value="unpublished">Unpublished</option>}
                  </select>
                </div>
                
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                  <div className="flex h-5 items-center">
                    <input
                      id="consent"
                      name="consent_given"
                      type="checkbox"
                      checked={formData.consent_given}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-white/20 bg-navy-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-navy-900"
                    />
                  </div>
                  <div className="text-sm">
                    <label htmlFor="consent" className="font-semibold text-slate-200">
                      Public Listing Consent Given
                    </label>
                    <p className="text-xs text-slate-400">Required before publishing.</p>
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-white/10 bg-navy-800/50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="listing-form"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-sm font-bold transition disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Listing'}
          </button>
        </div>
      </div>
    </div>
  );
}
