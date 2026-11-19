'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LockSimple, User, ArrowLeft, Key } from '@phosphor-icons/react';

export default function StudioLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login gagal.');
      }

      router.push('/studio');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-4 py-12">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white border border-black/10 shadow-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#121113] text-white flex items-center justify-center font-display font-extrabold text-xl mx-auto mb-3 shadow-xs">
            VWS
          </div>
          <h1 className="font-display font-extrabold text-2xl text-[#121113] tracking-tight">
            VWS Studio Login
          </h1>
          <p className="text-xs text-[#64748B]">
            Akses operasional, Page Builder, dan manajemen perjalanan.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-xs font-bold text-[#121113] mb-1.5 uppercase tracking-wider">
              Username Admin
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#4E38FF] bg-white text-[#121113]"
              />
              <User size={18} className="absolute left-3.5 top-3 text-[#64748B]" />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-[#121113] mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#4E38FF] bg-white text-[#121113]"
              />
              <LockSimple size={18} className="absolute left-3.5 top-3 text-[#64748B]" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#121113] text-white font-bold text-sm hover:bg-[#4E38FF] transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Studio'}
          </button>
        </form>

        {/* Credentials Info Helper Box */}
        <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-black/5 text-xs text-[#64748B] space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[#121113]">
            <Key size={14} weight="bold" />
            <span>Kredensial Login Admin:</span>
          </div>
          <div className="font-mono text-[11px] text-[#121113] flex justify-between">
            <span>Username: <strong className="text-[#4E38FF]">admin</strong></span>
            <span>Password: <strong className="text-[#4E38FF]">admin123</strong></span>
          </div>
        </div>

        <div className="pt-2 text-center border-t border-black/5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#121113] font-medium transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Website Publik</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
