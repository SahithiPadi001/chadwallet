"use client";
// Bare /tokens (no address yet) — TokenListColumn in the layout owns picking the
// top trending token and navigating there, so this is just a brief loading state.

export default function TokensIndexPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
