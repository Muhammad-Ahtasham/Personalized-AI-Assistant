"use client";

import Link from 'next/link';
import { UserButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Home, LayoutDashboard, NotebookText, User } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-500 shadow-xl px-6 py-3 flex items-center justify-between">
      
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-white font-extrabold text-2xl tracking-tight">📚 StudyMate</span>
      </div>

      {/* Nav Links */}
      <div className="hidden sm:flex gap-6">
        <Link href="/" className="flex items-center gap-1 text-white hover:text-yellow-300 transition font-medium">
          <Home size={18}/> Home
        </Link>
        <Link href="/dashboard" className="flex items-center gap-1 text-white hover:text-yellow-300 transition font-medium">
          <LayoutDashboard size={18}/> Dashboard
        </Link>
        <Link href="/notes" className="flex items-center gap-1 text-white hover:text-yellow-300 transition font-medium">
          <NotebookText size={18}/> Notes
        </Link>
        <Link href="/profile" className="flex items-center gap-1 text-white hover:text-yellow-300 transition font-medium">
          <User size={18}/> Profile
        </Link>
      </div>

      {/* Auth Buttons */}
      <div className="flex items-center gap-3">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-1.5 bg-yellow-300 text-purple-800 font-semibold rounded-lg shadow hover:bg-yellow-400 transition">
              Sign In
            </button>
          </SignInButton>
          <Link href="/sign-up">
            <button className="px-4 py-1.5 border border-yellow-300 text-yellow-300 font-medium rounded-lg hover:bg-yellow-300 hover:text-purple-800 transition">
              Sign Up
            </button>
          </Link>
        </SignedOut>

        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </nav>
  );
}
