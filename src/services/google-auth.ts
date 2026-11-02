import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

export const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '731856766862-nd6rfig6r6862qtlujhk550knvtkm1na.apps.googleusercontent.com';

export interface GoogleAuthResult {
  idToken: string;
}

/**
 * Initiates Google OAuth 2.0 flow via in-app browser session.
 * Obtains an OpenID Connect id_token to exchange with POST /api/v1/auth/google.
 */
export async function promptGoogleSignIn(): Promise<GoogleAuthResult | null> {
  const redirectUrl = Linking.createURL('auth/google/callback');
  const nonce = Math.random().toString(36).substring(2, 15);

  const authUrl =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
    '&response_type=id_token' +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&nonce=${encodeURIComponent(nonce)}`;

  try {
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

    if (result.type === 'success' && result.url) {
      const hashOrQuery = result.url.includes('#')
        ? result.url.split('#')[1]
        : result.url.split('?')[1] || '';
      const params = new URLSearchParams(hashOrQuery);
      const idToken = params.get('id_token');

      if (idToken) {
        return { idToken };
      }
    }
  } catch (err) {
    console.warn('[GoogleAuth] OAuth session error:', err);
  }

  return null;
}
