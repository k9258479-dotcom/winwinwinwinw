import React, { useState } from 'react';
import { X, Smartphone, Lock, Eye, EyeOff, ShieldCheck, Check } from 'lucide-react';
import { api } from '../services/api';
import { sounds } from '../utils/audio';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
  noticeMessage?: string;
  onOpenProfile?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  noticeMessage,
  onOpenProfile,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredUser, setRegisteredUser] = useState<UserProfile | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  React.useEffect(() => {
    setMode(initialMode);
    setRegisteredUser(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    sounds.playClick();

    if (!phone || phone.length < 10) {
      setErrorMsg('Please enter a valid Philippine mobile number (09...).');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    if (mode === 'login') {
      const res = await api.login(phone, password);
      setIsLoading(false);
      if (res.success && res.user) {
        sounds.playWin();
        onLoginSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.message || 'Login failed');
      }
    } else {
      const res = await api.register(phone, password, promoCode);
      setIsLoading(false);
      if (res.success && res.user) {
        sounds.playBigWin();
        onLoginSuccess(res.user);
        setRegisteredUser(res.user);
      } else {
        setErrorMsg(res.message || 'Registration failed');
      }
    }
  };

  const handleCopyRegisteredId = () => {
    if (!registeredUser) return;
    sounds.playClick();
    const pid = registeredUser.playerId || `BET88-${registeredUser.phone.slice(-6)}`;
    navigator.clipboard.writeText(pid);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleQuickDemo = () => {
    sounds.playClick();
    setPhone('09060489645');
    setPassword('Dan051391');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎰</span>
            <span className="font-bold text-amber-400 text-base">
              {mode === 'login' ? 'BET88 SECURE LOGIN' : 'CREATE BET88 ACCOUNT'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => {
              sounds.playClick();
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === 'login'
                ? 'border-b-2 border-amber-400 text-amber-400 bg-amber-500/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === 'register'
                ? 'border-b-2 border-amber-400 text-amber-400 bg-amber-500/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register (+₱100 Bonus)
          </button>
        </div>

        {/* If Just Registered: Show Profile Card with Player ID */}
        {registeredUser ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-500/10">
              🎉
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Rehistrasyon Matagumpay!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Welcome sa Bet88! Heto ang iyong opisyal na Player ID number:
              </p>
            </div>

            {/* Official ID Box */}
            <div className="p-4 bg-slate-950 border-2 border-amber-500/40 rounded-2xl relative shadow-inner">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                Official Player ID Number
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-2xl font-black font-mono text-white tracking-widest">
                  {registeredUser.playerId || `BET88-${registeredUser.phone.slice(-6)}`}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRegisteredId}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-bold transition-all active:scale-95"
                >
                  {copiedId ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span>Account: <b className="text-slate-200">{registeredUser.username}</b></span>
                <span>Mobile: <b className="font-mono text-slate-200">{registeredUser.phone}</b></span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              🎁 Na-credit na ang ₱100.00 Free Play Bonus sa iyong account!
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenProfile) onOpenProfile();
                }}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs uppercase rounded-xl transition-all border border-slate-700"
              >
                Tingnan ang Profile
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
              >
                Maglaro Na
              </button>
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {noticeMessage && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs rounded-xl flex items-center gap-2">
              <span className="text-base">🎰</span>
              <span className="font-semibold">{noticeMessage}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500 text-red-300 text-xs rounded-xl flex flex-col gap-2">
              <span>{errorMsg}</span>
              {mode === 'register' && errorMsg.includes('nakarehistro') && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className="self-start px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 active:scale-95 transition-all text-[11px]"
                >
                  Pindutin dito para Mag-Log In →
                </button>
              )}
            </div>
          )}

          {/* Phone Field */}
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1.5">
              Philippine Mobile Number
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400 font-mono"
                placeholder="09xxxxxxxxx"
                required
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Used for instant GCash / Maya auto-verification
            </span>
          </div>

          {/* Password Field */}
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400 font-mono"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Referral Promo Code for Register */}
          {mode === 'register' && (
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1.5">
                Invitation / Promo Code (Optional)
              </label>
              <input
                type="text"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs font-mono uppercase focus:outline-none focus:border-amber-400"
                placeholder="BET88VIP"
              />
            </div>
          )}

          {/* Security badge */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span className="text-[11px] text-slate-500">256-Bit Financial Encryption</span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure Session
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-sm uppercase rounded-xl shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all mt-2"
          >
            {isLoading
              ? 'Verifying...'
              : mode === 'login'
              ? 'LOG IN TO PLATFORM'
              : 'REGISTER & CLAIM ₱100 BONUS'}
          </button>
        </form>
        )}
      </div>
    </div>
  );
};
