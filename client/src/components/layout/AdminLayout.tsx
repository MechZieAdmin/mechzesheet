import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getInitials } from '../../lib/utils';
import {
 LayoutDashboard, Users, CalendarCheck, FileText, Settings, LogOut,
 ClipboardList, Hexagon, ChevronLeft, ChevronRight, Bell, UserPlus, Megaphone
} from 'lucide-react';
import { toast } from 'sonner';
import MechanicalBackground from './MechanicalBackground';

const navItems = [
 { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
 { to: '/admin/employees', icon: Users, label: 'Employees' },
 { to: '/admin/register', icon: UserPlus, label: 'Register User' },
 { to: '/admin/attendance', icon: CalendarCheck, label: 'Attendance' },
 { to: '/admin/leaves', icon: ClipboardList, label: 'Leaves' },
 { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
 { to: '/admin/reports', icon: FileText, label: 'Reports' },
 { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
 const [collapsed, setCollapsed] = useState(false);
 const user = useAuthStore((s) => s.user);
 const logout = useAuthStore((s) => s.logout);
 const navigate = useNavigate();

 const handleLogout = async () => {
 await logout();
 toast.success('Logged out successfully');
 navigate('/admin/login');
 };

 return (
 <div className="flex h-screen overflow-hidden bg-transparent">
 <MechanicalBackground />
 {/* Sidebar */}
 <aside
 className={`bg-gpt-panel/80 backdrop-blur-xl border-r border-[#2f2f2f] flex flex-col transition-all duration-300 ease-in-out shrink-0 z-20 ${
 collapsed ? 'w-[72px]' : 'w-64'
 }`}
 >
 {/* Logo */}
 <div className="flex items-center gap-3 px-5 h-16 border-b border-[#2f2f2f] shrink-0">
 <div className="w-9 h-9 bg-gpt-panel text-gpt-panel rounded-xl flex items-center justify-center shrink-0 shadow-soft">
 <Hexagon className="w-5 h-5" />
 </div>
 {!collapsed && (
 <div className="animate-fade-in overflow-hidden whitespace-nowrap">
 <h1 className="text-[17px] font-bold text-white leading-none tracking-tight">MechZie</h1>
 <p className="text-[10px] text-gpt-muted font-medium tracking-widest uppercase mt-1">HR Portal</p>
 </div>
 )}
 </div>

 {/* Navigation */}
 <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
 {navItems.map((item) => (
 <NavLink
 key={item.to}
 to={item.to}
 end={item.end}
 className={({ isActive }) =>
 isActive ? 'sidebar-link-active' : 'sidebar-link'
 }
 title={collapsed ? item.label : undefined}
 >
 <item.icon className={`w-5 h-5 shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
 {!collapsed && <span className="truncate">{item.label}</span>}
 </NavLink>
 ))}
 </nav>

 {/* Collapse toggle */}
 <div className="p-3 border-t border-[#2f2f2f]">
 <button
 onClick={() => setCollapsed(!collapsed)}
 className="sidebar-link w-full justify-center"
 title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
 >
 {collapsed ? (
 <ChevronRight className="w-5 h-5" />
 ) : (
 <>
 <ChevronLeft className="w-5 h-5" />
 <span>Collapse</span>
 </>
 )}
 </button>
 </div>
 </aside>

 {/* Main content area */}
 <div className="flex-1 flex flex-col overflow-hidden relative">
 {/* Top header - Glassmorphism */}
 <header className="sticky top-0 z-10 h-16 bg-gpt-panel/60 backdrop-blur-xl border-b border-[#2f2f2f] flex items-center justify-between px-8 shrink-0 transition-all">
 <div>
 <h2 className="text-sm font-semibold text-white tracking-tight">Admin Dashboard</h2>
 </div>
 <div className="flex items-center gap-5">
 <button className="relative p-2 text-gpt-muted hover:text-white transition-colors">
 <Bell className="w-5 h-5" />
 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gpt-panel rounded-full shadow-[0_0_0_2px_#171717]" />
 </button>

 <div className="flex items-center gap-3 pl-5 border-l border-[#2f2f2f]">
 <div className="w-9 h-9 rounded-full bg-[#2f2f2f] flex items-center justify-center text-white text-sm font-bold shadow-sm">
 {getInitials(user?.name || 'A')}
 </div>
 <div className="hidden sm:block">
 <p className="text-sm font-bold text-white leading-none">{user?.name}</p>
 <p className="text-xs text-gpt-muted mt-1 capitalize font-medium">{user?.role}</p>
 </div>
 <button
 onClick={handleLogout}
 className="p-2 text-gpt-muted hover:text-red-400 hover:bg-red-950/50 rounded-lg transition-colors ml-2"
 title="Logout"
 >
 <LogOut className="w-4 h-4" />
 </button>
 </div>
 </div>
 </header>

 {/* Page content */}
 <main className="flex-1 overflow-y-auto p-8 relative">
 <div className="page-enter max-w-7xl mx-auto">
 <Outlet />
 </div>
 </main>

 </div>
 </div>
 );
}
