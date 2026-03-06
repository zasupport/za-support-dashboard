import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/nav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ZA Support — Health Check AI Dashboard',
  description: 'ZA Support Health Check AI Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-100`}>
        <div className="flex min-h-screen">
          <Nav />
          <main className="flex-1 p-4 md:p-6 overflow-auto pt-16 md:pt-6 pb-20 md:pb-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
