'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, LayoutDashboard, NotebookText, User, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import CustomUserButton from './CustomUserButton';

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/notes', label: 'Notes', icon: NotebookText },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-yellow-accent font-bold text-lg sm:text-xl tracking-tight">
              📚 StudyMate
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 transition-colors font-medium ${
                    pathname === link.href
                      ? 'text-yellow-accent'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  <Icon size={18} /> {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link href="/sign-in">
                  <button className="btn-primary text-sm px-4 py-2">Sign In</button>
                </Link>
                <Link href="/sign-up">
                  <button className="btn-primary text-sm px-4 py-2">Sign Up</button>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <CustomUserButton />
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-sm">
            <div className="px-4 py-2 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium ${
                      pathname === link.href
                        ? 'text-yellow-accent bg-yellow-accent/10'
                        : 'text-muted-foreground hover:text-white hover:bg-muted/50'
                    }`}
                  >
                    <Icon size={18} /> {link.label}
                  </Link>
                );
              })}

              {/* Mobile Auth Buttons */}
              {!isAuthenticated ? (
                <div className="pt-4 pb-2 space-y-2">
                  <Link href="/sign-in" onClick={closeMobileMenu}>
                    <button className="w-full btn-primary text-sm px-4 py-2">Sign In</button>
                  </Link>
                  <Link href="/sign-up" onClick={closeMobileMenu}>
                    <button className="w-full btn-primary text-sm px-4 py-2">Sign Up</button>
                  </Link>
                </div>
              ) : (
                <div className="pt-4 pb-2">
                  <CustomUserButton />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
