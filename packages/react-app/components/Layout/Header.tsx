'use client';

import { useState, useEffect } from 'react';
import {
  motion,
  useScroll,
  AnimatePresence,
} from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/Logo';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const navItems = [
  { name: 'Features', href: '#Features' },
  { name: 'How It Works', href: '#HowItWorks' },
  { name: 'Use Cases', href: '#UsesCases' },
  // { name: 'FAQ', href: '#FAQ' },
  { name: 'Contact', href: '#Contact' },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        isScrolled
          ? 'bg-white/80 backdrop-blur-md border-b border-gray-100 py-2'
          : 'bg-transparent py-4'
      )}
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo size={32} className="mr-2" animated={false} />
            <motion.span
              className="font-extrabold text-lg sm:text-xl text-gray-900"
              initial={{ opacity: 1, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
            >
              SubPay
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navItems.map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                className="text-sm font-extrabold text-gray-700 hover:text-[#35D07F]"
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{
                  color: '#35D07F',
                  textShadow: '0 0 8px rgba(53, 208, 127, 0.5)',
                }}
              >
                {item.name}
              </motion.a>
            ))}
          </nav>

          {/* Action Button */}
          <div className="hidden lg:block">
            <ConnectButton />
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="lg:hidden text-gray-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            whileTap={{ scale: 0.95 }}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 1, height: 'auto' }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100"
          >
            <div className="container mx-auto px-4 py-3 space-y-3">
              {navItems.map((item) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className="block text-gray-700 py-2 font-extrabold"
                  onClick={() => setMobileMenuOpen(false)}
                  initial={{ opacity: 1, x: 0 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  {item.name}
                </motion.a>
              ))}
              <div className="pt-2 border-t border-gray-100">
                <ConnectButton />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
