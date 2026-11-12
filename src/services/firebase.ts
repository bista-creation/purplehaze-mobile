import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'purple-haze-cfeb7',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const configured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.appId && firebaseConfig.messagingSenderId,
);

const app = configured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

export const firestore = app ? getFirestore(app) : null;

export function requireFirebaseApp() {
  if (!app) {
    throw new Error('Firebase is not configured. Add the Firebase app values to .env.local and rebuild.');
  }
  return app;
}
