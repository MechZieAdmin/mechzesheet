import { useState } from 'react';
import api from '../../lib/api';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function EmployeeTimesheet() {
 const [month, setMonth] = useState(() => {
 const now = new Date();
 return`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
 });
 const [loading, setLoading] = useState(false);
 const [records, setRecords] = useState<any[]>([]);

 const fetchRecords = async () => {
 setLoading(true);
 try {
 const res = await api.get(`/attendance/my-history?month=${month}&limit=50`);
 setRecords(res.data.data);
 } catch { toast.error('Failed to load timesheet'); }
 setLoading(false);
 };

 const handleDownloadPDF = async () => {
 try {
 const { default: jsPDF } = await import('jspdf');
 const { default: autoTable } = await import('jspdf-autotable');
 
 const doc = new jsPDF();
 
 doc.setFontSize(18);
 doc.setTextColor(15, 23, 42);
 doc.text('MechZie Attendance', 14, 20);
 
 doc.setFontSize(12);
 doc.setTextColor(100);
 doc.text(`Monthly Timesheet — ${month}`, 14, 28);
 doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 35);

 const tableData = records.map(r => [
 r.date,
 r.status?.charAt(0).toUpperCase() + r.status?.slice(1).replace('_', ' '),
 r.clockIn ? new Date(r.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—',
 r.clockOut ? new Date(r.clockOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—',
 r.hoursWorked ?`${Math.floor(r.hoursWorked)}h ${Math.round((r.hoursWorked % 1) * 60)}m` : '—',
 ]);

 autoTable(doc, {
 startY: 42,
 head: [['Date', 'Status', 'Clock In', 'Clock Out', 'Hours']],
 body: tableData,
 theme: 'striped',
 headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
 alternateRowStyles: { fillColor: [248, 250, 252] },
 styles: { fontSize: 9 },
 });

 // Summary
 const present = records.filter((r: any) => r.status === 'present' || r.status === 'late').length;
 const totalH = records.reduce((s: number, r: any) => s + (r.hoursWorked || 0), 0);
 const finalY = (doc as any).lastAutoTable?.finalY || 100;
 
 doc.setFontSize(10);
 doc.setTextColor(60);
 doc.text(`Total Days Present: ${present} | Total Hours: ${Math.floor(totalH)}h ${Math.round((totalH % 1) * 60)}m`, 14, finalY + 12);
 doc.setFontSize(8);
 doc.setTextColor(150);
 doc.text('Powered by Varnainfotech', 14, doc.internal.pageSize.height - 10);

 doc.save(`MechZie_Timesheet_${month}.pdf`);
 toast.success('PDF downloaded');
 } catch (err) {
 console.error(err);
 toast.error('Failed to generate PDF');
 }
 };

 return (
 <div className="space-y-6 max-w-3xl">
 <div>
 <h1 className="text-2xl font-bold text-white">My Timesheet</h1>
 <p className="text-gpt-muted mt-1">View and download your monthly timesheet</p>
 </div>

 <div className="card">
 <div className="flex flex-wrap items-end gap-4 mb-6">
 <div>
 <label className="label">Select Month</label>
 <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
 className="input-field w-auto" />
 </div>
 <button onClick={fetchRecords} disabled={loading} className="btn-secondary h-10">
 {loading ? 'Loading...' : 'Load Timesheet'}
 </button>
 {records.length > 0 && (
 <button onClick={handleDownloadPDF} className="btn-primary h-10">
 <Download className="w-4 h-4" /> Download PDF
 </button>
 )}
 </div>

 {records.length === 0 ? (
 <div className="text-center py-12">
 <FileText className="w-12 h-12 text-gpt-muted mx-auto mb-3" />
 <p className="text-gpt-muted">Select a month and click Load Timesheet</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="data-table">
 <thead><tr><th>Date</th><th>Status</th><th>Clock In</th><th>Clock Out</th><th>Hours</th></tr></thead>
 <tbody>
 {records.map((r: any) => (
 <tr key={r.id}>
 <td className="font-medium text-white">{r.date}</td>
 <td>
 <span className={`status-badge ${
 r.status === 'present' ? 'bg-emerald-50 text-emerald-700 ' :
 r.status === 'late' ? 'bg-amber-50 text-amber-700 ' :
 r.status === 'absent' ? 'bg-red-50 text-red-700 ' :
 'bg-gpt-panel text-gpt-muted '
 }`}>
 {r.status?.replace('_', ' ')}
 </span>
 </td>
 <td className="text-gpt-muted">
 {r.clockIn ? new Date(r.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
 </td>
 <td className="text-gpt-muted">
 {r.clockOut ? new Date(r.clockOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
 </td>
 <td className="text-gpt-muted">
 {r.hoursWorked ?`${Math.floor(r.hoursWorked)}h ${Math.round((r.hoursWorked % 1) * 60)}m` : '—'}
 </td>
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
