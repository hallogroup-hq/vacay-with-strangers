'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, MagnifyingGlass, User, CalendarBlank, CaretRight } from '@phosphor-icons/react';

interface BookingRow {
  id: string;
  booking_code: string;
  primary_contact_name: string;
  primary_contact_phone: string;
  primary_contact_email: string;
  status: string;
  source: string;
  created_at: string;
  batch_code: string;
  series_name: string;
  travelers_count: string;
  total_debit_idr: string;
  total_credit_idr: string;
  outstanding_balance_idr: string;
}

export default function BookingsDirectoryPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchBookings = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);

    fetch(`/api/studio/bookings?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.bookings) setBookings(data.bookings);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const formatIDR = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1F1E1F]">
            Manajemen Reservasi & Traveler
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Daftar reservasi manual dari WhatsApp, alokasi kursi, status pembayaran, dan pembatalan.
          </p>
        </div>

        <Link
          href="/studio/bookings/new"
          className="px-5 py-2.5 rounded-xl bg-[#1F1E1F] text-white hover:bg-[#5335FF] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Plus size={16} weight="bold" />
          <span>Catat Reservasi Baru</span>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode booking, nama kontak, atau nomor WhatsApp..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-900 focus:outline-none focus:border-[#5335FF]"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-800 focus:outline-none"
        >
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="partially_cancelled">Sebagian Batal</option>
          <option value="cancelled">Batal</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-500">Memuat data reservasi...</div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            Tidak ada reservasi yang sesuai kriteria pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-neutral-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Kode Booking</th>
                  <th className="py-3 px-4">Kontak Utama</th>
                  <th className="py-3 px-4">Batch & Destinasi</th>
                  <th className="py-3 px-4 text-center">Peserta</th>
                  <th className="py-3 px-4 text-right">Outstanding (Sisa)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => {
                  const outstanding = Number(b.outstanding_balance_idr) || 0;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-neutral-900">
                        <Link
                          href={`/studio/bookings/${b.id}`}
                          className="hover:text-[#5335FF] underline-offset-2 hover:underline"
                        >
                          {b.booking_code}
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-neutral-900">{b.primary_contact_name}</div>
                        <div className="text-xs text-neutral-500 font-mono">{b.primary_contact_phone}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-neutral-900">{b.batch_code}</div>
                        <div className="text-xs text-neutral-500">{b.series_name}</div>
                      </td>
                      <td className="py-4 px-4 text-center font-semibold text-neutral-800">
                        {b.travelers_count} org
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold">
                        {outstanding > 0 ? (
                          <span className="text-neutral-900">{formatIDR(outstanding)}</span>
                        ) : (
                          <span className="text-neutral-500 font-normal">Lunas (Rp 0)</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-300">
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/studio/bookings/${b.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-700 hover:text-[#5335FF]"
                        >
                          <span>Detail</span>
                          <CaretRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
