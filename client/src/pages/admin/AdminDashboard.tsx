import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Users, UserCheck, UserX, Clock, ClipboardList, TrendingUp } from 'lucide-react';
import {
 AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { toast } from 'sonner';
import AnnouncementPopup from '../../components/AnnouncementPopup';

interface DashboardStats {
 totalEmployees: number;
 presentToday: number;
 absentToday: number;
 lateToday: number;
 pendingLeaves: number;
}

interface TrendData {
 date: string;
 present: number;
 absent: number;
 late: number;
 leave: number;
}

export default function AdminDashboard() {
 const [stats, setStats] = useState<DashboardStats | null>(null);
 const [trend, setTrend] = useState<TrendData[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const fetchData = async () => {
 try {
 const [statsRes, trendRes] = await Promise.all([
 api.get('/admin/dashboard'),
 api.get('/admin/attendance-trend?days=30'),
 ]);
 setStats(statsRes.data);
 setTrend(trendRes.data);
 } catch (err) {
 toast.error('Failed to load dashboard data');
 } finally {
 setLoading(false);
 }
 };
 fetchData();
 }, []);

 const statCards = stats ? [
 { label: 'Total Employees', value: stats.totalEmployees, icon: Users, color: 'text-blue-600 ', iconBg: 'bg-blue-100 ' },
 { label: 'Present Today', value: stats.presentToday, icon: UserCheck, color: 'text-emerald-600 ', iconBg: 'bg-emerald-100 ' },
 { label: 'Absent Today', value: stats.absentToday, icon: UserX, color: 'text-red-600 ', iconBg: 'bg-red-100 ' },
 { label: 'Late Check-ins', value: stats.lateToday, icon: Clock, color: 'text-amber-600 ', iconBg: 'bg-amber-100 ' },
 { label: 'Pending Leaves', value: stats.pendingLeaves, icon: ClipboardList, color: 'text-purple-600 ', iconBg: 'bg-purple-100 ' },
 ] : [];

 if (loading) {
 return (
 <div className="space-y-6">
 <div><div className="skeleton h-8 w-48 mb-2" /><div className="skeleton h-4 w-72" /></div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
 {[...Array(5)].map((_, i) => (
 <div key={i} className="card"><div className="skeleton h-12 w-12 rounded-xl mb-3" /><div className="skeleton h-8 w-16 mb-1" /><div className="skeleton h-4 w-24" /></div>
 ))}
 </div>
 <div className="card"><div className="skeleton h-64 w-full rounded-lg" /></div>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 <div>
 <h1 className="text-2xl font-bold text-white">Dashboard</h1>
 <p className="text-gpt-muted mt-1">
 Overview for {formatDate(new Date().toISOString().split('T')[0])}
 </p>
 </div>

 {/* Stats cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
 {statCards.map((card, index) => (
 <div key={card.label} className="card-hover group cursor-default">
 <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
 <card.icon className={`w-5 h-5 ${card.color}`} />
 </div>
 <div className="text-3xl font-bold text-white">{card.value}</div>
 <div className="text-sm text-gpt-muted mt-0.5">{card.label}</div>
 </div>
 ))}
 </div>

 {/* Attendance Trend Chart */}
 <div className="card">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h3 className="text-lg font-semibold text-white flex items-center gap-2">
 <TrendingUp className="w-5 h-5 text-white" />
 Attendance Trend
 </h3>
 <p className="text-sm text-gpt-muted mt-0.5">Last 30 working days</p>
 </div>
 </div>

 <div className="h-72">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
 <defs>
 <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
 <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
 </linearGradient>
 <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
 <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
 </linearGradient>
 <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
 <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
 <XAxis
 dataKey="date"
 tick={{ fontSize: 11, fill: '#9CA3AF' }}
 tickFormatter={(val) => {
 const d = new Date(val);
 return`${d.getDate()}/${d.getMonth() + 1}`;
 }}
 />
 <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
 <Tooltip
 contentStyle={{
 backgroundColor: 'var(--toast-bg)',
 color: 'var(--toast-color)',
 border: '1px solid var(--toast-border)',
 borderRadius: '8px',
 boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
 fontSize: '13px',
 }}
 labelFormatter={(val) => formatDate(val)}
 />
 <Legend />
 <Area type="monotone" dataKey="present" name="Present" stroke="#10B981" fill="url(#colorPresent)" strokeWidth={2} />
 <Area type="monotone" dataKey="late" name="Late" stroke="#F59E0B" fill="url(#colorLate)" strokeWidth={2} />
 <Area type="monotone" dataKey="absent" name="Absent" stroke="#EF4444" fill="url(#colorAbsent)" strokeWidth={2} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>
 );
}
