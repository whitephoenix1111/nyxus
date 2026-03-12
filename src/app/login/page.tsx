'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { setUser }  = useAuthStore();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Đăng nhập thất bại');
        return;
      }

      const user = await res.json();
      setUser(user);

      const from = searchParams.get('from') ?? '/';
      router.replace(from);
    } catch {
      setError('Không thể kết nối server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DFFF00]">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
              {[0,1,2,3].map(row =>
                [0,1,2,3].map(col => (
                  <circle key={`${row}-${col}`}
                    cx={2 + col * 4} cy={2 + row * 4} r="1"
                    fill="#000" opacity={(row + col) % 3 === 0 ? 1 : 0.4}
                  />
                ))
              )}
            </svg>
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-white">Nyxus CRM</h1>
            <p className="mt-1 text-sm text-[#555]">Đăng nhập để tiếp tục</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#888]">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="sale@nyxus.vn"
              required
              className="rounded-xl border border-[#222] bg-[#111] px-4 py-2.5 text-sm text-white placeholder-[#444] outline-none transition-colors focus:border-[#DFFF00]/60"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#888]">Mật khẩu</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="rounded-xl border border-[#222] bg-[#111] px-4 py-2.5 text-sm text-white placeholder-[#444] outline-none transition-colors focus:border-[#DFFF00]/60"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex items-center justify-center rounded-xl bg-[#DFFF00] px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#c8e600] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                Đang đăng nhập...
              </span>
            ) : 'Đăng nhập'}
          </button>
        </form>

        {/* Dev hint */}
        <div className="mt-6 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-4">
          <p className="mb-2 text-xs font-medium text-[#555]">Tài khoản demo:</p>
          <div className="flex flex-col gap-1 font-mono text-xs text-[#444]">
            <span><span className="text-[#666]">Manager:</span>     manager@nyxus.vn / manager123</span>
            <span><span className="text-[#666]">Salesperson1:</span> sale@nyxus.vn / sale123</span>
            <span><span className="text-[#666]">Salesperson2:</span> khoa@nyxus.vn / khoa123</span>
            <span><span className="text-[#666]">Salesperson3:</span> ha@nyxus.vn / ha123</span>
            <span><span className="text-[#666]">Salesperson4:</span> huy@nyxus.vn / huy123</span>
          </div>
        </div>

      </div>
    </div>
  );
}
