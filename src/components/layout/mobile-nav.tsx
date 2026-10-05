'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Radio, Users, Route, Leaf } from 'lucide-react';

const MOBILE_NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/traffic', label: 'Traffic', icon: Radio },
  { href: '/carpool', label: 'Carpool', icon: Users },
  { href: '/routes', label: 'Routes', icon: Route },
  { href: '/impact', label: 'Impact', icon: Leaf },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around transition-colors duration-150">
      {MOBILE_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
