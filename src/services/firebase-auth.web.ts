import {
  createUserWithEmailAndPassword,
  type Auth,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { requireFirebaseApp } from './firebase';

let authInstance: Auth | null = null;
function getFirebaseAuth(): Auth {
  if (!authInstance) authInstance = getAuth(requireFirebaseApp());
  return authInstance;
}
export function getFirebaseUser() {
  const currentAuth = getFirebaseAuth();
  return new Promise<typeof currentAuth.currentUser>((resolve) => {
    let unsubscribe: (() => void) | undefined;
    let resolved = false;
    unsubscribe = onAuthStateChanged(currentAuth, (user) => {
      resolved = true;
      unsubscribe?.();
      resolve(user);
    });
    if (resolved) unsubscribe();
  });
}

export async function firebaseSendPhoneCode(_phoneNumber: string): Promise<void> {
  throw new Error('Phone verification is available in the Android and iOS app.');
}

export async function firebaseConfirmPhoneCode(_code: string) {
  throw new Error('Phone verification is available in the Android and iOS app.');
}

export async function firebaseEmailLogin(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email.trim().toLowerCase(), password);
}

export async function firebaseEmailRegister(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim().toLowerCase(), password);
  await updateProfile(credential.user, { displayName: name.trim() });
  await sendEmailVerification(credential.user);
  return credential;
}

export async function firebaseGoogleLogin(googleIdToken: string) {
  return signInWithCredential(getFirebaseAuth(), GoogleAuthProvider.credential(googleIdToken));
}

export async function firebaseGooglePopupLogin() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(getFirebaseAuth(), provider);
}

export async function firebaseLogout() {
  await signOut(getFirebaseAuth());
}
