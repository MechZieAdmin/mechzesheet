import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(isoString: string | null): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatHours(hours: number | null): string {
  if (hours === null || hours === undefined) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'present': return 'status-present';
    case 'absent': return 'status-absent';
    case 'late': return 'status-late';
    case 'leave': return 'status-leave';
    case 'holiday': return 'status-holiday';
    case 'half_day': return 'status-half-day';
    case 'weekly_off': return 'status-holiday';
    case 'approved': return 'status-approved';
    case 'rejected': return 'status-rejected';
    case 'pending': return 'status-pending';
    default: return 'status-badge bg-[#F1F5F9] text-[#64748B]';
  }
}

export function getStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case 'present': return 'Present';
    case 'absent': return 'Absent';
    case 'late': return 'Late';
    case 'leave': return 'On Leave';
    case 'holiday': return 'Holiday';
    case 'half_day': return 'Half Day';
    case 'weekly_off': return 'Weekly Off';
    case 'not_clocked_in': return 'Not Clocked In';
    case 'pending': return 'Pending';
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    default: return status;
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
