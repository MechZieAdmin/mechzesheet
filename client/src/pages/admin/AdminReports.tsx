import { useState } from 'react';
import api from '../../lib/api';
import { formatHours } from '../../lib/utils';
import { FileText, Download, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import {
 BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface TimesheetRow {
 employeeId: number;
 employeeCode: string;
 employeeName: string;
 department: string;
 designation: string;
 daysPresent: number;
 daysAbsent: number;
 daysLate: number;
 daysLeave: number;
 daysHalfDay: number;
 totalHoursWorked: number;
 overtimeHours: number;
}

interface DeptSummary {
 department: string;
 present: number;
 absent: number;
 late: number;
 leave: number;
 total: number;
}

export default function AdminReports() {
 const [tab, setTab] = useState<'timesheet' | 'department'>('timesheet');
 const [month, setMonth] = useState(() => {
 const now = new Date();
 return`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
 });
 const [timesheetData, setTimesheetData] = useState<TimesheetRow[]>([]);
 const [deptData, setDeptData] = useState<DeptSummary[]>([]);
 const [loading, setLoading] = useState(false);

 const fetchTimesheet = async () => {
 setLoading(true);
 try {
 const res = await api.get(`/admin/timesheet?month=${month}`);
 setTimesheetData(res.data);
 } catch {
 toast.error('Failed to load timesheet data');
 } finally {
 setLoading(false);
 }
 };

 const fetchDeptSummary = async () => {
 setLoading(true);
 try {
 const res = await api.get(`/admin/department-summary?month=${month}`);
 setDeptData(res.data);
 } catch {
 toast.error('Failed to load department summary');
 } finally {
 setLoading(false);
 }
 };

 const handleGenerate = () => {
 if (tab === 'timesheet') fetchTimesheet();
 else fetchDeptSummary();
 };

 return (
 <div className="space-y-6">
 <div>
 <h1 className="text-2xl font-bold text-white">Reports</h1>
 <p className="text-gpt-muted mt-1">Generate attendance and timesheet reports</p>
 </div>

 {/* Controls */}
 <div className="card">
 <div className="flex flex-wrap items-end gap-4">
 <div>
 <label className="label">Report Type</label>
 <select value={tab} onChange={(e) => setTab(e.target.value as any)} className="input-field w-auto">
 <option value="timesheet">Monthly Timesheet</option>
 <option value="department">Department Summary</option>
 </select>
 </div>
 <div>
 <label className="label">Month</label>
 <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input-field w-auto" />
 </div>
 <button onClick={handleGenerate} className="btn-primary h-10">
 <BarChart3 className="w-4 h-4" /> Generate
 </button>
 </div>
 </div>

 {/* Timesheet Report */}
 {tab === 'timesheet' && timesheetData.length > 0 && (
 <div className="card p-0 overflow-hidden">
 <div className="p-4 border-b border-gpt-accent flex items-center justify-between">
 <h3 className="font-semibold text-white flex items-center gap-2">
 <FileText className="w-5 h-5 text-white" />
 Monthly Timesheet — {month}
 </h3>
 </div>
 <div className="overflow-x-auto">
 <table className="data-table">
 <thead>
 <tr>
 <th>Employee</th>
 <th>Department</th>
 <th className="text-center">Present</th>
 <th className="text-center">Absent</th>
 <th className="text-center">Late</th>
 <th className="text-center">Leave</th>
 <th className="text-center">Half Day</th>
 <th className="text-right">Total Hours</th>
 <th className="text-right">Overtime</th>
 </tr>
 </thead>
 <tbody>
 {timesheetData.map((row) => (
 <tr key={row.employeeId}>
 <td>
 <p className="font-medium text-white">{row.employeeName}</p>
 <p className="text-xs text-gpt-muted font-mono">{row.employeeCode}</p>
 </td>
 <td className="text-gpt-muted">{row.department}</td>
 <td className="text-center">
 <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold">{row.daysPresent}</span>
 </td>
 <td className="text-center">
 <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-700 text-sm font-semibold">{row.daysAbsent}</span>
 </td>
 <td className="text-center">
 <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold">{row.daysLate}</span>
 </td>
 <td className="text-center">
 <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">{row.daysLeave}</span>
 </td>
 <td className="text-center">
 <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 text-purple-700 text-sm font-semibold">{row.daysHalfDay}</span>
 </td>
 <td className="text-right font-medium">{formatHours(row.totalHoursWorked)}</td>
 <td className="text-right">
 {row.overtimeHours > 0 ? (
 <span className="text-white font-medium">{formatHours(row.overtimeHours)}</span>
 ) : '—'}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* Department Summary */}
 {tab === 'department' && deptData.length > 0 && (
 <div className="space-y-6">
 <div className="card">
 <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
 <BarChart3 className="w-5 h-5 text-white" />
 Department-wise Attendance — {month}
 </h3>
 <div className="h-72">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={deptData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
 <XAxis dataKey="department" tick={{ fontSize: 12 }} />
 <YAxis tick={{ fontSize: 12 }} />
 <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
 <Legend />
 <Bar dataKey="present" name="Present" fill="#10B981" radius={[4, 4, 0, 0]} />
 <Bar dataKey="late" name="Late" fill="#F59E0B" radius={[4, 4, 0, 0]} />
 <Bar dataKey="absent" name="Absent" fill="#EF4444" radius={[4, 4, 0, 0]} />
 <Bar dataKey="leave" name="Leave" fill="#3B82F6" radius={[4, 4, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>
 )}

 {!loading && timesheetData.length === 0 && deptData.length === 0 && (
 <div className="card text-center py-12">
 <FileText className="w-12 h-12 text-gpt-muted mx-auto mb-3" />
 <p className="text-gpt-muted font-medium">Select a report type and month, then click Generate</p>
 </div>
 )}
 </div>
 );
}
