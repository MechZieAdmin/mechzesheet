/**
 * EnableBiometricModal — Post-login prompt to enable biometric authentication
 * 
 * Shown after the user's first successful login on a native device.
 * Offers the option to enable fingerprint/Face ID for future logins.
 */
import { useState } from 'react';
import { Fingerprint, ScanFace, ShieldCheck, X, Loader2 } from 'lucide-react';

interface EnableBiometricModalProps {
  biometryType: 'fingerprint' | 'faceId' | 'iris' | 'none';
  onEnable: () => Promise<void>;
  onSkip: () => void;
}

export default function EnableBiometricModal({
  biometryType,
  onEnable,
  onSkip,
}: EnableBiometricModalProps) {
  const [isEnabling, setIsEnabling] = useState(false);

  const Icon = biometryType === 'faceId' ? ScanFace : Fingerprint;
  const label = biometryType === 'faceId' ? 'Face ID' : 'Fingerprint';

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      await onEnable();
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl">
      <div className="w-full max-w-sm mx-4 animate-slide-up">
        <div className="card p-8 text-center border-[#2f2f2f] bg-[#212121]/90 backdrop-blur-2xl relative">
          {/* Close button */}
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gpt-muted hover:text-white hover:bg-[#2f2f2f] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Shield + biometric icon */}
          <div className="relative mx-auto mb-6 w-20 h-20">
            {/* Gradient glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-white/5 blur-xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2f2f2f] to-[#1a1a1a] border border-[#404040] flex items-center justify-center shadow-lg">
                <Icon className="w-8 h-8 text-white" />
              </div>
            </div>
            {/* Shield badge */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg border-2 border-[#212121]">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Content */}
          <h3 className="text-lg font-bold text-white mb-2">
            Enable {label} Login
          </h3>
          <p className="text-sm text-gpt-muted mb-8 leading-relaxed max-w-xs mx-auto">
            Sign in faster and more securely using your device's {label.toLowerCase()}.
            Your credentials are stored in the device's secure keystore.
          </p>

          {/* Features list */}
          <div className="space-y-3 mb-8 text-left">
            {[
              'Instant sign-in with one touch',
              'Credentials encrypted on device',
              'Disable anytime from settings',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                </div>
                <span className="text-sm text-gpt-light">{feature}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleEnable}
              disabled={isEnabling}
              className="btn-primary w-full h-11"
            >
              {isEnabling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <Icon className="w-4 h-4" />
                  Enable {label}
                </>
              )}
            </button>
            <button
              onClick={onSkip}
              disabled={isEnabling}
              className="w-full h-10 text-sm font-medium text-gpt-muted hover:text-white transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
