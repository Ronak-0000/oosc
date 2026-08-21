import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signInEmail, signUpEmail, authError, clearAuthError } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'verification_sent'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setLoadingGoogle(true);
    setLocalError(null);
    setSuccessInfo(null);
    clearAuthError();
    try {
      await signIn();
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('authorized')) {
        setLocalError(
          'Google Sign-in: This domain is not listed in your Firebase Authorized Domains. You can use Email Sign-in below or add your domain in Firebase Console.'
        );
      } else {
        setLocalError(err?.message || 'Google sign-in popup was closed.');
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setLoadingEmail(true);
    setLocalError(null);
    setSuccessInfo(null);
    clearAuthError();

    try {
      if (authMode === 'signup') {
        await signUpEmail(email.trim(), password, displayName.trim());
        setAuthMode('verification_sent');
        setSuccessInfo(
          `Account created for ${email.trim()}! Please open your email inbox, click the verification link, and then sign in.`
        );
      } else {
        await signInEmail(email.trim(), password);
        onClose();
      }
    } catch (err: any) {
      if (err?.code === 'auth/verification-sent') {
        setAuthMode('verification_sent');
        setSuccessInfo(err.message);
      } else if (err?.code === 'auth/unverified-email') {
        setAuthMode('verification_sent');
        setSuccessInfo(err.message);
      } else {
        setLocalError(err?.message || 'Authentication failed. Please check your details.');
      }
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        ref={modalContentRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#CBD5E1] overflow-hidden flex flex-col cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#0F172A] text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#006c4a] text-[24px]">gavel</span>
            <div>
              <h3 className="font-headline font-bold text-[18px]">
                {authMode === 'signin' ? 'Sign in to CaseLoop' : 'Create Free Account'}
              </h3>
              <p className="text-[12px] text-slate-300">Sync your cases & legal notice drafts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          {(localError || authError) && (
            <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-3.5 text-[12.5px] text-[#991B1B] flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-[#DC2626] shrink-0 mt-0.5">
                info
              </span>
              <div className="flex-grow">
                <p className="font-semibold">Notice</p>
                <p className="mt-0.5 leading-relaxed">{localError || authError}</p>
              </div>
            </div>
          )}

          {authMode === 'verification_sent' ? (
            <div className="flex flex-col items-center text-center gap-3 py-2 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-full bg-[#DCFCE7] text-[#006c4a] flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px]">mark_email_unread</span>
              </div>
              <h4 className="font-headline font-bold text-[18px] text-[#0F172A]">
                Check Your Inbox to Verify
              </h4>
              <p className="text-[13px] text-[#475569] leading-relaxed max-w-sm">
                {successInfo ||
                  `We've sent a verification link to ${email || 'your email'}. Please click the link to activate your account before logging in.`}
              </p>

              <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-xl text-left text-[12px] text-[#64748B] flex flex-col gap-1.5 mt-1">
                <div className="flex items-center gap-2 text-[#0F172A] font-semibold">
                  <span className="material-symbols-outlined text-[16px] text-[#006c4a]">check_circle</span>
                  <span>1. Open the verification email</span>
                </div>
                <div className="flex items-center gap-2 text-[#0F172A] font-semibold">
                  <span className="material-symbols-outlined text-[16px] text-[#006c4a]">check_circle</span>
                  <span>2. Click the confirmation link</span>
                </div>
                <div className="flex items-center gap-2 text-[#0F172A] font-semibold">
                  <span className="material-symbols-outlined text-[16px] text-[#006c4a]">check_circle</span>
                  <span>3. Return here and Sign In</span>
                </div>
              </div>

              <div className="flex flex-col w-full gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setLocalError(null);
                    setSuccessInfo(null);
                  }}
                  className="w-full py-3 bg-[#006c4a] hover:bg-[#005137] text-white font-bold rounded-xl text-[14px] transition-all cursor-pointer shadow-md"
                >
                  I have verified my email — Sign In
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (email.trim() && password.trim()) {
                      try {
                        setLoadingEmail(true);
                        await signInEmail(email.trim(), password);
                      } catch (err: any) {
                        setLocalError('Verification email resent to ' + email.trim());
                      } finally {
                        setLoadingEmail(false);
                      }
                    } else {
                      setAuthMode('signin');
                    }
                  }}
                  className="w-full py-2.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-semibold rounded-xl text-[13px] transition-all cursor-pointer"
                >
                  Resend Verification Email
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Option 1: Continue with Google */}
              <button
                onClick={handleGoogleAuth}
                disabled={loadingGoogle || loadingEmail}
                className="w-full py-3 px-4 bg-white hover:bg-[#F8FAFC] border-2 border-[#CBD5E1] hover:border-[#0F172A] text-[#0F172A] font-semibold rounded-xl text-[14px] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loadingGoogle ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <div className="flex items-center my-1">
                <div className="flex-grow border-t border-[#E2E8F0]"></div>
                <span className="px-3 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                  OR EMAIL LOGIN
                </span>
                <div className="flex-grow border-t border-[#E2E8F0]"></div>
              </div>

              {/* Toggle between Sign in and Sign up */}
              <div className="flex bg-[#F1F5F9] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setLocalError(null);
                    clearAuthError();
                  }}
                  className={`flex-1 py-1.5 text-[13px] font-semibold rounded-lg transition-all cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-white text-[#0F172A] shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setLocalError(null);
                    clearAuthError();
                  }}
                  className={`flex-1 py-1.5 text-[13px] font-semibold rounded-lg transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-white text-[#0F172A] shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Option 2: Email Form */}
              <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[14px] text-[#0F172A] outline-none focus:border-[#006c4a]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[14px] text-[#0F172A] outline-none focus:border-[#006c4a]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[14px] text-[#0F172A] outline-none focus:border-[#006c4a]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingEmail || loadingGoogle}
                  className="w-full py-3 px-4 bg-[#006c4a] hover:bg-[#005137] text-white font-bold rounded-xl text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md mt-1 disabled:opacity-50"
                >
                  {loadingEmail ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                      <span>{authMode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
                    </>
                  ) : (
                    <span>{authMode === 'signin' ? 'Sign In with Email' : 'Create Free Account'}</span>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[12px] text-[#64748B]">
          <span>Protected with Firebase Auth</span>
          <button
            onClick={onClose}
            className="text-[#475569] hover:text-[#0F172A] font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
