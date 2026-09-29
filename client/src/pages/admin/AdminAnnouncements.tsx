import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Megaphone, Plus, Image as ImageIcon, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface Announcement {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/admin/announcements');
      setAnnouncements(res.data);
    } catch {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ title: '', description: '', imageUrl: '', isActive: true });
    setShowModal(true);
  };

  const openEditModal = (a: Announcement) => {
    setEditingId(a.id);
    setForm({ 
      title: a.title, 
      description: a.description, 
      imageUrl: a.imageUrl || '', 
      isActive: a.isActive 
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      toast.error('Title and description are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form, imageUrl: form.imageUrl || null };
      if (editingId) {
        await api.put(`/admin/announcements/${editingId}`, payload);
        toast.success('Announcement updated');
      } else {
        await api.post('/admin/announcements', payload);
        toast.success('Announcement created');
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await api.delete(`/admin/announcements/${id}`);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch {
      toast.error('Failed to delete announcement');
    }
  };

  const toggleActive = async (a: Announcement) => {
    try {
      await api.put(`/admin/announcements/${a.id}`, { isActive: !a.isActive });
      toast.success(`Announcement ${!a.isActive ? 'activated' : 'deactivated'}`);
      fetchAnnouncements();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Announcements</h1>
          <p className="text-gpt-muted mt-1">Manage broadcast banners and portal notifications</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {loading ? (
        <div className="card"><div className="skeleton h-64 w-full" /></div>
      ) : announcements.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-gpt-panel rounded-full flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-gpt-muted" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Announcements</h3>
          <p className="text-gpt-muted mb-6 max-w-sm mx-auto">Create an announcement to broadcast important information to all employees.</p>
          <button onClick={openCreateModal} className="btn-secondary">Create First Announcement</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {announcements.map((a) => (
            <div key={a.id} className={`card p-0 overflow-hidden flex flex-col transition-all ${!a.isActive ? 'opacity-75 grayscale-[0.5]' : ''}`}>
              {/* Image Preview */}
              {a.imageUrl ? (
                <div className="h-40 w-full bg-gpt-panel relative">
                  <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3">
                    <span className={`status-badge shadow-sm ${a.isActive ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-40 w-full bg-slate-800 flex items-center justify-center relative">
                  <Megaphone className="w-10 h-10 text-slate-600" />
                  <div className="absolute top-3 right-3">
                    <span className={`status-badge shadow-sm ${a.isActive ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{a.title}</h3>
                <p className="text-sm text-gpt-muted mb-4 line-clamp-2 flex-1">{a.description}</p>
                <div className="text-xs text-gpt-muted mb-4 font-medium">Created: {formatDate(a.createdAt)}</div>
                
                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={a.isActive}
                        onChange={() => toggleActive(a)}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${a.isActive ? 'bg-[#0F172A]' : 'bg-gray-200'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-gpt-panel w-4 h-4 rounded-full transition-transform ${a.isActive ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className="text-xs font-semibold text-gpt-muted uppercase tracking-wider">{a.isActive ? 'Live' : 'Hidden'}</span>
                  </label>
                  
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditModal(a)} className="p-2 text-gpt-muted hover:text-[#0F172A] hover:bg-gpt-accent rounded-lg transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(a.id)} className="p-2 text-gpt-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-gpt-panel rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-6">
              {editingId ? 'Edit Announcement' : 'Create Announcement'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Title *</label>
                <input 
                  type="text" 
                  value={form.title} 
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Townhall Meeting" 
                  className="input-field font-medium" 
                  required 
                />
              </div>
              
              <div>
                <label className="label">Description *</label>
                <textarea 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Details about the announcement..." 
                  className="input-field h-28 resize-none py-3" 
                  required 
                />
              </div>
              
              <div>
                <label className="label flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Image URL (Optional)
                </label>
                <input 
                  type="url" 
                  value={form.imageUrl} 
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg" 
                  className="input-field" 
                />
                <p className="text-xs text-gpt-muted mt-1.5">For best results, use a 16:9 landscape image.</p>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gpt-panel rounded-xl border border-[#E2E8F0]">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={form.isActive} 
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gpt-accent text-[#0F172A] focus:ring-[#0F172A]" 
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-gpt-muted cursor-pointer">
                  Publish immediately (Active)
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[#E2E8F0]">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : 'Save Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
