import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';

const db = getFirestore();

export async function saveCustomerProfile(uid: string, profile: { name?: string; phone?: string }) {
  await setDoc(
    doc(db, 'customers', uid),
    {
      ...(profile.name !== undefined ? { name: profile.name.trim().slice(0, 120) } : {}),
      ...(profile.phone !== undefined ? { phone: profile.phone.trim().slice(0, 32) } : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function readFavoriteIds(uid: string): Promise<string[]> {
  const snapshot = await getDocs(collection(db, 'customers', uid, 'favorites'));
  return snapshot.docs.map((favorite) => favorite.id);
}

export async function writeFavorite(uid: string, dishId: string, enabled: boolean) {
  const favoriteRef = doc(db, 'customers', uid, 'favorites', dishId);
  if (enabled) await setDoc(favoriteRef, { dishId, createdAt: serverTimestamp() });
  else await deleteDoc(favoriteRef);
}
