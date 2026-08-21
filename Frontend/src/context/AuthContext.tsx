import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  sendUserEmailVerification,
  logOut,
  testConnection,
} from '../firebase';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: () => Promise<AppUser>;
  signInEmail: (email: string, pass: string) => Promise<AppUser>;
  signUpEmail: (email: string, pass: string, name?: string) => Promise<AppUser>;
  sendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {
    throw new Error('AuthContext not initialized');
  },
  signInEmail: async () => {
    throw new Error('AuthContext not initialized');
  },
  signUpEmail: async () => {
    throw new Error('AuthContext not initialized');
  },
  sendVerificationEmail: async () => {
    throw new Error('AuthContext not initialized');
  },
  reloadUser: async () => {},
  signOut: async () => {},
  authError: null,
  clearAuthError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    testConnection().catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const appUser: AppUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Citizen',
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignInGoogle = async (): Promise<AppUser> => {
    setAuthError(null);
    try {
      const loggedUser = await signInWithGoogle();
      const appUser: AppUser = {
        uid: loggedUser.uid,
        email: loggedUser.email,
        displayName: loggedUser.displayName || 'Citizen',
        photoURL: loggedUser.photoURL,
        emailVerified: loggedUser.emailVerified,
      };
      setUser(appUser);
      return appUser;
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      let message = 'Google sign-in could not be completed.';

      if (err?.code === 'auth/unauthorized-domain') {
        message =
          'This domain is not yet authorized for Google Sign-In in Firebase. Please use Email Login below, or add this domain in Firebase Console > Authentication > Settings > Authorized Domains.';
      } else if (err?.code === 'auth/popup-blocked') {
        message = 'Google sign-in popup was blocked by your browser. Please allow popups or use Email Login.';
      } else if (err?.code === 'auth/cancelled-popup-request' || err?.code === 'auth/popup-closed-by-user') {
        message = 'The Google sign-in window was closed before completing.';
      } else if (err?.message) {
        message = err.message;
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  const handleSignInEmail = async (email: string, pass: string): Promise<AppUser> => {
    setAuthError(null);
    try {
      const loggedUser = await signInWithEmail(email, pass);

      // Check if email is verified
      if (!loggedUser.emailVerified) {
        // Send a fresh verification email
        try {
          await sendUserEmailVerification(loggedUser);
        } catch (vErr) {
          console.warn('Could not auto-resend verification on login attempt:', vErr);
        }
        await logOut();
        setUser(null);
        const unverifiedError: any = new Error(
          'Email verification required. We have sent a verification link to your email. Please click the link to verify your account before logging in.'
        );
        unverifiedError.code = 'auth/unverified-email';
        throw unverifiedError;
      }

      const appUser: AppUser = {
        uid: loggedUser.uid,
        email: loggedUser.email,
        displayName: loggedUser.displayName || email.split('@')[0],
        photoURL: loggedUser.photoURL,
        emailVerified: loggedUser.emailVerified,
      };
      setUser(appUser);
      return appUser;
    } catch (err: any) {
      console.error('Email sign-in error:', err);
      let message = 'Could not sign in with this email and password.';
      if (err?.code === 'auth/unverified-email') {
        message = err.message;
      } else if (err?.code === 'auth/operation-not-allowed') {
        message =
          'Email/Password provider is not enabled in Firebase Console. Go to Firebase Console > Authentication > Sign-in method > Enable "Email/Password", or click "Continue with Google".';
      } else if (
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/invalid-credential'
      ) {
        message = 'Invalid email or password. If you do not have an account yet, click "Create Account".';
      } else if (err?.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err?.message) {
        message = err.message;
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  const handleSignUpEmail = async (email: string, pass: string, name?: string): Promise<AppUser> => {
    setAuthError(null);
    try {
      const loggedUser = await signUpWithEmail(email, pass, name);

      // Send email verification link
      try {
        await sendUserEmailVerification(loggedUser);
      } catch (verifErr: any) {
        console.warn('Auto verification email notice:', verifErr);
      }

      // Log out unverified user to prevent unverified session
      await logOut();
      setUser(null);

      const verificationNeeded: any = new Error(
        `Account created for ${email}! A verification link has been sent to your email inbox. Please verify your email before signing in.`
      );
      verificationNeeded.code = 'auth/verification-sent';
      throw verificationNeeded;
    } catch (err: any) {
      console.error('Email sign-up error:', err);
      let message = 'Could not create account.';
      if (err?.code === 'auth/verification-sent') {
        message = err.message;
      } else if (err?.code === 'auth/operation-not-allowed') {
        message =
          'Email/Password registration is not enabled in Firebase Console. Go to Firebase Console > Authentication > Sign-in method > Enable "Email/Password", or click "Continue with Google".';
      } else if (err?.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists. Please sign in instead.';
      } else if (err?.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (err?.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err?.message) {
        message = err.message;
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  const handleSendVerificationEmail = async () => {
    setAuthError(null);
    if (!auth.currentUser) {
      const msg = 'You must be signed in to send a verification email.';
      setAuthError(msg);
      throw new Error(msg);
    }
    try {
      await sendUserEmailVerification(auth.currentUser);
    } catch (err: any) {
      console.error('Send verification email error:', err);
      let message = 'Failed to send verification email.';
      if (err?.code === 'auth/operation-not-allowed') {
        message =
          'Email verification is not enabled in Firebase Console. Enable "Email/Password" provider in Firebase Console > Authentication > Sign-in method.';
      } else if (err?.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please wait a few moments before trying to resend the verification email.';
      } else if (err?.message) {
        message = err.message;
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  const handleReloadUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      setUser({
        uid: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName || updatedUser.email?.split('@')[0] || 'Citizen',
        photoURL: updatedUser.photoURL,
        emailVerified: updatedUser.emailVerified,
      });
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    try {
      await logOut();
      setUser(null);
    } catch (err: any) {
      console.error('Sign-out failed:', err);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignInGoogle,
        signInEmail: handleSignInEmail,
        signUpEmail: handleSignUpEmail,
        sendVerificationEmail: handleSendVerificationEmail,
        reloadUser: handleReloadUser,
        signOut: handleSignOut,
        authError,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
