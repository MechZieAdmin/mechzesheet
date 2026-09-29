/**
 * Biometric Authentication Utility
 * 
 * Wraps capacitor-native-biometric for fingerprint/Face ID support.
 * Gracefully degrades on web (non-native) platforms.
 */
import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';
import { Preferences } from '@capacitor/preferences';

const BIOMETRIC_ENABLED_KEY = 'mechzie_biometric_enabled';
const BIOMETRIC_CREDENTIALS_SERVER = 'com.mechzie.app';

export interface BiometricStatus {
  isAvailable: boolean;
  biometryType: 'fingerprint' | 'faceId' | 'iris' | 'none';
}

/**
 * Check if biometric authentication is available on this device
 */
export async function isBiometricAvailable(): Promise<BiometricStatus> {
  if (!Capacitor.isNativePlatform()) {
    return { isAvailable: false, biometryType: 'none' };
  }

  try {
    const result = await NativeBiometric.isAvailable();
    let biometryType: BiometricStatus['biometryType'] = 'none';

    switch (result.biometryType) {
      case BiometryType.FINGERPRINT:
        biometryType = 'fingerprint';
        break;
      case BiometryType.FACE_AUTHENTICATION:
      case BiometryType.FACE_ID:
        biometryType = 'faceId';
        break;
      case BiometryType.IRIS_AUTHENTICATION:
        biometryType = 'iris';
        break;
      default:
        biometryType = 'fingerprint';
    }

    return { isAvailable: result.isAvailable, biometryType };
  } catch {
    return { isAvailable: false, biometryType: 'none' };
  }
}

/**
 * Trigger biometric authentication prompt
 */
export async function authenticateWithBiometric(
  reason = 'Verify your identity to access MechZie'
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    await NativeBiometric.verifyIdentity({
      reason,
      title: 'MechZie Login',
      subtitle: 'Use biometrics to sign in',
      description: 'Place your finger on the sensor or look at the camera',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Save credentials for biometric login
 * Credentials are stored in the device's secure keystore
 */
export async function enableBiometricLogin(
  email: string,
  password: string
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    await NativeBiometric.setCredentials({
      username: email,
      password: password,
      server: BIOMETRIC_CREDENTIALS_SERVER,
    });

    await Preferences.set({
      key: BIOMETRIC_ENABLED_KEY,
      value: 'true',
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieve stored credentials after successful biometric verification
 */
export async function getBiometricCredentials(): Promise<{
  email: string;
  password: string;
} | null> {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const credentials = await NativeBiometric.getCredentials({
      server: BIOMETRIC_CREDENTIALS_SERVER,
    });

    return {
      email: credentials.username,
      password: credentials.password,
    };
  } catch {
    return null;
  }
}

/**
 * Disable biometric login and remove stored credentials
 */
export async function disableBiometricLogin(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await NativeBiometric.deleteCredentials({
      server: BIOMETRIC_CREDENTIALS_SERVER,
    });
  } catch {
    // Credentials might not exist, ignore
  }

  await Preferences.set({
    key: BIOMETRIC_ENABLED_KEY,
    value: 'false',
  });
}

/**
 * Check if biometric login is enabled by the user
 */
export async function isBiometricLoginEnabled(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const { value } = await Preferences.get({ key: BIOMETRIC_ENABLED_KEY });
    return value === 'true';
  } catch {
    return false;
  }
}
