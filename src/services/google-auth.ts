import { Platform } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
  isSuccessResponse,
  isCancelledResponse,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';

/**
 * Web Client ID: Configured in Google Cloud Console as Web application OAuth Client ID.
 * Google Play Services uses this server client ID to mint an OpenID Connect id_token
 * that Supabase Auth can exchange for a Supabase session.
 */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '731856766862-nd6rfig6r6862qtlujhk550knvtkm1na.apps.googleusercontent.com';

export interface GoogleAuthResult {
  idToken: string;
}

let isConfigured = false;

export function configureGoogleSignIn(): void {
  if (isConfigured || Platform.OS === 'web') return;

  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
      scopes: ['profile', 'email'],
    });
    isConfigured = true;
  } catch (err) {
    console.warn('[GoogleAuth] Configuration failed:', err);
  }
}

/**
 * Native Android & iOS Google Sign-In using Google Play Services / GIDSignIn.
 * Returns an OpenID Connect id_token for Supabase Auth sign-in.
 */
export async function promptGoogleSignIn(): Promise<GoogleAuthResult | null> {
  if (Platform.OS === 'web') {
    // On web, direct user to website authentication or show message
    if (typeof window !== 'undefined') {
      window.location.href = 'https://purplehaze-nine.vercel.app/auth/login';
    }
    return null;
  }

  configureGoogleSignIn();

  try {
    // Ensure Google Play Services are present and up to date on Android
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Clear any previous cached account session so account picker shows if needed
    try {
      await GoogleSignin.signOut();
    } catch {
      // Non-critical if no active session
    }

    const response = await GoogleSignin.signIn();

    if (isCancelledResponse(response)) {
      // User tapped outside or cancelled the account picker
      return null;
    }

    if (isSuccessResponse(response)) {
      const idToken = response.data.idToken;
      if (idToken) {
        return { idToken };
      }
      throw new Error('Google sign-in succeeded but did not return an ID token.');
    }

    // Fallback accessor for alternative response shapes
    const fallbackToken =
      (response as any)?.data?.idToken || (response as any)?.idToken;
    if (fallbackToken) {
      return { idToken: fallbackToken };
    }

    return null;
  } catch (error: any) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          // User cancelled sign-in dialog
          return null;
        case statusCodes.IN_PROGRESS:
          console.warn('[GoogleAuth] Sign-in is already in progress');
          return null;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          throw new Error(
            'Google Play Services is not available or outdated on this device. Please update Google Play Services and try again.'
          );
        default:
          console.warn('[GoogleAuth] Native sign-in error:', error.code, error.message);
          throw new Error(error.message || 'Google sign-in failed.');
      }
    }

    console.warn('[GoogleAuth] Unexpected error:', error);
    throw error;
  }
}
