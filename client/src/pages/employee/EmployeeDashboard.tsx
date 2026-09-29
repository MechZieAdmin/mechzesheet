import { useEffect, useState, useRef } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { formatTime, formatHours, getStatusColor, getStatusLabel } from '../../lib/utils';
import { Clock, LogIn, LogOut, MapPin, Timer, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import AnnouncementPopup from '../../components/AnnouncementPopup';

interface TodayRecord {
 date: string;
 status: string;
 clockIn: string | null;
 clockOut: string | null;
 hoursWorked: number | null;
}

interface AttendanceRecord {
 id: number;
 date: string;
 status: string;
 clockIn: string | null;
 clockOut: string | null;
 hoursWorked: number | null;
}

export default function EmployeeDashboard() {
 const user = useAuthStore((s) => s.user);
 const [today, setToday] = useState<TodayRecord | null>(null);
 const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([]);
 const [loading, setLoading] = useState(true);
 const [clockingIn, setClockingIn] = useState(false);
 const [clockingOut, setClockingOut] = useState(false);
 const [currentTime, setCurrentTime] = useState(new Date());
 const [elapsedTime, setElapsedTime] = useState<string>('');
 const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

 useEffect(() => {
 const tick = setInterval(() => setCurrentTime(new Date()), 1000);
 return () => clearInterval(tick);
 }, []);

 useEffect(() => {
 if (today?.clockIn && !today?.clockOut) {
 const update = () => {
 const diff = Date.now() - new Date(today.clockIn!).getTime();
 const h = Math.floor(diff / 3600000);
 const m = Math.floor((diff % 3600000) / 60000);
 const s = Math.floor((diff % 60000) / 1000);
 setElapsedTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
 };
 update();
 timerRef.current = setInterval(update, 1000);
 return () => clearInterval(timerRef.current);
 } else {
 setElapsedTime('');
 }
 }, [today]);

 const fetchData = async () => {
 try {
 const [todayRes, histRes] = await Promise.all([
 api.get('/attendance/today'),
 api.get('/attendance/my-history?limit=31'),
 ]);
 setToday(todayRes.data);
 setMonthlyRecords(histRes.data.data);
 } catch { toast.error('Failed to load attendance data'); }
 setLoading(false);
 };

 useEffect(() => { fetchData(); }, []);

 const getLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
 return new Promise((resolve) => {
 if (!navigator.geolocation) { resolve(null); return; }
 navigator.geolocation.getCurrentPosition(
 (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
 () => resolve(null),
 { timeout: 5000 }
 );
 });
 };

 const handleClockIn = async () => {
 setClockingIn(true);
 try {
 const location = await getLocation();
 const res = await api.post('/attendance/clock-in', location || {});
 toast.success(res.data.message);
 fetchData();
 } catch (err: any) {
 toast.error(err.response?.data?.error || 'Clock-in failed');
 } finally {
 setClockingIn(false);
 }
 };

 const handleClockOut = async () => {
 setClockingOut(true);
 try {
 const location = await getLocation();
 const res = await api.post('/attendance/clock-out', location || {});
 toast.success(res.data.message);
 fetchData();
 } catch (err: any) {
 toast.error(err.response?.data?.error || 'Clock-out failed');
 } finally {
 setClockingOut(false);
 }
 };

 const hasClockedIn = today?.clockIn != null;
 const hasClockedOut = today?.clockOut != null;

 // Build calendar data for current month
 const now = new Date();
 const year = now.getFullYear();
 const month = now.getMonth();
 const daysInMonth = new Date(year, month + 1, 0).getDate();
 const firstDayOfWeek = new Date(year, month, 1).getDay();
 const recordMap = new Map(monthlyRecords.map(r => [r.date, r]));

 if (loading) {
 return (
 <div className="space-y-6">
 <div className="skeleton h-8 w-64" />
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-1 skeleton h-64 rounded-xl" />
 <div className="lg:col-span-2 skeleton h-64 rounded-xl" />
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 <AnnouncementPopup />
 {/* Greeting */}
 <div>
 <h1 className="text-2xl font-bold text-white">
 Good {now.getHours() < 12 ? 'Morning' : now.getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋
 </h1>
 <p className="text-gpt-muted mt-1">
 {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
 </p>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Clock In/Out Card */}
 <div className="lg:col-span-1 space-y-4">
 <div className="card text-center">
 {/* Live clock */}
 <div className="mb-4">
 <div className="text-4xl font-bold text-white font-mono tracking-wider">
 {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
 </div>
 <p className="text-xs text-gpt-muted mt-1">Current Time</p>
 </div>

 {/* Status */}
 <div className="mb-6">
 {!hasClockedIn && (
 <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gpt-panel text-gpt-muted text-sm">
 <Clock className="w-4 h-4" /> Not clocked in yet
 </div>
 )}
 {hasClockedIn && !hasClockedOut && (
 <div className="space-y-2">
 <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-soft" /> Working
 </div>
 <div className="text-3xl font-bold text-white font-mono">{elapsedTime}</div>
 <p className="text-xs text-gpt-muted">Time elapsed since clock-in</p>
 </div>
 )}
 {hasClockedOut && (
 <div className="space-y-2">
 <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
 Shift complete ✓
 </div>
 <p className="text-lg font-semibold text-white">
 {formatHours(today?.hoursWorked ?? null)} worked
 </p>
 </div>
 )}
 </div>

 {/* Clock buttons */}
 {!hasClockedIn && (
 <button onClick={handleClockIn} disabled={clockingIn}
 className="btn-primary w-full h-14 text-lg">
 {clockingIn ? (
 <span className="flex items-center gap-2"><Timer className="w-5 h-5 animate-spin" /> Clocking in...</span>
 ) : (
 <span className="flex items-center gap-2"><LogIn className="w-5 h-5" /> Clock In</span>
 )}
 </button>
 )}
 {hasClockedIn && !hasClockedOut && (
 <button onClick={handleClockOut} disabled={clockingOut}
 className="w-full h-14 text-lg rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
 {clockingOut ? (
 <><Timer className="w-5 h-5 animate-spin" /> Clocking out...</>
 ) : (
 <><LogOut className="w-5 h-5" /> Clock Out</>
 )}
 </button>
 )}
 </div>

 {/* Today's details */}
 {hasClockedIn && (
 <div className="card space-y-3">
 <h3 className="text-sm font-semibold text-gpt-muted uppercase tracking-wider">Today's Details</h3>
 <div className="flex justify-between items-center py-2 border-b border-gpt-accent">
 <span className="text-sm text-gpt-muted">Status</span>
 <span className={getStatusColor(today?.status || 'absent')}>{getStatusLabel(today?.status || 'absent')}</span>
 </div>
 <div className="flex justify-between items-center py-2 border-b border-gpt-accent">
 <span className="text-sm text-gpt-muted">Clock In</span>
 <span className="text-sm font-medium text-white">{formatTime(today?.clockIn ?? null)}</span>
 </div>
 {today?.clockOut && (
 <div className="flex justify-between items-center py-2">
 <span className="text-sm text-gpt-muted">Clock Out</span>
 <span className="text-sm font-medium text-white">{formatTime(today.clockOut)}</span>
 </div>
 )}
 </div>
 )}
 </div>

 {/* Monthly Calendar */}
 <div className="lg:col-span-2">
 <div className="card">
 <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
 <CalendarDays className="w-5 h-5 text-white" />
 {now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
 </h3>

 {/* Calendar grid */}
 <div className="grid grid-cols-7 gap-1">
 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
 <div key={d} className="text-center text-xs font-semibold text-gpt-muted py-2">{d}</div>
 ))}
 {/* Empty cells for offset */}
 {[...Array(firstDayOfWeek)].map((_, i) => (
 <div key={`empty-${i}`} />
 ))}
 {/* Day cells */}
 {[...Array(daysInMonth)].map((_, i) => {
 const day = i + 1;
 const dateStr =`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
 const record = recordMap.get(dateStr);
 const isToday = day === now.getDate();
 const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;
 const isFuture = day > now.getDate();

 let bgColor = '';
 if (isFuture) bgColor = '';
 else if (record?.status === 'present') bgColor = 'bg-emerald-100 text-emerald-800 ';
 else if (record?.status === 'late') bgColor = 'bg-amber-100 text-amber-800 ';
 else if (record?.status === 'absent') bgColor = 'bg-red-100 text-red-800 ';
 else if (record?.status === 'leave') bgColor = 'bg-blue-100 text-blue-800 ';
 else if (record?.status === 'half_day') bgColor = 'bg-purple-100 text-purple-800 ';
 else if (isWeekend && !isFuture) bgColor = 'bg-gpt-panel text-gpt-muted';

 return (
 <div
 key={day}
 className={`relative text-center py-2.5 rounded-lg text-sm font-medium transition-all
 ${bgColor}
 ${isToday ? 'ring-2 ring-gray-900 ring-offset-1 ' : ''}
 ${isFuture ? 'text-gpt-muted ' : ''}
`}
 title={record ? getStatusLabel(record.status) : isWeekend ? 'Weekend' : ''}
 >
 {day}
 </div>
 );
 })}
 </div>

 {/* Legend */}
 <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gpt-accent">
 {[
 { color: 'bg-emerald-100 ', label: 'Present' },
 { color: 'bg-amber-100 ', label: 'Late' },
 { color: 'bg-red-100 ', label: 'Absent' },
 { color: 'bg-blue-100 ', label: 'Leave' },
 { color: 'bg-gpt-panel ', label: 'Weekend' },
 ].map(l => (
 <div key={l.label} className="flex items-center gap-1.5">
 <div className={`w-3 h-3 rounded ${l.color}`} />
 <span className="text-xs text-gpt-muted">{l.label}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
