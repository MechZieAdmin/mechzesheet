import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Eye, EyeOff, LogIn, Loader2, Cog, Fingerprint, ScanFace } from 'lucide-react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import MechanicalBackground from '../components/layout/MechanicalBackground';
import BiometricPrompt from '../components/BiometricPrompt';
import EnableBiometricModal from '../components/EnableBiometricModal';

interface LoginPageProps {
 isAdmin?: boolean;
}

export default function LoginPage({ isAdmin = false }: LoginPageProps) {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const navigate = useNavigate();
 const login = useAuthStore((s) => s.login);
 const biometricCheckedRef = useRef(false);

 // Biometric state from store
 const biometricStatus = useAuthStore((s) => s.biometricStatus);
 const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
 const showBiometricPrompt = useAuthStore((s) => s.showBiometricPrompt);
 const showEnableBiometricModal = useAuthStore((s) => s.showEnableBiometricModal);
 const checkBiometricAvailability = useAuthStore((s) => s.checkBiometricAvailability);
 const loginWithBiometric = useAuthStore((s) => s.loginWithBiometric);
 const enableBiometric = useAuthStore((s) => s.enableBiometric);
 const setShowBiometricPrompt = useAuthStore((s) => s.setShowBiometricPrompt);
 const setShowEnableBiometricModal = useAuthStore((s) => s.setShowEnableBiometricModal);

 // Check biometric availability on mount
 useEffect(() => {
   if (Capacitor.isNativePlatform()) {
     checkBiometricAvailability();
   }
 }, [checkBiometricAvailability]);

 // Auto-trigger biometric login if enabled
 useEffect(() => {
   if (
     Capacitor.isNativePlatform() &&
     biometricStatus.isAvailable &&
     biometricEnabled &&
     !biometricCheckedRef.current
   ) {
     biometricCheckedRef.current = true;
     handleBiometricLogin();
   }
 }, [biometricStatus.isAvailable, biometricEnabled]);

 const handleBiometricLogin = async () => {
   const success = await loginWithBiometric();
   if (success) {
     const user = useAuthStore.getState().user;
     toast.success(`Welcome back, ${user?.name}!`);
     navigate(isAdmin ? '/admin' : '/dashboard');
   } else {
     toast.error('Biometric authentication failed. Please use your password.');
   }
 };

 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   if (!email || !password) {
     toast.error('Please fill in all fields');
     return;
   }

   setIsSubmitting(true);
   try {
     await login(email, password);
     const user = useAuthStore.getState().user;

     if (isAdmin && user?.role === 'employee') {
       toast.error('Access denied. This portal is for HR/Admin only.');
       await useAuthStore.getState().logout();
       setIsSubmitting(false);
       return;
     }

     if (!isAdmin && (user?.role === 'admin' || user?.role === 'hr')) {
       toast.error('Please use the admin portal to login.');
       await useAuthStore.getState().logout();
       setIsSubmitting(false);
       return;
     }

     toast.success(`Welcome back, ${user?.name}!`);

     // On native platform, offer to enable biometrics after first login
     if (
       Capacitor.isNativePlatform() &&
       biometricStatus.isAvailable &&
       !biometricEnabled
     ) {
       // Store credentials temporarily for biometric enrollment
       sessionStorage.setItem('_bio_email', email);
       sessionStorage.setItem('_bio_pass', password);
       setShowEnableBiometricModal(true);
     } else {
       navigate(isAdmin ? '/admin' : '/dashboard');
     }
   } catch (err: any) {
     toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
   } finally {
     setIsSubmitting(false);
   }
 };

 const handleEnableBiometric = async () => {
   const bioEmail = sessionStorage.getItem('_bio_email') || email;
   const bioPass = sessionStorage.getItem('_bio_pass') || password;
   await enableBiometric(bioEmail, bioPass);
   sessionStorage.removeItem('_bio_email');
   sessionStorage.removeItem('_bio_pass');
   toast.success('Biometric login enabled!');
   navigate(isAdmin ? '/admin' : '/dashboard');
 };

 const handleSkipBiometric = () => {
   sessionStorage.removeItem('_bio_email');
   sessionStorage.removeItem('_bio_pass');
   setShowEnableBiometricModal(false);
   navigate(isAdmin ? '/admin' : '/dashboard');
 };

 const isNative = Capacitor.isNativePlatform();
 const BiometricIcon = biometricStatus.biometryType === 'faceId' ? ScanFace : Fingerprint;

  return (
    <div className="min-h-screen flex bg-transparent relative z-0">
      <MechanicalBackground />

      {/* Biometric Prompt Overlay */}
      {showBiometricPrompt && (
        <BiometricPrompt
          biometryType={biometricStatus.biometryType}
          isAuthenticating={true}
          onUsePassword={() => setShowBiometricPrompt(false)}
        />
      )}

      {/* Enable Biometric Modal */}
      {showEnableBiometricModal && (
        <EnableBiometricModal
          biometryType={biometricStatus.biometryType}
          onEnable={handleEnableBiometric}
          onSkip={handleSkipBiometric}
        />
      )}

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gpt-panel/60 backdrop-blur-md border-r border-[#2f2f2f]/50">
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24 text-white">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-gpt-panel text-gpt-panel rounded-xl flex items-center justify-center shadow-soft">
              <Cog className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">MechZie</h1>
              <p className="text-xs text-gpt-muted font-bold tracking-wider uppercase">Attendance System</p>
            </div>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6 text-white">
            {isAdmin ? 'HR Admin Portal' : 'Employee Portal'}
          </h2>
          <p className="text-gpt-muted text-lg leading-relaxed max-w-md font-medium">
            {isAdmin
              ? 'Manage your workforce attendance, track leave requests, and generate payroll-ready reports — all in one place.'
              : 'Clock in, track your attendance, manage leave requests, and download your timesheets with ease.'}
          </p>

          <div className="mt-16 grid grid-cols-2 gap-8 max-w-sm">
            <div className="p-2">
              <div className="text-3xl font-extrabold text-white">100%</div>
              <div className="text-sm font-semibold text-gpt-muted mt-2">Accurate Tracking</div>
            </div>
            <div className="p-2">
              <div className="text-3xl font-extrabold text-white">Real-time</div>
              <div className="text-sm font-semibold text-gpt-muted mt-2">Attendance Data</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 bg-gpt-panel/60 backdrop-blur-md relative">
        <div className="w-full max-w-md animate-fade-in relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 bg-gpt-panel text-gpt-panel rounded-xl flex items-center justify-center shadow-soft">
              <Cog className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">MechZie</h1>
              <p className="text-[10px] text-gpt-muted tracking-wider uppercase font-bold">Attendance System</p>
            </div>
          </div>

          <div className="card p-10 lg:p-12 shadow-xl border-[#2f2f2f]">
            <div className="mb-10">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
                isAdmin
                  ? 'bg-gpt-panel text-gpt-panel'
                  : 'bg-[#2f2f2f] text-gpt-light'
              }`}>
                {isAdmin ? '🔒 Admin Access' : '👤 Employee Access'}
              </div>
              <h2 className="text-2xl font-bold text-white">
                {isAdmin ? 'Admin Login' : 'Welcome Back'}
              </h2>
              <p className="text-gpt-muted mt-1">
                Enter your credentials to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="label">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isAdmin ? 'admin@mechzie.com' : 'your.email@mechzie.com'}
                  className="input-field"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="login-password" className="label">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-field pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gpt-muted hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full h-11"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Biometric login button — only on native with biometrics enabled */}
            {isNative && biometricStatus.isAvailable && biometricEnabled && (
              <>
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-[#2f2f2f]" />
                  <span className="text-xs text-gpt-muted font-medium uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-[#2f2f2f]" />
                </div>
                <button
                  onClick={handleBiometricLogin}
                  disabled={isSubmitting}
                  className="btn-secondary w-full h-11 group"
                >
                  <BiometricIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Sign in with {biometricStatus.biometryType === 'faceId' ? 'Face ID' : 'Fingerprint'}
                </button>
              </>
            )}

            {!isAdmin && (
              <p className="text-center text-sm text-gpt-muted mt-8 font-medium">
                Are you an admin?{' '}
                <a href="/admin/login" className="text-white hover:underline font-bold">
                  Login here
                </a>
              </p>
            )}

            {isAdmin && (
              <div className="text-center mt-8 space-y-2">
                <p className="text-sm text-gpt-muted font-medium">
                  Employee login?{' '}
                  <a href="/login" className="text-white hover:underline font-bold">
                    Go to employee portal
                  </a>
                </p>
              </div>
            )}
          </div>

          <p className="text-center text-sm font-medium text-gpt-muted mt-10">
            Powered by <span className="font-bold text-white">Varnainfotech</span>
          </p>
        </div>
      </div>
    </div>
 );
}
