"use client";

import { Github, Twitter, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-4 sm:py-6 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Left - Copy */}
          <span className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            &copy; {new Date().getFullYear()} <strong className="text-foreground">StudyMate</strong>. All rights reserved.
          </span>

          {/* Center - Quote */}
          <span className="italic text-xs text-muted-foreground text-center max-w-xs sm:max-w-none">
            &ldquo;Success is the sum of small efforts, repeated day in and day out.&rdquo;
          </span>

          {/* Right - Social Icons */}
          <div className="flex gap-3 sm:gap-4">
            <a href="https://github.com/Muhammad-Ahtasham/ " target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github size={16} className="sm:w-[18px] sm:h-[18px]" />
            </a>
            <a href="https://atiiisham.vercel.app" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter size={16} className="sm:w-[18px] sm:h-[18px]" />
            </a>
            <a href="mailto:support@studymate.com" className="text-muted-foreground hover:text-foreground transition-colors">
              <Mail size={16} className="sm:w-[18px] sm:h-[18px]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
