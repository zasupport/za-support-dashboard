'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Monitor, Wifi, Shield, BarChart2, Activity, Bell, Lock, Search, Microscope, Users, Wrench, FileText, Coffee, ShieldCheck, Download, Settings, BookOpen, LogOut, TrendingUp, Stethoscope, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlobalSearch } from './GlobalSearch';

const links = [
  { href: '/', label: 'Dashboard', icon: Monitor },
  { href: '/morning', label: 'Morning Brief', icon: Coffee },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/workshop', label: 'Workshop', icon: Wrench },
  { href: '/cybershield', label: 'CyberShield', icon: ShieldCheck },
  { href: '/devices', label: 'Devices', icon: Monitor },
  { href: '/isp', label: 'ISP Status', icon: Wifi },
  { href: '/shield', label: 'Shield Events', icon: Shield },
  { href: '/intelligence', label: 'App Intelligence', icon: BarChart2 },
  { href: '/analytics', label: 'Interaction Analytics', icon: Activity },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/vault', label: 'Vault', icon: Lock },
  { href: '/breach-scanner', label: 'Breach Scanner', icon: Search },
  { href: '/forensics', label: 'Forensics', icon: Microscope },
  { href: '/sales', label: 'Sales CRM', icon: TrendingUp },
  { href: '/medical', label: 'Medical', icon: Stethoscope },
  { href: '/dedup', label: 'Deduplication', icon: Copy },
  { href: '/guides', label: 'Guides', icon: BookOpen },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/installer', label: 'Scout Installer', icon: Download },
  { href: '/system', label: 'System Health', icon: Settings },
];

// Top 5 links shown in mobile bottom nav
const mobileLinks = [
  { href: '/', label: 'Home', icon: Monitor },
  { href: '/morning', label: 'Brief', icon: Coffee },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/workshop', label: 'Workshop', icon: Wrench },
  { href: '/cybershield', label: 'Shield', icon: ShieldCheck },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 min-h-screen bg-slate-900 text-slate-100 flex-col shrink-0">
        <div className="px-4 py-4 border-b border-slate-700">
          <span className="font-bold text-white tracking-wide text-sm block mb-3">ZA Support</span>
          <GlobalSearch />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                pathname === href
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-slate-700">
          <button
            onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login'; }}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-white text-sm">ZA Support</span>
        <GlobalSearch />
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-700 flex">
        {mobileLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors',
              pathname === href ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
