import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getInitials } from '../../lib/utils';
import {
 LayoutDashboard, CalendarCheck, ClipboardList, User, FileText,
 LogOut, Hexagon, Menu, X, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import MechanicalBackground from './MechanicalBackground';

const navItems = [
 { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
 { to: '/dashboard/attendance', icon: CalendarCheck, label: 'Attendance' },
 { to: '/dashboard/leaves', icon: ClipboardList, label: 'Leaves' },
 { to: '/dashboard/timesheet', icon: FileText, label: 'Timesheet' },
 { to: '/dashboard/profile', icon: User, label: 'Profile' },
 { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function EmployeeLayout() {
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const user = useAuthStore((s) => s.user);
 const logout = useAuthStore((s) => s.logout);
 const navigate = useNavigate();

 const handleLogout = async () => {
 await logout();
 toast.success('Logged out successfully');
 navigate('/login');
 };

 return (
 <div className="min-h-screen bg-transparent flex flex-col relative z-0">
 <MechanicalBackground />
 {/* Top navigation - Glassmorphism */}
 <header className="sticky top-0 z-50 bg-gpt-panel/60 backdrop-blur-xl border-b border-[#2f2f2f] transition-all">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between h-16">
 {/* Logo */}
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 bg-gpt-panel text-gpt-panel rounded-xl flex items-center justify-center shadow-soft">
 <Hexagon className="w-5 h-5" />
 </div>
 <div>
 <h1 className="text-[17px] font-bold text-white leading-none tracking-tight">MechZie</h1>
 <p className="text-[10px] text-gpt-muted font-medium tracking-widest uppercase mt-1">Employee</p>
 </div>
 </div>

 {/* Desktop nav */}
 <nav className="hidden md:flex items-center gap-1">
 {navItems.map((item) => (
 <NavLink
 key={item.to}
 to={item.to}
 end={item.end}
 className={({ isActive }) =>
 `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ease-out ${
 isActive
 ? 'bg-gpt-panel text-gpt-panel'
 : 'text-gpt-muted hover:bg-[#2f2f2f] hover:text-white'
 }`
 }
 >
 <item.icon className="w-4 h-4" />
 <span>{item.label}</span>
 </NavLink>
 ))}
 </nav>

 {/* User / Logout */}
 <div className="flex items-center gap-3">
 <div className="hidden sm:flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-[#2f2f2f] flex items-center justify-center text-white text-xs font-bold shadow-sm">
 {getInitials(user?.name || 'E')}
 </div>
 <span className="text-sm text-white font-bold">{user?.name}</span>
 </div>
 <button
 onClick={handleLogout}
 className="p-2 text-gpt-muted hover:text-red-400 hover:bg-red-950/50 rounded-lg transition-colors ml-2"
 title="Logout"
 >
 <LogOut className="w-4 h-4" />
 </button>

 {/* Mobile menu toggle */}
 <button
 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
 className="md:hidden p-2 text-gpt-muted hover:bg-[#2f2f2f] rounded-lg"
 >
 {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
 </button>
 </div>
 </div>
 </div>

 {/* Mobile nav */}
 {mobileMenuOpen && (
 <div className="md:hidden bg-[#212121]/90 backdrop-blur-xl border-b border-[#2f2f2f] px-4 py-3 space-y-1 animate-slide-up shadow-glass absolute w-full left-0">
 {navItems.map((item) => (
 <NavLink
 key={item.to}
 to={item.to}
 end={item.end}
 onClick={() => setMobileMenuOpen(false)}
 className={({ isActive }) =>
`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${
 isActive
 ? 'bg-gpt-panel text-gpt-panel'
 : 'text-gpt-muted hover:bg-[#2f2f2f] hover:text-white'
 }`
 }
 >
 <item.icon className="w-5 h-5" />
 <span>{item.label}</span>
 </NavLink>
 ))}
 </div>
 )}
 </header>

 {/* Page content */}
 <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative">
 <div className="page-enter">
 <Outlet />
 </div>
 </main>

 {/* Footer */}
 <footer className="bg-gpt-panel/50 border-t border-[#2f2f2f] py-4 mt-auto backdrop-blur-md">
 <p className="text-center text-xs text-gpt-muted font-medium tracking-wide">
 Powered by <span className="font-bold text-white">Varnainfotech</span>
 </p>
 </footer>
 </div>
 );
}
