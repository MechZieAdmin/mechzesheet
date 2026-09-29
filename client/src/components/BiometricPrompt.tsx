/**
 * BiometricPrompt — Premium biometric authentication overlay
 * 
 * Shows an animated fingerprint/Face ID prompt during native
 * biometric authentication. Falls back to password input.
 */
import { useEffect, useState } from 'react';
import { Fingerprint, ScanFace, Loader2, KeyRound } from 'lucide-react';

interface BiometricPromptProps {
  biometryType: 'fingerprint' | 'faceId' | 'iris' | 'none';
  isAuthenticating: boolean;
  onUsePassword: () => void;
}

export default function BiometricPrompt({
  biometryType,
  isAuthenticating,
  onUsePassword,
}: BiometricPromptProps) {
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase((prev) => (prev + 1) % 3);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const Icon = biometryType === 'faceId' ? ScanFace : Fingerprint;
  const label =
    biometryType === 'faceId' ? 'Face ID' : 'Fingerprint';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl">
      <div className="w-full max-w-sm mx-4 animate-slide-up">
        {/* Glassmorphism card */}
        <div className="card p-10 text-center border-[#2f2f2f] bg-[#212121]/90 backdrop-blur-2xl">
          {/* Animated icon container */}
          <div className="relative mx-auto mb-8 w-24 h-24">
            {/* Pulse rings */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-white/10 transition-all duration-700"
                style={{
                  transform: `scale(${1 + (pulsePhase === i ? 0.3 : 0.1 * i)})`,
                  opacity: pulsePhase === i ? 0.5 : 0.15,
                }}
              />
            ))}
            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isAuthenticating ? (
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              ) : (
                <Icon className="w-12 h-12 text-white transition-transform duration-300" />
              )}
            </div>
          </div>

          {/* Text */}
          <h3 className="text-xl font-bold text-white mb-2">
            {isAuthenticating ? 'Authenticating...' : `Use ${label}`}
          </h3>
          <p className="text-sm text-gpt-muted mb-8 leading-relaxed">
            {isAuthenticating
              ? 'Verifying your identity'
              : `Place your ${biometryType === 'faceId' ? 'face in front of the camera' : 'finger on the sensor'} to sign in`}
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#2f2f2f]" />
            <span className="text-xs text-gpt-muted font-medium uppercase tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-[#2f2f2f]" />
          </div>

          {/* Password fallback */}
          <button
            onClick={onUsePassword}
            className="btn-secondary w-full h-11"
            disabled={isAuthenticating}
          >
            <KeyRound className="w-4 h-4" />
            Use Password Instead
          </button>
        </div>
      </div>
    </div>
  );
}
