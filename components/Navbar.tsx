"use client";

import Link from 'next/link';
import { UserButton, SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { Home, LayoutDashboard, NotebookText, User } from "lucide-react";
import { useAuth } from '../hooks/useAuth';
import CustomUserButton from './CustomUserButton';

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const { isAuthenticated, isFaceAuthenticated } = useAuth();

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-yellow-accent font-bold text-xl tracking-tight">📚 StudyMate</span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex gap-6">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors font-medium">
              <Home size={18}/> Home
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors font-medium">
              <LayoutDashboard size={18}/> Dashboard
            </Link>
            <Link href="/notes" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors font-medium">
              <NotebookText size={18}/> Notes
            </Link>
            <Link href="/profile" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors font-medium">
              <User size={18}/> Profile
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link href="/sign-in">
                  <button className="btn-primary">
                    Sign In
                  </button>
                </Link>
                <Link href="/sign-up">
                  <button className="btn-secondary">
                    Sign Up
                  </button>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {isSignedIn ? (
                  <UserButton afterSignOutUrl="/" />
                ) : (
                  <CustomUserButton />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
