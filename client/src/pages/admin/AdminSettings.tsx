import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Settings, Plus, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Holiday {
 id: number;
 date: string;
 name: string;
}

export default function AdminSettings() {
 const [settings, setSettings] = useState<Record<string, string>>({});
 const [holidays, setHolidays] = useState<Holiday[]>([]);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });

 useEffect(() => {
 const fetch = async () => {
 try {
 const [sRes, hRes] = await Promise.all([
 api.get('/settings'),
 api.get('/settings/holidays'),
 ]);
 setSettings(sRes.data);
 setHolidays(hRes.data);
 } catch { toast.error('Failed to load settings'); }
 setLoading(false);
 };
 fetch();
 }, []);

 const handleSave = async () => {
 setSaving(true);
 try {
 await api.put('/settings', settings);
 toast.success('Settings saved');
 } catch { toast.error('Failed to save'); }
 setSaving(false);
 };

 const handleAddHoliday = async () => {
 if (!newHoliday.date || !newHoliday.name) { toast.error('Date and name required'); return; }
 try {
 const res = await api.post('/settings/holidays', newHoliday);
 setHolidays([...holidays, res.data]);
 setNewHoliday({ date: '', name: '' });
 toast.success('Holiday added');
 } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
 };

 const handleDeleteHoliday = async (id: number) => {
 try {
 await api.delete(`/settings/holidays/${id}`);
 setHolidays(holidays.filter(h => h.id !== id));
 toast.success('Holiday removed');
 } catch { toast.error('Failed'); }
 };

 if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}</div>;

 return (
 <div className="space-y-6 max-w-4xl">
 <div>
 <h1 className="text-2xl font-bold text-white">Settings</h1>
 <p className="text-gpt-muted mt-1">Configure attendance system parameters</p>
 </div>

 {/* Work Settings */}
 <div className="card">
 <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
 <Settings className="w-5 h-5 text-white" /> Work Configuration
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="label">Default Shift Start</label>
 <input type="time" value={settings.shift_start || '09:00'}
 onChange={(e) => setSettings({ ...settings, shift_start: e.target.value })}
 className="input-field" />
 </div>
 <div>
 <label className="label">Default Shift End</label>
 <input type="time" value={settings.shift_end || '18:00'}
 onChange={(e) => setSettings({ ...settings, shift_end: e.target.value })}
 className="input-field" />
 </div>
 <div>
 <label className="label">Work Hours per Day</label>
 <input type="number" value={settings.work_hours || '9'}
 onChange={(e) => setSettings({ ...settings, work_hours: e.target.value })}
 className="input-field" />
 </div>
 <div>
 <label className="label">Grace Period (minutes)</label>
 <input type="number" value={settings.grace_period_minutes || '15'}
 onChange={(e) => setSettings({ ...settings, grace_period_minutes: e.target.value })}
 className="input-field" />
 </div>
 <div>
 <label className="label">Weekly Offs</label>
 <input type="text" value={settings.weekly_offs || 'saturday,sunday'}
 onChange={(e) => setSettings({ ...settings, weekly_offs: e.target.value })}
 placeholder="saturday,sunday" className="input-field" />
 </div>
 <div>
 <label className="label">Geolocation Required</label>
 <select value={settings.geo_required || 'false'}
 onChange={(e) => setSettings({ ...settings, geo_required: e.target.value })}
 className="input-field">
 <option value="false">No</option>
 <option value="true">Yes</option>
 </select>
 </div>
 </div>
 <div className="mt-6 flex justify-end">
 <button onClick={handleSave} disabled={saving} className="btn-primary">
 {saving ? 'Saving...' : 'Save Settings'}
 </button>
 </div>
 </div>

 {/* Holiday Calendar */}
 <div className="card">
 <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
 <Calendar className="w-5 h-5 text-white" /> Holiday Calendar
 </h3>

 <div className="flex gap-3 mb-4">
 <input type="date" value={newHoliday.date}
 onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
 className="input-field w-auto" />
 <input type="text" value={newHoliday.name}
 onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
 placeholder="Holiday name" className="input-field flex-1" />
 <button onClick={handleAddHoliday} className="btn-primary shrink-0">
 <Plus className="w-4 h-4" /> Add
 </button>
 </div>

 <div className="space-y-2">
 {holidays.map((h) => (
 <div key={h.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg">
 <div className="flex items-center gap-4">
 <span className="text-sm font-mono text-gpt-muted">{h.date}</span>
 <span className="text-sm font-medium text-white">{h.name}</span>
 </div>
 <button onClick={() => handleDeleteHoliday(h.id)}
 className="p-1.5 text-gpt-muted hover:text-red-500 hover:bg-red-50 :bg-red-900/30 rounded-lg transition-colors">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 ))}
 {holidays.length === 0 && (
 <p className="text-center py-6 text-gpt-muted text-sm">No holidays configured</p>
 )}
 </div>
 </div>
 </div>
 );
}
