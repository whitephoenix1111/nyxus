import type { Metadata } from 'next';
import { Syne, DM_Mono, Inter } from 'next/font/google';
import './globals.css';
import TopNav from '@/components/ui/TopNav';
import AuthProvider from '@/components/ui/AuthProvider';

/* ── Display font: Syne ───────────────────────────────────────
   Dùng cho: headings, nav labels, stat numbers, page titles
   Đặc điểm: geometric, bold personality — phù hợp dashboard tối
──────────────────────────────────────────────────────────────── */
const syne = Syne({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

/* ── Body font: Geist ─────────────────────────────────────────
   Dùng cho: body text, descriptions, labels dài
   Đặc điểm: clean, readable ở size nhỏ, không cạnh tranh với Syne
──────────────────────────────────────────────────────────────── */
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

/* ── Mono font: DM Mono ───────────────────────────────────────
   Dùng cho: giá tiền ($120,600), IDs, data values, percentages
   Đặc điểm: tabular-nums, đọc số liệu không bị lệch cột
──────────────────────────────────────────────────────────────── */
const dmMono = DM_Mono({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Nyxus CRM',
  description: 'Sales CRM Dashboard — Pipeline clarity. Revenue velocity.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`dark ${syne.variable} ${inter.variable} ${dmMono.variable}`}
    >
      <body className="font-sans bg-black text-white antialiased">
        <AuthProvider>
          <TopNav />
          <main className="min-h-screen">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
