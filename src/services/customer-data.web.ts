import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { firestore } from './firebase';

function requireFirestore() {
  if (!firestore) throw new Error('Firebase is not configured. Add the Firebase app values to .env.local.');
  return firestore;
}

export async function saveCustomerProfile(uid: string, profile: { name?: string; phone?: string }) {
  const db = requireFirestore();
  await setDoc(doc(db, 'customers', uid), {
    ...(profile.name !== undefined ? { name: profile.name.trim().slice(0, 120) } : {}),
    ...(profile.phone !== undefined ? { phone: profile.phone.trim().slice(0, 32) } : {}),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function readFavoriteIds(uid: string): Promise<string[]> {
  const snapshot = await getDocs(collection(requireFirestore(), 'customers', uid, 'favorites'));
  return snapshot.docs.map((favorite) => favorite.id);
}

export async function writeFavorite(uid: string, dishId: string, enabled: boolean) {
  const favoriteRef = doc(requireFirestore(), 'customers', uid, 'favorites', dishId);
  if (enabled) await setDoc(favoriteRef, { dishId, createdAt: serverTimestamp() });
  else await deleteDoc(favoriteRef);
}
