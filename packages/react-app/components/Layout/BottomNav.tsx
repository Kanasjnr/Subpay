'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  AlertCircle,
  Settings,
} from 'lucide-react';

interface NavLink {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const subscriberLinks: NavLink[] = [
  { 
    name: 'Home', 
    href: '/subscriber', 
    icon: <LayoutDashboard className="w-6 h-6" strokeWidth={2.5} /> 
  },
  { 
    name: 'Transactions', 
    href: '/subscriber/transactions', 
    icon: <CreditCard className="w-6 h-6" strokeWidth={2.5} /> 
  },
  { 
    name: 'Disputes', 
    href: '/subscriber/disputes', 
    icon: <AlertCircle className="w-6 h-6" strokeWidth={2.5} /> 
  },
  { 
    name: 'Profile', 
    href: '/subscriber/profile', 
    icon: <Settings className="w-6 h-6" strokeWidth={2.5} /> 
  }
];

const businessLinks: NavLink[] = [
  { 
    name: 'Dashboard', 
    href: '/business', 
    icon: <LayoutDashboard className="w-6 h-6" strokeWidth={2.5} /> 
  },
  { 
    name: 'Plans', 
    href: '/business/plans', 
    icon: <CreditCard className="w-6 h-6" strokeWidth={2.5} /> 
  },
  { 
    name: 'Subscribers', 
    href: '/business/subscribers', 
    icon: <Users className="w-6 h-6" strokeWidth={2.5} /> 
  },
  { 
    name: 'Disputes', 
    href: '/business/disputes', 
    icon: <AlertCircle className="w-6 h-6" strokeWidth={2.5} /> 
  },
  { 
    name: 'Settings', 
    href: '/business/settings', 
    icon: <Settings className="w-6 h-6" strokeWidth={2.5} /> 
  }
];

interface BottomNavProps {
  type: 'business' | 'subscriber';
  pathname: string;
}

export function BottomNav({ type, pathname }: BottomNavProps) {
  const links = type === 'subscriber' ? subscriberLinks : businessLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center h-16">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1.5',
              pathname === link.href
                ? 'text-primary'
                : 'text-muted-foreground hover:text-primary'
            )}
          >
            {link.icon}
            <span className="text-xs font-semibold">{link.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
} 