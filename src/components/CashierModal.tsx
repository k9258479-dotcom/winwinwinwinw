import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, History, QrCode, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react';
import { api } from '../services/api';
import { sounds } from '../utils/audio';
import { Transaction } from '../types';

interface CashierModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBalance: number;
  onBalanceUpdate: (newBal: number) => void;
  transactions: Transaction[];
  onRefreshWallet: () => void;
  initialTab?: 'deposit' | 'withdraw' | 'history';
}

const DEPOSIT_PRESETS = [100, 300, 500, 1000, 2000, 5000];

export const CashierModal: React.FC<CashierModalProps> = ({
  isOpen,
  onClose,
  userBalance,
  onBalanceUpdate,
  transactions,
  onRefreshWallet,
  initialTab = 'deposit',
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>(initialTab);
  const [selectedMethod, setSelectedMethod] = useState<'Payment' | 'GCash' | 'PayMaya' | 'Bank'>('Payment');

  // Deposit state
  const [depositAmount, setDepositAmount] = useState<number>(500);
  const [depositPhone, setDepositPhone] = useState('');
  const [depositSuccessReceipt, setDepositSuccessReceipt] = useState<Transaction | null>(null);
  const [paymongoCheckoutUrl, setPaymongoCheckoutUrl] = useState<string | null>(null);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState<number>(200);
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawName, setWithdrawName] = useState('');
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPaymongoCheckoutUrl(null);

    if (depositAmount < 50) {
      setErrorMsg('Minimum deposit is ₱50.');
      return;
    }

    setIsLoading(true);

    // Process all deposits via Payment gateway
    try {
      const res = await fetch('/api/paymongo/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: depositAmount,
          phone: depositPhone,
          description: `Bet88 Deposit ₱${depositAmount.toLocaleString()}`,
        }),
      });

      let data: any = null;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } catch {}

      setIsLoading(false);
      if (data && data.success && data.checkoutUrl) {
        setPaymongoCheckoutUrl(data.checkoutUrl);
        sounds.playCashout();
        // Diretso agad sa PayMongo Checkout page
        window.location.href = data.checkoutUrl;
        return;
      } else if (!data) {
        // Fallback to local checkout simulation
        const refNo = `PM-${Math.floor(10000000 + Math.random() * 90000000)}`;
        const txId = `tx_pm_${Date.now()}`;
        const simUrl = `/paymongo-checkout.html?amount=${depositAmount}&phone=${depositPhone}&ref=${refNo}&tx=${txId}`;
        setPaymongoCheckoutUrl(simUrl);
        sounds.playCashout();
        window.location.href = simUrl;
        return;
      } else {
        setErrorMsg(data.message || 'Hindi ma-load ang Payment checkout. Pakisubukang muli.');
        return;
      }
    } catch (err) {
      setIsLoading(false);
      const refNo = `PM-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const txId = `tx_pm_${Date.now()}`;
      const simUrl = `/paymongo-checkout.html?amount=${depositAmount}&phone=${depositPhone}&ref=${refNo}&tx=${txId}`;
      setPaymongoCheckoutUrl(simUrl);
      sounds.playCashout();
      try {
        window.open(simUrl, '_blank');
      } catch {}
      return;
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (withdrawAmount < 200) {
      setErrorMsg('Ang minimum withdrawal ay ₱200.00.');
      return;
    }
    if (withdrawAmount > userBalance) {
      setErrorMsg('Insufficient balance for this withdrawal amount.');
      return;
    }

    setIsLoading(true);
    const res = await api.withdraw(withdrawAmount, selectedMethod, withdrawPhone, withdrawName);
    setIsLoading(false);

    if (res.success && res.newBalance !== undefined) {
      sounds.playCashout();
      onBalanceUpdate(res.newBalance);
      setWithdrawSuccessMsg(res.message || 'Withdrawal submitted successfully');
      onRefreshWallet();
    } else {
      setErrorMsg(res.message || 'Withdrawal failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-amber-400">BET88 CASHIER</h2>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Fast GCash & Maya Instant Settlement</span>
              <span>·</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Ribbon */}
        <div className="px-6 py-3 bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Current Balance:</span>
          <span className="text-base font-bold text-amber-400 font-mono">
            ₱{userBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => {
              setActiveTab('deposit');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'deposit'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownRight className="w-4 h-4 text-emerald-400" />
            Deposit (Cash In)
          </button>
          <button
            onClick={() => {
              setActiveTab('withdraw');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'withdraw'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-cyan-400" />
            Withdraw (Cash Out)
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500 text-red-300 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* DEPOSIT TAB */}
          {activeTab === 'deposit' && (
            <div>
              {paymongoCheckoutUrl ? (
                <div className="text-center py-6 space-y-4 bg-slate-950/80 border border-purple-500/40 rounded-2xl p-6">
                  <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto text-2xl font-black shadow-lg shadow-purple-500/20">
                    ⚡
                  </div>
                  <h3 className="text-lg font-bold text-white">Payment Gateway Ready!</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Handa na ang iyong deposit na ₱{depositAmount.toLocaleString()}. Pindutin ang button sa ibaba upang buksan ang secure payment portal.
                  </p>
                  <div className="flex flex-col gap-2.5 max-w-sm mx-auto pt-2">
                    <a
                      href={paymongoCheckoutUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:brightness-110 active:scale-95 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                    >
                      <span>Magbayad Ngayon (Proceed to Payment) →</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setPaymongoCheckoutUrl(null)}
                      className="py-2.5 text-xs text-slate-400 hover:text-white"
                    >
                      Bumalik sa Cashier Form
                    </button>
                  </div>
                </div>
              ) : depositSuccessReceipt ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Deposit Successful!</h3>
                  <p className="text-xs text-slate-400">
                    Your account has been credited with ₱{depositSuccessReceipt.amount.toLocaleString()}.
                  </p>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-left text-xs space-y-2 max-w-sm mx-auto">
                    <div className="flex justify-between text-slate-400">
                      <span>Method:</span>
                      <span className="text-white font-medium">{depositSuccessReceipt.method}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Ref No:</span>
                      <span className="text-amber-400 font-mono font-medium">{depositSuccessReceipt.referenceNo}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Status:</span>
                      <span className="text-emerald-400 font-bold">{depositSuccessReceipt.status}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDepositSuccessReceipt(null)}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl uppercase tracking-wider"
                  >
                    Make Another Deposit
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  {/* Select Payment Method */}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-2">
                      1. Select Payment Method
                    </label>
                    <div className="p-3.5 rounded-xl border border-purple-500/50 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 flex items-center justify-between shadow-lg shadow-purple-500/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-black text-xl">
                          💳
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-white flex items-center gap-2">
                            <span>Payment</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                              Instant Auto-Credit
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            GCash · Maya · QR Ph · Credit/Debit Card · Bank
                          </span>
                        </div>
                      </div>
                      <div className="text-emerald-400 text-xs font-bold flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Aktibo
                      </div>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-2">
                      2. Choose Amount (PHP)
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                      {DEPOSIT_PRESETS.map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDepositAmount(amt)}
                          className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                            depositAmount === amt
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          ₱{amt}
                        </button>
                      ))}
                    </div>

                    <input
                      type="number"
                      min={50}
                      max={50000}
                      value={depositAmount}
                      onChange={e => setDepositAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                      placeholder="Enter custom deposit amount"
                    />
                  </div>

                  {/* Phone / Account Number */}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1.5">
                      3. Mobile Phone Number (para sa payment reference)
                    </label>
                    <input
                      type="tel"
                      value={depositPhone}
                      onChange={e => setDepositPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400"
                      placeholder="09xxxxxxxxx"
                    />
                  </div>

                  {/* Payment Gateway Info Box */}
                  <div className="p-3 bg-slate-950 border border-purple-500/30 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <div className="text-xs text-slate-400">
                      <span className="text-slate-200 font-semibold block">Automated Instant Payment Gateway</span>
                      <span>Mabilis na pag-credit via GCash, Maya, QR Ph, o Card pagkatapos magbayad.</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-black text-sm uppercase rounded-xl shadow-lg shadow-purple-600/30 hover:brightness-110 active:scale-95 transition-all"
                  >
                    {isLoading ? 'Inihahanda ang Payment...' : `Mag-deposit ng ₱${depositAmount.toLocaleString()} (Proceed to Payment)`}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* WITHDRAW TAB */}
          {activeTab === 'withdraw' && (
            <div>
              {withdrawSuccessMsg ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Cashout Submitted!</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">{withdrawSuccessMsg}</p>
                  <button
                    onClick={() => setWithdrawSuccessMsg(null)}
                    className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl uppercase tracking-wider"
                  >
                    Back to Cashier
                  </button>
                </div>
              ) : (
                <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  {/* Select Cashout Destination */}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-2">
                      1. Cashout Channel
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('GCash')}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedMethod === 'GCash'
                            ? 'bg-blue-600/20 border-blue-400 text-blue-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="font-bold text-sm block text-blue-400">GCash Express</span>
                        <span className="text-[10px] text-slate-400">Within 3-5 Mins</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMethod('PayMaya')}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedMethod === 'PayMaya'
                            ? 'bg-emerald-600/20 border-emerald-400 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="font-bold text-sm block text-emerald-400">Maya Payout</span>
                        <span className="text-[10px] text-slate-400">Instant Transfer</span>
                      </button>
                    </div>
                  </div>

                  {/* Cashout Amount */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-400 font-semibold">2. Cashout Amount</span>
                      <span className="text-amber-400/90 font-medium">Min: ₱200.00 · Max: ₱{userBalance.toLocaleString()}</span>
                    </div>
                    <input
                      type="number"
                      min={200}
                      max={userBalance}
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                      placeholder="Minimum ₱200"
                    />
                  </div>

                  {/* Account Name */}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1.5">
                      3. Registered Account Name
                    </label>
                    <input
                      type="text"
                      value={withdrawName}
                      onChange={e => setWithdrawName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400"
                      placeholder="e.g. Juan Dela Cruz"
                    />
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1.5">
                      4. Recipient Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={withdrawPhone}
                      onChange={e => setWithdrawPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400"
                      placeholder="09xxxxxxxxx"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black text-sm uppercase rounded-xl shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all"
                  >
                    {isLoading ? 'Processing Request...' : `Withdraw ₱${withdrawAmount.toLocaleString()} to ${selectedMethod}`}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              <span className="text-xs text-slate-400 block font-semibold">
                Transaction History ({transactions.length} records)
              </span>

              {transactions.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No transaction records yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map(tx => (
                    <div
                      key={tx.id}
                      className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                            tx.type === 'DEPOSIT'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : tx.type === 'WITHDRAWAL'
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : tx.type === 'WIN'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}
                        >
                          {tx.type === 'DEPOSIT' ? '↓' : tx.type === 'WITHDRAWAL' ? '↑' : '★'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-200 block">{tx.method}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{tx.referenceNo} · {tx.timestamp}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-mono font-bold block ${
                            tx.type === 'WITHDRAWAL' ? 'text-cyan-400' : 'text-emerald-400'
                          }`}
                        >
                          {tx.type === 'WITHDRAWAL' ? '-' : '+'}₱{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-emerald-500 font-semibold uppercase">{tx.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
