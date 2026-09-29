import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { User, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function EmployeeProfile() {
 const [profile, setProfile] = useState<any>(null);
 const [form, setForm] = useState({ phone: '', address: '', emergencyContact: '' });
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);

 useEffect(() => {
 const fetch = async () => {
 try {
 const res = await api.get('/employees/me/profile');
 setProfile(res.data);
 setForm({ phone: res.data.phone || '', address: res.data.address || '', emergencyContact: res.data.emergencyContact || '' });
 } catch { toast.error('Failed to load profile'); }
 setLoading(false);
 };
 fetch();
 }, []);

 const handleSave = async () => {
 setSaving(true);
 try {
 await api.put('/employees/me/profile', form);
 toast.success('Profile updated');
 } catch { toast.error('Failed to update'); }
 setSaving(false);
 };

 if (loading) return <div className="max-w-2xl space-y-4"><div className="skeleton h-8 w-48" /><div className="skeleton h-64 rounded-xl" /></div>;

 return (
 <div className="max-w-2xl space-y-6">
 <div>
 <h1 className="text-2xl font-bold text-white">My Profile</h1>
 <p className="text-gpt-muted mt-1">View and update your personal information</p>
 </div>

 {/* Read-only info */}
 <div className="card">
 <h3 className="text-sm font-semibold text-gpt-muted uppercase tracking-wider mb-4">Employment Details</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {[
 { label: 'Full Name', value: profile?.fullName },
 { label: 'Employee Code', value: profile?.employeeCode },
 { label: 'Email', value: profile?.email },
 { label: 'Department', value: profile?.department },
 { label: 'Designation', value: profile?.designation },
 { label: 'Date of Joining', value: profile?.dateOfJoining },
 { label: 'Shift', value:`${profile?.shiftStart} — ${profile?.shiftEnd}` },
 { label: 'Status', value: profile?.employmentStatus },
 ].map(f => (
 <div key={f.label}>
 <p className="text-xs text-gpt-muted mb-0.5">{f.label}</p>
 <p className="text-sm font-medium text-white capitalize">{f.value || '—'}</p>
 </div>
 ))}
 </div>
 </div>

 {/* Editable fields */}
 <div className="card">
 <h3 className="text-sm font-semibold text-gpt-muted uppercase tracking-wider mb-4">Personal Information</h3>
 <div className="space-y-4">
 <div>
 <label className="label">Phone Number</label>
 <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
 placeholder="+91-9876543210" className="input-field" />
 </div>
 <div>
 <label className="label">Address</label>
 <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
 placeholder="Your address" className="input-field h-20 resize-none" />
 </div>
 <div>
 <label className="label">Emergency Contact</label>
 <input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
 placeholder="Name — Phone" className="input-field" />
 </div>
 <div className="flex justify-end pt-2">
 <button onClick={handleSave} disabled={saving} className="btn-primary">
 <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
