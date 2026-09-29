import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';
import { ClipboardList, Plus, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface LeaveType { id: number; name: string; }
interface LeaveBalance { leaveTypeName: string; totalAllotted: number; used: number; remaining: number; }
interface LeaveRequest { id: number; leaveTypeName: string; startDate: string; endDate: string; reason: string; status: string; reviewerComment: string | null; createdAt: string; }

export default function EmployeeLeaves() {
 const [types, setTypes] = useState<LeaveType[]>([]);
 const [balances, setBalances] = useState<LeaveBalance[]>([]);
 const [requests, setRequests] = useState<LeaveRequest[]>([]);
 const [loading, setLoading] = useState(true);
 const [showApply, setShowApply] = useState(false);
 const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
 const [submitting, setSubmitting] = useState(false);

 const fetchData = async () => {
 try {
 const [tRes, bRes, rRes] = await Promise.all([
 api.get('/leaves/types'),
 api.get('/leaves/my-balance'),
 api.get('/leaves/my-requests'),
 ]);
 setTypes(tRes.data);
 setBalances(bRes.data);
 setRequests(rRes.data);
 } catch { toast.error('Failed to load leave data'); }
 setLoading(false);
 };

 useEffect(() => { fetchData(); }, []);

 const handleApply = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!form.leaveTypeId || !form.startDate || !form.endDate || !form.reason) {
 toast.error('All fields are required');
 return;
 }
 setSubmitting(true);
 try {
 await api.post('/leaves/apply', { ...form, leaveTypeId: parseInt(form.leaveTypeId) });
 toast.success('Leave request submitted');
 setShowApply(false);
 setForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
 fetchData();
 } catch (err: any) {
 toast.error(err.response?.data?.error || 'Failed to apply');
 } finally { setSubmitting(false); }
 };

 if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>;

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-white">Leave Management</h1>
 <p className="text-gpt-muted mt-1">Apply for leave and track your balance</p>
 </div>
 <button onClick={() => setShowApply(true)} className="btn-primary">
 <Plus className="w-4 h-4" /> Apply for Leave
 </button>
 </div>

 {/* Leave Balance */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 {balances.map((b) => (
 <div key={b.leaveTypeName} className="card">
 <h4 className="text-sm font-semibold text-gpt-muted mb-2">{b.leaveTypeName}</h4>
 <div className="flex items-end gap-3">
 <span className="text-3xl font-bold text-white">{b.remaining}</span>
 <span className="text-sm text-gpt-muted mb-1">/ {b.totalAllotted} remaining</span>
 </div>
 <div className="mt-3 h-2 bg-gpt-panel rounded-full overflow-hidden">
 <div
 className="h-full bg-gray-900 text-white rounded-full transition-all duration-500"
 style={{ width:`${(b.remaining / b.totalAllotted) * 100}%` }}
 />
 </div>
 <p className="text-xs text-gpt-muted mt-1.5">{b.used} used</p>
 </div>
 ))}
 </div>

 {/* Leave Requests */}
 <div>
 <h3 className="text-lg font-semibold text-white mb-3">Request History</h3>
 {requests.length === 0 ? (
 <div className="card text-center py-12">
 <ClipboardList className="w-12 h-12 text-gpt-muted mx-auto mb-3" />
 <p className="text-gpt-muted">No leave requests yet</p>
 </div>
 ) : (
 <div className="space-y-3">
 {requests.map((r) => (
 <div key={r.id} className="card p-4">
 <div className="flex items-start justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="text-sm font-semibold text-white">{r.leaveTypeName}</span>
 <span className={getStatusColor(r.status)}>{getStatusLabel(r.status)}</span>
 </div>
 <p className="text-sm text-gpt-muted">
 {formatDate(r.startDate)} — {formatDate(r.endDate)}
 </p>
 <p className="text-sm text-gpt-muted mt-1">{r.reason}</p>
 {r.reviewerComment && (
 <p className="text-sm text-gpt-muted mt-2 flex items-start gap-1.5">
 <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
 <span className="italic">{r.reviewerComment}</span>
 </p>
 )}
 </div>
 <span className="text-xs text-gpt-muted shrink-0">{formatDate(r.createdAt)}</span>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Apply Modal */}
 {showApply && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowApply(false)}>
 <div className="bg-gpt-panel rounded-xl p-6 max-w-md w-full shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
 <h3 className="text-lg font-semibold text-white mb-4">Apply for Leave</h3>
 <form onSubmit={handleApply} className="space-y-4">
 <div>
 <label className="label">Leave Type *</label>
 <select value={form.leaveTypeId} onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
 className="input-field" required>
 <option value="">Select type</option>
 {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
 </select>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="label">Start Date *</label>
 <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
 className="input-field" required />
 </div>
 <div>
 <label className="label">End Date *</label>
 <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
 className="input-field" required />
 </div>
 </div>
 <div>
 <label className="label">Reason *</label>
 <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
 placeholder="Explain your reason..." className="input-field h-20 resize-none" required />
 </div>
 <div className="flex gap-3 justify-end pt-2">
 <button type="button" onClick={() => setShowApply(false)} className="btn-secondary">Cancel</button>
 <button type="submit" disabled={submitting} className="btn-primary">
 {submitting ? 'Submitting...' : 'Submit Request'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
