"use client";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="mx-auto max-w-md py-10">
      <SignIn redirectUrl="/onboarding" />
    </div>
  );
}
