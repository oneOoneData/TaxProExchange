'use client';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export function JoinButton() {
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="rounded-2xl bg-slate-900 text-white text-sm px-4 py-2 shadow hover:shadow-md">
            Join Now
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </>
  );
}
