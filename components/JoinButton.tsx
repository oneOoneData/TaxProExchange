'use client';
import { SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";

export function JoinButton() {
  return (
    <SignedOut>
      <div className="flex items-center gap-3">
        <SignInButton mode="modal" fallbackRedirectUrl="/">
          <button className="rounded-2xl border border-slate-300 text-slate-700 text-sm px-4 py-2 shadow hover:bg-slate-50 transition-colors">
            Sign In
          </button>
        </SignInButton>
        <SignUpButton mode="modal" forceRedirectUrl="/onboarding" fallbackRedirectUrl="/">
          <button className="rounded-2xl bg-slate-900 text-white text-sm px-4 py-2 shadow hover:hover:shadow-md">
            Join Now
          </button>
        </SignUpButton>
      </div>
    </SignedOut>
  );
}
