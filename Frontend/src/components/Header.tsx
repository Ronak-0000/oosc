import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

interface HeaderProps {
  currentView: 'home' | 'workspace' | 'my-filings';
  onNavigate: (view: 'home' | 'workspace' | 'my-filings') => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  unreadNotifications?: number;
  filingsCount?: number;
}

export const CITIES = [
  'Delhi (NCR)',
  'Bengaluru',
  'Mumbai',
  'Chennai',
  'Hyderabad',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Chandigarh',
];

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  selectedCity,
  onSelectCity,
  unreadNotifications = 2,
  filingsCount = 0,
}) => {
  const { user, loading, signOut, sendVerificationEmail, reloadUser } = useAuth();
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authWorking, setAuthWorking] = useState(false);
  const [verifSent, setVerifSent] = useState(false);
  const [verifError, setVerifError] = useState<string | null>(null);

  const cityMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleSendVerification = async () => {
    setVerifError(null);
    setVerifSent(false);
    try {
      await sendVerificationEmail();
      setVerifSent(true);
      setTimeout(() => setVerifSent(false), 5000);
    } catch (err: any) {
      setVerifError(err?.message || 'Could not send verification email.');
    }
  };

  const handleCheckVerification = async () => {
    try {
      await reloadUser();
    } catch (err) {
      console.warn('Could not reload user status:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (cityMenuRef.current && !cityMenuRef.current.contains(target)) {
        setShowCityMenu(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(target)) {
        setShowNotificationMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowProfileMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCityMenu(false);
        setShowNotificationMenu(false);
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSignOut = async () => {
    setAuthWorking(true);
    try {
      await signOut();
      setShowProfileMenu(false);
    } catch (err) {
      console.error('Sign-out error:', err);
    } finally {
      setAuthWorking(false);
    }
  };

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] sticky top-0 z-50 transition-all duration-200">
        <div className="flex justify-between items-center w-full px-4 sm:px-8 md:px-10 max-w-[1280px] mx-auto h-16">
          {/* Brand & City Selector */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="font-headline text-[22px] font-bold text-[#0F172A] flex items-center gap-2 tracking-tight group text-left cursor-pointer"
            >
              <span className="material-symbols-outlined fill text-[#006c4a] text-[26px] group-hover:rotate-[-6deg] transition-transform duration-200">
                gavel
              </span>
              <span>CaseLoop</span>
            </button>

            <div className="hidden md:flex items-center gap-2">
              <div ref={cityMenuRef} className="relative">
                <button
                  onClick={() => setShowCityMenu(!showCityMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] hover:text-[#0F172A] rounded-full border border-[#CBD5E1] text-[12px] font-medium transition-colors cursor-pointer"
                  title="Change jurisdiction location"
                >
                  <span className="material-symbols-outlined text-[15px] text-[#64748B]">location_on</span>
                  <span>{selectedCity}</span>
                  <span className="material-symbols-outlined text-[14px] text-[#94A3B8]">arrow_drop_down</span>
                </button>

                {showCityMenu && (
                  <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-lg shadow-lg border border-[#E2E8F0] py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] border-b border-[#F1F5F9]">
                      Select Jurisdiction
                    </div>
                    {CITIES.map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          onSelectCity(city);
                          setShowCityMenu(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-[13px] flex items-center justify-between hover:bg-[#F8FAFC] transition-colors ${
                          selectedCity === city ? 'font-semibold text-[#006c4a] bg-[#F0FDF4]' : 'text-[#334155]'
                        }`}
                      >
                        {city}
                        {selectedCity === city && (
                          <span className="material-symbols-outlined text-[16px] text-[#006c4a]">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Clean Single Navigation Link */}
          <nav className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => onNavigate('my-filings')}
              className={`text-[13.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg relative ${
                currentView === 'my-filings'
                  ? 'text-[#006c4a] font-bold bg-[#F0FDF4]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">folder</span>
              <span>My Filings</span>
              {filingsCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#006c4a] text-white rounded-full">
                  {filingsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Notifications & Profile */}
          <div className="flex items-center gap-3">
            <div ref={notificationMenuRef} className="relative">
              <button
                onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                className="text-[#64748B] hover:text-[#0F172A] flex items-center justify-center w-9 h-9 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <span className="material-symbols-outlined text-[18px]">notifications</span>
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#D97706] rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {showNotificationMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#E2E8F0] p-3 z-50 animate-in fade-in duration-150">
                  <div className="flex justify-between items-center pb-2 border-b border-[#F1F5F9] mb-2">
                    <span className="font-headline font-semibold text-[14px] text-[#0F172A]">Filing Alerts</span>
                    <span className="text-[11px] text-[#059669] font-medium bg-[#059669]/10 px-2 py-0.5 rounded">2 Active</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="p-2.5 bg-[#FEF3C7]/60 border border-[#FDE68A] rounded-lg text-[12px]">
                      <div className="font-semibold text-[#92400E] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">timer</span>
                        Statutory Clock Notice
                      </div>
                      <p className="text-[#78350F] mt-0.5">Agency response required within 18 statutory calendar days.</p>
                    </div>
                    <div className="p-2.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg text-[12px]">
                      <div className="font-semibold text-[#166534] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">cloud_done</span>
                        Firebase Real-time Storage
                      </div>
                      <p className="text-[#14532D] mt-0.5">Your filings are synced automatically with zero data loss.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
            ) : user ? (
              <div ref={profileMenuRef} className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-2 py-1 rounded-full border border-[#CBD5E1] hover:border-[#94A3B8] bg-white transition-all cursor-pointer shadow-xs"
                  title="Account Settings"
                >
                  <img
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover border border-[#E2E8F0]"
                    src={
                      user.photoURL ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                    }
                  />
                  <span className="hidden sm:inline text-[12px] font-semibold text-[#1E293B] max-w-[90px] truncate">
                    {user.displayName?.split(' ')[0] || 'Citizen'}
                  </span>
                  <span className="material-symbols-outlined text-[14px] text-[#94A3B8]">expand_more</span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#E2E8F0] p-3 z-50 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#F1F5F9]">
                      <img
                        src={
                          user.photoURL ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                        }
                        alt="User"
                        className="w-9 h-9 rounded-full object-cover border border-[#E2E8F0]"
                      />
                      <div className="overflow-hidden">
                        <div className="font-semibold text-[13px] text-[#0F172A] truncate">
                          {user.displayName || 'Citizen User'}
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate">{user.email || 'citizen@caseloop.app'}</div>
                      </div>
                    </div>

                    {user.email && (
                      <div className="mt-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11.5px]">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#475569]">Email Status</span>
                          {user.emailVerified ? (
                            <span className="inline-flex items-center gap-1 text-[#059669] font-semibold bg-[#DCFCE7] px-2 py-0.5 rounded-full text-[10.5px]">
                              <span className="material-symbols-outlined text-[13px]">verified</span>
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#D97706] font-semibold bg-[#FEF3C7] px-2 py-0.5 rounded-full text-[10.5px]">
                              <span className="material-symbols-outlined text-[13px]">pending</span>
                              Unverified
                            </span>
                          )}
                        </div>

                        {!user.emailVerified && (
                          <div className="mt-2 pt-2 border-t border-[#E2E8F0] flex flex-col gap-1">
                            <button
                              onClick={handleSendVerification}
                              className="text-left text-[#006c4a] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">forward_to_inbox</span>
                              {verifSent ? 'Verification link sent!' : 'Send Verification Email'}
                            </button>
                            <button
                              onClick={handleCheckVerification}
                              className="text-left text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 cursor-pointer text-[11px]"
                            >
                              <span className="material-symbols-outlined text-[13px]">refresh</span>
                              Check status after verifying
                            </button>
                            {verifError && (
                              <p className="text-[11px] text-[#DC2626] mt-1 leading-snug">{verifError}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex flex-col gap-1 text-[13px]">
                      <button
                        onClick={() => {
                          onNavigate('my-filings');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-2 py-1.5 hover:bg-[#F8FAFC] rounded text-[#334155] flex items-center gap-2 cursor-pointer mt-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">folder</span>
                        <span>My Cloud Filings ({filingsCount})</span>
                      </button>

                      <div className="border-t border-[#F1F5F9] my-1"></div>

                      <button
                        onClick={handleSignOut}
                        disabled={authWorking}
                        className="w-full text-left px-2 py-1.5 hover:bg-[#FEF2F2] rounded text-[#DC2626] font-medium flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">logout</span>
                        <span>{authWorking ? 'Signing Out...' : 'Sign Out'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] active:scale-[0.98] border border-slate-700/60 shadow-sm hover:shadow transition-all duration-200 cursor-pointer overflow-hidden"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] group-hover:scale-125 transition-transform duration-200"></div>
                <span>Sign In</span>
                <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:translate-x-0.5 group-hover:text-white transition-all duration-200">
                  arrow_forward
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};
