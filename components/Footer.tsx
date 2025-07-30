"use client";

import { Github, Twitter, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-6 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Left - Copy */}
          <span className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} <strong className="text-foreground">StudyMate</strong>. All rights reserved.
          </span>

          {/* Center - Quote */}
          <span className="italic text-xs text-muted-foreground text-center">
            "Success is the sum of small efforts, repeated day in and day out."
          </span>

          {/* Right - Social Icons */}
          <div className="flex gap-4">
            <a href="https://github.com" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github size={18} />
            </a>
            <a href="https://twitter.com" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter size={18} />
            </a>
            <a href="mailto:support@studymate.com" className="text-muted-foreground hover:text-foreground transition-colors">
              <Mail size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
