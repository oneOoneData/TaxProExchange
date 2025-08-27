'use client';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function JoinButton() {
  return (
    <>
      <SignedOut>
        <div className="flex items-center gap-3">
          <SignInButton mode="modal" fallbackRedirectUrl="/">
            <button className="rounded-2xl border border-slate-300 text-slate-700 text-sm px-4 py-2 shadow hover:bg-slate-50 transition-colors">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal" fallbackRedirectUrl="/join">
            <button className="rounded-2xl bg-slate-900 text-white text-sm px-4 py-2 shadow hover:shadow-md">
              Join Now
            </button>
          </SignUpButton>
        </div>
      </SignedOut>
                   <SignedIn>
               <div className="flex items-center gap-3">
                 <Link 
                   href="/profile/edit" 
                   className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                 >
                   Edit Profile
                 </Link>
                 <UserButton afterSignOutUrl="/" />
               </div>
             </SignedIn>
    </>
  );
}
