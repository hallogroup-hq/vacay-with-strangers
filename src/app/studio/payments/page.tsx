'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CurrencyDollar,
  CheckCircle,
  XCircle,
  ArrowsClockwise,
  CreditCard,
  ShieldCheck,
  Funnel,
} from '@phosphor-icons/react';

export default function StudioPaymentsPage() {
  const [activeTab, setActiveTab] = useState<'payments' | 'refunds'>('payments');
  const [payments, setPayments] = useState<any[]>([]);
  const [refundCases, setRefundCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Payout modal state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutRef, setPayoutRef] = useState('');

  const fetchPayments = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);

    fetch(`/api/studio/payments?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.payments) setPayments(data.payments);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchRefunds = () => {
    setLoading(true);
    fetch('/api/studio/payments/refunds')
      .then((res) => res.json())
      .then((data) => {
        if (data.refundCases) setRefundCases(data.refundCases);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments();
    } else {
      fetchRefunds();
    }
  }, [activeTab, statusFilter]);

  const formatIDR = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleVerify = async (paymentId: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/studio/payments/${paymentId}/verify`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal verifikasi pembayaran');
      setMessage({ text: 'Pembayaran terverifikasi dan diposting ke ledger.' });
      fetchPayments();
    } catch (err: any) {
      setMessage({ text: err.message, isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReverse = async (paymentId: string) => {
    const reason = prompt('Masukkan alasan koreksi / pembatalan pembayaran ini:');
    if (!reason) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/studio/payments/${paymentId}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal reversal pembayaran');
      setMessage({ text: 'Pembayaran berhasil dibalik (reversal) di ledger kas.' });
      fetchPayments();
    } catch (err: any) {
      setMessage({ text: err.message, isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/studio/payments/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_payout',
          caseId: selectedCaseId,
          amountIdr: Number(payoutAmount),
          transferReference: payoutRef,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencatat pencairan');
      setShowPayoutModal(false);
      setPayoutAmount('');
      setPayoutRef('');
      setMessage({ text: 'Pencairan refund berhasil dibukukan ke ledger kas.' });
      fetchRefunds();
    } catch (err: any) {
      setMessage({ text: err.message, isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1F1E1F]">
            Pusat Keuangan & Buku Kas (Finance)
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Rekonsiliasi mutasi transfer masuk, verifikasi bertingkat, dan pengembalian dana resmi.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-xs sm:text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`pb-3 transition-colors ${
            activeTab === 'payments'
              ? 'text-[#1F1E1F] border-b-2 border-[#1F1E1F]'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Semua Mutasi Pembayaran
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('refunds')}
          className={`pb-3 transition-colors ${
            activeTab === 'refunds'
              ? 'text-[#1F1E1F] border-b-2 border-[#1F1E1F]'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Kasus Pengembalian Dana (Refund Cases)
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold ${
            message.isError
              ? 'bg-neutral-100 border border-neutral-300 text-neutral-800'
              : 'bg-neutral-100 border border-neutral-300 text-neutral-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tab Content: Payments */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-800"
            >
              <option value="">Semua Status Pembayaran</option>
              <option value="pending_verification">Menunggu Verifikasi</option>
              <option value="verified">Terverifikasi (Masuk Kas)</option>
              <option value="reversed">Reversed (Dibatalkan)</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-xs text-neutral-500">Memuat mutasi pembayaran...</div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center text-xs text-neutral-500">
                Belum ada catatan mutasi pembayaran.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-neutral-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Waktu Terima</th>
                      <th className="py-3 px-4">Booking & Pelanggan</th>
                      <th className="py-3 px-4">Batch</th>
                      <th className="py-3 px-4 text-right">Nominal (IDR)</th>
                      <th className="py-3 px-4">Metode / Ref</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-4 px-4 font-mono text-xs text-neutral-600">
                          {p.received_at?.slice(0, 16).replace('T', ' ')}
                        </td>
                        <td className="py-4 px-4">
                          <Link
                            href={`/studio/bookings/${p.booking_id}`}
                            className="font-mono font-bold text-neutral-900 hover:text-[#5335FF] underline-offset-2 hover:underline"
                          >
                            {p.booking_code}
                          </Link>
                          <div className="text-xs text-neutral-500">{p.primary_contact_name}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-neutral-900">{p.batch_code}</div>
                          <div className="text-xs text-neutral-500">{p.series_name}</div>
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-bold text-neutral-900">
                          {formatIDR(p.amount_idr)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-neutral-800 capitalize">
                            {p.payment_channel.replace('_', ' ')}
                          </div>
                          <div className="text-xs font-mono text-neutral-500">
                            {p.external_reference || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-300">
                            {p.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {p.status === 'pending_verification' && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleVerify(p.id)}
                              className="px-3 py-1 rounded-lg bg-[#1F1E1F] text-white hover:bg-[#5335FF] text-xs font-semibold transition-colors"
                            >
                              Verifikasi
                            </button>
                          )}
                          {p.status === 'verified' && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleReverse(p.id)}
                              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 underline"
                            >
                              Koreksi / Reverse
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Refunds */}
      {activeTab === 'refunds' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-xs text-neutral-500">Memuat data kasus refund...</div>
          ) : refundCases.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-500">
              Belum ada kasus pengembalian dana tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-neutral-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Booking & Pelanggan</th>
                    <th className="py-3 px-4">Alasan & Inisiator</th>
                    <th className="py-3 px-4 text-right">Refund Disetujui</th>
                    <th className="py-3 px-4 text-right">Refund Dicairkan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {refundCases.map((rc) => (
                    <tr key={rc.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <Link
                          href={`/studio/bookings/${rc.booking_id}`}
                          className="font-mono font-bold text-neutral-900 hover:text-[#5335FF] underline-offset-2 hover:underline"
                        >
                          {rc.booking_code}
                        </Link>
                        <div className="text-xs text-neutral-500">{rc.primary_contact_name}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-neutral-800">{rc.reason}</div>
                        <div className="text-xs text-neutral-500 capitalize">Oleh: {rc.initiated_by}</div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-neutral-900">
                        {formatIDR(rc.total_approved_refund_idr)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-neutral-900">
                        {formatIDR(rc.total_paid_refund_idr)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-300">
                          {rc.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {rc.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCaseId(rc.id);
                              setPayoutAmount(rc.total_approved_refund_idr);
                              setShowPayoutModal(true);
                            }}
                            className="px-3 py-1 rounded-lg bg-[#1F1E1F] text-white hover:bg-[#5335FF] text-xs font-semibold transition-colors"
                          >
                            Catat Payout
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Catat Payout Refund */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-display font-bold text-lg text-neutral-900">
              Catat Pencairan Dana Refund
            </h3>
            <p className="text-xs text-neutral-600">
              Membukukan pengeluaran kas perusahaan ke rekening peserta dan memposting debit di buku kas.
            </p>

            <form onSubmit={handleRecordPayout} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Nominal Transfer Keluar (IDR) *
                </label>
                <input
                  type="number"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Referensi / Bukti Transfer Bank Keluar
                </label>
                <input
                  type="text"
                  required
                  value={payoutRef}
                  onChange={(e) => setPayoutRef(e.target.value)}
                  placeholder="Misal: OUT-BCA-887123"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-neutral-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-[#1F1E1F] text-white hover:bg-[#5335FF] font-semibold"
                >
                  Posting Payout ke Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
