import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export default function RegisterPage() {
 const [form, setForm] = useState({
 email: '',
 password: '',
 confirmPassword: '',
 role: 'EMPLOYEE',
 fullName: '',
 employeeCode: '',
 department: '',
 designation: '',
 });
 const [isSubmitting, setIsSubmitting] = useState(false);
 const navigate = useNavigate();
 const user = useAuthStore((s) => s.user);

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
 setForm({ ...form, [e.target.name]: e.target.value });
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();

 if (!form.email || !form.password || !form.fullName) {
 toast.error('Please fill in all required fields');
 return;
 }

 if (form.password !== form.confirmPassword) {
 toast.error('Passwords do not match');
 return;
 }

 if (form.password.length < 6) {
 toast.error('Password must be at least 6 characters');
 return;
 }

 setIsSubmitting(true);
 try {
 const payload = {
 email: form.email,
 password: form.password,
 role: form.role,
 fullName: form.fullName,
 employeeCode: form.employeeCode || undefined,
 department: form.department || undefined,
 designation: form.designation || undefined,
 };

 await api.post('/auth/register', payload);
 toast.success(`${form.role === 'HR' ? 'HR' : 'Employee'} registered successfully!`);
 setForm({
 email: '', password: '', confirmPassword: '', role: 'EMPLOYEE',
 fullName: '', employeeCode: '', department: '', designation: '',
 });
 navigate('/admin/employees');
 } catch (err: any) {
 toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <div className="max-w-2xl mx-auto">
 {/* Header */}
 <div className="mb-8">
 <h1 className="text-2xl font-bold text-white">Register New User</h1>
 <p className="text-gpt-muted mt-1">
 Add a new Employee or HR user to the system. Logged in as{' '}
 <span className="font-semibold text-white">{user?.email}</span>
 </p>
 </div>

 {/* Info cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
 <div className={`card p-4 border-2 transition-colors ${
 form.role === 'EMPLOYEE' ? 'border-gray-900 bg-gpt-panel' : 'border-transparent'
 }`}>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">👤</div>
 <div>
 <h3 className="font-semibold text-white text-sm">Employee</h3>
 <p className="text-xs text-gpt-muted">Clock in/out, leaves, timesheet</p>
 </div>
 </div>
 </div>
 <div className={`card p-4 border-2 transition-colors ${
 form.role === 'HR' ? 'border-gray-900 bg-gpt-panel' : 'border-transparent'
 }`}>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">🛡️</div>
 <div>
 <h3 className="font-semibold text-white text-sm">HR</h3>
 <p className="text-xs text-gpt-muted">Admin dashboard, manage staff</p>
 </div>
 </div>
 </div>
 </div>

 {/* Form */}
 <div className="card p-6">
 <form onSubmit={handleSubmit} className="space-y-5">
 {/* Role selector */}
 <div>
 <label htmlFor="reg-role" className="label">Role *</label>
 <select
 id="reg-role"
 name="role"
 value={form.role}
 onChange={handleChange}
 className="input-field"
 >
 <option value="EMPLOYEE">Employee</option>
 <option value="HR">HR</option>
 </select>
 </div>

 {/* Full Name */}
 <div>
 <label htmlFor="reg-fullName" className="label">Full Name *</label>
 <input
 id="reg-fullName"
 name="fullName"
 type="text"
 value={form.fullName}
 onChange={handleChange}
 placeholder="e.g. Rahul Kumar"
 className="input-field"
 required
 />
 </div>

 {/* Email */}
 <div>
 <label htmlFor="reg-email" className="label">Email *</label>
 <input
 id="reg-email"
 name="email"
 type="email"
 value={form.email}
 onChange={handleChange}
 placeholder="e.g. rahul@mechzie.com"
 className="input-field"
 required
 />
 </div>

 {/* Password */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label htmlFor="reg-password" className="label">Password *</label>
 <input
 id="reg-password"
 name="password"
 type="password"
 value={form.password}
 onChange={handleChange}
 placeholder="Min 6 characters"
 className="input-field"
 required
 />
 </div>
 <div>
 <label htmlFor="reg-confirmPassword" className="label">Confirm Password *</label>
 <input
 id="reg-confirmPassword"
 name="confirmPassword"
 type="password"
 value={form.confirmPassword}
 onChange={handleChange}
 placeholder="Repeat password"
 className="input-field"
 required
 />
 </div>
 </div>

 {/* Employee-specific fields */}
 {form.role === 'EMPLOYEE' && (
 <div className="space-y-4 pt-4 border-t border-gpt-accent">
 <p className="text-xs text-gpt-muted font-semibold uppercase tracking-wider">Employee Details</p>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label htmlFor="reg-employeeCode" className="label">Employee Code</label>
 <input
 id="reg-employeeCode"
 name="employeeCode"
 type="text"
 value={form.employeeCode}
 onChange={handleChange}
 placeholder="e.g. MZ-004"
 className="input-field"
 />
 </div>
 <div>
 <label htmlFor="reg-department" className="label">Department</label>
 <input
 id="reg-department"
 name="department"
 type="text"
 value={form.department}
 onChange={handleChange}
 placeholder="e.g. Engineering"
 className="input-field"
 />
 </div>
 </div>
 <div>
 <label htmlFor="reg-designation" className="label">Designation</label>
 <input
 id="reg-designation"
 name="designation"
 type="text"
 value={form.designation}
 onChange={handleChange}
 placeholder="e.g. Software Engineer"
 className="input-field"
 />
 </div>
 </div>
 )}

 <button
 type="submit"
 disabled={isSubmitting}
 className="btn-primary w-full h-11 mt-2"
 >
 {isSubmitting ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 Registering...
 </>
 ) : (
 <>
 <UserPlus className="w-4 h-4" />
 Register {form.role === 'HR' ? 'HR User' : 'Employee'}
 </>
 )}
 </button>
 </form>
 </div>
 </div>
 );
}
