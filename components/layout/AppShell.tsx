"use client";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";

// Wraps every authenticated page — phone-width shell + bottom nav on mobile,
// full-width top nav + wide content grid on desktop
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav />
      <main className="max-w-md md:max-w-5xl mx-auto pb-20 md:pb-12">{children}</main>
      <BottomNav />
    </div>
  );
}
