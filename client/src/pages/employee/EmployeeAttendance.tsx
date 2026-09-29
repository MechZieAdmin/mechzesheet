import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { formatTime, formatHours, formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';
import { CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';

interface AttendanceRecord {
 id: number;
 date: string;
 status: string;
 clockIn: string | null;
 clockOut: string | null;
 hoursWorked: number | null;
}

export default function EmployeeAttendance() {
 const [records, setRecords] = useState<AttendanceRecord[]>([]);
 const [loading, setLoading] = useState(true);
 const [month, setMonth] = useState(() => {
 const now = new Date();
 return`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
 });

 useEffect(() => {
 const fetch = async () => {
 setLoading(true);
 try {
 const res = await api.get(`/attendance/my-history?month=${month}&limit=50`);
 setRecords(res.data.data);
 } catch { toast.error('Failed to load attendance'); }
 setLoading(false);
 };
 fetch();
 }, [month]);

 // Stats
 const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
 const absent = records.filter(r => r.status === 'absent').length;
 const late = records.filter(r => r.status === 'late').length;
 const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-white">Attendance History</h1>
 <p className="text-gpt-muted mt-1">Your detailed attendance records</p>
 </div>
 <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
 className="input-field w-auto" />
 </div>

 {/* Summary cards */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 <div className="card text-center"><div className="text-2xl font-bold text-emerald-600">{present}</div><div className="text-xs text-gpt-muted mt-1">Days Present</div></div>
 <div className="card text-center"><div className="text-2xl font-bold text-red-600">{absent}</div><div className="text-xs text-gpt-muted mt-1">Days Absent</div></div>
 <div className="card text-center"><div className="text-2xl font-bold text-amber-600">{late}</div><div className="text-xs text-gpt-muted mt-1">Late Check-ins</div></div>
 <div className="card text-center"><div className="text-2xl font-bold text-blue-600">{formatHours(totalHours)}</div><div className="text-xs text-gpt-muted mt-1">Total Hours</div></div>
 </div>

 {/* Records table */}
 <div className="card p-0 overflow-hidden">
 {loading ? (
 <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}</div>
 ) : records.length === 0 ? (
 <div className="text-center py-12">
 <CalendarCheck className="w-12 h-12 text-gpt-muted mx-auto mb-3" />
 <p className="text-gpt-muted">No records for this month</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="data-table">
 <thead><tr><th>Date</th><th>Status</th><th>Clock In</th><th>Clock Out</th><th>Hours</th></tr></thead>
 <tbody>
 {records.map(r => (
 <tr key={r.id}>
 <td className="font-medium text-white">{formatDate(r.date)}</td>
 <td><span className={getStatusColor(r.status)}>{getStatusLabel(r.status)}</span></td>
 <td className="text-gpt-muted">{formatTime(r.clockIn)}</td>
 <td className="text-gpt-muted">{formatTime(r.clockOut)}</td>
 <td className="text-gpt-muted">{formatHours(r.hoursWorked)}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 );
}
