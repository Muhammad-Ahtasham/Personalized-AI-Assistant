"use client";

import { Github, Twitter, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-700 text-white py-5 px-6 shadow-inner mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left - Copy */}
        <span className="text-sm opacity-90">&copy; {new Date().getFullYear()} <strong>StudyMate</strong>. All rights reserved.</span>

        {/* Center - Quote */}
        <span className="italic text-xs opacity-75">
          “Success is the sum of small efforts, repeated day in and day out.”
        </span>

        {/* Right - Social Icons */}
        <div className="flex gap-4">
          <a href="https://github.com" target="_blank" className="hover:text-yellow-300 transition">
            <Github size={18} />
          </a>
          <a href="https://twitter.com" target="_blank" className="hover:text-yellow-300 transition">
            <Twitter size={18} />
          </a>
          <a href="mailto:support@studymate.com" className="hover:text-yellow-300 transition">
            <Mail size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
}
