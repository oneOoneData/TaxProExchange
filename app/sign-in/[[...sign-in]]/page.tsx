"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/onboarding';

  return (
    <div className="mx-auto max-w-md py-10">
      <SignIn forceRedirectUrl={redirectUrl} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-md py-10 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
