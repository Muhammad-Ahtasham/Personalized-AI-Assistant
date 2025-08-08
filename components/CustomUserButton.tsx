"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function CustomUserButton() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const userEmail = user.emailAddresses?.[0]?.emailAddress || "";
  const userName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : "";

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <button
          key={user?.imageUrl} // Force re-render when image changes
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          {user.imageUrl ? (
            <Image
              src={user.imageUrl}
              alt={userName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium">
              {userName.charAt(0).toUpperCase()}
            </span>
          )}
        </button>
        <div>{userName ? userName : userEmail ? userEmail.slice(0, 8) + "..." : ""}</div>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-black border border-border rounded-xl shadow-lg z-50">
          <div className="py-2">
            <div className="px-4 py-3 border-b border-border">
              <div className="text-base font-semibold text-foreground truncate">
                {userName}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {userEmail}
              </div>
            </div>
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/profile");
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent/10 transition-colors rounded-none"
              >
                <svg
                  className="w-4 h-4 mr-2 text-yellow-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="font-medium">Manage account</span>
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-red-500/10 hover:text-white-500 transition-colors rounded-none"
              >
                <svg
                  className="w-4 h-4 mr-2 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="font-medium">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
