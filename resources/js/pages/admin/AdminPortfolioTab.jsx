import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Save, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function AdminPortfolioTab() {
  const [settings, setSettings] = useState({});
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState(null);

  // Modal State for Items
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    type: 'project',
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    primary_link: '',
    secondary_link: '',
    sort_order: 0,
    is_active: true,
    metadata_json: '{}' // Stored as string for editing
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, itemsRes] = await Promise.all([
        axios.get('/api/admin/portfolio/settings'),
        axios.get('/api/admin/portfolio/items')
      ]);
      setSettings(settingsRes.data.data || {});
      setItems(itemsRes.data.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load portfolio data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setMessage(null);
    try {
      await axios.post('/api/admin/portfolio/settings', { settings });
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Items Management
  const openNewItemModal = () => {
    setEditingItem(null);
    setItemForm({
      type: 'project', title: '', subtitle: '', description: '', image_url: '',
      primary_link: '', secondary_link: '', sort_order: 0, is_active: true, metadata_json: '{\n  \n}'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setItemForm({
      ...item,
      metadata_json: item.metadata ? JSON.stringify(item.metadata, null, 2) : '{\n  \n}'
    });
    setIsModalOpen(true);
  };

  const handleItemFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setItemForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveItem = async (e) => {
    e.preventDefault();
    setMessage(null);
    
    // Parse metadata JSON
    let parsedMetadata = null;
    try {
      parsedMetadata = JSON.parse(itemForm.metadata_json);
    } catch (err) {
      alert("Invalid JSON format in Metadata field.");
      return;
    }

    const payload = { ...itemForm, metadata: parsedMetadata };
    delete payload.metadata_json;

    try {
      if (editingItem) {
        await axios.put(`/api/admin/portfolio/items/${editingItem.id}`, payload);
      } else {
        await axios.post('/api/admin/portfolio/items', payload);
      }
      setIsModalOpen(false);
      fetchData();
      setMessage({ type: 'success', text: 'Item saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert('Failed to save item. Check the inputs.');
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`/api/admin/portfolio/items/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  if (loading) return <div className="text-white text-center py-10">Loading Portfolio CMS...</div>;

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-semibold text-sm">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Settings */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 bg-navy-800/80 border border-white/10 shadow-sm">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-amber-400" />
              Global Settings
            </h3>
            <form onSubmit={saveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input type="text" name="full_name" value={settings.full_name || ''} onChange={handleSettingsChange} className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Profession / Title</label>
                <input type="text" name="profession" value={settings.profession || ''} onChange={handleSettingsChange} className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Hero Tagline</label>
                <input type="text" name="hero_tagline" value={settings.hero_tagline || ''} onChange={handleSettingsChange} className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">About Me</label>
                <textarea name="about_me" value={settings.about_me || ''} onChange={handleSettingsChange} rows="4" className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">CV Link (PDF URL)</label>
                <input type="text" name="cv_link" value={settings.cv_link || ''} onChange={handleSettingsChange} className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">GitHub URL</label>
                <input type="text" name="github_url" value={settings.github_url || ''} onChange={handleSettingsChange} className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <Button type="submit" variant="primary" disabled={savingSettings} className="w-full justify-center">
                <Save className="w-4 h-4 mr-2" /> {savingSettings ? 'Saving...' : 'Save Settings'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-navy-800/80 border border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Portfolio Items (Projects, Skills, etc.)
              </h3>
              <Button onClick={openNewItemModal} size="sm" variant="primary">Add New Item</Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-navy-900/50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-4 py-3 font-mono text-slate-400">{item.sort_order}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-navy-700 rounded-md text-[10px] font-bold uppercase">{item.type}</span></td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{item.title}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${item.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {item.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEditModal(item)} className="p-1.5 text-slate-400 hover:text-amber-400 transition"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 text-slate-400 hover:text-rose-400 transition ml-1"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-6 text-center text-slate-500 italic">No items created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-navy-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-navy-800/50">
              <h3 className="font-bold text-white">{editingItem ? 'Edit Item' : 'New Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto min-h-0">
              <form id="item-form" onSubmit={saveItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Type (e.g., project, skill)</label>
                    <input type="text" name="type" value={itemForm.type} onChange={handleItemFormChange} required className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Sort Order</label>
                    <input type="number" name="sort_order" value={itemForm.sort_order} onChange={handleItemFormChange} required className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Title</label>
                  <input type="text" name="title" value={itemForm.title} onChange={handleItemFormChange} required className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Subtitle</label>
                  <input type="text" name="subtitle" value={itemForm.subtitle || ''} onChange={handleItemFormChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                  <textarea name="description" value={itemForm.description || ''} onChange={handleItemFormChange} rows="3" className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Image URL</label>
                  <input type="text" name="image_url" value={itemForm.image_url || ''} onChange={handleItemFormChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Primary Link (Live Demo)</label>
                    <input type="text" name="primary_link" value={itemForm.primary_link || ''} onChange={handleItemFormChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Secondary Link (GitHub)</label>
                    <input type="text" name="secondary_link" value={itemForm.secondary_link || ''} onChange={handleItemFormChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-400 mb-1 flex items-center justify-between">
                    <span>Metadata (Flexible JSON Data)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Must be valid JSON formatting!</span>
                  </label>
                  <textarea name="metadata_json" value={itemForm.metadata_json} onChange={handleItemFormChange} rows="4" className="w-full font-mono bg-navy-950 border border-amber-500/20 rounded-lg px-3 py-2 text-amber-400 text-xs focus:border-amber-500 focus:outline-none"></textarea>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="is_active" name="is_active" checked={itemForm.is_active} onChange={handleItemFormChange} className="w-4 h-4 rounded border-white/10 bg-navy-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-navy-900" />
                  <label htmlFor="is_active" className="text-sm text-slate-300 font-semibold cursor-pointer">Active / Visible on site</label>
                </div>
              </form>
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-slate-800 bg-navy-800/50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition">Cancel</button>
              <Button type="submit" form="item-form" variant="primary">
                {editingItem ? 'Save Changes' : 'Create Item'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
