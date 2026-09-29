import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { getInitials, getStatusLabel } from '../../lib/utils';
import { Plus, Search, Filter, MoreVertical, UserMinus, Edit, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Employee {
 id: number;
 employeeCode: string;
 fullName: string;
 department: string;
 designation: string;
 email: string;
 phone: string;
 dateOfJoining: string;
 employmentStatus: string;
 isActive: boolean;
}

export default function AdminEmployees() {
 const [employees, setEmployees] = useState<Employee[]>([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [department, setDepartment] = useState('');
 const [departments, setDepartments] = useState<string[]>([]);
 const [page, setPage] = useState(1);
 const [totalPages, setTotalPages] = useState(1);
 const [showAddForm, setShowAddForm] = useState(false);
 const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
 const [confirmDeactivate, setConfirmDeactivate] = useState<Employee | null>(null);
 const [actionMenu, setActionMenu] = useState<number | null>(null);
 const navigate = useNavigate();

 const fetchEmployees = async () => {
 try {
 const params = new URLSearchParams();
 params.set('page', String(page));
 params.set('limit', '20');
 if (search) params.set('search', search);
 if (department) params.set('department', department);

 const res = await api.get(`/employees?${params}`);
 setEmployees(res.data.data);
 setTotalPages(res.data.pagination.totalPages);
 } catch {
 toast.error('Failed to load employees');
 } finally {
 setLoading(false);
 }
 };

 const fetchDepartments = async () => {
 try {
 const res = await api.get('/employees/departments');
 setDepartments(res.data);
 } catch {}
 };

 useEffect(() => {
 fetchEmployees();
 fetchDepartments();
 }, [page, search, department]);

 const handleDeactivate = async (emp: Employee) => {
 try {
 await api.delete(`/employees/${emp.id}`);
 toast.success(`${emp.fullName} has been deactivated`);
 setConfirmDeactivate(null);
 fetchEmployees();
 } catch (err: any) {
 toast.error(err.response?.data?.error || 'Failed to deactivate employee');
 }
 };

 // Skeleton loading
 if (loading) {
 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div className="skeleton h-8 w-48" />
 <div className="skeleton h-10 w-36 rounded-lg" />
 </div>
 <div className="card p-0 overflow-hidden">
 <div className="p-4 border-b border-gpt-accent flex gap-3">
 <div className="skeleton h-10 w-64 rounded-lg" />
 <div className="skeleton h-10 w-40 rounded-lg" />
 </div>
 {[...Array(5)].map((_, i) => (
 <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50">
 <div className="skeleton w-10 h-10 rounded-full" />
 <div className="flex-1 space-y-2">
 <div className="skeleton h-4 w-40" />
 <div className="skeleton h-3 w-28" />
 </div>
 <div className="skeleton h-4 w-24" />
 <div className="skeleton h-4 w-24" />
 </div>
 ))}
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-white">Employees</h1>
 <p className="text-gpt-muted mt-1">{employees.length} team members</p>
 </div>
 <button
 onClick={() => setShowAddForm(true)}
 className="btn-primary"
 >
 <Plus className="w-4 h-4" />
 Add Employee
 </button>
 </div>

 {/* Filters */}
 <div className="card p-0 overflow-hidden">
 <div className="p-4 border-b border-gpt-accent flex flex-wrap gap-3">
 <div className="relative flex-1 min-w-[200px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gpt-muted" />
 <input
 type="text"
 placeholder="Search by name, code, or email..."
 value={search}
 onChange={(e) => { setSearch(e.target.value); setPage(1); }}
 className="input-field pl-9"
 />
 </div>
 <select
 value={department}
 onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
 className="input-field w-auto min-w-[160px]"
 >
 <option value="">All Departments</option>
 {departments.map(d => (
 <option key={d} value={d}>{d}</option>
 ))}
 </select>
 </div>

 {/* Table */}
 <div className="overflow-x-auto">
 <table className="data-table">
 <thead>
 <tr>
 <th>Employee</th>
 <th>Code</th>
 <th>Department</th>
 <th>Designation</th>
 <th>Status</th>
 <th>Joined</th>
 <th className="text-right">Actions</th>
 </tr>
 </thead>
 <tbody>
 {employees.length === 0 ? (
 <tr>
 <td colSpan={7} className="text-center py-12 text-gpt-muted">
 <div className="flex flex-col items-center gap-2">
 <Users className="w-10 h-10 text-gpt-muted" />
 <p className="font-medium">No employees found</p>
 <p className="text-sm">Try adjusting your search or filters</p>
 </div>
 </td>
 </tr>
 ) : (
 employees.map((emp) => (
 <tr key={emp.id}>
 <td>
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-white text-xs font-semibold shrink-0">
 {getInitials(emp.fullName)}
 </div>
 <div>
 <p className="font-medium text-white">{emp.fullName}</p>
 <p className="text-xs text-gpt-muted">{emp.email}</p>
 </div>
 </div>
 </td>
 <td>
 <span className="font-mono text-xs bg-gpt-panel px-2 py-1 rounded">{emp.employeeCode}</span>
 </td>
 <td>{emp.department}</td>
 <td>{emp.designation}</td>
 <td>
 <span className={`status-badge ${
 emp.isActive
 ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
 : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
 }`}>
 {emp.isActive ? 'Active' : 'Inactive'}
 </span>
 </td>
 <td className="text-gpt-muted text-sm">
 {new Date(emp.dateOfJoining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
 </td>
 <td className="text-right">
 <div className="relative inline-block">
 <button
 onClick={() => setActionMenu(actionMenu === emp.id ? null : emp.id)}
 className="p-1.5 hover:bg-gpt-accent rounded-lg transition-colors"
 >
 <MoreVertical className="w-4 h-4 text-gpt-muted" />
 </button>
 {actionMenu === emp.id && (
 <div className="absolute right-0 top-full mt-1 w-44 bg-gpt-panel rounded-lg shadow-lg border border-gpt-accent py-1 z-50 animate-fade-in">
 <button
 onClick={() => { setSelectedEmployee(emp); setShowAddForm(true); setActionMenu(null); }}
 className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gpt-muted hover:bg-gpt-accent"
 >
 <Edit className="w-4 h-4" /> Edit Details
 </button>
 {emp.isActive && (
 <button
 onClick={() => { setConfirmDeactivate(emp); setActionMenu(null); }}
 className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
 >
 <UserMinus className="w-4 h-4" /> Deactivate
 </button>
 )}
 </div>
 )}
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="flex items-center justify-between px-4 py-3 border-t border-gpt-accent">
 <p className="text-sm text-gpt-muted">Page {page} of {totalPages}</p>
 <div className="flex gap-2">
 <button
 onClick={() => setPage(p => Math.max(1, p - 1))}
 disabled={page === 1}
 className="btn-secondary text-xs px-3 py-1.5"
 >
 Previous
 </button>
 <button
 onClick={() => setPage(p => Math.min(totalPages, p + 1))}
 disabled={page === totalPages}
 className="btn-secondary text-xs px-3 py-1.5"
 >
 Next
 </button>
 </div>
 </div>
 )}
 </div>

 {/* Add/Edit Employee Modal */}
 {showAddForm && (
 <EmployeeFormModal
 employee={selectedEmployee}
 onClose={() => { setShowAddForm(false); setSelectedEmployee(null); }}
 onSuccess={() => { setShowAddForm(false); setSelectedEmployee(null); fetchEmployees(); }}
 />
 )}

 {/* Deactivate Confirmation */}
 {confirmDeactivate && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDeactivate(null)}>
 <div className="bg-gpt-panel rounded-xl p-6 max-w-md w-full shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
 <h3 className="text-lg font-semibold text-white mb-2">Deactivate Employee</h3>
 <p className="text-gpt-muted mb-1">
 Are you sure you want to deactivate <strong>{confirmDeactivate.fullName}</strong>?
 </p>
 <p className="text-sm text-gpt-muted mb-6">
 This will revoke their login access. All historical attendance data will be preserved.
 </p>
 <div className="flex gap-3 justify-end">
 <button onClick={() => setConfirmDeactivate(null)} className="btn-secondary">Cancel</button>
 <button onClick={() => handleDeactivate(confirmDeactivate)} className="btn-danger">
 <UserMinus className="w-4 h-4" /> Deactivate
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

// ─── Inline Employee Form Modal ──────────────────────────────
import { Users } from 'lucide-react';

function EmployeeFormModal({
 employee,
 onClose,
 onSuccess,
}: {
 employee: Employee | null;
 onClose: () => void;
 onSuccess: () => void;
}) {
 const [form, setForm] = useState({
 employeeCode: employee?.employeeCode || '',
 fullName: employee?.fullName || '',
 department: employee?.department || '',
 designation: employee?.designation || '',
 dateOfJoining: employee?.dateOfJoining || '',
 email: employee?.email || '',
 phone: employee?.phone || '',
 reportingManager: '',
 shiftStart: '09:00',
 shiftEnd: '18:00',
 baseSalary: '',
 employmentStatus: employee?.employmentStatus || 'active',
 });
 const [submitting, setSubmitting] = useState(false);
 const [credentials, setCredentials] = useState<{ email: string; tempPassword: string } | null>(null);

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
 setForm({ ...form, [e.target.name]: e.target.value });
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setSubmitting(true);

 try {
 if (employee) {
 await api.put(`/employees/${employee.id}`, form);
 toast.success('Employee updated successfully');
 onSuccess();
 } else {
 const res = await api.post('/employees', {
 ...form,
 baseSalary: form.baseSalary ? parseFloat(form.baseSalary) : null,
 });
 setCredentials(res.data.credentials);
 toast.success('Employee created successfully');
 }
 } catch (err: any) {
 toast.error(err.response?.data?.error || 'Operation failed');
 } finally {
 setSubmitting(false);
 }
 };

 if (credentials) {
 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
 <div className="bg-gpt-panel rounded-xl p-6 max-w-md w-full shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
 <h3 className="text-lg font-semibold text-white mb-2">✅ Employee Created</h3>
 <p className="text-sm text-gpt-muted mb-4">Share these login credentials with the employee securely:</p>
 <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm space-y-2 mb-4">
 <div><span className="text-gpt-muted">Email:</span> <span className="text-white font-semibold">{credentials.email}</span></div>
 <div><span className="text-gpt-muted">Password:</span> <span className="text-white font-semibold">{credentials.tempPassword}</span></div>
 </div>
 <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3 mb-4">
 ⚠️ This password is shown only once. The employee should change it on first login.
 </p>
 <button onClick={() => { onSuccess(); }} className="btn-primary w-full">Done</button>
 </div>
 </div>
 );
 }

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
 <div className="bg-gpt-panel rounded-xl p-6 max-w-2xl w-full shadow-xl animate-slide-up my-8" onClick={e => e.stopPropagation()}>
 <h3 className="text-lg font-semibold text-white mb-6">
 {employee ? 'Edit Employee' : 'Add New Employee'}
 </h3>

 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="label">Employee Code *</label>
 <input name="employeeCode" value={form.employeeCode} onChange={handleChange}
 placeholder="MZ-006" className="input-field" required disabled={!!employee} />
 </div>
 <div>
 <label className="label">Full Name *</label>
 <input name="fullName" value={form.fullName} onChange={handleChange}
 placeholder="John Doe" className="input-field" required />
 </div>
 <div>
 <label className="label">Email *</label>
 <input name="email" type="email" value={form.email} onChange={handleChange}
 placeholder="john@mechzie.com" className="input-field" required />
 </div>
 <div>
 <label className="label">Phone</label>
 <input name="phone" value={form.phone} onChange={handleChange}
 placeholder="+91-9876543210" className="input-field" />
 </div>
 <div>
 <label className="label">Department *</label>
 <input name="department" value={form.department} onChange={handleChange}
 placeholder="Engineering" className="input-field" required />
 </div>
 <div>
 <label className="label">Designation *</label>
 <input name="designation" value={form.designation} onChange={handleChange}
 placeholder="Senior Engineer" className="input-field" required />
 </div>
 <div>
 <label className="label">Date of Joining *</label>
 <input name="dateOfJoining" type="date" value={form.dateOfJoining} onChange={handleChange}
 className="input-field" required />
 </div>
 <div>
 <label className="label">Reporting Manager</label>
 <input name="reportingManager" value={form.reportingManager} onChange={handleChange}
 placeholder="Manager name" className="input-field" />
 </div>
 <div>
 <label className="label">Shift Start</label>
 <input name="shiftStart" type="time" value={form.shiftStart} onChange={handleChange}
 className="input-field" />
 </div>
 <div>
 <label className="label">Shift End</label>
 <input name="shiftEnd" type="time" value={form.shiftEnd} onChange={handleChange}
 className="input-field" />
 </div>
 <div>
 <label className="label">Base Salary (CTC)</label>
 <input name="baseSalary" type="number" value={form.baseSalary} onChange={handleChange}
 placeholder="50000" className="input-field" />
 </div>
 <div>
 <label className="label">Employment Status</label>
 <select name="employmentStatus" value={form.employmentStatus} onChange={handleChange}
 className="input-field">
 <option value="active">Active</option>
 <option value="probation">Probation</option>
 <option value="notice_period">Notice Period</option>
 </select>
 </div>
 </div>

 <div className="flex gap-3 justify-end pt-4 border-t border-gpt-accent">
 <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
 <button type="submit" disabled={submitting} className="btn-primary">
 {submitting ? 'Saving...' : (employee ? 'Update Employee' : 'Create Employee')}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
