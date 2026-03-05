'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Monitor, Wifi, Shield, BarChart2, Activity, Bell, Lock, Search, Microscope } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Dashboard', icon: Monitor },
  { href: '/devices', label: 'Devices', icon: Monitor },
  { href: '/isp', label: 'ISP Status', icon: Wifi },
  { href: '/shield', label: 'Shield Events', icon: Shield },
  { href: '/intelligence', label: 'App Intelligence', icon: BarChart2 },
  { href: '/analytics', label: 'Interaction Analytics', icon: Activity },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/vault', label: 'Vault', icon: Lock },
  { href: '/breach-scanner', label: 'Breach Scanner', icon: Search },
  { href: '/forensics', label: 'Forensics', icon: Microscope },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <aside className="w-56 min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <div className="px-6 py-5 border-b border-slate-700">
        <span className="font-bold text-white tracking-wide text-sm">ZA Support</span>
        <p className="text-slate-400 text-xs mt-0.5">Health Check AI</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
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
    </aside>
  );
}
