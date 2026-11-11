import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Smart Teknik', description: 'Smart Teknik — aplikasi manajemen toko, stok, pembelian, penjualan, dan analitik bisnis.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
