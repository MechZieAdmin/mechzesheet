import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { formatTime, formatHours, getStatusColor, getStatusLabel } from '../../lib/utils';
import { CalendarCheck, Search, Filter, Edit2, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface GridRecord {
 employeeId: number;
 employeeCode: string;
 fullName: string;
 department: string;
 designation: string;
 status: string;
 clockIn: string | null;
 clockOut: string | null;
 hoursWorked: number | null;
}

interface AttendanceRecord {
 id: number;
 employeeId: number;
 employeeCode: string;
 employeeName: string;
 department: string;
 date: string;
 clockIn: string | null;
 clockOut: string | null;
 status: string;
 hoursWorked: number | null;
 isManualEdit: boolean;
 editReason: string | null;
}

export default function AdminAttendance() {
 const [view, setView] = useState<'grid' | 'history'>('grid');
 const [gridData, setGridData] = useState<GridRecord[]>([]);
 const [historyData, setHistoryData] = useState<AttendanceRecord[]>([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [dateFilter, setDateFilter] = useState('');
 const [statusFilter, setStatusFilter] = useState('');
 const [editModal, setEditModal] = useState<AttendanceRecord | null>(null);

 const fetchGrid = async () => {
 try {
 const res = await api.get('/attendance/live-grid');
 setGridData(res.data);
 } catch { toast.error('Failed to load attendance grid'); }
 setLoading(false);
 };

 const fetchHistory = async () => {
 try {
 const params = new URLSearchParams();
 if (dateFilter) params.set('date', dateFilter);
 if (statusFilter) params.set('status', statusFilter);
 const res = await api.get(`/attendance?${params}`);
 setHistoryData(res.data.data);
 } catch { toast.error('Failed to load attendance history'); }
 setLoading(false);
 };

 useEffect(() => {
 if (view === 'grid') fetchGrid();
 else fetchHistory();
 }, [view, dateFilter, statusFilter]);

 const filteredGrid = gridData.filter(r =>
 r.fullName.toLowerCase().includes(search.toLowerCase()) ||
 r.employeeCode.toLowerCase().includes(search.toLowerCase())
 );

 const statusCounts = gridData.reduce((acc, r) => {
 acc[r.status] = (acc[r.status] || 0) + 1;
 return acc;
 }, {} as Record<string, number>);

 if (loading) {
 return (
 <div className="space-y-6">
 <div className="skeleton h-8 w-48" />
 <div className="grid grid-cols-4 gap-4">
 {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
 </div>
 <div className="card"><div className="skeleton h-64" /></div>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-white">Attendance</h1>
 <p className="text-gpt-muted mt-1">Monitor and manage employee attendance</p>
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => { setView('grid'); setLoading(true); }}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
 view === 'grid' ? 'bg-gpt-accent text-white' : 'bg-gpt-panel text-gpt-muted border border-gpt-accent hover:bg-gpt-accent'
 }`}
 >
 Live Grid
 </button>
 <button
 onClick={() => { setView('history'); setLoading(true); }}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
 view === 'history' ? 'bg-gpt-accent text-white' : 'bg-gpt-panel text-gpt-muted border border-gpt-accent hover:bg-gpt-accent'
 }`}
 >
 History
 </button>
 </div>
 </div>

 {view === 'grid' && (
 <>
 {/* Status summary cards */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {[
 { label: 'Present', count: statusCounts['present'] || 0, color: 'text-emerald-600 bg-emerald-50' },
 { label: 'Late', count: statusCounts['late'] || 0, color: 'text-amber-600 bg-amber-50' },
 { label: 'Absent', count: (gridData.length - Object.values(statusCounts).reduce((a, b) => a + b, 0)) + (statusCounts['absent'] || 0), color: 'text-red-600 bg-red-50' },
 { label: 'On Leave', count: statusCounts['leave'] || 0, color: 'text-blue-600 bg-blue-50' },
 ].map((s) => (
 <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
 <div className="text-2xl font-bold">{s.count}</div>
 <div className="text-sm font-medium mt-0.5">{s.label}</div>
 </div>
 ))}
 </div>

 {/* Live Grid */}
 <div className="card p-0 overflow-hidden">
 <div className="p-4 border-b border-gpt-accent flex items-center gap-3">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gpt-muted" />
 <input
 type="text" placeholder="Search employees..."
 value={search} onChange={(e) => setSearch(e.target.value)}
 className="input-field pl-9"
 />
 </div>
 <button onClick={() => { setLoading(true); fetchGrid(); }} className="btn-secondary">
 <RefreshCw className="w-4 h-4" /> Refresh
 </button>
 </div>
 <div className="overflow-x-auto">
 <table className="data-table">
 <thead>
 <tr>
 <th>Employee</th>
 <th>Department</th>
 <th>Status</th>
 <th>Clock In</th>
 <th>Clock Out</th>
 <th>Hours</th>
 </tr>
 </thead>
 <tbody>
 {filteredGrid.map((r) => (
 <tr key={r.employeeId}>
 <td>
 <div>
 <p className="font-medium text-white">{r.fullName}</p>
 <p className="text-xs text-gpt-muted font-mono">{r.employeeCode}</p>
 </div>
 </td>
 <td className="text-gpt-muted">{r.department}</td>
 <td><span className={getStatusColor(r.status)}>{getStatusLabel(r.status)}</span></td>
 <td className="text-gpt-muted">{formatTime(r.clockIn)}</td>
 <td className="text-gpt-muted">{formatTime(r.clockOut)}</td>
 <td className="text-gpt-muted">{formatHours(r.hoursWorked)}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </>
 )}

 {view === 'history' && (
 <div className="card p-0 overflow-hidden">
 <div className="p-4 border-b border-gpt-accent flex flex-wrap items-center gap-3">
 <input
 type="date" value={dateFilter}
 onChange={(e) => setDateFilter(e.target.value)}
 className="input-field w-auto"
 />
 <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
 className="input-field w-auto min-w-[140px]">
 <option value="">All Status</option>
 <option value="present">Present</option>
 <option value="late">Late</option>
 <option value="absent">Absent</option>
 <option value="leave">Leave</option>
 <option value="half_day">Half Day</option>
 </select>
 </div>
 <div className="overflow-x-auto">
 <table className="data-table">
 <thead>
 <tr>
 <th>Employee</th>
 <th>Date</th>
 <th>Status</th>
 <th>Clock In</th>
 <th>Clock Out</th>
 <th>Hours</th>
 <th>Edited</th>
 <th className="text-right">Action</th>
 </tr>
 </thead>
 <tbody>
 {historyData.map((r) => (
 <tr key={r.id}>
 <td>
 <p className="font-medium text-white">{r.employeeName}</p>
 <p className="text-xs text-gpt-muted font-mono">{r.employeeCode}</p>
 </td>
 <td className="text-gpt-muted">{new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
 <td><span className={getStatusColor(r.status)}>{getStatusLabel(r.status)}</span></td>
 <td className="text-gpt-muted">{formatTime(r.clockIn)}</td>
 <td className="text-gpt-muted">{formatTime(r.clockOut)}</td>
 <td className="text-gpt-muted">{formatHours(r.hoursWorked)}</td>
 <td>
 {r.isManualEdit && (
 <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Edited</span>
 )}
 </td>
 <td className="text-right">
 <button
 onClick={() => setEditModal(r)}
 className="p-1.5 hover:bg-gpt-accent rounded-lg transition-colors text-gpt-muted hover:text-gpt-muted"
 title="Edit attendance"
 >
 <Edit2 className="w-4 h-4" />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* Edit Modal */}
 {editModal && (
 <AttendanceEditModal
 record={editModal}
 onClose={() => setEditModal(null)}
 onSuccess={() => { setEditModal(null); fetchHistory(); }}
 />
 )}
 </div>
 );
}

function AttendanceEditModal({
 record,
 onClose,
 onSuccess,
}: {
 record: AttendanceRecord;
 onClose: () => void;
 onSuccess: () => void;
}) {
 const [status, setStatus] = useState(record.status);
 const [clockIn, setClockIn] = useState(record.clockIn || '');
 const [clockOut, setClockOut] = useState(record.clockOut || '');
 const [editReason, setEditReason] = useState('');
 const [submitting, setSubmitting] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!editReason.trim()) {
 toast.error('Edit reason is required');
 return;
 }
 setSubmitting(true);
 try {
 await api.put(`/attendance/${record.id}`, { status, clockIn: clockIn || undefined, clockOut: clockOut || undefined, editReason });
 toast.success('Attendance record updated');
 onSuccess();
 } catch (err: any) {
 toast.error(err.response?.data?.error || 'Failed to update');
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
 <div className="bg-gpt-panel rounded-xl p-6 max-w-md w-full shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-lg font-semibold">Edit Attendance</h3>
 <button onClick={onClose} className="p-1 hover:bg-gpt-accent rounded-lg"><X className="w-5 h-5" /></button>
 </div>
 <p className="text-sm text-gpt-muted mb-4">{record.employeeName} — {record.date}</p>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="label">Status</label>
 <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field">
 <option value="present">Present</option>
 <option value="absent">Absent</option>
 <option value="late">Late</option>
 <option value="half_day">Half Day</option>
 <option value="leave">Leave</option>
 </select>
 </div>
 <div>
 <label className="label">Reason for Edit *</label>
 <textarea
 value={editReason} onChange={(e) => setEditReason(e.target.value)}
 placeholder="Explain why this attendance record is being corrected..."
 className="input-field h-20 resize-none"
 required
 />
 </div>
 <div className="flex gap-3 justify-end pt-2">
 <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
 <button type="submit" disabled={submitting} className="btn-primary">
 {submitting ? 'Saving...' : 'Save Changes'}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
