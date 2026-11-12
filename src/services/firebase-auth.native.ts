import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  updateProfile,
  type ConfirmationResult,
} from '@react-native-firebase/auth';

const auth = getAuth();
let phoneConfirmation: ConfirmationResult | null = null;

export function getFirebaseUser() {
  return new Promise<ReturnType<typeof getAuth>['currentUser']>((resolve) => {
    let unsubscribe: (() => void) | undefined;
    let resolved = false;
    unsubscribe = onAuthStateChanged(auth, (user) => {
      resolved = true;
      unsubscribe?.();
      resolve(user);
    });
    if (resolved) unsubscribe();
  });
}

export async function firebaseEmailLogin(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
}

export async function firebaseEmailRegister(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  await updateProfile(credential.user, { displayName: name.trim() });
  await sendEmailVerification(credential.user);
  return credential;
}

export async function firebaseGoogleLogin(googleIdToken: string) {
  return signInWithCredential(auth, GoogleAuthProvider.credential(googleIdToken));
}

export async function firebaseSendPhoneCode(phoneNumber: string) {
  phoneConfirmation = await signInWithPhoneNumber(auth, phoneNumber.trim());
}

export async function firebaseConfirmPhoneCode(code: string) {
  if (!phoneConfirmation) throw new Error('Request a new phone verification code first.');
  const credential = await phoneConfirmation.confirm(code.trim());
  phoneConfirmation = null;
  if (!credential) throw new Error('Phone verification could not be completed.');
  return credential;
}

export async function firebaseLogout() {
  phoneConfirmation = null;
  await signOut(auth);
}
