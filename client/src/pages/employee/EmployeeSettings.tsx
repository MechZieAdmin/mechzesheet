import { useState } from 'react';
import api from '../../lib/api';
import { Save, Shield, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function EmployeeSettings() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (form.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (form.currentPassword === form.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setSubmitting(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Password updated successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gpt-muted mt-1">Manage your account settings and security preferences</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-6 border-b border-[#E2E8F0] pb-4">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-[#0F172A]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Security</h3>
            <p className="text-xs text-gpt-muted">Update your password</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="label">Current Password *</label>
            <div className="relative">
              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                className="input-field pl-10"
                placeholder="Enter current password"
                required
              />
              <Key className="w-4 h-4 text-gpt-muted absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="label">New Password *</label>
            <div className="relative">
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                className="input-field pl-10"
                placeholder="Min 6 characters"
                required
              />
              <Key className="w-4 h-4 text-gpt-muted absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="label">Confirm New Password *</label>
            <div className="relative">
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="input-field pl-10"
                placeholder="Repeat new password"
                required
              />
              <Key className="w-4 h-4 text-gpt-muted absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={submitting} className="btn-primary">
              <Save className="w-4 h-4" />
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
