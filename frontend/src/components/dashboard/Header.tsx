'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Status } from './StatusBadge';
import { StatusBadge } from './StatusBadge';
import WalletDropdown from './WalletDropdown';

// Simple SVG icons to replace Heroicons
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ciStatus, setCiStatus] = useState<Status>('running' as Status);

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Contracts', href: '/dashboard/contracts' },
    { name: 'Events', href: '/dashboard/events' },
  ];

  return (
    <header className="bg-transparent text-white backdrop-blur-sm bg-opacity-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/dashboard" className="text-xl font-bold">
              Servel
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <div className="flex space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-white hover:bg-opacity-20 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <StatusBadge status={ciStatus} />
            <WalletDropdown />
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 hover:bg-white hover:bg-opacity-20 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <CloseIcon />
              ) : (
                <MenuIcon />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block rounded-md px-3 py-2 text-base font-medium hover:bg-white hover:bg-opacity-20 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="px-3 py-2">
              <StatusBadge status={ciStatus} />
              <WalletDropdown />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
