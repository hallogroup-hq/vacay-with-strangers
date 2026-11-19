'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  Envelope,
  CheckCircle,
  XCircle,
  Clock,
  ArrowsLeftRight,
  Plus,
  ArrowClockwise,
  ShieldCheck,
  Warning,
} from '@phosphor-icons/react';

export default function BookingDetailPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentChannel, setPaymentChannel] = useState('bank_transfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedTravelerId, setSelectedTravelerId] = useState('');
  const [cancelReason, setCancelReason] = useState('Pembatalan atas inisiatif peserta (DP forfeited)');

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [allBatches, setAllBatches] = useState<any[]>([]);
  const [allOffers, setAllOffers] = useState<any[]>([]);
  const [reschedBatchId, setReschedBatchId] = useState('');
  const [reschedOfferId, setReschedOfferId] = useState('');
  const [reschedTransferDp, setReschedTransferDp] = useState(true);
  const [reschedReason, setReschedReason] = useState('Reschedule atas persetujuan admin');

  const fetchBookingData = () => {
    setLoading(true);
    fetch(`/api/studio/bookings/${bookingId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.booking) setBooking(data.booking);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookingData();
  }, [bookingId]);

  // Load available batches and offers for reschedule modal
  useEffect(() => {
    fetch('/api/studio/batches')
      .then((res) => res.json())
      .then((data) => {
        if (data.batches) setAllBatches(data.batches);
        if (data.offers) setAllOffers(data.offers);
      })
      .catch((err) => console.error(err));
  }, []);

  const formatIDR = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Seat allocation actions
  const handleAllocateSeat = async (bookingItemId: string) => {
    if (!booking) return;
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/studio/bookings/${bookingId}/seats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingItemId,
          batchId: booking.batch_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengalokasikan seat');
      setSuccessMsg('Seat berhasil dialokasikan secara transaksional.');
      fetchBookingData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal alokasi seat');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseSeat = async (seatAllocationId: string) => {
    const reason = prompt('Masukkan alasan pelepasan seat:');
    if (!reason) return;

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/studio/bookings/${bookingId}/seats`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatAllocationId,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal melepas seat');
      setSuccessMsg('Seat berhasil dilepaskan.');
      fetchBookingData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal melepas seat');
    } finally {
      setActionLoading(false);
    }
  };

  // Payment Actions
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/studio/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          amountIdr: Number(paymentAmount),
          paymentChannel,
          externalReference: paymentRef || undefined,
          notes: paymentNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencatat pembayaran');

      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentRef('');
      setPaymentNotes('');
      setSuccessMsg('Pembayaran berhasil dicatat. Lanjutkan verifikasi untuk membukukan ke buku kas.');
      fetchBookingData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mencatat pembayaran');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/studio/payments/${paymentId}/verify`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memverifikasi pembayaran');
      setSuccessMsg('Pembayaran terverifikasi dan kredit diposting ke ledger.');
      fetchBookingData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal verifikasi pembayaran');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReversePayment = async (paymentId: string) => {
    const reason = prompt('Masukkan alasan pembatalan/koreksi pembayaran ini:');
    if (!reason) return;

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/studio/payments/${paymentId}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membalik pembayaran');
      setSuccessMsg('Pembayaran berhasil dibalik (reversal) dan debit pengurang tercatat di ledger.');
      fetchBookingData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal reversal pembayaran');
    } finally {
      setActionLoading(false);
    }
  };

  // Traveler Cancellation
  const handleCancelTraveler = async () => {
    if (!selectedTravelerId) return;
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/studio/bookings/${bookingId}/cancel-traveler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          travelerId: selectedTravelerId,
          reason: cancelReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membatalkan peserta');
      setShowCancelModal(false);
      setSuccessMsg('Peserta berhasil dibatalkan. DP hangus dan kewajiban sisa di-relief.');
      fetchBookingData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal pembatalan peserta');
    } finally {
      setActionLoading(false);
    }
  };

  // Traveler Reschedule
  const handleRescheduleSubmit = async () => {
    if (!selectedTravelerId || !reschedBatchId || !reschedOfferId) {
      alert('Pilih batch tujuan dan paket harga');
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/studio/bookings/${bookingId}/reschedule-traveler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          travelerId: selectedTravelerId,
          destinationBatchId: reschedBatchId,
          destinationPriceOptionId: reschedOfferId,
          transferDp: reschedTransferDp,
          reason: reschedReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses reschedule');
      setShowRescheduleModal(false);
      setSuccessMsg(`Reschedule berhasil! Dibuat booking baru: ${data.newBookingCode}`);
      fetchBookingData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal reschedule peserta');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-neutral-500">Memuat rincian reservasi...</div>;
  }

  if (!booking) {
    return (
      <div className="p-12 text-center text-xs text-neutral-500">
        Booking tidak ditemukan.{' '}
        <Link href="/studio/bookings" className="text-[#5335FF] underline">
          Kembali ke daftar
        </Link>
      </div>
    );
  }

  const outstanding = Number(booking.outstanding_balance_idr) || 0;
  const availableOffersForResched = allOffers.filter((o) => o.batch_id === reschedBatchId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/studio/bookings"
            className="p-2 rounded-lg border border-gray-300 text-neutral-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-2xl text-[#1F1E1F]">
                {booking.booking_code}
              </h1>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-300">
                {booking.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              {booking.batch_code} — {booking.series_name} ({booking.destination_name})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#1F1E1F] text-white hover:bg-[#5335FF] text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} weight="bold" />
            <span>Catat Pembayaran</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-300 text-xs font-semibold text-neutral-800">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-300 text-xs font-semibold text-neutral-800">
          {successMsg}
        </div>
      )}

      {/* Info & Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Kontak Pemesan
          </span>
          <div>
            <div className="font-bold text-base text-neutral-900">{booking.primary_contact_name}</div>
            <div className="text-xs text-neutral-600 font-mono mt-0.5 flex items-center gap-1">
              <Phone size={14} />
              <span>{booking.primary_contact_phone}</span>
            </div>
            {booking.primary_contact_email && (
              <div className="text-xs text-neutral-600 mt-0.5 flex items-center gap-1">
                <Envelope size={14} />
                <span>{booking.primary_contact_email}</span>
              </div>
            )}
          </div>
          {booking.notes_private && (
            <div className="p-2.5 bg-gray-50 rounded-xl text-xs text-neutral-600 border border-gray-200">
              <span className="font-semibold block text-neutral-800">Catatan:</span>
              {booking.notes_private}
            </div>
          )}
        </div>

        {/* Financial Ledger Summary Card */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm md:col-span-2 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Buku Kas & Rekonsiliasi Tagihan
            </span>
            <span className="text-xs font-mono text-neutral-400">Ledger Snapshot</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-neutral-500">Total Tagihan (Debit)</div>
              <div className="font-mono font-bold text-base sm:text-lg text-neutral-900 mt-0.5">
                {formatIDR(booking.total_debit_idr)}
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Terbayar (Kredit)</div>
              <div className="font-mono font-bold text-base sm:text-lg text-neutral-900 mt-0.5">
                {formatIDR(booking.total_credit_idr)}
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Sisa Tagihan (Outstanding)</div>
              <div className="font-mono font-bold text-base sm:text-lg text-neutral-900 mt-0.5">
                {outstanding > 0 ? formatIDR(outstanding) : 'Lunas (Rp 0)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Travelers & Seat Allocations Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-6">
        <h2 className="font-display font-bold text-lg text-[#1F1E1F] border-b border-gray-100 pb-3">
          Daftar Peserta & Alokasi Kursi ({booking.travelers?.length || 0})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-neutral-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Nama Peserta</th>
                <th className="py-3 px-4">Paket Dipilih</th>
                <th className="py-3 px-4 text-right">Harga Disepakati</th>
                <th className="py-3 px-4 text-center">Status Peserta</th>
                <th className="py-3 px-4 text-center">Alokasi Kursi</th>
                <th className="py-3 px-4 text-right">Tindakan Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {booking.travelers?.map((t: any) => {
                const isSeatAllocated = !!t.seat_allocation_id;
                const isActive = t.traveler_status === 'active';

                return (
                  <tr key={t.traveler_id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-neutral-900">{t.full_name}</div>
                      <div className="text-xs text-neutral-500 font-mono">{t.contact_phone}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-neutral-800">
                        {t.offer_snapshot_json?.display_name || 'Paket Standar'}
                      </div>
                      <div className="text-xs text-neutral-500">
                        DP: {formatIDR(t.agreed_dp_idr)}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-neutral-900">
                      {formatIDR(t.agreed_price_idr)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-300">
                        {t.traveler_status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {isSeatAllocated ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
                            Seat Aktif
                          </span>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleReleaseSeat(t.seat_allocation_id)}
                            className="text-[11px] text-neutral-600 hover:text-neutral-900 underline ml-1"
                          >
                            Lepas
                          </button>
                        </div>
                      ) : isActive ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleAllocateSeat(t.item_id)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs transition-colors border border-neutral-300"
                        >
                          Alokasikan Seat
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {isActive && (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTravelerId(t.traveler_id);
                              setShowRescheduleModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 text-xs font-semibold text-neutral-700 transition-colors"
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTravelerId(t.traveler_id);
                              setShowCancelModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 text-xs font-semibold text-neutral-700 transition-colors"
                          >
                            Batalkan
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="font-display font-bold text-lg text-[#1F1E1F]">
            Riwayat Pembayaran ({booking.payments?.length || 0})
          </h2>
          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-xs font-semibold text-neutral-800 transition-colors"
          >
            + Catat Pembayaran
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-neutral-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Tanggal Terima</th>
                <th className="py-3 px-4">Metode / Kanal</th>
                <th className="py-3 px-4">Referensi / Bukti</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Tindakan Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!booking.payments || booking.payments.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-neutral-400">
                    Belum ada pembayaran yang dicatat untuk reservasi ini.
                  </td>
                </tr>
              ) : (
                booking.payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono text-xs text-neutral-700">
                      {p.received_at?.slice(0, 16).replace('T', ' ')}
                    </td>
                    <td className="py-4 px-4 font-medium text-neutral-900 capitalize">
                      {p.payment_channel.replace('_', ' ')}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-neutral-500">
                      {p.external_reference || '-'}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-neutral-900">
                      {formatIDR(p.amount_idr)}
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
                          onClick={() => handleVerifyPayment(p.id)}
                          className="px-3 py-1 rounded-lg bg-[#1F1E1F] text-white hover:bg-[#5335FF] text-xs font-semibold transition-colors"
                        >
                          Verifikasi
                        </button>
                      )}
                      {p.status === 'verified' && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleReversePayment(p.id)}
                          className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 underline"
                        >
                          Koreksi / Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Append-Only Ledger Trail */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="font-display font-bold text-lg text-[#1F1E1F]">
            Jejak Audit Buku Kas (Append-Only Ledger)
          </h2>
          <span className="text-xs text-neutral-400 font-mono">
            {booking.ledger_entries?.length || 0} entri
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-gray-50 border-b border-gray-200 text-neutral-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Waktu Posting</th>
                <th className="py-2.5 px-4">Tipe Peristiwa</th>
                <th className="py-2.5 px-4">Arah</th>
                <th className="py-2.5 px-4 text-right">Nominal (IDR)</th>
                <th className="py-2.5 px-4">Sumber Relasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {booking.ledger_entries?.map((le: any) => (
                <tr key={le.id} className="hover:bg-gray-50/80">
                  <td className="py-2.5 px-4 text-neutral-600">
                    {le.posted_at?.slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-neutral-900">
                    {le.event_type}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        le.direction === 'debit'
                          ? 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                          : 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                      }`}
                    >
                      {le.direction}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-neutral-900">
                    {formatIDR(le.amount_idr)}
                  </td>
                  <td className="py-2.5 px-4 text-neutral-500">
                    {le.source_kind} ({le.source_id?.slice(0, 8)}...)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Catat Pembayaran */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-display font-bold text-lg text-neutral-900">
              Catat Pembayaran Masuk
            </h3>
            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Nominal Pembayaran (IDR) *
                </label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Misal: 5000000"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Kanal / Metode Pembayaran
                </label>
                <select
                  value={paymentChannel}
                  onChange={(e) => setPaymentChannel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-neutral-900"
                >
                  <option value="bank_transfer">Transfer Bank (BCA / Mandiri / BNI)</option>
                  <option value="qris">QRIS Static / Dynamic</option>
                  <option value="cash">Tunai / Offline</option>
                  <option value="credit_transfer">Pindahan Kredit Saldo</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Nomor Referensi / ID Transaksi Bank
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="Misal: TRX-BCA-987213"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Catatan Pembayaran
                </label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Catatan dari rekening pengirim atas nama..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-neutral-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-[#1F1E1F] text-white hover:bg-[#5335FF] font-semibold"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Batalkan Peserta */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-display font-bold text-lg text-neutral-900">
              Konfirmasi Pembatalan Peserta
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Sesuai klausul perjanjian VWS V1: Down Payment (DP) bersifat non-refundable dan hangus.
              Kewajiban sisa pelunasan peserta ini akan di-relief otomatis pada ledger kas.
            </p>

            <div className="text-xs space-y-3">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Alasan Pembatalan
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-neutral-700 font-semibold"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleCancelTraveler}
                  className="px-4 py-2 rounded-xl bg-neutral-900 text-white hover:bg-black font-semibold"
                >
                  Batalkan Peserta & Hanguskan DP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reschedule Peserta */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="font-display font-bold text-lg text-neutral-900">
              Pindahkan Peserta ke Batch Lain (Reschedule)
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Membuat reservasi tertaut pada batch tujuan. Admin dapat menentukan apakah DP yang sudah dibayar dapat ditransfer ke batch baru atau hangus.
            </p>

            <div className="text-xs space-y-3">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Pilih Batch Tujuan *
                </label>
                <select
                  value={reschedBatchId}
                  onChange={(e) => {
                    setReschedBatchId(e.target.value);
                    const destOffers = allOffers.filter((o) => o.batch_id === e.target.value);
                    if (destOffers.length > 0) setReschedOfferId(destOffers[0].offer_id);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300"
                >
                  <option value="">-- Pilih Batch Tujuan --</option>
                  {allBatches
                    .filter((b) => b.id !== booking.batch_id)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batch_code} — {b.series_name} (Sisa: {b.remaining_seats} seat)
                      </option>
                    ))}
                </select>
              </div>

              {reschedBatchId && (
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Pilih Paket Harga di Batch Tujuan *
                  </label>
                  <select
                    value={reschedOfferId}
                    onChange={(e) => setReschedOfferId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  >
                    {availableOffersForResched.map((o) => (
                      <option key={o.offer_id} value={o.offer_id}>
                        {o.display_name} ({formatIDR(o.effective_price_idr)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={reschedTransferDp}
                    onChange={(e) => setReschedTransferDp(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span>Transfer Kredit DP ke Reservasi Baru (Net-Zero Cash)</span>
                </label>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Bila dicentang, kredit DP peserta di batch asal akan dipindahkan ke booking baru via transfer buku kas internal.
                </p>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Alasan & Catatan Persetujuan
                </label>
                <textarea
                  rows={2}
                  value={reschedReason}
                  onChange={(e) => setReschedReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-neutral-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !reschedBatchId || !reschedOfferId}
                  onClick={handleRescheduleSubmit}
                  className="px-4 py-2 rounded-xl bg-[#1F1E1F] text-white hover:bg-[#5335FF] font-semibold disabled:opacity-50"
                >
                  Terapkan Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
