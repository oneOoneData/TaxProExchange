"use client";
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="mx-auto max-w-md py-10">
      <SignUp redirectUrl="/onboarding" />
    </div>
  );
}
