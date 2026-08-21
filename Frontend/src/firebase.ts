import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { LegalCase } from './types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with databaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline. Please check connection.');
    }
  }
}

// Google Authentication
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Save/update user profile in Firestore
    const userDocPath = `users/${user.uid}`;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          userId: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Citizen User',
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userDocPath);
    }

    return user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

// Email & Password Sign In
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    const user = result.user;

    const userDocPath = `users/${user.uid}`;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || email.split('@')[0],
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userDocPath);
    }

    return user;
  } catch (error: any) {
    console.error('Email Sign-In Error:', error);
    throw error;
  }
}

// Email & Password Sign Up
export async function signUpWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const user = result.user;

    const name = displayName?.trim() || email.split('@')[0];
    try {
      await updateProfile(user, { displayName: name });
    } catch (e) {
      console.warn('Could not update profile name', e);
    }

    const userDocPath = `users/${user.uid}`;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          userId: user.uid,
          email: user.email,
          displayName: name,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userDocPath);
    }

    return user;
  } catch (error: any) {
    console.error('Email Sign-Up Error:', error);
    throw error;
  }
}

// Send Email Verification
export async function sendUserEmailVerification(user?: User): Promise<void> {
  const targetUser = user || auth.currentUser;
  if (!targetUser) {
    throw new Error('No user is currently signed in to send verification email.');
  }
  try {
    await sendEmailVerification(targetUser);
  } catch (error: any) {
    console.error('Send Email Verification Error:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

// Case document Firestore format helper
function serializeCaseForFirestore(legalCase: LegalCase, userId: string) {
  return {
    id: legalCase.id,
    userId,
    caseNumber: legalCase.caseNumber || `#CL-${Date.now()}`,
    title: legalCase.title || 'Untitled Case',
    category: legalCase.category || 'General Grievance',
    rulebookId: legalCase.rulebookId || 'sunshine_rti',
    status: legalCase.status || 'drafting',
    statusBadge: legalCase.statusBadge || 'Active',
    statusType: legalCase.statusType || 'warning',
    deadlineText: legalCase.deadlineText || 'Statutory Window',
    filedDate: legalCase.filedDate || new Date().toISOString(),
    description: legalCase.description || '',
    rawIntakeText: legalCase.rawIntakeText || '',
    redactedText: legalCase.redactedText || '',
    requestScope: legalCase.requestScope || '',
    dateRange: legalCase.dateRange || '',
    statute: legalCase.statute || '',
    score: Number(legalCase.score) || 85,
    hasHardshipClause: Boolean(legalCase.hasHardshipClause),
    autoRedactEnabled: Boolean(legalCase.autoRedactEnabled),
    autoEscalateEnabled: Boolean(legalCase.autoEscalateEnabled),
    daysRemaining: Number(legalCase.daysRemaining) || 18,
    revisionCount: Number(legalCase.revisionCount) || 1,
    lastEdited: legalCase.lastEdited || 'Just now',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Complex nested fields stored serialized for robustness
    facts: JSON.stringify(legalCase.facts || []),
    piiItems: JSON.stringify(legalCase.piiItems || []),
    officer: JSON.stringify(legalCase.officer || {}),
  };
}

function deserializeCaseFromFirestore(data: any): LegalCase {
  let facts = [];
  let piiItems = [];
  let officer = {
    name: 'Authorized Officer',
    title: 'Public Information Officer',
    department: 'Grievance Redressal Division',
    avatar: 'AO',
    jurisdiction: 'Jurisdiction Hub',
  };

  try {
    if (typeof data.facts === 'string') facts = JSON.parse(data.facts);
    else if (Array.isArray(data.facts)) facts = data.facts;
  } catch {}

  try {
    if (typeof data.piiItems === 'string') piiItems = JSON.parse(data.piiItems);
    else if (Array.isArray(data.piiItems)) piiItems = data.piiItems;
  } catch {}

  try {
    if (typeof data.officer === 'string') officer = JSON.parse(data.officer);
    else if (data.officer) officer = data.officer;
  } catch {}

  return {
    id: data.id,
    caseNumber: data.caseNumber,
    title: data.title,
    category: data.category,
    rulebookId: data.rulebookId,
    status: data.status,
    statusBadge: data.statusBadge,
    statusType: data.statusType,
    deadlineText: data.deadlineText,
    filedDate: data.filedDate,
    description: data.description,
    rawIntakeText: data.rawIntakeText,
    redactedText: data.redactedText,
    requestScope: data.requestScope,
    dateRange: data.dateRange,
    statute: data.statute,
    score: data.score,
    hasHardshipClause: data.hasHardshipClause,
    autoRedactEnabled: data.autoRedactEnabled,
    autoEscalateEnabled: data.autoEscalateEnabled,
    daysRemaining: data.daysRemaining,
    revisionCount: data.revisionCount,
    lastEdited: data.lastEdited,
    facts,
    piiItems,
    officer,
  };
}

// Real-time listener for user cases
export function subscribeToUserCases(
  userId: string,
  onCasesChanged: (cases: LegalCase[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const collectionPath = `users/${userId}/cases`;
  const casesCol = collection(db, 'users', userId, 'cases');

  return onSnapshot(
    casesCol,
    (snapshot) => {
      const casesList: LegalCase[] = [];
      snapshot.forEach((docSnap) => {
        casesList.push(deserializeCaseFromFirestore(docSnap.data()));
      });
      onCasesChanged(casesList);
    },
    (error) => {
      console.error('Real-time cases sync error:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

// Save or update a case in Firestore
export async function saveUserCaseToFirestore(userId: string, legalCase: LegalCase): Promise<void> {
  const docPath = `users/${userId}/cases/${legalCase.id}`;
  try {
    const payload = serializeCaseForFirestore(legalCase, userId);
    await setDoc(doc(db, 'users', userId, 'cases', legalCase.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

// Delete a case from Firestore
export async function deleteUserCaseFromFirestore(userId: string, caseId: string): Promise<void> {
  const docPath = `users/${userId}/cases/${caseId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'cases', caseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
