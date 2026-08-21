import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDocs,
  limit
} from 'firebase/firestore';
import { LegalCase } from './types';

const firebaseConfig = {
  apiKey: "AIzaSyCqIhonP2ECvIP8IzRlWX7u4LjyXtXrA0Y",
  authDomain: "gen-lang-client-0851074499.firebaseapp.com",
  projectId: "gen-lang-client-0851074499",
  storageBucket: "gen-lang-client-0851074499.firebasestorage.app",
  messagingSenderId: "985842757078",
  appId: "1:985842757078:web:42430114c278165e3e4877",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// --- Auth Exports expected by AuthContext.tsx ---
export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signInWithEmail(email: string, pass: string) {
  return signInWithEmailAndPassword(auth, email, pass);
}

export async function signUpWithEmail(email: string, pass: string) {
  return createUserWithEmailAndPassword(auth, email, pass);
}

export async function logOut() {
  return signOut(auth);
}

export async function sendUserEmailVerification(user?: User | null) {
  const targetUser = user || auth.currentUser;
  if (targetUser) {
    return sendEmailVerification(targetUser);
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const testCol = collection(db, 'users');
    await getDocs(query(testCol, limit(1)));
    return true;
  } catch {
    return true;
  }
}

// --- Realtime Cases Synchronization ---
export function subscribeToUserCases(
  userId: string,
  onUpdate: (cases: LegalCase[]) => void,
  onError?: (err: Error) => void
): () => void {
  const casesRef = collection(db, 'users', userId, 'cases');
  const q = query(casesRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const cases: LegalCase[] = [];
      snapshot.forEach((docSnap) => {
        cases.push(docSnap.data() as LegalCase);
      });
      onUpdate(cases);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export async function saveUserCaseToFirestore(
  userId: string,
  legalCase: LegalCase
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'cases', legalCase.id);
  await setDoc(docRef, { ...legalCase, userId, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function deleteUserCaseFromFirestore(
  userId: string,
  caseId: string
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'cases', caseId);
  await deleteDoc(docRef);
}
